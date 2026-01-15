/**
 * POST /api/parent/rewards/delete
 *
 * Deletes a reward
 * Body: { rewardId: string }
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates reward's child belongs to the authenticated parent
 *
 * Restrictions:
 * - Cannot delete if status is 'requested' (must approve/reject first)
 * - Cannot delete if status is 'approved' (already claimed)
 *
 * Returns:
 * - 200: { success: true }
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

const LOG_PREFIX = "[parent:rewards:delete]";

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
        { error: "FORBIDDEN", message: "Only parents can delete rewards" },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = (await request.json()) as {
      rewardId?: string;
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

    // 4. Get reward and validate ownership via child
    // Handle schema without status column
    let reward;
    let hasStatusColumn = true;
    
    const fullQuery = await adminClient
      .from("rewards")
      .select("id, name, status, child_user_id, claimed")
      .eq("id", body.rewardId)
      .single();

    if (isMissingColumnError(fullQuery.error)) {
      // Status column doesn't exist
      hasStatusColumn = false;
      const basicQuery = await adminClient
        .from("rewards")
        .select("id, name, child_user_id, claimed")
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
    if (reward.status === "requested") {
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: "Cannot delete a reward that is pending approval. Approve or reject it first.",
        },
        { status: 409 }
      );
    }

    if (reward.status === "approved" || reward.claimed) {
      return NextResponse.json(
        {
          error: "INVALID_STATUS",
          message: "Cannot delete a reward that has been claimed.",
        },
        { status: 409 }
      );
    }

    // 7. Delete reward (only available or rejected)
    let deleteError;
    if (hasStatusColumn) {
      const result = await adminClient
        .from("rewards")
        .delete()
        .eq("id", body.rewardId)
        .in("status", ["available", "rejected"]);
      deleteError = result.error;
    } else {
      // Without status column, just check claimed=false
      const result = await adminClient
        .from("rewards")
        .delete()
        .eq("id", body.rewardId)
        .eq("claimed", false);
      deleteError = result.error;
    }

    if (deleteError) {
      logSupabaseError(LOG_PREFIX, deleteError, { step: "delete_reward" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to delete reward" },
        { status: 500 }
      );
    }

    console.log(`${LOG_PREFIX} Reward deleted`, {
      reward_id: body.rewardId,
      name: reward.name,
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to delete reward" },
      { status: 500 }
    );
  }
}
