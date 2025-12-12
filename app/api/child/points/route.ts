/**
 * GET /api/child/points
 * 
 * Returns total GGPoints for a child
 * Requires: Child session cookie (set by /api/child/login)
 * 
 * Returns:
 * {
 *   ggpoints: number
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import {
  getTotalPointsForChild,
  ChildTaskError,
} from "@/lib/repositories/childTaskRepository";
import { requireChildSession } from "@/lib/auth/childSession";

export async function POST(request: NextRequest) {
  try {
    // Get child session from cookie
    const session = await requireChildSession(request);

    let adminClient;
    try {
      adminClient = getSupabaseAdminClient();
    } catch (envError) {
      console.error("[child:points] Environment configuration error:", envError);
      return NextResponse.json(
        {
          error: "CONFIGURATION_ERROR",
          message: envError instanceof Error ? envError.message : "Server configuration error. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    console.log("[child:points] Fetching total points for child", {
      child_id: session.child_id,
    });

    // Get total points
    const totalPoints = await getTotalPointsForChild({
      childId: session.child_id,
      supabase: adminClient,
    });

    console.log("[child:points] Total points calculated", {
      child_id: session.child_id,
      total_points: totalPoints,
    });

    return NextResponse.json(
      {
        ggpoints: totalPoints,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle unauthorized (missing session)
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Child session required. Please log in first.",
        },
        { status: 401 }
      );
    }

    if (error instanceof ChildTaskError) {
      console.error("[child:points] Error", {
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

    console.error("[child:points] Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to get total points" },
      { status: 500 }
    );
  }
}

