# Migration: Period Key for Weekly Task Occurrences (PR A)

This document describes the migration to add `period_key` support for weekly task occurrences in the `child_tasks` table.

## Overview

The migration adds three new columns to `child_tasks`:
- **`period_key`**: ISO week format string (e.g., "2025-W04")
- **`assigned_for_date`**: DATE representing Monday of the week (UTC)
- **`approved_at`**: TIMESTAMPTZ (real timestamp column in database)

It also creates indexes and a unique constraint to prevent duplicate weekly task assignments.

## Files

- **Migration SQL**: `scripts/sql/32-add-period-key-to-child-tasks.sql`
- **Cleanup Script**: `scripts/sql/31-clean-duplicate-child-tasks-by-week.sql` (optional, for resolving duplicates)
- **Verification Script**: `scripts/verify-period-key-migration.ts`
- **TypeScript Helpers**: `lib/utils/period.ts`

## Prerequisites

1. Ensure you have access to Supabase SQL Editor or Supabase CLI
2. Environment variables configured:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Step-by-Step Migration

### Step 1: Check for Duplicates (Precheck)

Before applying the migration, the SQL script automatically checks for potential duplicates. However, you can manually check first:

```sql
-- Run this query in Supabase SQL Editor to check for duplicates
WITH computed_periods AS (
  SELECT 
    child_id,
    task_id,
    to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW') AS computed_period_key,
    COUNT(*) AS row_count
  FROM public.child_tasks
  WHERE status != 'rejected'
  GROUP BY child_id, task_id, to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW')
  HAVING COUNT(*) > 1
)
SELECT 
  child_id,
  task_id,
  computed_period_key,
  row_count
FROM computed_periods
ORDER BY row_count DESC;
```

### Step 2: Clean Duplicates (If Needed)

If duplicates are found, run the cleanup script before applying the migration:

```sql
-- Open scripts/sql/31-clean-duplicate-child-tasks-by-week.sql
-- Review PART A and PART B to see what will be changed
-- Uncomment PART C to execute the cleanup
```

The cleanup script will:
- Identify duplicate groups
- Keep the row with the **latest** `assigned_at` timestamp
- Mark all other rows as `status = 'rejected'`
- **Important**: This does NOT modify `points_balance` or `ggpoints_ledger`

### Step 3: Apply Migration

Execute the migration SQL in Supabase:

**Option A: Supabase SQL Editor (Recommended)**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/sql/32-add-period-key-to-child-tasks.sql`
3. Paste into SQL Editor
4. Click "Run"

**Option B: Supabase CLI**
```bash
supabase db push
# Or if using migration files directly:
psql $DATABASE_URL -f scripts/sql/32-add-period-key-to-child-tasks.sql
```

The migration will:
1. Run precheck for duplicates (abort if found)
2. Add three new columns (`period_key`, `assigned_for_date`, `approved_at`)
3. Backfill data from existing `assigned_at` timestamps
4. Set NOT NULL constraints
5. Create indexes for performance
6. Create unique constraint to prevent duplicates
7. Verify all changes

### Step 4: Verify Migration

Run the verification script:

```bash
npm run verify:migration:period
```

The script checks:
- ✅ Columns exist and are queryable
- ✅ No NULL values in required columns (`period_key`, `assigned_for_date`)
- ✅ No duplicate violations of unique constraint
- ✅ Period keys are in valid ISO week format (YYYY-Www)

**Expected output if successful:**
```
✅ All checks passed! Migration appears to be successful.
```

**If validation fails**, the script will:
- List specific errors (nulls, duplicates, etc.)
- Provide guidance on next steps
- Exit with code 1

## Manual Verification

You can also verify manually in Supabase SQL Editor:

```sql
-- Check columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'child_tasks'
  AND column_name IN ('period_key', 'assigned_for_date', 'approved_at');

-- Check for NULLs
SELECT COUNT(*) as null_period_key
FROM public.child_tasks
WHERE period_key IS NULL OR assigned_for_date IS NULL;

-- Check for duplicates
SELECT child_id, task_id, period_key, COUNT(*) as count
FROM public.child_tasks
WHERE status != 'rejected'
GROUP BY child_id, task_id, period_key
HAVING COUNT(*) > 1;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'child_tasks'
  AND indexname LIKE '%period%';
