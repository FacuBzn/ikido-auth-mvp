/**
 * Uniform profile interfaces for the application
 * These match the database schema exactly
 */

export interface ParentProfile {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  family_code: string;
  created_at: string;
}

export interface ChildProfile {
  id: string;
  parent_id: string;
  name: string;
  family_code: string;
  child_code: string | null;
  points_balance: number;
  created_at: string;
}

/**
 * Utility function to normalize name to INITCAP
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Utility function to normalize codes to UPPERCASE
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

