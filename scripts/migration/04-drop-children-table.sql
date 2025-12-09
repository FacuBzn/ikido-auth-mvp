-- FASE 7.3: Eliminar tabla children (SOLO después de validar migración)
-- ⚠️ ADVERTENCIA: Este script ELIMINA la tabla children permanentemente
-- Ejecutar SOLO después de:
-- 1. Verificar que todos los datos fueron migrados
-- 2. Verificar que la aplicación funciona correctamente
-- 3. Tener backup completo de la base de datos

-- Primero, eliminar foreign keys que referencian children
-- (Si existen, ajustar según tu esquema)

-- Eliminar tabla children
DROP TABLE IF EXISTS children CASCADE;

-- Verificar eliminación
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'children';
-- Debe retornar 0 si se eliminó correctamente