```

Expected indexes:
- `idx_child_tasks_child_period_status`
- `idx_child_tasks_child_period`
- `idx_child_tasks_unique_period` (unique)

## Rollback

If you need to rollback the migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_child_tasks_unique_period;
DROP INDEX IF EXISTS idx_child_tasks_child_period;
DROP INDEX IF EXISTS idx_child_tasks_child_period_status;

-- Remove NOT NULL constraints
ALTER TABLE public.child_tasks
  ALTER COLUMN period_key DROP NOT NULL,
  ALTER COLUMN assigned_for_date DROP NOT NULL;

-- Drop columns
ALTER TABLE public.child_tasks
  DROP COLUMN IF EXISTS period_key,
  DROP COLUMN IF EXISTS assigned_for_date,
  DROP COLUMN IF EXISTS approved_at;
```

**⚠️ Warning**: This will remove all `period_key` data. Ensure you have a backup if needed.

## TypeScript Helpers

After migration, use the helpers in `lib/utils/period.ts`:

```typescript
import { getISOWeekKey, getISOWeekStartDate, getCurrentISOWeekKey } from '@/lib/utils/period';

// Get current week key
const currentWeek = getCurrentISOWeekKey(); // "2025-W04"

// Get week key for a specific date
const weekKey = getISOWeekKey(new Date('2025-01-20')); // "2025-W04"

// Get Monday date for a week key
const monday = getISOWeekStartDate("2025-W04"); // Date object (Monday 00:00 UTC)
```

## Index Details

### `idx_child_tasks_child_period_status`
- Columns: `(child_id, period_key, status)`
- Purpose: Fast queries for child tasks in a specific week with status filter

### `idx_child_tasks_child_period`
- Columns: `(child_id, period_key)`
- Purpose: Fast queries for all tasks for a child in a specific week

### `idx_child_tasks_unique_period` (UNIQUE)
- Columns: `(child_id, task_id, period_key)`
- Condition: `WHERE status != 'rejected'`
- Purpose: Prevent duplicate task assignments in the same week
- Allows multiple rejected tasks (useful for history/audit)

## Troubleshooting

### Migration fails with "PRECHECK FAILED: Found duplicates"

**Solution**: Run cleanup script first (`31-clean-duplicate-child-tasks-by-week.sql`)

1. Open the cleanup script
2. Review PART A and PART B (dry-run output)
3. Uncomment and execute PART C
4. Verify duplicates are resolved
5. Retry migration

### Verification script reports NULL values

**Possible causes**:
- Migration didn't complete fully
- Data was added during migration
- Backfill UPDATE didn't run

**Solution**:
```sql
-- Manually backfill NULL values
UPDATE public.child_tasks
SET 
  period_key = to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW'),
  assigned_for_date = date_trunc('week', (assigned_at AT TIME ZONE 'UTC'))::date
WHERE period_key IS NULL OR assigned_for_date IS NULL;
```

### Verification script reports duplicate violations

**Possible causes**:
- Unique index wasn't created
- Data was inserted after migration that violates constraint

**Solution**:
1. Check if unique index exists:
   ```sql
   SELECT indexname FROM pg_indexes WHERE indexname = 'idx_child_tasks_unique_period';
   ```
2. If missing, create it:
   ```sql
   CREATE UNIQUE INDEX idx_child_tasks_unique_period
     ON public.child_tasks (child_id, task_id, period_key)
     WHERE status != 'rejected';
   ```
3. If exists but violations present, run cleanup script to resolve duplicates

## Next Steps (Post-Migration)

After successful migration:

1. ✅ Update application code to use `period_key` for weekly queries
2. ✅ Update task assignment logic to calculate and set `period_key`
3. ✅ Update API endpoints to filter by `period_key` (in separate PRs)
4. ✅ Test weekly task assignment flows

**Note**: This PR (PR A) only adds the database schema. Endpoint and UI changes will be in separate PRs.

## References

- ISO 8601 Week Date Standard: [Wikipedia](https://en.wikipedia.org/wiki/ISO_8601#Week_dates)
- PostgreSQL Date/Time Functions: [PostgreSQL Docs](https://www.postgresql.org/docs/current/functions-datetime.html)
- Supabase Migrations: [Supabase Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
