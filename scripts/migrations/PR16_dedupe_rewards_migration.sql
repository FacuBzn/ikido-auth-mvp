-- ============================================================================
-- PR16: Deduplicate Rewards and Add Unique Constraint
-- This migration:
-- 1. Removes duplicate rewards (keeping canonical one)
-- 2. Adds unique index on (child_user_id, name)
-- ============================================================================

-- Step 1: Check if status column exists and deduplicate accordingly
DO $$
DECLARE
    has_status_column BOOLEAN;
    deleted_count INTEGER := 0;
BEGIN
    -- Check if status column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rewards' 
        AND column_name = 'status'
    ) INTO has_status_column;

    IF has_status_column THEN
        RAISE NOTICE 'Status column exists - using full deduplication logic';
        
        -- Delete duplicates keeping the canonical row (with status column)
        -- Priority: 
        -- 1. status = 'approved' or 'requested' 
        -- 2. claimed = true
        -- 3. oldest created_at
        WITH ranked_rewards AS (
            SELECT 
                id,
                child_user_id,
                name,
                ROW_NUMBER() OVER (
                    PARTITION BY child_user_id, name
                    ORDER BY 
                        CASE 
                            WHEN status = 'approved' THEN 1
                            WHEN status = 'requested' THEN 2
                            WHEN claimed = true THEN 3
                            ELSE 4
                        END,
                        created_at ASC
                ) AS rn
            FROM public.rewards
        ),
        duplicates_to_delete AS (
            SELECT id FROM ranked_rewards WHERE rn > 1
        )
        DELETE FROM public.rewards 
        WHERE id IN (SELECT id FROM duplicates_to_delete);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % duplicate rewards (with status logic)', deleted_count;
    ELSE
        RAISE NOTICE 'Status column does not exist - using legacy deduplication logic';
        
        -- Delete duplicates keeping the canonical row (without status column)
        -- Priority:
        -- 1. claimed = true
        -- 2. oldest created_at
        WITH ranked_rewards AS (
            SELECT 
                id,
                child_user_id,
                name,
                ROW_NUMBER() OVER (
                    PARTITION BY child_user_id, name
                    ORDER BY 
                        CASE WHEN claimed = true THEN 1 ELSE 2 END,
                        created_at ASC
                ) AS rn
            FROM public.rewards
        ),
        duplicates_to_delete AS (
            SELECT id FROM ranked_rewards WHERE rn > 1
        )
        DELETE FROM public.rewards 
        WHERE id IN (SELECT id FROM duplicates_to_delete);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % duplicate rewards (legacy logic)', deleted_count;
    END IF;
END $$;

-- Step 2: Verify no duplicates remain
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT child_user_id, name, COUNT(*) as cnt
        FROM public.rewards
        GROUP BY child_user_id, name
        HAVING COUNT(*) > 1
    ) AS dups;
    
    IF dup_count > 0 THEN
        RAISE WARNING 'Still have % duplicate groups - manual review needed', dup_count;
    ELSE
        RAISE NOTICE 'All duplicates removed successfully';
    END IF;
END $$;

-- Step 3: Create unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS rewards_unique_child_name
ON public.rewards (child_user_id, name);

-- Step 4: Verify index was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'rewards_unique_child_name'
    ) THEN
        RAISE NOTICE 'Unique index rewards_unique_child_name created successfully';
    ELSE
        RAISE WARNING 'Failed to create unique index';
    END IF;
END $$;

-- Step 5: Set default for claimed column
ALTER TABLE public.rewards ALTER COLUMN claimed SET DEFAULT false;

-- ============================================================================
-- VERIFICATION QUERIES (run manually to check):
-- 
-- Check for any remaining duplicates:
-- SELECT child_user_id, name, COUNT(*) 
-- FROM public.rewards 
-- GROUP BY child_user_id, name 
-- HAVING COUNT(*) > 1;
--
-- Check rewards count per child:
-- SELECT child_user_id, COUNT(*) as reward_count 
-- FROM public.rewards 
-- GROUP BY child_user_id;
--
-- ============================================================================
-- ROLLBACK (run manually if needed):
-- DROP INDEX IF EXISTS rewards_unique_child_name;
-- ============================================================================
