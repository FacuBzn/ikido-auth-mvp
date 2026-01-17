/**
 * GET /api/parent/rewards/list
 *
 * Lists rewards for a specific child
 * Query params: ?child_id=UUID
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates child belongs to the authenticated parent
 *
 * Returns:
 * {
 *   rewards: [...],
 *   ggpoints: number (child's points_balance)
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { isMissingColumnError, logSupabaseError } from "@/lib/utils/supabaseErrors";
import { DEFAULT_REWARDS } from "@/lib/rewards/defaultRewards";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

// Full columns (with PR13 migration)
const FULL_COLUMNS = "id, name, cost, claimed, claimed_at, created_at, status, requested_at, approved_at, rejected_at, reject_reason";
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

/**
 * Seeds default rewards for a child if they have none
 * Uses upsert for idempotency - duplicates are ignored
 */
async function seedDefaultRewardsForChild(
  adminClient: ReturnType<typeof getSupabaseAdminClient>,
  childId: string,
  logPrefix: string
): Promise<number> {
  const rewardsToInsert = DEFAULT_REWARDS.map((reward) => ({
    child_user_id: childId,
    name: reward.name,
    cost: reward.cost,
    claimed: false,
  }));

  // Try upsert with ignoreDuplicates
  const { data: insertedData, error: upsertError } = await adminClient
    .from("rewards")
    .upsert(rewardsToInsert, {
      onConflict: "child_user_id,name",
      ignoreDuplicates: true,
    })
    .select("id");

  if (upsertError) {
    // Fallback to individual inserts
    console.log(`${logPrefix} Upsert failed, using individual inserts`, {
      error_code: upsertError.code,
    });

    let seededCount = 0;
    for (const reward of DEFAULT_REWARDS) {
      const { error: insertError } = await adminClient
        .from("rewards")
        .insert({
          child_user_id: childId,
          name: reward.name,
          cost: reward.cost,
          claimed: false,
        });

      if (!insertError) {
        seededCount++;
      } else if (insertError.code !== "23505") {
        logSupabaseError(logPrefix, insertError, { step: "auto_seed", reward: reward.name });
      }
    }
    return seededCount;
  }

  return insertedData?.length ?? 0;
}

export async function GET(request: NextRequest) {
  const LOG_PREFIX = "[parent:rewards:list]";

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
        { error: "FORBIDDEN", message: "Only parents can view rewards" },
        { status: 403 }
      );
    }

    // 2. Get child_id from query params
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("child_id");

    if (!childId) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "child_id query parameter is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(childId)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "child_id must be a valid UUID" },
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

    // 4. Validate child belongs to parent
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("id, name, parent_id, points_balance")
      .eq("id", childId)
      .eq("role", "child")
      .single();

    if (childError || !childData) {
      logSupabaseError(LOG_PREFIX, childError, { step: "get_child", childId });
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Child not found" },
        { status: 404 }
      );
    }

    if (childData.parent_id !== parentId) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "This child does not belong to you" },
        { status: 403 }
      );
    }

    // 5. Get rewards for this child
    // Try with all columns first, fallback to basic columns if migration not run
    let rewards;

    const fullQuery = await adminClient
      .from("rewards")
      .select(FULL_COLUMNS)
      .eq("child_user_id", childId)
      .order("created_at", { ascending: false });

    if (isMissingColumnError(fullQuery.error)) {
      // Column doesn't exist - use basic schema
      console.log(`${LOG_PREFIX} New columns not found (code: ${fullQuery.error?.code}), using basic schema`);
      
      const basicQuery = await adminClient
        .from("rewards")
        .select(BASIC_COLUMNS)
        .eq("child_user_id", childId)
        .order("created_at", { ascending: false });

      if (basicQuery.error) {
        logSupabaseError(LOG_PREFIX, basicQuery.error, { step: "fetch_rewards_basic" });
        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to fetch rewards" },
          { status: 500 }
        );
      }

      // Map to include derived status from claimed field
      rewards = (basicQuery.data || []).map((r: BasicReward) => ({
        ...r,
        status: r.claimed ? "approved" : "available",
        requested_at: null,
        approved_at: r.claimed ? r.claimed_at : null,
        rejected_at: null,
        reject_reason: null,
      }));
    } else if (fullQuery.error) {
      logSupabaseError(LOG_PREFIX, fullQuery.error, { step: "fetch_rewards_full" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to fetch rewards" },
        { status: 500 }
      );
    } else {
      rewards = fullQuery.data || [];
    }

    // 6. Auto-seed defaults if no rewards exist for this child
    if (rewards.length === 0) {
      console.log(`${LOG_PREFIX} No rewards found, auto-seeding defaults for child`, { childId });
      
      const seededCount = await seedDefaultRewardsForChild(adminClient, childId, LOG_PREFIX);
      
      if (seededCount > 0) {
        console.log(`${LOG_PREFIX} Auto-seeded ${seededCount} default rewards`);
        
        // Re-fetch rewards after seeding
        const refetchQuery = await adminClient
          .from("rewards")
          .select(BASIC_COLUMNS)
          .eq("child_user_id", childId)
          .order("created_at", { ascending: false });

        if (!refetchQuery.error && refetchQuery.data) {
          rewards = refetchQuery.data.map((r: BasicReward) => ({
            ...r,
            status: r.claimed ? "approved" : "available",
            requested_at: null,
            approved_at: r.claimed ? r.claimed_at : null,
            rejected_at: null,
            reject_reason: null,
          }));
        }
      }
    }

    console.log(`${LOG_PREFIX} Found rewards`, {
      child_id: childId,
      count: rewards.length,
      ggpoints: childData.points_balance,
    });

    return NextResponse.json(
      {
        rewards,
        ggpoints: childData.points_balance ?? 0,
        child: {
          id: childData.id,
          name: childData.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}
