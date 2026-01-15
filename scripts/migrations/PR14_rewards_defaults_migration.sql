-- ============================================================================
-- PR14: Default Rewards Migration
-- Adds unique constraint and ensures proper defaults for rewards table
-- ============================================================================

-- Step 1: Create unique index for (child_user_id, name) to prevent duplicates
-- This enables idempotent seeding of default rewards
CREATE UNIQUE INDEX IF NOT EXISTS rewards_unique_child_name
ON public.rewards (child_user_id, name);

-- Step 2: Ensure claimed column has proper default
ALTER TABLE public.rewards ALTER COLUMN claimed SET DEFAULT false;

-- Step 3: Verify the index was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'rewards_unique_child_name'
    ) THEN
        RAISE NOTICE 'Index rewards_unique_child_name created successfully';
    ELSE
        RAISE WARNING 'Failed to create index rewards_unique_child_name';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK (run manually if needed):
-- DROP INDEX IF EXISTS rewards_unique_child_name;
-- ============================================================================
