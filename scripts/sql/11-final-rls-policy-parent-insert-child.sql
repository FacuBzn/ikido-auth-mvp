-- ============================================
-- POLÍTICA RLS FINAL: Parent puede insertar children
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR DESPUÉS de migración parent_auth_id
--
-- Esta política permite que un parent autenticado inserte children
-- validando directamente parent_auth_id = auth.uid() sin subqueries.
--
-- IMPORTANTE: Evitamos SELECT dentro de políticas para prevenir recursión.

-- Paso 1: Eliminar políticas anteriores
DROP POLICY IF EXISTS "parent_can_insert_child" ON public.users;
DROP POLICY IF EXISTS "Parents can insert children" ON public.users;

-- Paso 2: Crear política RLS final (SIN subqueries recursivas)
CREATE POLICY "parent_can_insert_child"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
    -- El registro debe ser un child
    role = 'child'
    -- auth_id debe ser NULL (children no tienen Auth users)
    AND auth_id IS NULL
    -- parent_auth_id debe ser igual al auth.uid() del padre autenticado
    AND parent_auth_id = auth.uid()
);

-- Paso 3: Asegurar otras políticas necesarias

-- Parents pueden leer sus children (actualizar para usar parent_auth_id si es más eficiente)
DROP POLICY IF EXISTS "Parents can read their children" ON public.users;
CREATE POLICY "Parents can read their children"
ON public.users
FOR SELECT
TO authenticated
USING (
    role = 'child' AND
    parent_auth_id = auth.uid()
);

-- Parents pueden actualizar sus children
DROP POLICY IF EXISTS "Parents can update their children" ON public.users;
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

-- Parents pueden eliminar sus children
DROP POLICY IF EXISTS "Parents can delete their children" ON public.users;
CREATE POLICY "Parents can delete their children"
ON public.users
FOR DELETE
TO authenticated
USING (
    role = 'child' AND
    parent_auth_id = auth.uid()
);

-- Parents pueden leer su propio perfil
DROP POLICY IF EXISTS "Parents can read own profile" ON public.users;
CREATE POLICY "Parents can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
    auth_id = auth.uid() AND role = 'parent'
);

-- Paso 4: Habilitar RLS si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Paso 5: Verificar políticas creadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Paso 6: Verificar RLS está habilitado
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

