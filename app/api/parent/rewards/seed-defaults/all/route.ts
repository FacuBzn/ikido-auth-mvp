/**
 * POST /api/parent/rewards/seed-defaults/all
 *
 * Seeds default rewards for ALL children of the authenticated parent
 * Body: {} (empty or optional)
 *
 * Auth: Requires parent authentication (Supabase Auth)
 *
 * This endpoint is idempotent - calling it multiple times will not create duplicates
 * due to the unique index on (child_user_id, name).
 *
 * Returns:
 * - 200: { success: true, results: [{ child_id, child_name, seeded }], totalSeeded: number }
 */

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { DEFAULT_REWARDS } from "@/lib/rewards/defaultRewards";
import { logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[parent:rewards:seed-defaults:all]";

interface SeedResult {
  child_id: string;
  child_name: string | null;
  seeded: number;
}

export async function POST() {
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
        { error: "FORBIDDEN", message: "Only parents can seed rewards" },
        { status: 403 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // 2. Get parent's internal ID
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

    // 3. Get all children of this parent
    const { data: children, error: childrenError } = await adminClient
      .from("users")
      .select("id, name")
      .eq("parent_id", parentId)
      .eq("role", "child");

    if (childrenError) {
      logSupabaseError(LOG_PREFIX, childrenError, { step: "get_children" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to get children" },
        { status: 500 }
      );
    }

    if (!children || children.length === 0) {
      console.log(`${LOG_PREFIX} No children found for parent`, { parentId });
      return NextResponse.json(
        {
          success: true,
          results: [],
          totalSeeded: 0,
          message: "No children found for this parent",
        },
        { status: 200 }
      );
    }

    // 4. Seed default rewards for each child using upsert
    const results: SeedResult[] = [];
    let totalSeeded = 0;

    for (const child of children) {
      // Build batch of rewards for this child
      const rewardsToInsert = DEFAULT_REWARDS.map((reward) => ({
        child_user_id: child.id,
        name: reward.name,
        cost: reward.cost,
        claimed: false,
      }));

      // Use upsert with ignoreDuplicates for idempotency
      const { data: insertedData, error: upsertError } = await adminClient
        .from("rewards")
        .upsert(rewardsToInsert, {
          onConflict: "child_user_id,name",
          ignoreDuplicates: true,
        })
        .select("id");

      let seededCount = 0;

      if (upsertError) {
        // Fallback to individual inserts if upsert fails
        console.log(`${LOG_PREFIX} Upsert failed for child ${child.id}, falling back`, {
          error_code: upsertError.code,
        });

        for (const reward of DEFAULT_REWARDS) {
          const { error: insertError } = await adminClient
            .from("rewards")
            .insert({
              child_user_id: child.id,
              name: reward.name,
              cost: reward.cost,
              claimed: false,
            });

          if (!insertError) {
            seededCount++;
          } else if (insertError.code !== "23505") {
            logSupabaseError(LOG_PREFIX, insertError, {
              step: "insert_reward",
              child_id: child.id,
              reward: reward.name,
            });
          }
        }
      } else {
        seededCount = insertedData?.length ?? 0;
      }

      results.push({
        child_id: child.id,
        child_name: child.name,
        seeded: seededCount,
      });

      totalSeeded += seededCount;
    }

    console.log(`${LOG_PREFIX} Seeded defaults for all children`, {
      parent_id: parentId,
      children_count: children.length,
      total_seeded: totalSeeded,
      total_attempted: children.length * DEFAULT_REWARDS.length,
    });

    return NextResponse.json(
      {
        success: true,
        results,
        totalSeeded,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to seed default rewards" },
      { status: 500 }
    );
  }
}
