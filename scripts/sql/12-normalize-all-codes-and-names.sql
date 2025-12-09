-- ============================================
-- NORMALIZACIÓN MASIVA DE DATOS
-- ============================================
-- Ejecutar en Supabase SQL Editor para normalizar:
-- - family_code → UPPERCASE
-- - child_code → UPPERCASE
-- - name → Initcap (primera letra mayúscula por palabra)
-- - role → lowercase y convertir a tipo enum

-- IMPORTANTE: Esta migración es idempotente y puede ejecutarse múltiples veces

-- Paso 1: Normalizar todos los campos en la tabla users
UPDATE public.users
SET
  family_code = UPPER(NULLIF(TRIM(family_code), '')),
  child_code  = UPPER(NULLIF(TRIM(child_code), '')),
  name        = INITCAP(NULLIF(TRIM(name), '')),
  role        = LOWER(role::text)::user_role
WHERE TRUE;

-- Paso 2: Verificar resultados
SELECT 
  role,
  COUNT(*) as count,
  COUNT(DISTINCT family_code) FILTER (WHERE role = 'parent') as unique_family_codes,
  COUNT(DISTINCT child_code) FILTER (WHERE role = 'child') as unique_child_codes
FROM public.users
GROUP BY role
ORDER BY role;

-- Paso 3: Verificar que todos los códigos estén en uppercase
SELECT 
  id,
  name,
  role,
  family_code,
  child_code
FROM public.users
WHERE 
  (family_code IS NOT NULL AND family_code != UPPER(family_code))
  OR
  (child_code IS NOT NULL AND child_code != UPPER(child_code))
LIMIT 10;

-- Si la query anterior devuelve resultados, significa que hay datos sin normalizar

-- Paso 4: Verificar integridad referencial
-- Verificar que todos los children tengan un parent válido
SELECT 
  c.id as child_id,
  c.name as child_name,
  c.child_code,
  c.parent_id,
  c.parent_auth_id,
  p.id as parent_id_check,
  p.name as parent_name,
  p.family_code
FROM public.users c
LEFT JOIN public.users p ON c.parent_id = p.id
WHERE c.role = 'child'
  AND p.id IS NULL;

-- Si la query anterior devuelve resultados, hay children huérfanos que necesitan atención

-- Paso 5: Verificar que todos los parents tengan family_code
SELECT 
  id,
  name,
  email,
  family_code
FROM public.users
WHERE role = 'parent'
  AND (family_code IS NULL OR family_code = '')
LIMIT 10;

-- Si hay parents sin family_code, se debe generar uno manualmente o via aplicación

-- ============================================
-- RESUMEN DE LA NORMALIZACIÓN
-- ============================================
-- Después de ejecutar este script:
-- 1. Todos los family_code están en UPPERCASE
-- 2. Todos los child_code están en UPPERCASE
-- 3. Todos los names están en Initcap
-- 4. Todos los roles están en lowercase como enum
-- 5. Los datos están listos para el nuevo flujo de autenticación

