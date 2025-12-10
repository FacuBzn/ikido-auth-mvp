-- ============================================
-- DEBUG: Verificar estado de tareas
-- ============================================
-- Ejecutar en Supabase SQL Editor para diagnosticar

-- 1. Verificar que las tablas existen
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('tasks', 'child_tasks', 'users')
  AND column_name IN ('child_user_id', 'task_id', 'is_global', 'child_code', 'family_code')
ORDER BY table_name, column_name;

-- 2. Ver tareas globales disponibles
SELECT 
  id,
  title,
  description,
  points,
  is_global,
  created_at
FROM public.tasks
WHERE is_global = true
ORDER BY title;

-- 3. Ver tareas asignadas a un niño específico
-- Reemplaza 'CHILD_ID_AQUI' con el ID real del niño
SELECT 
  ct.id as child_task_id,
  ct.child_user_id,
  ct.task_id,
  ct.completed,
  ct.completed_at,
  ct.created_at,
  t.title,
  t.description,
  t.points
FROM public.child_tasks ct
JOIN public.tasks t ON ct.task_id = t.id
WHERE ct.child_user_id = 'CHILD_ID_AQUI'  -- Reemplazar con ID real
ORDER BY ct.created_at DESC;

-- 4. Ver todos los niños y sus tareas asignadas
SELECT 
  u.id as child_id,
  u.name as child_name,
  u.child_code,
  COUNT(ct.id) as tasks_assigned
FROM public.users u
LEFT JOIN public.child_tasks ct ON u.id = ct.child_user_id
WHERE u.role = 'child'
GROUP BY u.id, u.name, u.child_code
ORDER BY tasks_assigned DESC;

-- 5. Verificar estructura de child_tasks
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'child_tasks'
ORDER BY ordinal_position;

