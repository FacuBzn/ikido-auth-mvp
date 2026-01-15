/**
 * POST /api/parent/rewards/claims/approve
 *
 * Approves a pending reward claim
 * Body: { rewardId: string }
 *
 * Flow:
 * 1. Validate parent auth + child ownership
 * 2. Check reward status='requested'
 * 3. Verify child has enough points
 * 4. Atomic update: status='approved', claimed=true, claimed_at=now()
 * 5. Deduct points from users.points_balance (CAS with retry)
 * 6. Insert ggpoints_ledger entry
 *
 * Returns:
 * - 200: { success: true, reward, ggpoints }
 * - 400: { error: "INSUFFICIENT_POINTS", message }
 * - 403: { error: "FORBIDDEN", message }
 * - 404: { error: "NOT_FOUND", message }
 * - 409: { error: "INVALID_STATUS", message }
 * - 501: { error: "FEATURE_NOT_AVAILABLE", message }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { isMissingColumnError, logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[parent:rewards:claims:approve]";
const MAX_RETRIES = 1;

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.profile.role !== "Parent") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only parents can approve claims" },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = (await request.json()) as { rewardId?: string };

    if (!body.rewardId) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "rewardId is required" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // 3. Get parent's internal ID
    const { data: parentData, error: parentError } = await adminClient
      .from("users")
      .select("id")
      .eq("auth_id", authUser.user.id)
      .eq("role", "parent")
      .single();

    if (parentError || !parentData) {
      logSupabaseError(LOG_PREFIX, parentError, { step: "get_parent" });
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Parent record not found" },
        { status: 401 }
      );
    }

    const parentId = parentData.id;

    // 4. Get reward with current state (schema-aware)
    // Try with status column first, fallback to basic columns
    let reward: {
      id: string;
      name: string;
      cost: number;
      status: string | null;
      claimed: boolean;
      child_user_id: string;
    };
    let hasStatusColumn = true;

    const fullRewardQuery = await adminClient
      .from("rewards")
      .select("id, name, cost, status, claimed, child_user_id")
      .eq("id", body.rewardId)
      .single();

    if (isMissingColumnError(fullRewardQuery.error)) {
      // Status column doesn't exist - use legacy schema
      console.log(`${LOG_PREFIX} Status column not found, using legacy schema`);
      hasStatusColumn = false;

      const legacyRewardQuery = await adminClient
        .from("rewards")
        .select("id, name, cost, claimed, child_user_id")
        .eq("id", body.rewardId)
        .single();

      if (legacyRewardQuery.error || !legacyRewardQuery.data) {
        logSupabaseError(LOG_PREFIX, legacyRewardQuery.error, { step: "get_reward_legacy" });
        return NextResponse.json(
          { error: "NOT_FOUND", message: "Reward not found" },
          { status: 404 }
        );
      }

      // Map to expected shape with derived status
      reward = {
        ...legacyRewardQuery.data,
        status: legacyRewardQuery.data.claimed ? "approved" : "available",
      };
    } else if (fullRewardQuery.error || !fullRewardQuery.data) {
      logSupabaseError(LOG_PREFIX, fullRewardQuery.error, { step: "get_reward" });
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Reward not found" },
        { status: 404 }
      );
    } else {
      reward = fullRewardQuery.data;
    }

    // 5. Validate child belongs to parent
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("id, parent_id, points_balance")
      .eq("id", reward.child_user_id)
      .eq("role", "child")
      .single();

    if (childError || !childData || childData.parent_id !== parentId) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "This reward does not belong to your child" },
        { status: 403 }
      );
    }

    const currentPoints = childData.points_balance ?? 0;

    // 6. If already approved/claimed, return idempotent success
    if (reward.status === "approved" || reward.claimed) {
      console.log(`${LOG_PREFIX} Already approved (idempotent)`, {
        reward_id: body.rewardId,
      });
      return NextResponse.json(
        {
          success: true,
          already_approved: true,
          reward: {
            id: reward.id,
            name: reward.name,
            cost: reward.cost,
            status: "approved",
          },
          ggpoints: currentPoints,
        },
        { status: 200 }
      );
    }

    // 7. Validate status (schema-aware)
    // With status column: must be 'requested'
    // Without status column (legacy): must not be claimed
    if (hasStatusColumn && reward.status !== "requested") {
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: `Reward must be in 'requested' status to approve. Current status: ${reward.status}`,
        },
        { status: 409 }
      );
    }
    // For legacy schema, we already checked claimed=false above

    // 8. Check if child has enough points
    if (currentPoints < reward.cost) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_POINTS",
          message: `Child doesn't have enough GGPoints. Has ${currentPoints}, needs ${reward.cost}.`,
          ggpoints: currentPoints,
        },
        { status: 400 }
      );
    }

    // 9. UPDATE reward to 'approved' status
    // Schema-aware: use legacy or new schema based on what we detected earlier
    const approvedAt = new Date().toISOString();
    let updatedReward;
    const useLegacySchema = !hasStatusColumn;

    if (useLegacySchema) {
      // Legacy schema: only claimed/claimed_at
      const legacyUpdate = await adminClient
        .from("rewards")
        .update({
          claimed: true,
          claimed_at: approvedAt,
        })
        .eq("id", body.rewardId)
        .eq("claimed", false) // Only update if not already claimed
        .select("id, name, cost, claimed, claimed_at")
        .single();

      if (legacyUpdate.error) {
        logSupabaseError(LOG_PREFIX, legacyUpdate.error, { step: "update_reward_legacy" });
        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to approve reward" },
          { status: 500 }
        );
      }

      if (!legacyUpdate.data) {
        return NextResponse.json(
          {
            error: "INVALID_STATUS",
            message: "Reward already claimed or status changed. Please refresh.",
          },
          { status: 409 }
        );
      }

      // Map legacy response to expected format
      updatedReward = {
        ...legacyUpdate.data,
        status: "approved" as const,
      };
    } else {
      // New schema: status + approved_at
      const fullUpdate = await adminClient
        .from("rewards")
        .update({
          status: "approved",
          claimed: true,
          claimed_at: approvedAt,
          approved_at: approvedAt,
        })
        .eq("id", body.rewardId)
        .eq("status", "requested") // Only update if still requested (race condition protection)
        .select("id, name, cost, status, claimed_at")
        .single();

      if (fullUpdate.error) {
        logSupabaseError(LOG_PREFIX, fullUpdate.error, { step: "update_reward" });
        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to approve reward" },
          { status: 500 }
        );
      }

      if (!fullUpdate.data) {
        // Race condition - status changed
        return NextResponse.json(
          {
            error: "INVALID_STATUS",
            message: "Reward status changed. Please refresh and try again.",
          },
          { status: 409 }
        );
      }

      updatedReward = fullUpdate.data;
    }

    // 10. Deduct points using Compare-And-Swap with retry
    let newBalance = 0;
    let casSuccess = false;
    let pointsUpdateBalance = currentPoints;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { data: updatedUsers, error: pointsError } = await adminClient
        .from("users")
        .update({ points_balance: pointsUpdateBalance - reward.cost })
        .eq("id", reward.child_user_id)
        .eq("points_balance", pointsUpdateBalance) // CAS condition
        .gte("points_balance", reward.cost) // Safety check
        .select("points_balance");

      if (pointsError) {
        logSupabaseError(LOG_PREFIX, pointsError, { step: "update_points", attempt });
        // Rollback reward status (schema-aware)
        if (useLegacySchema) {
          await adminClient
            .from("rewards")
            .update({ claimed: false, claimed_at: null })
            .eq("id", body.rewardId);
        } else {
          await adminClient
            .from("rewards")
            .update({
              status: "requested",
              claimed: false,
              claimed_at: null,
              approved_at: null,
            })
            .eq("id", body.rewardId);
        }

        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to deduct points" },
          { status: 500 }
        );
      }

      if (updatedUsers && updatedUsers.length > 0) {
        newBalance = updatedUsers[0].points_balance;
        casSuccess = true;
        break;
      }

      // CAS failed - refetch and retry
      if (attempt < MAX_RETRIES) {
        console.log(`${LOG_PREFIX} CAS failed, retrying (attempt ${attempt + 1})`);
        const { data: refetchedChild } = await adminClient
          .from("users")
          .select("points_balance")
          .eq("id", reward.child_user_id)
          .single();

        if (refetchedChild) {
          pointsUpdateBalance = refetchedChild.points_balance ?? 0;
          if (pointsUpdateBalance < reward.cost) {
            // Not enough points after refetch - rollback (schema-aware)
            if (useLegacySchema) {
              await adminClient
                .from("rewards")
                .update({ claimed: false, claimed_at: null })
                .eq("id", body.rewardId);
            } else {
              await adminClient
                .from("rewards")
                .update({
                  status: "requested",
                  claimed: false,
                  claimed_at: null,
                  approved_at: null,
                })
                .eq("id", body.rewardId);
            }

            return NextResponse.json(
              {
                error: "INSUFFICIENT_POINTS",
                message: "Child no longer has enough points",
                ggpoints: pointsUpdateBalance,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    if (!casSuccess) {
      // Rollback reward status (schema-aware)
      if (useLegacySchema) {
        await adminClient
          .from("rewards")
          .update({ claimed: false, claimed_at: null })
          .eq("id", body.rewardId);
      } else {
        await adminClient
          .from("rewards")
          .update({
            status: "requested",
            claimed: false,
            claimed_at: null,
            approved_at: null,
          })
          .eq("id", body.rewardId);
      }

      return NextResponse.json(
        {
          error: "CONCURRENT_MODIFICATION",
          message: "Points changed during approval. Please try again.",
        },
        { status: 409 }
      );
    }

    // 11. Insert ledger entry (best effort)
    const { error: ledgerError } = await adminClient.from("ggpoints_ledger").insert({
      child_id: reward.child_user_id,
      parent_id: parentId,
      delta: -reward.cost,
      reason: `Claimed reward: ${reward.name}`,
      child_task_id: null,
    });

    if (ledgerError) {
      logSupabaseError(LOG_PREFIX, ledgerError, { step: "insert_ledger" });
      // Don't fail the request, ledger is for auditing
    }

    console.log(`${LOG_PREFIX} Reward approved successfully`, {
      reward_id: body.rewardId,
      reward_name: reward.name,
      cost: reward.cost,
      new_balance: newBalance,
    });

    return NextResponse.json(
      {
        success: true,
        reward: updatedReward,
        ggpoints: newBalance,
        points_deducted: reward.cost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to approve claim" },
      { status: 500 }
    );
  }
}
