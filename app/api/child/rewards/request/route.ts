/**
 * POST /api/child/rewards/request
 *
 * Requests to claim a reward (does NOT deduct points yet)
 * Points are only deducted when parent approves.
 *
 * Requires: Child session cookie (set by /api/child/login)
 * Body: { reward_id: string }
 *
 * Flow:
 * 1. Validate reward exists and belongs to child
 * 2. Check reward status is 'available' (idempotent if already requested)
 * 3. Check child has enough points (but don't deduct)
 * 4. UPDATE rewards SET status='requested', requested_at=now()
 *
 * Returns:
 * - 200: { success: true, reward, ggpoints, already_requested?: boolean }
 * - 400: { error: "INSUFFICIENT_POINTS", message, ggpoints }
 * - 403: { error: "FORBIDDEN", message }
 * - 404: { error: "REWARD_NOT_FOUND", message }
 * - 409: { error: "INVALID_STATUS", message } (if approved/rejected)
 * - 501: { error: "FEATURE_NOT_AVAILABLE", message } (if migration not run)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireChildSession } from "@/lib/auth/childSession";
import { isMissingColumnError, logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[child:rewards:request]";

export async function POST(request: NextRequest) {
  try {
    // Get child session from cookie
    const session = await requireChildSession(request);

    const body = (await request.json()) as {
      reward_id?: string;
    };

    if (!body.reward_id) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "reward_id is required" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    console.log(`${LOG_PREFIX} Requesting reward`, {
      reward_id: body.reward_id,
      child_id: session.child_id,
    });

    // Get the reward with current state
    // Try with status column first to detect if migration is run
    const rewardQuery = await adminClient
      .from("rewards")
      .select("id, name, cost, status, claimed, child_user_id")
      .eq("id", body.reward_id)
      .single();

    // If status column doesn't exist, the request feature is not available
    if (isMissingColumnError(rewardQuery.error)) {
      console.log(`${LOG_PREFIX} Status column not found - feature not available`);
      return NextResponse.json(
        {
          error: "FEATURE_NOT_AVAILABLE",
          message: "Reward request feature requires database migration. Please use the claim feature instead.",
        },
        { status: 501 }
      );
    }

    if (rewardQuery.error || !rewardQuery.data) {
      logSupabaseError(LOG_PREFIX, rewardQuery.error, { step: "get_reward" });
      return NextResponse.json(
        { error: "REWARD_NOT_FOUND", message: "Reward not found" },
        { status: 404 }
      );
    }

    const reward = rewardQuery.data;

    // Validate ownership
    if (reward.child_user_id !== session.child_id) {
      console.warn(`${LOG_PREFIX} Ownership mismatch`, {
        reward_child: reward.child_user_id,
        session_child: session.child_id,
      });
      return NextResponse.json(
        { error: "FORBIDDEN", message: "This reward does not belong to you" },
        { status: 403 }
      );
    }

    // Get current child points_balance
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("points_balance")
      .eq("id", session.child_id)
      .single();

    if (childError || !childData) {
      logSupabaseError(LOG_PREFIX, childError, { step: "get_child_points" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to get child data" },
        { status: 500 }
      );
    }

    const currentPoints = childData.points_balance ?? 0;

    // If already requested, return idempotent success
    if (reward.status === "requested") {
      console.log(`${LOG_PREFIX} Already requested (idempotent)`, {
        reward_id: body.reward_id,
      });
      return NextResponse.json(
        {
          success: true,
          already_requested: true,
          reward: {
            id: reward.id,
            name: reward.name,
            cost: reward.cost,
            status: reward.status,
          },
          ggpoints: currentPoints,
        },
        { status: 200 }
      );
    }

    // If already approved (claimed), return error
    if (reward.status === "approved" || reward.claimed) {
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: "This reward has already been claimed",
        },
        { status: 409 }
      );
    }

    // Check if child has enough points (don't deduct yet, just validate)
    if (currentPoints < reward.cost) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_POINTS",
          message: `Not enough GGPoints. You have ${currentPoints} but need ${reward.cost}.`,
          ggpoints: currentPoints,
        },
        { status: 400 }
      );
    }

    // UPDATE reward to 'requested' status
    // Only update if status is 'available' or 'rejected' (allow re-requesting rejected rewards)
    const requestedAt = new Date().toISOString();
    const { data: updatedReward, error: updateError } = await adminClient
      .from("rewards")
      .update({
        status: "requested",
        requested_at: requestedAt,
        // Clear any previous rejection
        rejected_at: null,
        reject_reason: null,
      })
      .eq("id", body.reward_id)
      .eq("child_user_id", session.child_id)
      .in("status", ["available", "rejected"])
      .select("id, name, cost, status, requested_at")
      .single();

    if (updateError) {
      logSupabaseError(LOG_PREFIX, updateError, { step: "update_reward" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to request reward" },
        { status: 500 }
      );
    }

    if (!updatedReward) {
      // Race condition or status changed
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: "Reward is no longer available for request",
        },
        { status: 409 }
      );
    }

    console.log(`${LOG_PREFIX} Reward requested successfully`, {
      reward_id: body.reward_id,
      status: updatedReward.status,
    });

    return NextResponse.json(
      {
        success: true,
        reward: updatedReward,
        ggpoints: currentPoints,
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

    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to request reward" },
      { status: 500 }
    );
  }
}
