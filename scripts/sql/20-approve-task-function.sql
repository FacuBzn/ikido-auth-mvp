-- ============================================
-- 20 - FUNCTION approve_child_task_and_add_points
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Atomic approval of a child_task and GGPoints update.
-- This function ensures that:
-- 1. The parent owns the child_task
-- 2. The child_task status is updated to 'approved'
-- 3. A ledger entry is created
-- 4. The child's points_balance is updated
-- All within a single transaction.

CREATE OR REPLACE FUNCTION public.approve_child_task_and_add_points(
  p_child_task_id uuid,
  p_parent_auth_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_id uuid;
  v_child_id uuid;
  v_task_id uuid;
  v_points integer;
BEGIN
  -- Resolve parent internal id from auth user id
  SELECT u.id
  INTO v_parent_id
  FROM public.users u
  WHERE u.auth_id = p_parent_auth_id
    AND u.role = 'parent'
  LIMIT 1;

  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Parent not found for provided auth id'
      USING ERRCODE = 'P0001';
  END IF;

  -- Lock the child_task row and validate ownership
  SELECT ct.child_id, ct.task_id, ct.points
  INTO v_child_id, v_task_id, v_points
  FROM public.child_tasks ct
  WHERE ct.id = p_child_task_id
    AND ct.parent_id = v_parent_id
  FOR UPDATE;

  IF v_child_id IS NULL THEN
    RAISE EXCEPTION 'Child task not found or does not belong to this parent'
      USING ERRCODE = 'P0002';
  END IF;

  -- Ensure non-negative points
  IF v_points IS NULL OR v_points < 0 THEN
    -- Fallback to task.points
 if points is invalid
    SELECT t.points

    INTO v_points
    FROM public.tasks t
    WHERE t.id = v_task_id;

    IF v_points IS NULL OR v_points < 0 THEN
      RAISE EXCEPTION 'Invalid points configuration for child task %', p_child_task_id
        USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- Transactional updates (will rollback entirely on any error)

  -- 1) Approve child_task
  UPDATE public.child_tasks
  SET
    status = 'approved',
    approved_at = now()
  WHERE id = p_child_task_id;

  -- 2) Insert ledger entry
  INSERT INTO public.ggpoints_ledger (
    id,
    child_id,
    parent_id,
    child_task_id,
    delta,
    reason,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_child_id,
    v_parent_id,
    p_child_task_id,
    v_points,
    'task_approved',
    now()
  );

  -- 3) Update child's points_balance
  UPDATE public.users
  SET points_balance = points_balance + v_points
  WHERE id = v_child_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.approve_child_task_and_add_points(uuid, uuid) TO authenticated;

-- =====================
-- VERIFICATION
-- =====================

-- Verify function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'approve_child_task_and_add_points';

