-- FASE 7.2: Migrar datos de children a users
-- IMPORTANTE: Ejecutar SOLO después de verificar el backup

-- Migrar children existentes como users (si no existen ya)
INSERT INTO users (id, auth_id, email, name, role, parent_id, points_balance, created_at)
SELECT 
  id,
  id as auth_id, -- Temporal, será actualizado en próximo paso si es necesario
  CONCAT(LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g')), '@child.ikido') as email,
  name,
  'child' as role,
  parent_id,
  0 as points_balance,
  created_at
FROM children
WHERE id NOT IN (SELECT id FROM users WHERE role = 'child')
ON CONFLICT (id) DO NOTHING;

-- Verificar migración
SELECT 
  (SELECT COUNT(*) FROM children) as children_count,
  (SELECT COUNT(*) FROM users WHERE role = 'child') as users_children_count;

-- Los conteos deben ser iguales o users_children_count >= children_count

