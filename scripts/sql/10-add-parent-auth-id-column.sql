-- ============================================
-- MIGRACIÓN: Agregar columna parent_auth_id a users
-- ============================================
-- EJECUTAR EN SUPABASE SQL EDITOR PRIMERO
--
-- Esta columna almacena el auth.uid() del padre para facilitar RLS.
-- Permite validar directamente parent_auth_id = auth.uid() sin subqueries.

-- Paso 1: Verificar si la columna ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'parent_auth_id'
    ) THEN
        -- Agregar columna parent_auth_id
        ALTER TABLE public.users 
        ADD COLUMN parent_auth_id UUID NULL;
        
        -- Crear índice para búsquedas rápidas
        CREATE INDEX IF NOT EXISTS idx_users_parent_auth_id 
        ON public.users(parent_auth_id) 
        WHERE parent_auth_id IS NOT NULL;
        
        RAISE NOTICE 'Columna parent_auth_id agregada con índice';
    ELSE
        RAISE NOTICE 'Columna parent_auth_id ya existe';
    END IF;
END $$;

-- Paso 2: Migrar datos existentes
-- Para children existentes, establecer parent_auth_id desde su parent
UPDATE public.users AS child
SET parent_auth_id = parent.auth_id
FROM public.users AS parent
WHERE child.role = 'child'
AND child.parent_id = parent.id
AND parent.role = 'parent'
AND child.parent_auth_id IS NULL
AND parent.auth_id IS NOT NULL;

-- Paso 3: Verificar columna agregada
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'parent_auth_id';

-- Paso 4: Verificar datos migrados
SELECT 
    role,
    COUNT(*) as total,
    COUNT(parent_auth_id) as with_parent_auth_id
FROM public.users
WHERE role = 'child'
GROUP BY role;

