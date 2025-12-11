-- ============================================
-- 18 - TASKS / CHILD_TASKS / GGPOINTS_LEDGER SCHEMA
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Creates the three main tables for the Tasks & GGPoints module:
-- 1. tasks: catalog of global and custom task templates
-- 2. child_tasks: task instances assigned to children
-- 3. ggpoints_ledger: history of point movements
--
-- Includes indexes and seed data for global tasks.

-- =====================
-- TABLE: tasks
-- =====================

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  points
 integer NOT NULL CHECK (points
 >= 0),
  is_global boolean NOT NULL DEFAULT false,
  created_by_parent_id uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for parent custom tasks
CREATE INDEX IF NOT EXISTS idx_tasks_parent
  ON public.tasks (created_by_parent_id)
  WHERE created_by_parent_id IS NOT NULL;

-- Index for global tasks
CREATE INDEX IF NOT EXISTS idx_tasks_is_global
  ON public.tasks (is_global)
  WHERE is_global = true;

-- =====================
-- TABLE: child_tasks
-- =====================

CREATE TABLE IF NOT EXISTS public.child_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','in_progress','completed','approved','rejected')
  ),
  points integer NOT NULL CHECK (points >= 0),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  approved_at timestamptz
);

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_child_tasks_child
  ON public.child_tasks (child_id);

CREATE INDEX IF NOT EXISTS idx_child_tasks_parent
  ON public.child_tasks (parent_id);

CREATE INDEX IF NOT EXISTS idx_child_tasks_status
  ON public.child_tasks (status);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_child_tasks_child_status
  ON public.child_tasks (child_id, status);

-- =========================
-- TABLE: ggpoints_ledger
-- =========================

CREATE TABLE IF NOT EXISTS public.ggpoints_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_task_id uuid REFERENCES public.child_tasks(id) ON DELETE SET NULL,
  delta integer NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_ledger_child
  ON public.ggpoints_ledger (child_id);

CREATE INDEX IF NOT EXISTS idx_ledger_parent
  ON public.ggpoints_ledger (parent_id);

-- Composite index for parent-child queries
CREATE INDEX IF NOT EXISTS idx_ledger_parent_child
  ON public.ggpoints_ledger (parent_id, child_id);

-- =====================
-- SEED DATA: GLOBAL TASKS
-- =====================

INSERT INTO public.tasks (id, title, description, points
, is_global, created_by_parent_id)
VALUES
  (gen_random_uuid(), 'Make your bed', 'Tidy up your bed every morning.', 10, true, NULL),
  (gen_random_uuid(), 'Do homework', 'Complete your school homework.', 20, true, NULL),
  (gen_random_uuid(), 'Brush your teeth', 'Brush your teeth in the morning and at night.', 5, true, NULL),
  (gen_random_uuid(), 'Clean your room', 'Organize toys and keep your room clean.', 15, true, NULL),
  (gen_random_uuid(), 'Help in the kitchen', 'Help set or clear the table.', 10, true, NULL),
  (gen_random_uuid(), 'Take out the trash', 'Take the trash out to the bin.', 10, true, NULL),
  (gen_random_uuid(), 'Read for 20 minutes', 'Read a book for at least 20 minutes.', 15, true, NULL),
  (gen_random_uuid(), 'Feed your pet', 'Give food and water to your pet.', 10, true, NULL)
ON CONFLICT DO NOTHING;

-- =====================
-- VERIFICATION
-- =====================

-- Verify tables created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('tasks', 'child_tasks', 'ggpoints_ledger')
ORDER BY table_name, ordinal_position;

-- Verify seed data
SELECT COUNT(*) as global_tasks_count
FROM public.tasks
WHERE is_global = true;

