-- ============================================
-- 32 - ADD PERIOD_KEY TO CHILD_TASKS (Weekly Occurrences)
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Adds support for weekly task occurrences by adding:
-- - period_key: ISO week format (e.g., "2025-W04")
-- - assigned_for_date: DATE representing Monday of the week (UTC)
-- - approved_at: TIMESTAMPTZ (real column in DB)
-- - Indexes for weekly queries
-- - Unique constraint to prevent duplicate weekly occurrences
--
-- IMPORTANT: This migration includes a PRECHECK to detect potential duplicates
-- before applying schema changes. If duplicates are found, the migration will
-- abort with detailed error information.

-- =====================
-- PART A: PRECHECK FOR DUPLICATES
-- =====================
-- This check runs BEFORE any schema changes to ensure data integrity.
-- It calculates the period_key from existing assigned_at timestamps and
-- checks for duplicates that would violate the unique constraint.

DO $$
DECLARE
  duplicate_count INTEGER;
  duplicate_examples TEXT;
BEGIN
  -- Calculate potential duplicates using computed period_key
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
    COUNT(*) INTO duplicate_count
  FROM computed_periods;

  -- If duplicates found, abort with detailed error
  IF duplicate_count > 0 THEN
    -- Build example list (top 10)
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
    SELECT string_agg(
      format('(child_id: %s, task_id: %s, period_key: %s, count: %s)',
        child_id, task_id, computed_period_key, row_count),
      E'\n'
    ) INTO duplicate_examples
    FROM (
      SELECT child_id, task_id, computed_period_key, row_count
      FROM computed_periods
      ORDER BY row_count DESC, child_id, task_id
      LIMIT 10
    ) sub;

    RAISE EXCEPTION 'PRECHECK FAILED: Found % duplicate group(s) that would violate unique constraint (child_id, task_id, period_key) where status != ''rejected''. Examples:% % % %Please run cleanup script: scripts/sql/31-clean-duplicate-child-tasks-by-week.sql before applying this migration.', 
      duplicate_count, 
      E'\n\n', 
      duplicate_examples,
      E'\n\n',
      'Run the cleanup script to resolve duplicates, then retry this migration.';
  END IF;

  RAISE NOTICE 'PRECHECK PASSED: No duplicate period_key conflicts detected. Proceeding with migration...';
END $$;

-- =====================
-- PART B: SCHEMA CHANGES
-- =====================

-- 1. Add new columns (nullable initially for backfill)
ALTER TABLE public.child_tasks
  ADD COLUMN IF NOT EXISTS period_key text,
  ADD COLUMN IF NOT EXISTS assigned_for_date date,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 2. Backfill data from existing assigned_at
-- period_key: ISO week format (IYYY-"W"IW) in UTC
-- assigned_for_date: Monday of the week in UTC (using date_trunc)
-- approved_at: Set only if status = 'approved' (use completed_at if available, else assigned_at)
UPDATE public.child_tasks
SET 
  period_key = to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW'),
  assigned_for_date = date_trunc('week', (assigned_at AT TIME ZONE 'UTC'))::date,
  approved_at = CASE 
    WHEN status = 'approved' THEN COALESCE(completed_at, assigned_at)
    ELSE approved_at
  END
WHERE period_key IS NULL;

-- 3. Set NOT NULL constraints (after backfill)
ALTER TABLE public.child_tasks
  ALTER COLUMN period_key SET NOT NULL,
  ALTER COLUMN assigned_for_date SET NOT NULL;

-- =====================
-- PART C: INDEXES
-- =====================

-- Index for common query: child tasks by period and status
CREATE INDEX IF NOT EXISTS idx_child_tasks_child_period_status
  ON public.child_tasks (child_id, period_key, status);

-- Index for period-based queries (without status filter)
CREATE INDEX IF NOT EXISTS idx_child_tasks_child_period
  ON public.child_tasks (child_id, period_key);

-- Unique index to prevent duplicate weekly occurrences (excluding rejected)
-- This ensures one task per child per week (unless rejected)
CREATE UNIQUE INDEX IF NOT EXISTS idx_child_tasks_unique_period
  ON public.child_tasks (child_id, task_id, period_key)
  WHERE status != 'rejected';

-- =====================
-- PART D: VERIFICATION
-- =====================

-- Verify columns exist and have correct types
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'child_tasks'
    AND column_name IN ('period_key', 'assigned_for_date', 'approved_at');
  
  IF col_count != 3 THEN
    RAISE EXCEPTION 'Verification failed: Expected 3 new columns, found %', col_count;
  END IF;
  
  RAISE NOTICE 'Verification passed: All 3 new columns exist';
END $$;

-- Verify no NULL values in required columns
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.child_tasks
  WHERE period_key IS NULL OR assigned_for_date IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Verification failed: Found % rows with NULL period_key or assigned_for_date', null_count;
  END IF;
  
  RAISE NOTICE 'Verification passed: No NULL values in period_key or assigned_for_date';
END $$;

-- Verify unique index exists and has no duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT child_id, task_id, period_key
    FROM public.child_tasks
    WHERE status != 'rejected'
    GROUP BY child_id, task_id, period_key
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Verification failed: Unique index violated - found % duplicate group(s)', duplicate_count;
  END IF;
  
  RAISE NOTICE 'Verification passed: No duplicates violating unique constraint';
END $$;

-- Summary report
SELECT 
  'Migration completed successfully' AS status,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT period_key) AS unique_period_keys,
  MIN(period_key) AS min_period_key,
  MAX(period_key) AS max_period_key
FROM public.child_tasks;

-- =====================
-- ROLLBACK INSTRUCTIONS (Manual)
-- =====================
-- If you need to rollback this migration, execute:
--
-- DROP INDEX IF EXISTS idx_child_tasks_unique_period;
-- DROP INDEX IF EXISTS idx_child_tasks_child_period;
-- DROP INDEX IF EXISTS idx_child_tasks_child_period_status;
-- ALTER TABLE public.child_tasks
--   ALTER COLUMN period_key DROP NOT NULL,
--   ALTER COLUMN assigned_for_date DROP NOT NULL;
-- ALTER TABLE public.child_tasks
--   DROP COLUMN IF EXISTS period_key,
--   DROP COLUMN IF EXISTS assigned_for_date,
--   DROP COLUMN IF EXISTS approved_at;
--
-- Note: This will remove all period_key data. Ensure you have a backup.
