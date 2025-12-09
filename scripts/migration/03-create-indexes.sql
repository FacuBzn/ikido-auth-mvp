-- FASE 7.4: Crear índices faltantes en tabla users

-- Index for auth_id lookups (si no existe)
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id) WHERE parent_id IS NOT NULL;

-- Index for child_code lookups (family code)
CREATE INDEX IF NOT EXISTS idx_users_child_code ON users(child_code) WHERE child_code IS NOT NULL;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for tasks by child
CREATE INDEX IF NOT EXISTS idx_tasks_child_user_id ON tasks(child_user_id);

-- Index for rewards by child
CREATE INDEX IF NOT EXISTS idx_rewards_child_user_id ON rewards(child_user_id);

-- Verificar índices creados
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('users', 'tasks', 'rewards')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

