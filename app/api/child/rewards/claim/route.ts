/**
 * POST /api/child/rewards/claim
 *
 * Claims a reward for a child (deducts points)
 * Requires: Child session cookie (set by /api/child/login)
 * Body: { reward_id: string }
 *
 * Validates:
 * - Reward belongs to the child
 * - Reward is not already claimed
 * - Child has enough points
 *
 * Race condition protection (ATOMIC):
 * 1. UPDATE reward WHERE claimed=false (prevents double-claim of same reward)
 * 2. UPDATE users SET points_balance = points_balance - cost WHERE points_balance >= cost
 *    (prevents overspend from concurrent claims of different rewards)
 * 3. Only insert ledger if both updates succeed
 *
 * Returns:
 * - 200: { success: true, reward, ggpoints, already_claimed?: false }
 * - 200: { success: true, reward, ggpoints, already_claimed: true } (idempotent)
 * - 400: { error: "INSUFFICIENT_POINTS", message, ggpoints }
 * - 403: { error: "FORBIDDEN", message }
 * - 404: { error: "REWARD_NOT_FOUND", message }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireChildSession } from "@/lib/auth/childSession";

export async function POST(request: NextRequest) {
  try {
    // Get child session from cookie
    const session = await requireChildSession(request);

    const body = (await request.json()) as {
      reward_id?: string;
    };

    if (!body.reward_id) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "reward_id is required",
        },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    console.log("[child:rewards:claim] Claiming reward", {
      reward_id: body.reward_id,
      child_id: session.child_id,
    });

    // Get the reward with current state
    const { data: reward, error: rewardError } = await adminClient
      .from("rewards")
      .select("id, name, cost, claimed, claimed_at, child_user_id")
      .eq("id", body.reward_id)
      .single();

    if (rewardError || !reward) {
      console.error("[child:rewards:claim] Reward not found:", rewardError);
      return NextResponse.json(
        {
          error: "REWARD_NOT_FOUND",
          message: "Reward not found",
        },
        { status: 404 }
      );
    }

    // Validate ownership
    if (reward.child_user_id !== session.child_id) {
      console.warn("[child:rewards:claim] Ownership mismatch", {
        reward_child: reward.child_user_id,
        session_child: session.child_id,
      });
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "This reward does not belong to you",
        },
        { status: 403 }
      );
    }

    // Get current child data (points_balance and parent_id)
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("points_balance, parent_id")
      .eq("id", session.child_id)
      .single();

    if (childError || !childData) {
      console.error("[child:rewards:claim] Failed to get child data:", childError);
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: "Failed to resolve child data",
        },
        { status: 500 }
      );
    }

    const currentPoints = childData.points_balance ?? 0;

    // If already claimed, return success with already_claimed flag (idempotent)
    if (reward.claimed) {
      console.log("[child:rewards:claim] Already claimed (idempotent)", {
        reward_id: body.reward_id,
      });
      return NextResponse.json(
        {
          success: true,
          reward: {
            id: reward.id,
            name: reward.name,
            cost: reward.cost,
            claimed: true,
            claimed_at: reward.claimed_at,
          },
          ggpoints: currentPoints,
          already_claimed: true,
        },
        { status: 200 }
      );
    }

    // Check if enough points BEFORE attempting updates
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

    // ===== ATOMIC CLAIM SEQUENCE =====
    // Step 1: ATOMIC UPDATE reward (only if still unclaimed)
    const claimedAt = new Date().toISOString();
    const { data: updatedRewards, error: rewardUpdateError } = await adminClient
      .from("rewards")
      .update({
        claimed: true,
        claimed_at: claimedAt,
      })
      .eq("id", body.reward_id)
      .eq("child_user_id", session.child_id)
      .eq("claimed", false) // CRITICAL: Only update if not yet claimed
      .select("id, name, cost, claimed, claimed_at");

    if (rewardUpdateError) {
      console.error("[child:rewards:claim] Reward update failed:", rewardUpdateError);
      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: "Failed to claim reward",
        },
        { status: 500 }
      );
    }

    // Check if reward update affected any rows (race condition check)
    if (!updatedRewards || updatedRewards.length === 0) {
      // Another request claimed it first - return idempotent success
      console.log("[child:rewards:claim] Race condition: already claimed by another request", {
        reward_id: body.reward_id,
      });

      // Refetch current state
      const { data: refetchedReward } = await adminClient
        .from("rewards")
        .select("id, name, cost, claimed, claimed_at")
        .eq("id", body.reward_id)
        .single();

      return NextResponse.json(
        {
          success: true,
          reward: refetchedReward || {
            id: reward.id,
            name: reward.name,
            cost: reward.cost,
            claimed: true,
            claimed_at: null,
          },
          ggpoints: currentPoints,
          already_claimed: true,
        },
        { status: 200 }
      );
    }

    // Step 2: ATOMIC UPDATE points_balance (only if sufficient balance)
    // This prevents overspend from concurrent claims of DIFFERENT rewards
    const { data: updatedUsers, error: pointsUpdateError } = await adminClient
      .from("users")
      .update({
        points_balance: currentPoints - reward.cost,
      })
      .eq("id", session.child_id)
      .gte("points_balance", reward.cost) // CRITICAL: Only if balance >= cost
      .select("points_balance");

    if (pointsUpdateError) {
      console.error("[child:rewards:claim] Points update failed:", pointsUpdateError);
      // ROLLBACK: Revert reward claim since points deduction failed
      await adminClient
        .from("rewards")
        .update({ claimed: false, claimed_at: null })
        .eq("id", body.reward_id);

      return NextResponse.json(
        {
          error: "DATABASE_ERROR",
          message: "Failed to deduct points",
        },
        { status: 500 }
      );
    }

    // Check if points update affected any rows (concurrent claim race condition)
    if (!updatedUsers || updatedUsers.length === 0) {
      console.log("[child:rewards:claim] Race condition: insufficient points after concurrent claim", {
        reward_id: body.reward_id,
        expected_balance: currentPoints,
        cost: reward.cost,
      });

      // ROLLBACK: Revert reward claim since points were insufficient
      await adminClient
        .from("rewards")
        .update({ claimed: false, claimed_at: null })
        .eq("id", body.reward_id);

      // Get actual current balance
      const { data: actualBalance } = await adminClient
        .from("users")
        .select("points_balance")
        .eq("id", session.child_id)
        .single();

      return NextResponse.json(
        {
          error: "INSUFFICIENT_POINTS",
          message: `Not enough GGPoints. Another claim may have reduced your balance.`,
          ggpoints: actualBalance?.points_balance ?? 0,
        },
        { status: 400 }
      );
    }

    const newBalance = updatedUsers[0].points_balance;

    // Step 3: Insert ledger entry for audit trail (non-critical, best effort)
    if (childData.parent_id) {
      const { error: ledgerError } = await adminClient
        .from("ggpoints_ledger")
        .insert({
          child_id: session.child_id,
          parent_id: childData.parent_id,
          delta: -reward.cost,
          reason: `Claimed reward: ${reward.name}`,
          child_task_id: null,
        });

      if (ledgerError) {
        console.error("[child:rewards:claim] Ledger insert failed (non-critical):", ledgerError);
        // Continue - the claim is still valid, ledger is just for audit
      }
    }

    console.log("[child:rewards:claim] Reward claimed successfully (atomic)", {
      reward_id: body.reward_id,
      cost: reward.cost,
      old_balance: currentPoints,
      new_balance: newBalance,
    });

    return NextResponse.json(
      {
        success: true,
        reward: updatedRewards[0],
        ggpoints: newBalance,
        already_claimed: false,
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

    console.error("[child:rewards:claim] Unexpected error", error);
    return NextResponse.json(
      {
        error: "DATABASE_ERROR",
        message: "Failed to claim reward",
      },
      { status: 500 }
    );
  }
}
