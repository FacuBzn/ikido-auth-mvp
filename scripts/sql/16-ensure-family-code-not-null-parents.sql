-- ============================================
-- Asegurar que family_code sea NOT NULL para parents
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Este script asegura que todos los parents tengan family_code
-- y que el schema permita NOT NULL para parents.

-- Paso 1: Generar family_code para parents que no lo tengan
UPDATE public.users
SET family_code = UPPER(
  SUBSTRING(MD5(RANDOM()::text || id::text) FROM 1 FOR 6)
)
WHERE role = 'parent'
  AND (family_code IS NULL OR family_code = '');

-- Paso 2: Normalizar family_code existente a UPPERCASE
UPDATE public.users
SET family_code = UPPER(TRIM(family_code))
WHERE role = 'parent'
  AND family_code IS NOT NULL
  AND family_code != UPPER(TRIM(family_code));

-- Paso 3: Verificar que todos los parents tienen family_code
SELECT 
  id,
  name,
  email,
  family_code,
  CASE 
    WHEN family_code IS NULL OR family_code = '' THEN 'MISSING'
    ELSE 'OK'
  END as status
FROM public.users
WHERE role = 'parent'
  AND (family_code IS NULL OR family_code = '')
ORDER BY created_at DESC;

-- ============================================
-- NOTAS
-- ============================================
-- Este script:
-- 1. Genera family_code automáticamente para parents que no lo tienen
-- 2. Normaliza todos los family_code existentes a UPPERCASE
-- 3. Verifica que todos los parents tengan family_code
--
-- IMPORTANTE: El schema debe permitir NULL para family_code (para children),
-- pero la aplicación debe asegurar que todos los parents tengan uno.

