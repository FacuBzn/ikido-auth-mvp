-- FASE 7.1: Backup de tabla children antes de migración
-- Ejecutar este script ANTES de cualquier migración

-- Crear tabla de backup
CREATE TABLE IF NOT EXISTS children_backup AS 
SELECT * FROM children;

-- Verificar backup
SELECT COUNT(*) as backup_count FROM children_backup;
SELECT COUNT(*) as original_count FROM children;

-- Si los conteos coinciden, el backup fue exitoso

