/**
 * Verification script for period_key migration
 * 
 * Validates that migration 32-add-period-key-to-child-tasks.sql was applied correctly:
 * - Columns exist and are populated
 * - No NULL values in required columns
 * - No duplicate violations of unique constraint
 * - Period keys are valid ISO week format
 * 
 * Usage:
 *   npm run verify:migration:period
 *   or
 *   npx tsx scripts/verify-period-key-migration.ts
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Validation failed (nulls, duplicates, or missing columns)
 */

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

interface VerificationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalRows: number;
    rowsWithNullPeriodKey: number;
    rowsWithNullAssignedForDate: number;
    duplicateGroups: number;
    minPeriodKey: string | null;
    maxPeriodKey: string | null;
    topPeriodKeys: Array<{ period_key: string; count: number }>;
  };
}

async function verifyMigration(): Promise<VerificationResult> {
  const supabase = getSupabaseAdminClient();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log("[verify-period-key-migration] Starting verification...\n");

  // 1. Check if columns exist (by attempting to query them)
  console.log("1. Checking if columns exist...");
  const { data: columnCheck, error: columnError } = await supabase
    .from("child_tasks")
    .select("period_key, assigned_for_date, approved_at")
    .limit(1);

  if (columnError) {
    // Check if error is due to missing columns
    if (columnError.message.includes("column") && columnError.message.includes("does not exist")) {
      errors.push(`Missing columns: ${columnError.message}`);
    } else {
      // Other error (might be network, etc.)
      throw new Error(`Failed to check columns: ${columnError.message}`);
    }
  }

  if (columnCheck) {
    console.log("   ✓ Columns exist in schema\n");
  }

  // 2. Count NULL values
  console.log("2. Checking for NULL values...");
  const { data: nullCheck, error: nullError } = await supabase
    .from("child_tasks")
    .select("period_key, assigned_for_date")
    .is("period_key", null)
    .or("assigned_for_date.is.null");

  if (nullError) {
    throw new Error(`Failed to check NULL values: ${nullError.message}`);
  }

  const rowsWithNullPeriodKey = nullCheck?.filter((r) => r.period_key === null).length ?? 0;
  const rowsWithNullAssignedForDate = nullCheck?.filter((r) => r.assigned_for_date === null).length ?? 0;

  if (rowsWithNullPeriodKey > 0) {
    errors.push(`Found ${rowsWithNullPeriodKey} rows with NULL period_key`);
  }
  if (rowsWithNullAssignedForDate > 0) {
    errors.push(`Found ${rowsWithNullAssignedForDate} rows with NULL assigned_for_date`);
  }

  if (rowsWithNullPeriodKey === 0 && rowsWithNullAssignedForDate === 0) {
    console.log("   ✓ No NULL values in required columns\n");
  }

  // 3. Get total row count
  const { count: totalRows, error: countError } = await supabase
    .from("child_tasks")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to count rows: ${countError.message}`);
  }

  console.log(`3. Total rows: ${totalRows ?? 0}\n`);

  // 4. Check for duplicates (violating unique constraint)
  console.log("4. Checking for duplicate violations...");
  const { data: duplicates, error: duplicateError } = await supabase
    .from("child_tasks")
    .select("child_id, task_id, period_key, status")
    .neq("status", "rejected");

  if (duplicateError) {
    throw new Error(`Failed to check duplicates: ${duplicateError.message}`);
  }

  // Group by (child_id, task_id, period_key) and count
  const duplicateMap = new Map<string, number>();
  duplicates?.forEach((row) => {
    const key = `${row.child_id}|${row.task_id}|${row.period_key}`;
    duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
  });

  const duplicateGroups = Array.from(duplicateMap.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);

  if (duplicateGroups.length > 0) {
    errors.push(
      `Found ${duplicateGroups.length} duplicate group(s) violating unique constraint (child_id, task_id, period_key) where status != 'rejected'`
    );
    console.log("   ✗ Duplicates found:\n");
    duplicateGroups.slice(0, 10).forEach((key) => {
      const [child_id, task_id, period_key] = key.split("|");
      const count = duplicateMap.get(key) ?? 0;
      console.log(`     - child_id: ${child_id}, task_id: ${task_id}, period_key: ${period_key}, count: ${count}`);
    });
    if (duplicateGroups.length > 10) {
      console.log(`     ... and ${duplicateGroups.length - 10} more`);
    }
    console.log();
  } else {
    console.log("   ✓ No duplicate violations\n");
  }

  // 5. Get period key statistics
  console.log("5. Analyzing period key distribution...");
  const { data: periodStats, error: periodError } = await supabase
    .from("child_tasks")
    .select("period_key");

  if (periodError) {
    throw new Error(`Failed to get period stats: ${periodError.message}`);
  }

  const periodKeyCounts = new Map<string, number>();
  periodStats?.forEach((row) => {
    if (row.period_key) {
      periodKeyCounts.set(row.period_key, (periodKeyCounts.get(row.period_key) || 0) + 1);
    }
  });

  const allPeriodKeys = Array.from(periodKeyCounts.keys()).sort();
  const minPeriodKey = allPeriodKeys[0] ?? null;
  const maxPeriodKey = allPeriodKeys[allPeriodKeys.length - 1] ?? null;

  // Top 10 period keys by count
  const topPeriodKeys = Array.from(periodKeyCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([period_key, count]) => ({ period_key, count }));

  // Validate period key format (ISO week: YYYY-Www)
  const invalidFormat = allPeriodKeys.filter((key) => !/^\d{4}-W\d{1,2}$/.test(key));
  if (invalidFormat.length > 0) {
    warnings.push(`Found ${invalidFormat.length} period_key(s) with invalid format (expected: YYYY-Www)`);
  }

  console.log(`   Min period_key: ${minPeriodKey ?? "N/A"}`);
  console.log(`   Max period_key: ${maxPeriodKey ?? "N/A"}`);
  console.log(`   Unique period_keys: ${periodKeyCounts.size}`);
  console.log(`   Top 10 period keys by row count:`);
  topPeriodKeys.forEach(({ period_key, count }) => {
    console.log(`     - ${period_key}: ${count} rows`);
  });
  console.log();

  // 6. Summary
  const result: VerificationResult = {
    passed: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: totalRows ?? 0,
      rowsWithNullPeriodKey,
      rowsWithNullAssignedForDate,
      duplicateGroups: duplicateGroups.length,
      minPeriodKey,
      maxPeriodKey,
      topPeriodKeys,
    },
  };

  return result;
}

async function main() {
  try {
    const result = await verifyMigration();

    console.log("=".repeat(60));
    console.log("VERIFICATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total rows: ${result.summary.totalRows}`);
    console.log(`NULL period_key: ${result.summary.rowsWithNullPeriodKey}`);
    console.log(`NULL assigned_for_date: ${result.summary.rowsWithNullAssignedForDate}`);
    console.log(`Duplicate groups: ${result.summary.duplicateGroups}`);
    console.log(`Period key range: ${result.summary.minPeriodKey ?? "N/A"} to ${result.summary.maxPeriodKey ?? "N/A"}`);
    console.log();

    if (result.errors.length > 0) {
      console.log("❌ VALIDATION FAILED");
      console.log("Errors:");
      result.errors.forEach((error) => console.log(`  - ${error}`));
      console.log();
    }

    if (result.warnings.length > 0) {
      console.log("⚠️  Warnings:");
      result.warnings.forEach((warning) => console.log(`  - ${warning}`));
      console.log();
    }

    if (result.passed) {
      console.log("✅ All checks passed! Migration appears to be successful.");
      process.exit(0);
    } else {
      console.log("❌ Validation failed. Please review errors above.");
      console.log("\nNext steps:");
      console.log("  1. Check the migration SQL for issues");
      console.log("  2. Run cleanup script if duplicates exist: scripts/sql/31-clean-duplicate-child-tasks-by-week.sql");
      console.log("  3. Verify data manually in Supabase");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ FATAL ERROR:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
