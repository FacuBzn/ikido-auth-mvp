-- ============================================
-- POLÍTICA RLS: Parent puede insertar su propio perfil
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Esta política permite que un usuario autenticado inserte su propio perfil
-- como parent durante el registro.
--
-- IMPORTANTE: Esta política es necesaria para permitir el registro de nuevos parents.

-- Paso 1: Eliminar política anterior si existe
DROP POLICY IF EXISTS "Parents can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert own parent profile" ON public.users;

-- Paso 2: Crear política RLS para INSERT de parent profile
CREATE POLICY "Parents can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario debe estar autenticado (auth.uid() IS NOT NULL)
  auth.uid() IS NOT NULL
  -- El role debe ser 'parent'
  AND role = 'parent'
  -- El auth_id del registro debe coincidir con el auth.uid() del usuario autenticado
  AND auth_id = auth.uid()
  -- Solo puede insertar su propio perfil (id debe coincidir con auth_id)
  AND id = auth_id
  -- family_code debe estar presente (no NULL) para parents
  AND family_code IS NOT NULL
  -- parent_auth_id debe ser NULL para parents
  AND parent_auth_id IS NULL
  -- child_code debe ser NULL para parents
  AND child_code IS NULL
);

-- Paso 3: Verificar política creada
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
AND policyname = 'Parents can insert own profile';

-- Paso 4: Verificar que RLS está habilitado
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'users';

-- ============================================
-- NOTAS
-- ============================================
-- Esta política permite que durante el registro:
-- 1. Un usuario autenticado (que acaba de crear su cuenta en auth.users)
-- 2. Pueda insertar su perfil en public.users
-- 3. Validando que:
--    - role = 'parent'
--    - auth_id = auth.uid() (coincide con el usuario autenticado)
--    - id = auth_id (el ID interno es el mismo que el auth_id)
--
-- Esto es seguro porque:
-- - Solo puede insertar con SU propio auth.uid()
-- - No puede insertar perfiles para otros usuarios
-- - Solo puede crear perfiles de tipo 'parent' (children se crean diferente)

