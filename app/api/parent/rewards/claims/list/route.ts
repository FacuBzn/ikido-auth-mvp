/**
 * GET /api/parent/rewards/claims/list
 *
 * Lists pending reward claims (status='requested') for a specific child
 * Query params: ?child_id=UUID
 *
 * Auth: Requires parent authentication (Supabase Auth)
 * Ownership: Validates child belongs to the authenticated parent
 *
 * Returns:
 * {
 *   claims: [...] // Rewards with status='requested'
 * }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { isMissingColumnError, logSupabaseError } from "@/lib/utils/supabaseErrors";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const LOG_PREFIX = "[parent:rewards:claims:list]";

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
        { error: "FORBIDDEN", message: "Only parents can view claims" },
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

    // 5. Get requested rewards (claims) for this child
    // If status column doesn't exist, return empty array (no pending claims in old schema)
    let claims: unknown[] = [];

    const claimsQuery = await adminClient
      .from("rewards")
      .select("id, name, cost, status, requested_at, created_at")
      .eq("child_user_id", childId)
      .eq("status", "requested")
      .order("requested_at", { ascending: false });

    if (isMissingColumnError(claimsQuery.error)) {
      // Status column doesn't exist - in old schema there are no pending claims
      console.log(`${LOG_PREFIX} Status column not found (code: ${claimsQuery.error?.code}), returning empty claims`);
      claims = [];
    } else if (claimsQuery.error) {
      logSupabaseError(LOG_PREFIX, claimsQuery.error, { step: "fetch_claims" });
      return NextResponse.json(
        { error: "DATABASE_ERROR", message: "Failed to fetch claims" },
        { status: 500 }
      );
    } else {
      claims = claimsQuery.data || [];
    }

    console.log(`${LOG_PREFIX} Found claims`, {
      child_id: childId,
      child_name: childData.name,
      count: claims.length,
    });

    return NextResponse.json(
      {
        claims,
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
      { error: "DATABASE_ERROR", message: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
