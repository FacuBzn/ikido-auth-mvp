# PR14: Default Rewards Implementation

## Summary

This PR implements automatic seeding of default rewards for all children:
- When a parent opens "Manage Rewards", default rewards are seeded for **all** their children
- If a specific child has no rewards, defaults are auto-seeded when viewing that child
- Creating custom rewards per child is fully supported
- Duplicate prevention via unique index on `(child_user_id, name)`

## Files Created

| File | Description |
|------|-------------|
| `scripts/migrations/PR14_rewards_defaults_migration.sql` | SQL migration for unique index |
| `lib/rewards/defaultRewards.ts` | Default rewards configuration |
| `app/api/parent/rewards/seed-defaults/route.ts` | Endpoint to seed defaults for one child |
| `app/api/parent/rewards/seed-defaults/all/route.ts` | Endpoint to seed defaults for all children |
| `docs/PR14_DEFAULT_REWARDS_CHECKLIST.md` | This documentation |

## Files Updated

| File | Changes |
|------|---------|
| `app/api/parent/rewards/list/route.ts` | Auto-seeds defaults if child has no rewards |
| `app/v2/parent/rewards/ParentRewardsClient.tsx` | Calls seed-defaults/all on mount |

---

## Step 1: Run the SQL Migration

Execute in Supabase SQL Editor:

```sql
-- Create unique index to prevent duplicate rewards per child
CREATE UNIQUE INDEX IF NOT EXISTS rewards_unique_child_name
ON public.rewards (child_user_id, name);

-- Ensure claimed column has proper default
ALTER TABLE public.rewards ALTER COLUMN claimed SET DEFAULT false;
```

---

## Default Rewards

All children automatically receive these rewards (cost = 10 GGPoints each):

1. "Choose the Family Playlist (30 min)"
2. "Mystery Box: Tiny Surprise"
3. "Double GG Day (next task counts x2)"
4. "Build-a-Fort Night"
5. "Late Bedtime Pass (20 min)"

---

## API Endpoints

### POST /api/parent/rewards/seed-defaults

Seeds default rewards for a specific child.

```bash
curl -X POST "http://localhost:3000/api/parent/rewards/seed-defaults" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"child_id": "CHILD_UUID"}'
```

Response:
```json
{
  "success": true,
  "seeded": 5,
  "child_id": "...",
  "child_name": "Josecito"
}
```

### POST /api/parent/rewards/seed-defaults/all

Seeds default rewards for ALL children of the authenticated parent.

```bash
curl -X POST "http://localhost:3000/api/parent/rewards/seed-defaults/all" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{}'
```

Response:
```json
{
  "success": true,
  "results": [
    { "child_id": "...", "child_name": "Josecito", "seeded": 5 },
    { "child_id": "...", "child_name": "Maria", "seeded": 5 }
  ],
  "totalSeeded": 10
}
```

### GET /api/parent/rewards/list?child_id=UUID

Lists rewards for a child. If the child has no rewards, defaults are auto-seeded.

```bash
curl -X GET "http://localhost:3000/api/parent/rewards/list?child_id=CHILD_UUID" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Response:
```json
{
  "rewards": [
    { "id": "...", "name": "Late Bedtime Pass (20 min)", "cost": 10, ... }
  ],
  "ggpoints": 0,
  "child": { "id": "...", "name": "Josecito" }
}
```

### POST /api/parent/rewards/create

Creates a custom reward for a specific child.

```bash
curl -X POST "http://localhost:3000/api/parent/rewards/create" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"childId": "CHILD_UUID", "name": "Extra TV Time", "cost": 25}'
```

Response:
```json
{
  "success": true,
  "reward": {
    "id": "...",
    "name": "Extra TV Time",
    "cost": 25
  }
}
```

---

## How It Works

1. **On Mount**: When `ParentRewardsClient` mounts, it calls `POST /seed-defaults/all` to ensure all children have default rewards

2. **On Child Selection**: When listing rewards for a child, if they have 0 rewards, the endpoint automatically seeds the defaults before returning

3. **Idempotent**: Calling seed multiple times won't create duplicates - the unique index prevents it

4. **Custom Rewards**: Parents can still create custom rewards per child - these are in addition to defaults

---

## Testing Checklist

### Scenario 1: New Parent with Children
1. Create a new parent account
2. Add 2 children (e.g., "Josecito" and "Maria")
3. Navigate to `/v2/parent/rewards`
4. Both children should show 5 default rewards each

### Scenario 2: Switching Between Children
1. Select Josecito → See 5 rewards
2. Select Maria → See 5 rewards (same defaults)
3. Switch back to Josecito → Still 5 rewards

### Scenario 3: Creating Custom Rewards
1. Select Josecito
2. Click "+ New Reward"
3. Enter "Ice Cream Trip" with cost 50
4. Click Create
5. Josecito now has 6 rewards
6. Switch to Maria → Still has 5 rewards (custom is child-specific)

### Scenario 4: No Duplicates
1. Refresh the page multiple times
2. Rewards count should stay the same (no duplicates)

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
