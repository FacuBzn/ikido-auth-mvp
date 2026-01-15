-- ============================================================================
-- PR15: Add decided_by_parent_id column (OPTIONAL)
-- This column tracks which parent approved/rejected a reward claim
-- The approve/reject endpoints work without this column
-- ============================================================================

-- Add column if it doesn't exist
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS decided_by_parent_id uuid;

-- Add foreign key constraint (optional, for referential integrity)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rewards_decided_by_parent_fk'
    ) THEN
        ALTER TABLE public.rewards
        ADD CONSTRAINT rewards_decided_by_parent_fk
        FOREIGN KEY (decided_by_parent_id) REFERENCES public.users(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key: rewards_decided_by_parent_fk';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint rewards_decided_by_parent_fk already exists';
END $$;

-- Add index for queries by parent
CREATE INDEX IF NOT EXISTS rewards_decided_by_parent_idx 
ON public.rewards(decided_by_parent_id);

-- Verify
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rewards' 
        AND column_name = 'decided_by_parent_id'
    ) THEN
        RAISE NOTICE 'Column decided_by_parent_id added successfully';
    ELSE
        RAISE WARNING 'Failed to add column decided_by_parent_id';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK (run manually if needed):
-- ALTER TABLE public.rewards DROP COLUMN IF EXISTS decided_by_parent_id;
-- DROP INDEX IF EXISTS rewards_decided_by_parent_idx;
-- ============================================================================
