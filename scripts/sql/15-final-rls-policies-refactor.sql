-- ============================================
-- RLS POLICIES FINALES - REFACTOR COMPLETO
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Este script establece las políticas RLS definitivas según la arquitectura final:
-- - Parents insertan su propio perfil durante registro
-- - Parents insertan children con family_code
-- - Parents leen/actualizan sus children
-- - Sin recursión ni loops en políticas

-- Paso 1: Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar todas las políticas anteriores para empezar limpio
DROP POLICY IF EXISTS "Parents can insert own profile" ON public.users;
DROP POLICY IF EXISTS "parent_can_insert_child" ON public.users;
DROP POLICY IF EXISTS "Parents can insert children" ON public.users;
DROP POLICY IF EXISTS "Parents can read own profile" ON public.users;
DROP POLICY IF EXISTS "Parents can read their children" ON public.users;
DROP POLICY IF EXISTS "Parents can update their children" ON public.users;
DROP POLICY IF EXISTS "Parents can delete their children" ON public.users;
DROP POLICY IF EXISTS "Children can view their own profile and their parent" ON public.users;

-- ============================================
-- POLÍTICAS PARA PARENTS
-- ============================================

-- 1. Parents pueden insertar su propio perfil (durante registro)
CREATE POLICY "Parents can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  -- Usuario autenticado
  auth.uid() IS NOT NULL
  -- Role debe ser parent
  AND role = 'parent'
  -- auth_id debe coincidir con auth.uid()
  AND auth_id = auth.uid()
  -- id debe coincidir con auth_id (mismo valor)
  AND id = auth_id
  -- child_code debe ser NULL para parents
  AND child_code IS NULL
);

-- 2. Parents pueden leer su propio perfil
CREATE POLICY "Parents can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth_id = auth.uid() AND role = 'parent'
);

-- 3. Parents pueden insertar children
-- Valida que parent_auth_id = auth.uid() del parent autenticado
CREATE POLICY "Parents can insert children"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  -- El registro debe ser un child
  role = 'child'
  -- auth_id debe ser NULL (children no tienen Auth)
  AND auth_id IS NULL
  -- parent_auth_id debe ser igual al auth.uid() del padre autenticado
  AND parent_auth_id = auth.uid()
);

-- 4. Parents pueden leer sus children
CREATE POLICY "Parents can read their children"
ON public.users
FOR SELECT
TO authenticated
USING (
  role = 'child' AND
  parent_auth_id = auth.uid()
);

-- 5. Parents pueden actualizar sus children
CREATE POLICY "Parents can update their children"
ON public.users
FOR UPDATE
TO authenticated
USING (
  role = 'child' AND
  parent_auth_id = auth.uid()
)
WITH CHECK (
  role = 'child' AND
  parent_auth_id = auth.uid()
);

-- 6. Parents pueden eliminar sus children
CREATE POLICY "Parents can delete their children"
ON public.users
FOR DELETE
TO authenticated
USING (
  role = 'child' AND
  parent_auth_id = auth.uid()
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar políticas creadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Verificar RLS está habilitado
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- ============================================
-- NOTAS
-- ============================================
-- Estas políticas garantizan:
-- 1. Un parent solo puede insertar SU propio perfil (id = auth_id = auth.uid())
-- 2. Un parent solo puede insertar children con SU parent_auth_id
-- 3. Un parent solo puede leer/actualizar/eliminar SUS children
-- 4. No hay recursión en políticas (no usamos subqueries SELECT en WITH CHECK)
-- 5. Validación directa usando parent_auth_id = auth.uid()

