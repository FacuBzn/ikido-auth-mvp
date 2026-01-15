-- PR13: Parent Rewards Admin - Schema Migration
-- 
-- This migration adds status columns to the rewards table to support
-- the request/approve/reject flow for reward claims.
--
-- Flow:
-- 1. Parent creates reward for child (status = 'available')
-- 2. Child requests reward (status = 'requested')
-- 3. Parent approves (status = 'approved', claimed = true, points deducted)
--    OR Parent rejects (status = 'rejected', child can re-request later)
--
-- Consistency rules:
-- - status = 'available' => claimed = false
-- - status = 'requested' => claimed = false
-- - status = 'approved'  => claimed = true, claimed_at IS NOT NULL
-- - status = 'rejected'  => claimed = false

-- Step 1: Add new columns to rewards table
ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available',
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS decided_by_parent_id UUID NULL REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reject_reason TEXT NULL;

-- Step 2: Add check constraint for status values
-- NOTE: Run separately if constraint already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rewards_status_check'
  ) THEN
    ALTER TABLE rewards ADD CONSTRAINT rewards_status_check 
    CHECK (status IN ('available', 'requested', 'approved', 'rejected'));
  END IF;
END $$;

-- Step 3: Migrate existing claimed rewards to 'approved' status
UPDATE rewards 
SET 
  status = 'approved',
  approved_at = claimed_at
WHERE claimed = true AND status = 'available';

-- Step 4: Create index for faster queries by status
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_child_status ON rewards(child_user_id, status);

-- Verification query (run manually to check migration):
-- SELECT status, COUNT(*) FROM rewards GROUP BY status;
