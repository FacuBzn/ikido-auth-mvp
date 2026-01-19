/**
 * REQUIRE METRICS ADMIN
 * 
 * Validates that the authenticated user is authorized to access metrics.
 * Uses allowlist from METRICS_ADMIN_EMAILS environment variable.
 * 
 * If not authorized, calls notFound() to return 404.
 */

import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";

/**
 * Gets the list of allowed admin emails from environment variable.
 * 
 * Format: "email1@example.com,email2@example.com" (comma-separated)
 * 
 * @returns Array of allowed email addresses (normalized to lowercase)
 */
function getAllowedEmails(): string[] {
  const envValue = process.env.METRICS_ADMIN_EMAILS;

  if (!envValue || typeof envValue !== "string" || envValue.trim() === "") {
    // If not configured, deny by default (secure)
    return [];
  }

  // Split by comma, trim, normalize to lowercase
  return envValue
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0 && email.includes("@"));
}

/**
 * Requires that the current user is a metrics admin.
 * 
 * Checks:
 * 1. User is authenticated (parent)
 * 2. User's email is in METRICS_ADMIN_EMAILS allowlist
 * 
 * If not authorized, calls notFound() to return 404.
 * 
 * @returns Authenticated user if authorized
 * @throws never (calls notFound() instead)
 */
export async function requireMetricsAdmin() {
  // 1. Get authenticated user
  const authUser = await getAuthenticatedUser();

  if (!authUser) {
    // Not authenticated - return 404 (don't expose that this route exists)
    notFound();
  }

  // 2. Must be a parent
  if (authUser.profile.role !== "Parent") {
    // Not a parent - return 404
    notFound();
  }

  // 3. Get user email (from profile or user object)
  const userEmail = authUser.profile.email || authUser.user.email;

  if (!userEmail) {
    // No email found - deny access
    console.warn("[requireMetricsAdmin] User has no email", {
      userId: authUser.user.id,
    });
    notFound();
  }

  // 4. Normalize email to lowercase for comparison
  const normalizedEmail = userEmail.trim().toLowerCase();

  // 5. Get allowed emails from env
  const allowedEmails = getAllowedEmails();

  if (allowedEmails.length === 0) {
    // No emails configured - deny by default (secure)
    console.warn("[requireMetricsAdmin] METRICS_ADMIN_EMAILS not configured or empty");
    notFound();
  }

  // 6. Check if user's email is in allowlist
  if (!allowedEmails.includes(normalizedEmail)) {
    // Not authorized - return 404 (don't expose that this route exists)
    console.warn("[requireMetricsAdmin] Unauthorized access attempt", {
      email: normalizedEmail,
      allowedCount: allowedEmails.length,
    });
    notFound();
  }

  // 7. Authorized - return user
  return authUser;
}

/**
 * Checks if the current user is a metrics admin (non-throwing version).
 * 
 * Useful for conditional rendering (e.g., showing/hiding links).
 * 
 * @returns true if user is authorized, false otherwise
 */
export async function isMetricsAdmin(): Promise<boolean> {
  // 1. Get authenticated user
  const authUser = await getAuthenticatedUser();

  if (!authUser) {
    return false;
  }

  // 2. Must be a parent
  if (authUser.profile.role !== "Parent") {
    return false;
  }

  // 3. Get user email
  const userEmail = authUser.profile.email || authUser.user.email;

  if (!userEmail) {
    return false;
  }

  // 4. Normalize email to lowercase
  const normalizedEmail = userEmail.trim().toLowerCase();

  // 5. Get allowed emails from env
  const allowedEmails = getAllowedEmails();

  if (allowedEmails.length === 0) {
    return false;
  }

  // 6. Check if user's email is in allowlist
  return allowedEmails.includes(normalizedEmail);
}
