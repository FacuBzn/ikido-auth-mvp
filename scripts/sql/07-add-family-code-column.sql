-- ============================================
-- MIGRACIÓN: Agregar columna family_code a users
-- ============================================
-- Ejecutar en Supabase SQL Editor ANTES de aplicar políticas RLS
--
-- IMPORTANTE: Los children necesitan tener family_code que sea igual
-- al child_code del parent para que la política RLS funcione correctamente.

-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'family_code'
    ) THEN
        -- Agregar columna family_code
        ALTER TABLE public.users 
        ADD COLUMN family_code TEXT NULL;
        
        -- Actualizar family_code de parents con su child_code
        UPDATE public.users
        SET family_code = child_code
        WHERE role = 'parent' AND child_code IS NOT NULL;
        
        -- Actualizar family_code de children existentes con el child_code de su parent
        UPDATE public.users AS child
        SET family_code = parent.child_code
        FROM public.users AS parent
        WHERE child.role = 'child'
        AND child.parent_id = parent.id
        AND parent.role = 'parent'
        AND parent.child_code IS NOT NULL;
        
        RAISE NOTICE 'Columna family_code agregada y datos migrados';
    ELSE
        RAISE NOTICE 'Columna family_code ya existe';
    END IF;
END $$;

-- Verificar columna agregada
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'family_code';

-- Verificar datos migrados
SELECT 
    role,
    COUNT(*) as total,
    COUNT(family_code) as with_family_code
FROM public.users
GROUP BY role;

