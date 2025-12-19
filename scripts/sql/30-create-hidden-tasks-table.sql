-- ============================================
-- 30 - CREATE hidden_tasks TABLE FOR SOFT DELETE
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Creates a table to track which global tasks are hidden by each parent.
-- This allows "soft delete visual" for global tasks without actually deleting them.
--
-- IMPORTANT: Global tasks (is_global = true) should NEVER be deleted physically.
-- Custom tasks (is_global = false) can be deleted normally.

-- =====================
-- TABLE: parent_hidden_tasks
-- =====================

CREATE TABLE IF NOT EXISTS public.parent_hidden_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one parent can only hide a task once
  UNIQUE(parent_id, task_id)
);

-- =====================
-- INDEXES
-- =====================

-- Index for filtering by parent
CREATE INDEX IF NOT EXISTS idx_parent_hidden_tasks_parent
  ON public.parent_hidden_tasks (parent_id);

-- Index for filtering by task
CREATE INDEX IF NOT EXISTS idx_parent_hidden_tasks_task
  ON public.parent_hidden_tasks (task_id);

-- Composite index for the unique constraint and common queries
CREATE INDEX IF NOT EXISTS idx_parent_hidden_tasks_parent_task
  ON public.parent_hidden_tasks (parent_id, task_id);

-- =====================
-- ENABLE RLS
-- =====================

ALTER TABLE public.parent_hidden_tasks ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES
-- =====================

-- SELECT: Parents can see their own hidden tasks
DROP POLICY IF EXISTS parent_hidden_tasks_select ON public.parent_hidden_tasks;
CREATE POLICY parent_hidden_tasks_select
ON public.parent_hidden_tasks
FOR SELECT
TO authenticated
USING (
  parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- INSERT: Parents can hide tasks for themselves
DROP POLICY IF EXISTS parent_hidden_tasks_insert ON public.parent_hidden_tasks;
CREATE POLICY parent_hidden_tasks_insert
ON public.parent_hidden_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- DELETE: Parents can unhide tasks (remove from hidden list)
DROP POLICY IF EXISTS parent_hidden_tasks_delete ON public.parent_hidden_tasks;
CREATE POLICY parent_hidden_tasks_delete
ON public.parent_hidden_tasks
FOR DELETE
TO authenticated
USING (
  parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- =====================
-- RELOAD POSTGREST SCHEMA CACHE
-- =====================
-- CRITICAL: This tells PostgREST to reload its schema cache
-- so it can see the new table immediately
NOTIFY pgrst, 'reload schema';

-- =====================
-- VERIFICATION
-- =====================

-- Verify table created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'parent_hidden_tasks'
ORDER BY ordinal_position;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'parent_hidden_tasks';

-- Verify policies exist
SELECT 
  policyname,
  cmd,
  tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'parent_hidden_tasks'
ORDER BY policyname;

