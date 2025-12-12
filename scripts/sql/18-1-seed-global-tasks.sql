-- ============================================
-- 18-1 - SEED DATA: GLOBAL TASKS (Standalone)
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR SI LAS TAREAS GLOBALES NO SE CREARON
--
-- Este script inserta las 8 tareas globales estándar.
-- Puede ejecutarse múltiples veces de forma segura (usa ON CONFLICT DO NOTHING).

-- Verificar si ya existen tareas globales
DO $$
DECLARE
  global_count integer;
BEGIN
  SELECT COUNT(*) INTO global_count
  FROM public.tasks
  WHERE is_global = true;
  
  IF global_count > 0 THEN
    RAISE NOTICE 'Ya existen % tareas globales. No se insertarán duplicados.', global_count;
  ELSE
    RAISE NOTICE 'Insertando 8 tareas globales...';
  END IF;
END $$;

-- Insertar tareas globales (solo si no existen)
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

-- Verificar inserción
SELECT 
  COUNT(*) as total_global_tasks,
  string_agg(title, ', ' ORDER BY title) as task_titles
FROM public.tasks
WHERE is_global = true;

