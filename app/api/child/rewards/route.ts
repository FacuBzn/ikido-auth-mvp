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
 *       created_at: string,
 *       status: string,
 *       requested_at: string | null,
 *       reject_reason: string | null
 *     }
 *   ],
 *   ggpoints: number
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireChildSession } from "@/lib/auth/childSession";
import { isMissingColumnError, logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[child:rewards]";

// Full columns (with PR13 migration)
const FULL_COLUMNS = "id, name, cost, claimed, claimed_at, created_at, status, requested_at, reject_reason";
// Basic columns (legacy schema)
const BASIC_COLUMNS = "id, name, cost, claimed, claimed_at, created_at";

interface BasicReward {
  id: string;
  name: string;
  cost: number;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get child session from cookie
    const session = await requireChildSession(request);

    let adminClient;
    try {
      adminClient = getSupabaseAdminClient();
    } catch (envError) {
      console.error(`${LOG_PREFIX} Environment configuration error:`, envError);
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

    console.log(`${LOG_PREFIX} Fetching rewards for child`, {
      child_id: session.child_id,
    });

    // Get rewards for this child
    // Try with all columns first, fallback to basic if migration not run
    let rewards;

    const fullQuery = await adminClient
      .from("rewards")
      .select(FULL_COLUMNS)
      .eq("child_user_id", session.child_id)
      .order("created_at", { ascending: false });

    if (isMissingColumnError(fullQuery.error)) {
      // New columns don't exist - use basic schema
      console.log(`${LOG_PREFIX} New columns not found (code: ${fullQuery.error?.code}), using basic schema`);
      
      const basicQuery = await adminClient
        .from("rewards")
        .select(BASIC_COLUMNS)
        .eq("child_user_id", session.child_id)
        .order("created_at", { ascending: false });

      if (basicQuery.error) {
        logSupabaseError(LOG_PREFIX, basicQuery.error, { step: "fetch_rewards_basic" });
        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to load rewards" },
          { status: 500 }
        );
      }

      // Map to include derived status
      rewards = (basicQuery.data || []).map((r: BasicReward) => ({
        ...r,
        status: r.claimed ? "approved" : "available",
        requested_at: null,
        reject_reason: null,
      }));
    } else if (fullQuery.error) {
      logSupabaseError(LOG_PREFIX, fullQuery.error, { step: "fetch_rewards_full" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to load rewards" },
        { status: 500 }
      );
    } else {
      rewards = fullQuery.data || [];
    }

    // Get points_balance from users table (materialized balance for consistency)
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("points_balance")
      .eq("id", session.child_id)
      .single();

    if (childError) {
      logSupabaseError(LOG_PREFIX, childError, { step: "get_child_points" });
    }

    const totalPoints = childData?.points_balance ?? 0;

    console.log(`${LOG_PREFIX} Found rewards`, {
      count: rewards.length,
      points_balance: totalPoints,
    });

    return NextResponse.json(
      {
        rewards,
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

    console.error(`${LOG_PREFIX} Unexpected error`, error);
    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: "Failed to load rewards",
      },
      { status: 500 }
    );
  }
}
