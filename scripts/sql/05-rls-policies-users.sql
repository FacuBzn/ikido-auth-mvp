-- ============================================
-- RLS POLICIES PARA TABLA users (children sin Auth)
-- ============================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de migrar datos
-- 
-- IMPORTANTE: En este MVP, los children NO tienen Auth users.
-- Solo los parents tienen Supabase Auth accounts.
-- Los children se identifican por child_code y se manejan vía Zustand en el cliente.

-- Habilitar RLS en tabla users (si no está habilitado)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA PARENTS
-- ============================================

-- 1. Parents pueden leer su propio perfil
CREATE POLICY "Parents can read own profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth_id = auth.uid() AND role = 'parent'
);

-- 2. Parents pueden insertar children (SIN Auth users)
CREATE POLICY "Parents can insert children"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'child' AND
  auth_id IS NULL AND -- Children NO tienen Auth users
  parent_id IN (
    SELECT id FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'parent'
  )
);

-- 3. Parents pueden leer sus children
CREATE POLICY "Parents can read their children"
ON users
FOR SELECT
TO authenticated
USING (
  role = 'child' AND
  parent_id IN (
    SELECT id FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'parent'
  )
);

-- 4. Parents pueden actualizar sus children
CREATE POLICY "Parents can update their children"
ON users
FOR UPDATE
TO authenticated
USING (
  role = 'child' AND
  parent_id IN (
    SELECT id FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'parent'
  )
);

-- 5. Parents pueden eliminar sus children
CREATE POLICY "Parents can delete their children"
ON users
FOR DELETE
TO authenticated
USING (
  role = 'child' AND
  parent_id IN (
    SELECT id FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'parent'
  )
);

-- ============================================
-- POLÍTICAS PARA CHILDREN (futuro, si se agrega Auth)
-- ============================================
-- NOTA: Estas políticas están preparadas para el futuro,
-- pero actualmente los children NO tienen Auth users.

-- 6. Children pueden leerse a sí mismos (si tuvieran Auth)
-- CREATE POLICY "Children can read themselves"
-- ON users
-- FOR SELECT
-- TO authenticated
-- USING (
--   auth_id = auth.uid() AND role = 'child'
-- );

-- 7. Children pueden leer su parent (si tuvieran Auth)
-- CREATE POLICY "Children can read their parent"
-- ON users
-- FOR SELECT
-- TO authenticated
-- USING (
--   role = 'parent' AND
--   id IN (
--     SELECT parent_id FROM users 
--     WHERE auth_id = auth.uid() 
--     AND role = 'child'
--   )
-- );

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
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

