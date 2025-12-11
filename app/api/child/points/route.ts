/**
 * GET /api/child/points
 * 
 * Returns total GGPoints for a child
 * Body: { child_code: string, family_code: string }
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

    const adminClient = getSupabaseAdminClient();

    console.log("[child:points] Fetching total points for child", {
      child_code: body.child_code,
    });

    // Find child by codes
    const { data: child, error: childError } = await adminClient
      .from("users")
      .select("id, family_code")
      .eq("child_code", body.child_code.toUpperCase())
      .eq("role", "child")
      .single();

    if (childError || !child) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Invalid child credentials",
        },
        { status: 401 }
      );
    }

    if (child.family_code !== body.family_code.toUpperCase()) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Invalid family code",
        },
        { status: 401 }
      );
    }

    // Get total points
    const totalPoints = await getTotalPointsForChild({
      childId: child.id,
      supabase: adminClient,
    });

    console.log("[child:points] Total points calculated", {
      child_id: child.id,
      total_points: totalPoints,
    });

    return NextResponse.json(
      {
        ggpoints: totalPoints,
      },
      { status: 200 }
    );
  } catch (error) {
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

