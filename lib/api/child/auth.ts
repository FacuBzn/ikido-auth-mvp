/**
 * Child Auth API Client
 * Maps V2 UI to existing API routes
 */

import { apiPost } from "../client";

// Types matching existing API response
export interface ChildProfile {
  id: string;
  name: string;
  child_code: string;
  points_balance: number;
  role: "child";
}

export interface ParentInfo {
  id: string;
  name: string | null;
  family_code: string;
}

export interface ChildLoginResponse {
  child: ChildProfile;
  parent: ParentInfo;
}

export interface ChildLoginInput {
  child_code: string;
  family_code: string;
}

/**
 * Login child via codes
 * Maps to POST /api/child/login
 */
export async function loginChild(input: ChildLoginInput) {
  return apiPost<ChildLoginResponse>("/api/child/login", {
    child_code: input.child_code.toUpperCase(),
    family_code: input.family_code.toUpperCase(),
  });
}

/**
 * Logout child
 * Maps to POST /api/child/logout
 */
export async function logoutChild(childCode: string, familyCode: string) {
  return apiPost<{ success: boolean }>("/api/child/logout", {
    child_code: childCode,
    family_code: familyCode,
  });
}
