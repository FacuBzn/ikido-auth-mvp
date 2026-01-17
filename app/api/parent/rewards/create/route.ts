/**
 * POST /api/parent/rewards/create
 *
 * Creates a new reward for a specific child
 * Body: { childId: string, name: string, cost: number }
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates child belongs to the authenticated parent
 *
 * Returns:
 * - 200: { success: true, reward }
 * - 400: { error: "INVALID_INPUT", message }
 * - 403: { error: "FORBIDDEN", message }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { isMissingColumnError, logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

const LOG_PREFIX = "[parent:rewards:create]";

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
        { error: "FORBIDDEN", message: "Only parents can create rewards" },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = (await request.json()) as {
      childId?: string;
      name?: string;
      cost?: number;
    };

    if (!body.childId) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "childId is required" },
        { status: 400 }
      );
    }

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "name is required" },
        { status: 400 }
      );
    }

    if (!body.cost || body.cost < 1 || body.cost > 9999) {
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

    // 4. Validate child belongs to parent
    const { data: childData, error: childError } = await adminClient
      .from("users")
      .select("id, parent_id")
      .eq("id", body.childId)
      .eq("role", "child")
      .single();

    if (childError || !childData) {
      logSupabaseError(LOG_PREFIX, childError, { step: "get_child" });
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

    // 5. Create reward
    // Try with status column first, fallback to basic insert
    let reward;
    
    const fullInsert = await adminClient
      .from("rewards")
      .insert({
        child_user_id: body.childId,
        name: body.name.trim(),
        cost: body.cost,
        claimed: false,
        status: "available",
      })
      .select("id, name, cost, status, created_at")
      .single();

    if (isMissingColumnError(fullInsert.error)) {
      // Status column doesn't exist - use basic insert
      console.log(`${LOG_PREFIX} Status column not found (code: ${fullInsert.error?.code}), using basic insert`);
      const basicInsert = await adminClient
        .from("rewards")
        .insert({
          child_user_id: body.childId,
          name: body.name.trim(),
          cost: body.cost,
          claimed: false,
        })
        .select("id, name, cost, created_at")
        .single();
      
      if (basicInsert.error) {
        logSupabaseError(LOG_PREFIX, basicInsert.error, { step: "insert_basic" });
        return NextResponse.json(
          { error: "DATABASE_ERROR", message: "Failed to create reward" },
          { status: 500 }
        );
      }
      
      reward = { ...basicInsert.data, status: "available" };
    } else if (fullInsert.error) {
      logSupabaseError(LOG_PREFIX, fullInsert.error, { step: "insert_full" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to create reward" },
        { status: 500 }
      );
    } else {
      reward = fullInsert.data;
    }

    console.log(`${LOG_PREFIX} Reward created`, {
      reward_id: reward.id,
      child_id: body.childId,
      name: reward.name,
      cost: reward.cost,
    });

    return NextResponse.json(
      {
        success: true,
        reward,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: "Failed to create reward" },
      { status: 500 }
    );
  }
}
