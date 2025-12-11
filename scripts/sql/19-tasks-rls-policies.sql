-- ============================================
-- 19 - RLS POLICIES FOR TASKS MODULE
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Row Level Security policies for tasks, child_tasks, and ggpoints_ledger.
-- All policies use authenticated role and validate ownership via auth.uid().

-- =====================
-- Enable RLS
-- =====================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ggpoints_ledger ENABLE ROW LEVEL SECURITY;

-- =====================
-- TABLE: tasks
-- =====================

-- SELECT: Parents can see global tasks + their own custom tasks
DROP POLICY IF EXISTS tasks_parent_select ON public.tasks;
CREATE POLICY tasks_parent_select
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

-- INSERT: Parents can only create custom tasks for themselves
DROP POLICY IF EXISTS tasks_parent_insert_own ON public.tasks;
CREATE POLICY tasks_parent_insert_own
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
  AND is_global = false
);

-- UPDATE: Parents can only update their own custom tasks
DROP POLICY IF EXISTS tasks_parent_update_own ON public.tasks;
CREATE POLICY tasks_parent_update_own
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  created_by_parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
)
WITH CHECK (
  created_by_parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- DELETE: Parents can only delete their own custom tasks
DROP POLICY IF EXISTS tasks_parent_delete_own ON public.tasks;
CREATE POLICY tasks_parent_delete_own
ON public.tasks
FOR DELETE
TO authenticated
USING (
  created_by_parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- =====================
-- TABLE: child_tasks
-- =====================

-- SELECT: Parents can see child_tasks where parent_id matches their internal id
DROP POLICY IF EXISTS child_tasks_parent_select ON public.child_tasks;
CREATE POLICY child_tasks_parent_select
ON public.child_tasks
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

-- INSERT: Parents can only assign tasks to their own children
DROP POLICY IF EXISTS child_tasks_parent_insert ON public.child_tasks;
CREATE POLICY child_tasks_parent_insert
ON public.child_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  parent_id = (
    SELECT p.id
    FROM public.users p
    WHERE p.auth_id = auth.uid()
      AND p.role = 'parent'
    LIMIT 1
  )
  AND child_id IN (
    SELECT c.id
    FROM public.users c
    WHERE c.parent_id = (
      SELECT p2.id
      FROM public.users p2
      WHERE p2.auth_id = auth.uid()
        AND p2.role = 'parent'
      LIMIT 1
    )
      AND c.role = 'child'
  )
);

-- UPDATE: Parents can only update their own child_tasks
DROP POLICY IF EXISTS child_tasks_parent_update ON public.child_tasks;
CREATE POLICY child_tasks_parent_update
ON public.child_tasks
FOR UPDATE
TO authenticated
USING (
  parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
)
WITH CHECK (
  parent_id = (
    SELECT u.id
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'parent'
    LIMIT 1
  )
);

-- DELETE: Parents can only delete their own child_tasks
DROP POLICY IF EXISTS child_tasks_parent_delete ON public.child_tasks;
CREATE POLICY child_tasks_parent_delete
ON public.child_tasks
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
-- TABLE: ggpoints_ledger
-- =====================

-- SELECT: Parents can see ledger entries where parent_id matches their internal id
DROP POLICY IF EXISTS ggpoints_parent_select ON public.ggpoints_ledger;
CREATE POLICY ggpoints_parent_select
ON public.ggpoints_ledger
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

-- INSERT: Parents can insert ledger entries for their own children
DROP POLICY IF EXISTS ggpoints_parent_insert ON public.ggpoints_ledger;
CREATE POLICY ggpoints_parent_insert
ON public.ggpoints_ledger
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

-- Ledger is append-only: no UPDATE/DELETE policies by default
-- (Historical records should not be modified)

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
  AND tablename IN ('tasks', 'child_tasks', 'ggpoints_ledger');

-- Verify policies exist
SELECT 
  policyname,
  cmd,
  tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'child_tasks', 'ggpoints_ledger')
ORDER BY tablename, policyname;

