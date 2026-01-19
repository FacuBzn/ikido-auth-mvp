-- ============================================
-- 31 - CLEAN DUPLICATE CHILD_TASKS BY WEEK (Pre-migration cleanup)
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- This script helps resolve duplicate child_tasks that would violate the
-- unique constraint (child_id, task_id, period_key) when status != 'rejected'.
--
-- STRATEGY:
-- - For each duplicate group (child_id, task_id, computed_period_key):
--   - Keep the row with the LATEST assigned_at timestamp
--   - Mark all other rows as status = 'rejected'
-- - This preserves points_balance and ledger integrity (no deletions)
-- - Only normalizes rows to allow the unique index to be created
--
-- IMPORTANT:
-- - This script does NOT modify points_balance or ggpoints_ledger
-- - Review the output before committing changes
-- - Run this BEFORE applying migration 32-add-period-key-to-child-tasks.sql

-- =====================
-- PART A: IDENTIFY DUPLICATES
-- =====================

-- Show duplicate groups before cleanup
WITH computed_periods AS (
  SELECT 
    id,
    child_id,
    task_id,
    assigned_at,
    status,
    points,
    to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW') AS computed_period_key,
    ROW_NUMBER() OVER (
      PARTITION BY child_id, task_id, to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW')
      ORDER BY assigned_at DESC
    ) AS row_rank
  FROM public.child_tasks
  WHERE status != 'rejected'
)
SELECT 
  child_id,
  task_id,
  computed_period_key,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE row_rank = 1) AS rows_to_keep,
  COUNT(*) FILTER (WHERE row_rank > 1) AS rows_to_reject
FROM computed_periods
GROUP BY child_id, task_id, computed_period_key
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, child_id, task_id;

-- =====================
-- PART B: PREVIEW CHANGES (Dry-run)
-- =====================
-- This shows which rows would be marked as 'rejected'
-- Review this output before running PART C

WITH computed_periods AS (
  SELECT 
    id,
    child_id,
    task_id,
    assigned_at,
    status,
    points,
    to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW') AS computed_period_key,
    ROW_NUMBER() OVER (
      PARTITION BY child_id, task_id, to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW')
      ORDER BY assigned_at DESC
    ) AS row_rank
  FROM public.child_tasks
  WHERE status != 'rejected'
)
SELECT 
  id,
  child_id,
  task_id,
  status AS current_status,
  'rejected' AS new_status,
  computed_period_key,
  assigned_at,
  points
FROM computed_periods
WHERE row_rank > 1
ORDER BY child_id, task_id, assigned_at DESC;

-- =====================
-- PART C: APPLY CLEANUP (Uncomment to execute)
-- =====================
-- ⚠️  WARNING: This will modify data. Review PART B output first.
-- Uncomment the following block to execute the cleanup:

/*
WITH computed_periods AS (
  SELECT 
    id,
    child_id,
    task_id,
    assigned_at,
    to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW') AS computed_period_key,
    ROW_NUMBER() OVER (
      PARTITION BY child_id, task_id, to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW')
      ORDER BY assigned_at DESC
    ) AS row_rank
  FROM public.child_tasks
  WHERE status != 'rejected'
),
ids_to_reject AS (
  SELECT id
  FROM computed_periods
  WHERE row_rank > 1
)
UPDATE public.child_tasks
SET status = 'rejected'
WHERE id IN (SELECT id FROM ids_to_reject);

-- Verification: Should return 0 rows
WITH computed_periods AS (
  SELECT 
    child_id,
    task_id,
    to_char(assigned_at AT TIME ZONE 'UTC', 'IYYY-"W"IW') AS computed_period_key
  FROM public.child_tasks
  WHERE status != 'rejected'
)
SELECT 
  child_id,
  task_id,
  computed_period_key,
  COUNT(*) AS row_count
FROM computed_periods
GROUP BY child_id, task_id, computed_period_key
HAVING COUNT(*) > 1;
*/

-- =====================
-- NOTES
-- =====================
-- After running this cleanup, you should be able to run migration 32
-- without the precheck failing.
--
-- If you need to restore rejected rows, you can manually update their status
-- back, but note that this may cause the unique constraint to fail.
