-- ============================================
-- MIGRACIÓN: Mover child_code a family_code para parents
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Este script migra los datos existentes donde parents tienen
-- el family_code almacenado en child_code (legacy) hacia family_code.
--
-- IMPORTANTE: Ejecutar después de agregar la columna family_code
-- y antes de usar el nuevo flujo de autenticación.

-- Paso 1: Verificar estado actual
SELECT 
  id,
  name,
  role,
  child_code,
  family_code,
  CASE 
    WHEN role = 'parent' AND child_code IS NOT NULL AND family_code IS NULL THEN 'Needs migration'
    WHEN role = 'parent' AND family_code IS NOT NULL THEN 'Already migrated'
    ELSE 'No action needed'
  END as migration_status
FROM public.users
WHERE role = 'parent'
ORDER BY created_at DESC
LIMIT 20;

-- Paso 2: Migrar datos de child_code a family_code para parents
-- Solo migra si family_code es NULL y child_code NO es NULL
UPDATE public.users
SET 
  family_code = UPPER(TRIM(child_code)),
  child_code = NULL  -- Limpiar child_code después de migrar
WHERE 
  role = 'parent'
  AND family_code IS NULL
  AND child_code IS NOT NULL
  AND child_code != '';

-- Paso 3: Verificar migración completada
SELECT 
  COUNT(*) FILTER (WHERE role = 'parent' AND family_code IS NOT NULL) as parents_with_family_code,
  COUNT(*) FILTER (WHERE role = 'parent' AND child_code IS NOT NULL AND child_code != '') as parents_with_child_code,
  COUNT(*) FILTER (WHERE role = 'parent' AND family_code IS NULL) as parents_without_family_code
FROM public.users
WHERE role = 'parent';

-- Paso 4: Verificar que todos los parents tienen family_code
SELECT 
  id,
  name,
  email,
  family_code,
  child_code,
  CASE 
    WHEN family_code IS NULL THEN 'MISSING FAMILY_CODE - NEEDS ATTENTION'
    WHEN child_code IS NOT NULL AND child_code != '' THEN 'Has legacy child_code - consider cleaning'
    ELSE 'OK'
  END as status
FROM public.users
WHERE role = 'parent'
  AND (family_code IS NULL OR (child_code IS NOT NULL AND child_code != ''))
ORDER BY created_at DESC;

-- ============================================
-- NOTAS
-- ============================================
-- Después de ejecutar este script:
-- 1. Todos los parents deberían tener family_code
-- 2. child_code debería ser NULL para parents
-- 3. Si algún parent no tiene family_code después de la migración,
--    necesitarás generar uno manualmente o vía la aplicación
--
-- Para generar un family_code para un parent que no lo tiene:
-- UPDATE public.users
-- SET family_code = 'ABC123'  -- Generar uno único manualmente
-- WHERE id = 'parent-uuid' AND role = 'parent' AND family_code IS NULL;

