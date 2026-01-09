-- ============================================
-- 27 - ENSURE created_by_parent_id COLUMN EXISTS
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Fixes PGRST204 error: "Could not find the 'created_by_parent_id' column"
-- 
-- This script:
-- 1. Verifies if created_by_parent_id exists
-- 2. Adds it if missing (shouldn't happen if 18-tasks-schema.sql ran)
-- 3. Refreshes PostgREST schema cache
--
-- IMPORTANT: Run this if you get PGRST204 errors when creating tasks

-- Step 1: Verify current schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND column_name = 'created_by_parent_id';

-- Step 2: Add column if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'created_by_parent_id'
  ) THEN
    ALTER TABLE public.tasks 
    ADD COLUMN created_by_parent_id uuid REFERENCES public.users(id);
    
    RAISE NOTICE 'Column created_by_parent_id added to tasks table';
  ELSE
    RAISE NOTICE 'Column created_by_parent_id already exists';
  END IF;
END $$;

-- Step 3: Ensure index exists (idempotent)
CREATE INDEX IF NOT EXISTS idx_tasks_parent
  ON public.tasks (created_by_parent_id)
  WHERE created_by_parent_id IS NOT NULL;

-- Step 4: Refresh PostgREST schema cache (CRITICAL)
-- This tells PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify final state
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Expected output should include:
-- id, title, description, points, is_global, created_by_parent_id, created_at

