-- ============================================
-- 28 - FIX child_tasks RLS INSERT POLICY
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Fixes error 42501: "new row violates row-level security policy for table child_tasks"
--
-- Problem: The INSERT policy for child_tasks is too restrictive or not matching
-- the actual authentication context (auth.uid() vs internal parent_id).
--
-- Solution: Update the INSERT policy to correctly validate:
-- 1. parent_id matches the authenticated parent's internal id
-- 2. child_id belongs to that parent
--
-- IMPORTANT: This assumes the Supabase client is authenticated and auth.uid() 
-- corresponds to the parent's auth_id in the users table.

-- =====================
-- Enable RLS (if not already enabled)
-- =====================
ALTER TABLE public.child_tasks ENABLE ROW LEVEL SECURITY;

-- =====================
-- Drop existing INSERT policy (if exists)
-- =====================
DROP POLICY IF EXISTS child_tasks_parent_insert ON public.child_tasks;

-- =====================
-- CREATE NEW INSERT POLICY
-- =====================
-- Policy allows INSERT if:
-- 1. User is authenticated (auth.uid() IS NOT NULL)
-- 2. parent_id matches the authenticated parent's internal id (from users table)
-- 3. child_id belongs to that parent (child.parent_id = parent.id)
--
-- Explanation:
-- - auth.uid() is the Supabase Auth user ID (auth_id in users table)
-- - We need to find the parent's internal id (users.id) where users.auth_id = auth.uid()
-- - Then verify that child_tasks.parent_id = that internal id
-- - And verify that child_tasks.child_id belongs to that parent
-- - parent_id is ALWAYS set from session (auth.uid()), NEVER from client
CREATE POLICY child_tasks_parent_insert
ON public.child_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure user is authenticated
  auth.uid() IS NOT NULL
  -- parent_id must match the authenticated parent's internal id
  AND parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
  -- child_id must belong to that parent
  AND child_id IN (
    SELECT c.id
    FROM public.users c
    WHERE c.parent_id = (
      SELECT p.id
      FROM public.users p
      WHERE p.auth_id = auth.uid()
        AND p.role = 'parent'
      LIMIT 1
    )
      AND c.role = 'child'
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
  AND tablename = 'child_tasks';

-- Verify INSERT policy exists and is correct
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'child_tasks'
  AND policyname = 'child_tasks_parent_insert';

-- Expected output should show:
-- policyname: child_tasks_parent_insert
-- cmd: INSERT
-- with_check: (parent_id = (SELECT u.id FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'parent' LIMIT 1) AND child_id IN (...))

