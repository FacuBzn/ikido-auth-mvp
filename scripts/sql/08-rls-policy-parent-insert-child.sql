-- ============================================
-- POLÍTICA RLS: Parent puede insertar children
-- ============================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de migraciones
--
-- Esta política permite que un parent autenticado inserte children
-- validando que el family_code del child coincida con el child_code del parent.

-- Eliminar política anterior si existe (para evitar conflictos)
DROP POLICY IF EXISTS "parent_can_insert_child" ON public.users;
DROP POLICY IF EXISTS "Parents can insert children" ON public.users;

-- Crear nueva política según diseño propuesto
CREATE POLICY "parent_can_insert_child"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users AS parent
    WHERE parent.auth_id = auth.uid()
    AND parent.role = 'parent'
    AND parent.child_code = users.family_code
  )
  AND users.role = 'child'
);

-- Verificar política creada
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
AND policyname = 'parent_can_insert_child';

