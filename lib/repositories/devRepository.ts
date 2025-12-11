/**
 * DEV REPOSITORY
 * 
 * Development-only utilities for resetting and cleaning up test data.
 * ⚠️ These functions should NEVER be exposed in production.
 * 
 * Functions:
 * - resetChildTasks: Delete all child_task assignments
 * - resetPoints: Reset all children's points_balance to 0
 * - resetLedger: Clear all ggpoints_ledger entries
 * - resetCustomTasks: Delete all custom tasks (is_global = false)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type DevErrorCode =
  | "FORBIDDEN"
  | "DATABASE_ERROR";

export class DevError extends Error {
  code: DevErrorCode;

  constructor(code: DevErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "DevError";
  }
}

/**
 * RESET CHILD TASKS
 * Deletes all child_task assignments
 */
export async function resetChildTasks(
  supabase: SupabaseClient<Database>
): Promise<number> {
  console.log("[dev:reset] Deleting all child tasks...");

  // First, count existing rows
  const { count: initialCount } = await supabase
    .from("child_tasks")
    .select("*", { count: "exact", head: true });

  // Delete all child_tasks
  const { error } = await supabase
    .from("child_tasks")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (using neq with impossible UUID)

  if (error) {
    console.error("[dev:reset] Error deleting child tasks:", error);
    throw new DevError("DATABASE_ERROR", `Failed to delete child tasks: ${error.message}`);
  }

  const deletedCount = initialCount || 0;
  console.log(`[dev:reset] Deleted ${deletedCount} child tasks`);

  return deletedCount;
}

/**
 * RESET POINTS BALANCE
 * Sets points_balance to 0 for all children
 */
export async function resetPoints(
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  console.log("[dev:reset] Resetting points balance for all children...");

  const { error } = await supabase
    .from("users")
    .update({ points_balance: 0 })
    .eq("role", "child");

  if (error) {
    console.error("[dev:reset] Error resetting points:", error);
    throw new DevError("DATABASE_ERROR", `Failed to reset points: ${error.message}`);
  }

  console.log("[dev:reset] Points balance reset to 0 for all children");
  return true;
}

/**
 * RESET LEDGER
 * Deletes all entries from ggpoints_ledger
 */
export async function resetLedger(
  supabase: SupabaseClient<Database>
): Promise<number> {
  console.log("[dev:reset] Clearing ggpoints_ledger...");

  // First, count existing rows
  const { count: initialCount } = await supabase
    .from("ggpoints_ledger")
    .select("*", { count: "exact", head: true });

  // Delete all ledger entries
  const { error } = await supabase
    .from("ggpoints_ledger")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (error) {
    console.error("[dev:reset] Error clearing ledger:", error);
    throw new DevError("DATABASE_ERROR", `Failed to clear ledger: ${error.message}`);
  }

  const deletedCount = initialCount || 0;
  console.log(`[dev:reset] Deleted ${deletedCount} ledger entries`);

  return deletedCount;
}

/**
 * RESET CUSTOM TASKS
 * Deletes all custom tasks (is_global = false)
 * Preserves global tasks (is_global = true)
 */
export async function resetCustomTasks(
  supabase: SupabaseClient<Database>
): Promise<number> {
  console.log("[dev:reset] Deleting custom tasks (is_global = false)...");

  // First, count existing custom tasks
  const { count: initialCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("is_global", false);

  // Delete all custom tasks
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("is_global", false);

  if (error) {
    console.error("[dev:reset] Error deleting custom tasks:", error);
    throw new DevError("DATABASE_ERROR", `Failed to delete custom tasks: ${error.message}`);
  }

  const deletedCount = initialCount || 0;
  console.log(`[dev:reset] Deleted ${deletedCount} custom tasks`);

  return deletedCount;
}

/**
 * FULL RESET
 * Executes all reset operations in sequence
 */
export async function fullReset(
  supabase: SupabaseClient<Database>
): Promise<{
  deletedChildTasks: number;
  clearedPoints: boolean;
  deletedLedgerEntries: number;
  deletedCustomTasks: number;
}> {
  console.log("[dev:reset] Starting full reset of tasks module...");

  const deletedChildTasks = await resetChildTasks(supabase);
  const clearedPoints = await resetPoints(supabase);
  const deletedLedgerEntries = await resetLedger(supabase);
  const deletedCustomTasks = await resetCustomTasks(supabase);

  console.log("[dev:reset] Full reset completed successfully", {
    deletedChildTasks,
    clearedPoints,
    deletedLedgerEntries,
    deletedCustomTasks,
  });

  return {
    deletedChildTasks,
    clearedPoints,
    deletedLedgerEntries,
    deletedCustomTasks,
  };
}

