/**
 * Child Points API Client
 * Maps V2 UI to existing API routes
 */

import { apiPost } from "../client";

export interface PointsBalance {
  points_balance: number;
}

export interface PointsInput {
  child_code: string;
  family_code: string;
}

/**
 * Get child points balance
 * Maps to POST /api/child/points
 */
export async function getChildPoints(input: PointsInput) {
  return apiPost<PointsBalance>("/api/child/points", {
    child_code: input.child_code.toUpperCase(),
    family_code: input.family_code.toUpperCase(),
  });
}
