/**
 * POST /api/child/tasks/stats
 * 
 * OPTIMIZED: Get task statistics for a child without fetching full task list
 * Perfect for dashboard widgets and summary views
 * 
 * Body: {
 *   child_code: string,
 *   family_code: string
 * }
 * 
 * Returns:
 * {
 *   total: number,
 *   pending: number,
 *   completed: number,
 *   approved: number,
 *   totalPoints: number
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import {
  getTaskStatsByChildCodes,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository.paginated";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      child_code?: string;
      family_code?: string;
    };

    if (!body.child_code || !body.family_code) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "child_code and family_code are required",
        },
        { status: 400 }
      );
    }

    let adminClient;
    try {
      adminClient = getSupabaseAdminClient();
    } catch (envError) {
      const errorMessage = envError instanceof Error ? envError.message : "Server configuration error";
      console.error("[child:tasks:stats] Environment configuration error:", envError);
      return NextResponse.json(
        {
          error: "CONFIGURATION_ERROR",
          message: errorMessage,
        },
        { status: 500 }
      );
    }

    console.log("[child:tasks:stats] Fetching stats for child", {
      child_code: body.child_code,
      family_code: body.family_code,
    });

    const stats = await getTaskStatsByChildCodes({
      childCode: body.child_code,
      familyCode: body.family_code,
      supabase: adminClient,
    });

    console.log("[child:tasks:stats] Stats result", stats);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    if (error instanceof ChildTaskError) {
      console.error("[child:tasks:stats] Error", {
        code: error.code,
        message: error.message,
      });

      let status = 400;
      if (error.code === "UNAUTHORIZED") status = 401;
      else if (error.code === "FORBIDDEN") status = 403;

      return NextResponse.json(
        { error: error.code, message: error.message },
        { status }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[child:tasks:stats] Unexpected error", error);

    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: `Failed to fetch stats: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
