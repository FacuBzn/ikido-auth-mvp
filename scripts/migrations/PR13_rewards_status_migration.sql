-- ============================================================================
-- PR13: Rewards Status Migration
-- Adds status-based claim workflow columns to rewards table
-- ============================================================================

-- Step 1: Add new columns if they don't exist
DO $$
BEGIN
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'rewards' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.rewards ADD COLUMN status text DEFAULT 'available';
        RAISE NOTICE 'Added column: status';
    END IF;

    -- Add requested_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'rewards' 
                   AND column_name = 'requested_at') THEN
        ALTER TABLE public.rewards ADD COLUMN requested_at timestamptz;
        RAISE NOTICE 'Added column: requested_at';
    END IF;

    -- Add approved_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'rewards' 
                   AND column_name = 'approved_at') THEN
        ALTER TABLE public.rewards ADD COLUMN approved_at timestamptz;
        RAISE NOTICE 'Added column: approved_at';
    END IF;

    -- Add rejected_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'rewards' 
                   AND column_name = 'rejected_at') THEN
        ALTER TABLE public.rewards ADD COLUMN rejected_at timestamptz;
        RAISE NOTICE 'Added column: rejected_at';
    END IF;

    -- Add reject_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'rewards' 
                   AND column_name = 'reject_reason') THEN
        ALTER TABLE public.rewards ADD COLUMN reject_reason text;
        RAISE NOTICE 'Added column: reject_reason';
    END IF;

    -- Add decided_by_parent_id column (tracks who approved/rejected)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'rewards' 
                   AND column_name = 'decided_by_parent_id') THEN
        ALTER TABLE public.rewards ADD COLUMN decided_by_parent_id uuid REFERENCES public.users(id);
        RAISE NOTICE 'Added column: decided_by_parent_id';
    END IF;
END $$;

-- Step 2: Backfill status from claimed column
UPDATE public.rewards
SET 
    status = CASE 
        WHEN claimed = true THEN 'approved'
        ELSE 'available'
    END,
    approved_at = CASE 
        WHEN claimed = true THEN COALESCE(claimed_at, created_at)
        ELSE NULL
    END
WHERE status IS NULL OR status = '';

-- Step 3: Set default for claimed column if not already set
ALTER TABLE public.rewards ALTER COLUMN claimed SET DEFAULT false;

-- Step 4: Add CHECK constraint for status (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'rewards_status_check'
    ) THEN
        ALTER TABLE public.rewards 
        ADD CONSTRAINT rewards_status_check 
        CHECK (status IN ('available', 'requested', 'approved', 'rejected'));
        RAISE NOTICE 'Added constraint: rewards_status_check';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint rewards_status_check already exists';
END $$;

-- Step 5: Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rewards_child_status 
    ON public.rewards(child_user_id, status);

CREATE INDEX IF NOT EXISTS idx_rewards_child_created 
    ON public.rewards(child_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rewards_status_requested 
    ON public.rewards(status) WHERE status = 'requested';

-- Step 6: Verify migration
DO $$
DECLARE
    col_count integer;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name IN ('status', 'requested_at', 'approved_at', 'rejected_at', 'reject_reason', 'decided_by_parent_id');
    
    IF col_count = 6 THEN
        RAISE NOTICE 'Migration successful: All 6 new columns exist';
    ELSE
        RAISE WARNING 'Migration incomplete: Only % of 6 columns found', col_count;
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK (run manually if needed):
-- ALTER TABLE public.rewards DROP COLUMN IF EXISTS status;
-- ALTER TABLE public.rewards DROP COLUMN IF EXISTS requested_at;
-- ALTER TABLE public.rewards DROP COLUMN IF EXISTS approved_at;
-- ALTER TABLE public.rewards DROP COLUMN IF EXISTS rejected_at;
-- ALTER TABLE public.rewards DROP COLUMN IF EXISTS reject_reason;
-- ALTER TABLE public.rewards DROP COLUMN IF EXISTS decided_by_parent_id;
-- DROP INDEX IF EXISTS idx_rewards_child_status;
-- DROP INDEX IF EXISTS idx_rewards_child_created;
-- DROP INDEX IF EXISTS idx_rewards_status_requested;
-- ============================================================================
