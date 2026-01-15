/**
 * POST /api/child/points
 * 
 * Returns total GGPoints for a child
 * Requires: Child session cookie (set by /api/child/login)
 * 
 * Uses users.points_balance as the source of truth for consistency
 * across all endpoints (rewards, tasks, etc.)
 * 
 * Returns:
 * {
 *   ggpoints: number
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireChildSession } from "@/lib/auth/childSession";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

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

    console.log("[child:points] Fetching points_balance for child", {
      child_id: session.child_id,
    });

    // Get points_balance directly from users table (source of truth)
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("points_balance")
      .eq("id", session.child_id)
      .single();

    if (childError) {
      console.error("[child:points] Failed to get child data:", childError);
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: "Failed to get points balance",
        },
        { status: 500 }
      );
    }

    const totalPoints = childData?.points_balance ?? 0;

    console.log("[child:points] Points balance retrieved", {
      child_id: session.child_id,
      points_balance: totalPoints,
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

    console.error("[child:points] Unexpected error", error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to get total points" },
      { status: 500 }
    );
  }
}

