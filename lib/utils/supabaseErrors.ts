/**
 * Supabase Error Utilities
 *
 * Helpers for detecting and handling common Supabase/PostgreSQL errors
 */

export interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Detects if an error is due to a missing column in the database.
 * This happens when code references columns that don't exist yet
 * (e.g., before a migration is run).
 *
 * PostgreSQL error codes:
 * - 42703: undefined_column
 *
 * PostgREST error codes:
 * - PGRST204: Column not found
 *
 * @param error - The error object from Supabase
 * @returns true if the error indicates a missing column
 */
export function isMissingColumnError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;

  // PostgreSQL undefined_column error
  if (error.code === "42703") {
    return true;
  }

  // PostgREST column not found
  if (error.code === "PGRST204") {
    return true;
  }

  // Check message for column-related errors
  const message = error.message?.toLowerCase() || "";
  if (
    message.includes("column") &&
    (message.includes("does not exist") ||
      message.includes("not found") ||
      message.includes("could not find"))
  ) {
    return true;
  }

  return false;
}

/**
 * Detects if an error is due to a missing table in the database.
 *
 * PostgreSQL error codes:
 * - 42P01: undefined_table
 *
 * @param error - The error object from Supabase
 * @returns true if the error indicates a missing table
 */
export function isMissingTableError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;

  if (error.code === "42P01") {
    return true;
  }

  const message = error.message?.toLowerCase() || "";
  if (
    message.includes("relation") &&
    message.includes("does not exist")
  ) {
    return true;
  }

  return false;
}

/**
 * Detects if an error is a unique constraint violation.
 *
 * PostgreSQL error codes:
 * - 23505: unique_violation
 *
 * @param error - The error object from Supabase
 * @returns true if the error indicates a unique constraint violation
 */
export function isUniqueViolationError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;
  return error.code === "23505";
}

/**
 * Detects if an error is a foreign key violation.
 *
 * PostgreSQL error codes:
 * - 23503: foreign_key_violation
 *
 * @param error - The error object from Supabase
 * @returns true if the error indicates a foreign key violation
 */
export function isForeignKeyViolationError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;
  return error.code === "23503";
}

/**
 * Detects if an error is a check constraint violation.
 *
 * PostgreSQL error codes:
 * - 23514: check_violation
 *
 * @param error - The error object from Supabase
 * @returns true if the error indicates a check constraint violation
 */
export function isCheckViolationError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;
  return error.code === "23514";
}

/**
 * Logs a Supabase error with context prefix
 *
 * @param prefix - Log prefix (e.g., "[parent:rewards:list]")
 * @param error - The error object
 * @param context - Optional additional context
 */
export function logSupabaseError(
  prefix: string,
  error: SupabaseError | null | undefined,
  context?: Record<string, unknown>
): void {
  if (!error) return;

  console.error(`${prefix} Supabase error:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    ...context,
  });
}
