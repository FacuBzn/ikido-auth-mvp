/**
 * Parent Auth API Client
 * 
 * NOTE: Parent authentication uses Supabase Auth directly via:
 * - lib/repositories/parentRepository.ts -> loginParent(), registerParent()
 * - createBrowserClient() from lib/supabaseClient.ts
 * 
 * This file provides API wrappers for non-Supabase operations.
 */

import { apiPost } from "../client";

// Re-export types for consistency
export type { Parent } from "@/store/useSessionStore";

/**
 * Logout parent - calls existing signout route
 */
export async function logoutParent() {
  return apiPost<{ success: boolean }>("/api/auth/signout", {});
}
