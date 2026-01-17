/**
 * POST /api/parent/login/track
 * 
 * Tracks a parent login event for metrics.
 * This endpoint should be called from the frontend after a successful parent login
 * (since parent login uses Supabase Auth directly, not an API endpoint).
 * 
 * Body: { user_id: string }
 * 
 * Auth: Requires parent authentication (Supabase Auth)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { trackLogin } from "@/lib/metrics/trackLogin";

export async function POST(request: NextRequest) {
  try {
    // Verify parent is authenticated
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.profile.role !== "Parent") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only parents can track login events" },
        { status: 403 }
      );
    }

    // Get user_id from body (optional - can also use authUser.profile.id)
    const body = (await request.json()) as { user_id?: string };
    const userId = body.user_id || authUser.profile.id;

    // Track login event (non-blocking)
    await trackLogin({
      userId,
      role: "parent",
      request,
    });

    return NextResponse.json(
      { success: true, message: "Login event tracked" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api:parent:login:track] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to track login event" },
      { status: 500 }
    );
  }
}
