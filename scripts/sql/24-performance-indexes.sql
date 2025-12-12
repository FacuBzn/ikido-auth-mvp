-- Performance Optimization Indexes
-- Run this to optimize query performance for task retrieval

-- Index for child_code lookups (used in child authentication)
CREATE INDEX IF NOT EXISTS idx_users_child_code 
ON users(child_code) 
WHERE role = 'child';

-- Index for family_code lookups
CREATE INDEX IF NOT EXISTS idx_users_family_code 
ON users(family_code);

-- Composite index for child_code + role + family_code (covers common query pattern)
CREATE INDEX IF NOT EXISTS idx_users_child_auth 
ON users(child_code, role, family_code) 
WHERE role = 'child';

-- Index for child_tasks by child_id (most common query)
CREATE INDEX IF NOT EXISTS idx_child_tasks_child_id 
ON child_tasks(child_id);

-- Index for child_tasks by status (used in points calculation)
CREATE INDEX IF NOT EXISTS idx_child_tasks_status 
ON child_tasks(status);

-- Composite index for child_id + status (optimizes filtered queries)
CREATE INDEX IF NOT EXISTS idx_child_tasks_child_status 
ON child_tasks(child_id, status);

-- Index for sorting by assigned_at
CREATE INDEX IF NOT EXISTS idx_child_tasks_assigned_at 
ON child_tasks(assigned_at DESC);

-- Composite index for child_id + assigned_at (optimizes most common query pattern)
CREATE INDEX IF NOT EXISTS idx_child_tasks_child_assigned 
ON child_tasks(child_id, assigned_at DESC);

-- Analyze tables to update statistics for query planner
ANALYZE users;
ANALYZE child_tasks;
ANALYZE tasks;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'child_tasks', 'tasks')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

