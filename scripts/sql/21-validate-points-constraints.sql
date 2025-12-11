-- ============================================
-- 21 - VALIDATE POINTS CONSTRAINTS (1-100)
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Adds strict validation constraints for points columns:
-- - tasks.points: must be between 1 and 100
-- - child_tasks.points: must be between 1 and 100
-- - Ensures points column is integer type

-- =====================
-- TABLE: tasks
-- =====================

-- Drop existing constraint if it exists (points >= 0)
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_points_check;

-- Ensure points column is integer
ALTER TABLE public.tasks
ALTER COLUMN points TYPE integer USING points::integer;

-- Add new constraint: points must be between 1 and 100
ALTER TABLE public.tasks
ADD CONSTRAINT points_valid CHECK (points >= 1 AND points <= 100);

-- =====================
-- TABLE: child_tasks
-- =====================

-- Drop existing constraint if it exists (points >= 0)
ALTER TABLE public.child_tasks
DROP CONSTRAINT IF EXISTS child_tasks_points_check;

-- Ensure points column is integer
ALTER TABLE public.child_tasks
ALTER COLUMN points TYPE integer USING points::integer;

-- Add new constraint: points must be between 1 and 100
ALTER TABLE public.child_tasks
ADD CONSTRAINT points_valid CHECK (points >= 1 AND points <= 100);

-- =====================
-- VERIFICATION
-- =====================

-- Verify constraints exist
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid IN (
  'public.tasks'::regclass,
  'public.child_tasks'::regclass
)
AND conname LIKE '%points%'
ORDER BY conrelid::text, conname;

