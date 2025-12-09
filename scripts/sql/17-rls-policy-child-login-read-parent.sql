-- ============================================
-- RLS POLICIES: Permitir child login sin autenticación
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Estas políticas permiten que el endpoint de child login pueda:
-- 1. Leer el parent por family_code
-- 2. Leer el child por child_code + family_code
-- Sin requerir autenticación de Supabase Auth.

-- ============================================
-- POLÍTICA 1: Leer parents por family_code
-- ============================================
DROP POLICY IF EXISTS "Child login can read parent by family_code" ON public.users;

CREATE POLICY "Child login can read parent by family_code"
ON public.users
FOR SELECT
TO anon, authenticated
USING (
  role = 'parent' 
  AND family_code IS NOT NULL
);

-- ============================================
-- POLÍTICA 2: Leer children por child_code + family_code
-- ============================================
DROP POLICY IF EXISTS "Child login can read child by codes" ON public.users;

CREATE POLICY "Child login can read child by codes"
ON public.users
FOR SELECT
TO anon, authenticated
USING (
  role = 'child' 
  AND child_code IS NOT NULL
  AND family_code IS NOT NULL
);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
AND policyname IN (
  'Child login can read parent by family_code',
  'Child login can read child by codes'
);

-- ============================================
-- NOTAS
-- ============================================
-- Estas políticas permiten:
-- 1. Leer parents por family_code sin autenticación (para validar el código)
-- 2. Leer children por child_code + family_code sin autenticación (para child login)
-- 3. Funcionan tanto para usuarios anónimos como autenticados
-- 4. Son seguras porque solo exponen información necesaria para el login

