-- ============================================
-- FIX: Política RLS para INSERT de children
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Esta política permite que un parent autenticado inserte children.
-- NO usa family_code (columna que no existe).
-- Valida que parent_id corresponda al parent autenticado.

-- Paso 1: Eliminar políticas anteriores que puedan causar conflictos
DROP POLICY IF EXISTS "parent_can_insert_child" ON public.users;
DROP POLICY IF EXISTS "Parents can insert children" ON public.users;

-- Paso 2: Asegurar que auth_id puede ser NULL (para children)
-- Si ya se ejecutó antes, esto no hará nada
DO $$ 
BEGIN
    -- Check if auth_id is already nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'auth_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN auth_id DROP NOT NULL;
        RAISE NOTICE 'auth_id changed to nullable';
    ELSE
        RAISE NOTICE 'auth_id is already nullable';
    END IF;
END $$;

-- Paso 3: Crear política RLS corregida
-- Esta política valida:
-- 1. El usuario está autenticado (auth.uid() IS NOT NULL)
-- 2. El registro a insertar es un child (role = 'child')
-- 3. El auth_id del child es NULL (children no tienen Auth)
-- 4. El parent_id corresponde al parent autenticado
CREATE POLICY "parent_can_insert_child"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
    -- El registro debe ser un child
    role = 'child'
    -- auth_id debe ser NULL (children no tienen Auth users)
    AND auth_id IS NULL
    -- parent_id debe pertenecer al parent autenticado
    AND parent_id = (
        SELECT id 
        FROM public.users 
        WHERE auth_id = auth.uid() 
        AND role = 'parent'
        LIMIT 1
    )
);

-- Paso 4: Verificar que existan las otras políticas necesarias
-- Política para que parents puedan leer sus children
DROP POLICY IF EXISTS "Parents can read their children" ON public.users;
CREATE POLICY "Parents can read their children"
ON public.users
FOR SELECT
TO authenticated
USING (
    role = 'child' AND
    parent_id IN (
        SELECT id FROM public.users 
        WHERE auth_id = auth.uid() 
        AND role = 'parent'
    )
);

-- Política para que parents puedan leer su propio perfil
DROP POLICY IF EXISTS "Parents can read own profile" ON public.users;
CREATE POLICY "Parents can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
    auth_id = auth.uid() AND role = 'parent'
);

-- Política para que parents puedan actualizar sus children
DROP POLICY IF EXISTS "Parents can update their children" ON public.users;
CREATE POLICY "Parents can update their children"
ON public.users
FOR UPDATE
TO authenticated
USING (
    role = 'child' AND
    parent_id IN (
        SELECT id FROM public.users 
        WHERE auth_id = auth.uid() 
        AND role = 'parent'
    )
);

-- Política para que parents puedan eliminar sus children
DROP POLICY IF EXISTS "Parents can delete their children" ON public.users;
CREATE POLICY "Parents can delete their children"
ON public.users
FOR DELETE
TO authenticated
USING (
    role = 'child' AND
    parent_id IN (
        SELECT id FROM public.users 
        WHERE auth_id = auth.uid() 
        AND role = 'parent'
    )
);

-- Paso 5: Habilitar RLS si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Paso 6: Verificar políticas creadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Paso 7: Verificar que RLS está habilitado
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

