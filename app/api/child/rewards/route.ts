/**
 * POST /api/child/rewards
 *
 * Lists rewards for a child
 * Requires: Child session cookie (set by /api/child/login)
 *
 * Returns:
 * {
 *   rewards: [
 *     {
 *       id: string,
 *       name: string,
 *       cost: number,
 *       claimed: boolean,
 *       claimed_at: string | null,
 *       created_at: string
 *     }
 *   ],
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
      console.error("[child:rewards] Environment configuration error:", envError);
      return NextResponse.json(
        {
          error: "CONFIGURATION_ERROR",
          message:
            envError instanceof Error
              ? envError.message
              : "Server configuration error.",
        },
        { status: 500 }
      );
    }

    console.log("[child:rewards] Fetching rewards for child", {
      child_id: session.child_id,
    });

    // Get rewards for this child
    const { data: rewards, error: rewardsError } = await adminClient
      .from("rewards")
      .select("id, name, cost, claimed, claimed_at, created_at")
      .eq("child_user_id", session.child_id)
      .order("created_at", { ascending: false });

    if (rewardsError) {
      console.error("[child:rewards] Failed to load rewards:", rewardsError);
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: "Failed to load rewards",
        },
        { status: 500 }
      );
    }

    // Get points_balance from users table (materialized balance for consistency)
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("points_balance")
      .eq("id", session.child_id)
      .single();

    if (childError) {
      console.error("[child:rewards] Failed to get child data:", childError);
    }

    const totalPoints = childData?.points_balance ?? 0;

    console.log("[child:rewards] Found rewards", {
      count: rewards?.length || 0,
      points_balance: totalPoints,
    });

    return NextResponse.json(
      {
        rewards: rewards || [],
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

    console.error("[child:rewards] Unexpected error", error);
    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: "Failed to load rewards",
      },
      { status: 500 }
    );
  }
}
