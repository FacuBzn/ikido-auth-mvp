-- ============================================
-- MIGRACIÓN: Permitir NULL en auth_id y email para children
-- ============================================
-- Ejecutar en Supabase SQL Editor ANTES de aplicar políticas RLS
--
-- IMPORTANTE: Los children NO tienen Auth users, por lo que auth_id y email
-- deben poder ser NULL para permitir la inserción de children.

-- Verificar restricciones actuales
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name IN ('auth_id', 'email');

-- Permitir NULL en auth_id (si tiene constraint NOT NULL)
ALTER TABLE public.users 
ALTER COLUMN auth_id DROP NOT NULL;

-- Permitir NULL en email (si tiene constraint NOT NULL)
ALTER TABLE public.users 
ALTER COLUMN email DROP NOT NULL;

-- Verificar cambios aplicados
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name IN ('auth_id', 'email');

