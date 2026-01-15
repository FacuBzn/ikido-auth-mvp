/**
 * POST /api/parent/rewards/update
 *
 * Updates an existing reward
 * Body: { rewardId: string, name?: string, cost?: number }
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates reward's child belongs to the authenticated parent
 *
 * Restrictions:
 * - Cannot update cost if status is 'requested' or 'approved'
 * - Can always update name
 *
 * Returns:
 * - 200: { success: true, reward }
 * - 400: { error: "INVALID_INPUT", message }
 * - 403: { error: "FORBIDDEN", message }
 * - 404: { error: "NOT_FOUND", message }
 * - 409: { error: "INVALID_STATUS", message }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { isMissingColumnError, logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[parent:rewards:update]";

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
        { error: "FORBIDDEN", message: "Only parents can update rewards" },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = (await request.json()) as {
      rewardId?: string;
      name?: string;
      cost?: number;
    };

    if (!body.rewardId) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "rewardId is required" },
        { status: 400 }
      );
    }

    // At least one field to update
    if (!body.name && body.cost === undefined) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "At least name or cost is required" },
        { status: 400 }
      );
    }

    if (body.cost !== undefined && (body.cost < 1 || body.cost > 9999)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "cost must be between 1 and 9999" },
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

    // 4. Get reward and validate ownership via child
    // Handle schema without status column
    let reward;
    
    const fullQuery = await adminClient
      .from("rewards")
      .select("id, name, cost, status, child_user_id, claimed")
      .eq("id", body.rewardId)
      .single();

    if (isMissingColumnError(fullQuery.error)) {
      // Status column doesn't exist - use basic query
      const basicQuery = await adminClient
        .from("rewards")
        .select("id, name, cost, child_user_id, claimed")
        .eq("id", body.rewardId)
        .single();
      
      if (basicQuery.error || !basicQuery.data) {
        logSupabaseError(LOG_PREFIX, basicQuery.error, { step: "get_reward_basic" });
        return NextResponse.json(
          { error: "NOT_FOUND", message: "Reward not found" },
          { status: 404 }
        );
      }
      
      reward = {
        ...basicQuery.data,
        status: basicQuery.data.claimed ? "approved" : "available",
      };
    } else if (fullQuery.error || !fullQuery.data) {
      logSupabaseError(LOG_PREFIX, fullQuery.error, { step: "get_reward_full" });
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Reward not found" },
        { status: 404 }
      );
    } else {
      reward = fullQuery.data;
    }

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

    // 6. Check status restrictions
    if (body.cost !== undefined && reward.status !== "available") {
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: `Cannot update cost when reward is ${reward.status}. Only name can be changed.`,
        },
        { status: 409 }
      );
    }

    // 7. Build update object
    const updateData: { name?: string; cost?: number } = {};
    if (body.name) {
      updateData.name = body.name.trim();
    }
    if (body.cost !== undefined && reward.status === "available") {
      updateData.cost = body.cost;
    }

    // 8. Update reward
    let updatedReward;
    
    const fullUpdate = await adminClient
      .from("rewards")
      .update(updateData)
      .eq("id", body.rewardId)
      .select("id, name, cost, status, created_at")
      .single();

    if (isMissingColumnError(fullUpdate.error)) {
      // Status column doesn't exist
      const basicUpdate = await adminClient
        .from("rewards")
        .update(updateData)
        .eq("id", body.rewardId)
        .select("id, name, cost, created_at")
        .single();
      
      if (basicUpdate.error) {
        logSupabaseError(LOG_PREFIX, basicUpdate.error, { step: "update_basic" });
        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to update reward" },
          { status: 500 }
        );
      }
      
      updatedReward = { ...basicUpdate.data, status: reward.status };
    } else if (fullUpdate.error) {
      logSupabaseError(LOG_PREFIX, fullUpdate.error, { step: "update_full" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to update reward" },
        { status: 500 }
      );
    } else {
      updatedReward = fullUpdate.data;
    }

    console.log(`${LOG_PREFIX} Reward updated`, {
      reward_id: updatedReward.id,
      name: updatedReward.name,
      cost: updatedReward.cost,
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
      { error: "DATABASE_ERROR", message: "Failed to update reward" },
      { status: 500 }
    );
  }
}
