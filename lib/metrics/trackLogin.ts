/**
 * TRACK LOGIN EVENT
 * 
 * Records a user login event for metrics.
 * This is a best-effort operation - if it fails, it should not break the login flow.
 */

import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

export interface TrackLoginParams {
  userId: string;
  role: "parent" | "child";
  request?: NextRequest;
  source?: string;
}

/**
 * Tracks a login event in the database.
 * 
 * This function is non-blocking - if the insert fails, it logs an error
 * but does not throw, allowing the login flow to continue normally.
 * 
 * @param params - Login tracking parameters
 * @returns Promise that resolves when tracking is complete (or failed silently)
 */
export async function trackLogin(params: TrackLoginParams): Promise<void> {
  const { userId, role, source = "web" } = params;

  try {
    const adminClient = getSupabaseAdminClient();

    const { error } = await adminClient.from("user_login_events").insert({
      user_id: userId,
      role: role,
      source: source,
    });

    if (error) {
      // Log error but don't throw - login should continue even if tracking fails
      console.error("[metrics:trackLogin] Failed to insert login event:", {
        error: error.message,
        code: error.code,
        userId,
        role,
      });
      return;
    }

    console.log("[metrics:trackLogin] Login event tracked successfully", {
      userId,
      role,
      source,
    });
  } catch (error) {
    // Catch any unexpected errors (e.g., missing env vars, network issues)
    console.error("[metrics:trackLogin] Unexpected error tracking login:", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      role,
    });
    // Don't throw - this is best-effort tracking
  }
}
