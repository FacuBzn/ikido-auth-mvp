# PR13: Reward Claims Implementation Checklist

## Summary

This PR implements a complete reward claim workflow where:
1. **Child requests** a reward → `status='requested'`
2. **Parent approves** → `status='approved'`, points deducted
3. **Parent rejects** → `status='rejected'`, child can re-request later

## Files Created/Modified

### New Files
- `scripts/migrations/PR13_rewards_status_migration.sql` - Database migration
- `lib/utils/supabaseErrors.ts` - Error detection helpers

### Updated API Endpoints
- `app/api/parent/rewards/list/route.ts` - Uses helper, robust fallback
- `app/api/parent/rewards/claims/list/route.ts` - Uses helper, robust fallback
- `app/api/parent/rewards/claims/approve/route.ts` - Full implementation with CAS
- `app/api/parent/rewards/claims/reject/route.ts` - Full implementation
- `app/api/parent/rewards/create/route.ts` - Uses helper
- `app/api/parent/rewards/update/route.ts` - Uses helper
- `app/api/parent/rewards/delete/route.ts` - Uses helper
- `app/api/child/rewards/route.ts` - Uses helper
- `app/api/child/rewards/request/route.ts` - Full implementation

---

## Step 1: Run the SQL Migration

Execute in Supabase SQL Editor:

```sql
-- Copy contents from: scripts/migrations/PR13_rewards_status_migration.sql
```

This will:
1. Add columns: `status`, `requested_at`, `approved_at`, `rejected_at`, `reject_reason`, `decided_by_parent_id`
2. Backfill existing rewards: `claimed=true` → `status='approved'`, else `status='available'`
3. Add CHECK constraint for status values
4. Create indexes for performance

---

## Step 2: Verify Migration

```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards' 
AND column_name IN ('status', 'requested_at', 'approved_at', 'rejected_at', 'reject_reason');

-- Check data backfilled correctly
SELECT status, COUNT(*) 
FROM rewards 
GROUP BY status;
```

---

## Step 3: Test Endpoints Locally

### Prerequisites
- Start dev server: `npm run dev`
- Have a parent logged in with at least one child

### Test 1: Parent Lists Rewards

```bash
# Replace CHILD_ID with actual UUID
curl -X GET "http://localhost:3000/api/parent/rewards/list?child_id=CHILD_ID" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Expected: `200 OK` with `{ rewards: [...], ggpoints: number }`

### Test 2: Child Requests Reward

```bash
# Use browser console or Postman with child session cookie
curl -X POST "http://localhost:3000/api/child/rewards/request" \
  -H "Content-Type: application/json" \
  -d '{"reward_id": "REWARD_UUID"}'
```

Expected: `200 OK` with `{ success: true, reward: { status: "requested" } }`

### Test 3: Parent Lists Pending Claims

```bash
curl -X GET "http://localhost:3000/api/parent/rewards/claims/list?child_id=CHILD_ID" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Expected: `200 OK` with `{ claims: [{ status: "requested", ... }] }`

### Test 4: Parent Approves Claim

```bash
curl -X POST "http://localhost:3000/api/parent/rewards/claims/approve" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"rewardId": "REWARD_UUID"}'
```

Expected: `200 OK` with `{ success: true, ggpoints: <updated_balance> }`

### Test 5: Parent Rejects Claim

```bash
curl -X POST "http://localhost:3000/api/parent/rewards/claims/reject" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"rewardId": "REWARD_UUID", "reason": "Try again next week"}'
```

Expected: `200 OK` with `{ success: true, reward: { status: "rejected" } }`

---

## Behavior Before Migration

If the migration is NOT run yet:

| Endpoint | Behavior |
|----------|----------|
| `/parent/rewards/list` | Returns rewards with derived `status` from `claimed` field |
| `/parent/rewards/claims/list` | Returns empty array (no pending claims in legacy schema) |
| `/child/rewards/request` | Returns `501 FEATURE_NOT_AVAILABLE` |
| `/parent/rewards/claims/approve` | Returns `501 FEATURE_NOT_AVAILABLE` |
| `/parent/rewards/claims/reject` | Returns `501 FEATURE_NOT_AVAILABLE` |

The child UI will automatically fall back to the direct claim flow (`/api/child/rewards/claim`) when request returns 501.

---

## Behavior After Migration

| Status | Description |
|--------|-------------|
| `available` | Reward can be requested by child |
| `requested` | Pending parent approval (shows in Claims tab) |
| `approved` | Claimed, points deducted |
| `rejected` | Rejected by parent (child can re-request) |

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not owner of child/reward |
| `NOT_FOUND` | 404 | Reward/child not found |
| `INVALID_INPUT` | 400 | Missing/invalid parameters |
| `INVALID_STATUS` | 409 | Wrong status for operation |
| `INSUFFICIENT_POINTS` | 400 | Child doesn't have enough points |
| `CONCURRENT_MODIFICATION` | 409 | CAS failed (points changed) |
| `FEATURE_NOT_AVAILABLE` | 501 | Migration not run |
| `DATABASE_ERROR` | 500 | Unexpected DB error |

---

## Seed Test Data (Optional)

```sql
-- Insert 5 test rewards for a child
INSERT INTO rewards (name, cost, child_user_id, claimed, status)
SELECT 
  name, 
  10, 
  'YOUR_CHILD_USER_ID',
  false,
  'available'
FROM (VALUES 
  ('Extra Screen Time'),
  ('Ice Cream Treat'),
  ('New Sticker Pack'),
  ('Choose Dinner'),
  ('Stay Up Late')
) AS r(name);
```

---

## Validation Commands

```bash
# Lint
npm run lint

# Type check  
npm run typecheck

# Build
npm run build
```

All should pass with exit code 0.
