/**
 * POST /api/parent/rewards/seed-defaults
 *
 * Seeds default rewards for a specific child
 * Body: { child_id: string }
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates child belongs to the authenticated parent
 *
 * This endpoint is idempotent - calling it multiple times will not create duplicates
 * due to the unique index on (child_user_id, name).
 *
 * Returns:
 * - 200: { success: true, seeded: number, child_id: string }
 * - 400: { error: "INVALID_INPUT", message }
 * - 403: { error: "FORBIDDEN", message }
 * - 404: { error: "NOT_FOUND", message }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { DEFAULT_REWARDS } from "@/lib/rewards/defaultRewards";
import { logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[parent:rewards:seed-defaults]";

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
        { error: "FORBIDDEN", message: "Only parents can seed rewards" },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = (await request.json()) as { child_id?: string };

    if (!body.child_id) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "child_id is required" },
        { status: 400 }
      );
    }

    const childId = body.child_id;

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
      .select("id, name, parent_id")
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

    // 5. Seed default rewards for this child using upsert
    // This is idempotent - duplicates are ignored via onConflict
    const rewardsToInsert = DEFAULT_REWARDS.map((reward) => ({
      child_user_id: childId,
      name: reward.name,
      cost: reward.cost,
      claimed: false,
    }));

    // Use upsert with ignoreDuplicates to handle unique constraint
    const { data: insertedData, error: upsertError } = await adminClient
      .from("rewards")
      .upsert(rewardsToInsert, {
        onConflict: "child_user_id,name",
        ignoreDuplicates: true,
      })
      .select("id");

    let seededCount = 0;

    if (upsertError) {
      // If upsert fails entirely (e.g., constraint doesn't exist yet),
      // fall back to individual inserts with duplicate handling
      console.log(`${LOG_PREFIX} Upsert failed, falling back to individual inserts`, {
        error_code: upsertError.code,
        error_message: upsertError.message,
      });

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
          logSupabaseError(LOG_PREFIX, insertError, { step: "insert_reward", reward: reward.name });
        }
        // 23505 = unique violation, that's fine - already exists
      }
    } else {
      seededCount = insertedData?.length ?? 0;
    }

    console.log(`${LOG_PREFIX} Seeded defaults for child`, {
      child_id: childId,
      child_name: childData.name,
      seeded: seededCount,
      attempted: DEFAULT_REWARDS.length,
      already_existed: DEFAULT_REWARDS.length - seededCount,
    });

    return NextResponse.json(
      {
        success: true,
        seeded: seededCount,
        child_id: childId,
        child_name: childData.name,
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
