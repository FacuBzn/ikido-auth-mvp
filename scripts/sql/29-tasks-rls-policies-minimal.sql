-- ============================================
-- 29 - TASKS RLS POLICIES (MINIMAL)
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Minimal RLS policies for tasks table.
-- Only enable if you need RLS consistency across tasks module.
--
-- IMPORTANT: This is optional. Only run if you want RLS on tasks table.

-- =====================
-- Enable RLS
-- =====================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- =====================
-- SELECT Policy
-- =====================
-- Parents can see:
-- 1. Global tasks (is_global = true)
-- 2. Tasks they created (created_by_parent_id = their internal id)
DROP POLICY IF EXISTS "parent_select_tasks" ON public.tasks;
CREATE POLICY "parent_select_tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  is_global = true
  OR created_by_parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- =====================
-- INSERT Policy
-- =====================
-- Parents can only create tasks where created_by_parent_id = their internal id
-- created_by_parent_id is ALWAYS set from session (auth.uid()), NEVER from client
DROP POLICY IF EXISTS "parent_insert_tasks" ON public.tasks;
CREATE POLICY "parent_insert_tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by_parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- =====================
-- VERIFICATION
-- =====================

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tasks';

-- Verify policies exist
SELECT 
  policyname,
  cmd,
  tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
ORDER BY policyname;

