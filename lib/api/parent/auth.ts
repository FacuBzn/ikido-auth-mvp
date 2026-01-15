/**
 * Parent Auth API Client
 * Maps V2 UI to existing API routes
 */

import { apiPost } from "../client";

// Types matching existing API response
export interface ParentProfile {
  id: string;
  email: string;
  name: string | null;
  role: "parent";
  child_code: string; // family_code for parents
  points_balance: number;
}

export interface LoginResponse {
  parent: ParentProfile;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Login parent via Supabase Auth
 * Note: Uses existing auth flow, this is just a type-safe wrapper
 */
export async function loginParent(_input: LoginInput) {
  // Placeholder: Actual implementation uses Supabase client directly
  // This wrapper exists for future API route migration
  return { data: null, error: { code: "NOT_IMPLEMENTED", message: "Use Supabase client directly", status: 501 } };
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

/**
 * Register new parent
 */
export async function registerParent(_input: RegisterInput) {
  // Placeholder: Actual implementation uses Supabase client directly
  return { data: null, error: { code: "NOT_IMPLEMENTED", message: "Use Supabase client directly", status: 501 } };
}

/**
 * Logout parent - calls existing signout route
 */
export async function logoutParent() {
  return apiPost<{ success: boolean }>("/api/auth/signout", {});
}
