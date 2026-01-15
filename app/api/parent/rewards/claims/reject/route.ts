/**
 * POST /api/parent/rewards/claims/reject
 *
 * Rejects a pending reward claim
 * Body: { rewardId: string, reason?: string }
 *
 * Flow:
 * 1. Validate parent auth + child ownership
 * 2. Check reward status='requested'
 * 3. Update: status='rejected', rejected_at=now(), reject_reason
 * 4. Points are NOT deducted (child keeps their points)
 *
 * Returns:
 * - 200: { success: true, reward }
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

const LOG_PREFIX = "[parent:rewards:claims:reject]";

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
        { error: "FORBIDDEN", message: "Only parents can reject claims" },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = (await request.json()) as {
      rewardId?: string;
      reason?: string;
    };

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

    // 4. Get reward with current state
    const rewardQuery = await adminClient
      .from("rewards")
      .select("id, name, cost, status, child_user_id")
      .eq("id", body.rewardId)
      .single();

    // If status column doesn't exist, rejection feature is not available
    if (isMissingColumnError(rewardQuery.error)) {
      console.log(`${LOG_PREFIX} Status column not found - feature not available`);
      return NextResponse.json(
        {
          error: "FEATURE_NOT_AVAILABLE",
          message: "Reward rejection feature requires database migration. Please run the SQL migration.",
        },
        { status: 501 }
      );
    }

    if (rewardQuery.error || !rewardQuery.data) {
      logSupabaseError(LOG_PREFIX, rewardQuery.error, { step: "get_reward" });
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Reward not found" },
        { status: 404 }
      );
    }

    const reward = rewardQuery.data;

    // 5. Validate child belongs to parent
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("id, parent_id")
      .eq("id", reward.child_user_id)
      .eq("role", "child")
      .single();

    if (childError || !childData || childData.parent_id !== parentId) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "This reward does not belong to your child" },
        { status: 403 }
      );
    }

    // 6. Validate status
    // If already rejected, return idempotent success
    if (reward.status === "rejected") {
      console.log(`${LOG_PREFIX} Already rejected (idempotent)`, {
        reward_id: body.rewardId,
      });
      return NextResponse.json(
        {
          success: true,
          already_rejected: true,
          reward: {
            id: reward.id,
            name: reward.name,
            cost: reward.cost,
            status: "rejected",
          },
        },
        { status: 200 }
      );
    }

    // Can only reject if status is 'requested'
    if (reward.status !== "requested") {
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: `Reward must be in 'requested' status to reject. Current status: ${reward.status}`,
        },
        { status: 409 }
      );
    }

    // 7. UPDATE reward to 'rejected' status
    const rejectedAt = new Date().toISOString();
    const { data: updatedReward, error: updateError } = await adminClient
      .from("rewards")
      .update({
        status: "rejected",
        rejected_at: rejectedAt,
        reject_reason: body.reason?.trim() || null,
        decided_by_parent_id: parentId,
        // Keep claimed=false (no points were deducted)
        claimed: false,
      })
      .eq("id", body.rewardId)
      .eq("status", "requested") // Only update if still requested
      .select("id, name, cost, status, rejected_at, reject_reason")
      .single();

    if (updateError) {
      logSupabaseError(LOG_PREFIX, updateError, { step: "update_reward" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to reject reward" },
        { status: 500 }
      );
    }

    if (!updatedReward) {
      // Race condition - status changed
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: "Reward status changed. Please refresh and try again.",
        },
        { status: 409 }
      );
    }

    console.log(`${LOG_PREFIX} Reward rejected successfully`, {
      reward_id: body.rewardId,
      reward_name: reward.name,
      reason: body.reason || "(no reason provided)",
    });

    return NextResponse.json(
      {
        success: true,
        reward: updatedReward,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to reject claim" },
      { status: 500 }
    );
  }
}
