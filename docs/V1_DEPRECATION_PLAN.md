# V1 Deprecation Plan - Move V2 to Root

## Baseline (Before Migration)
- ✅ `npm run lint`: PASSED
- ✅ `npm run typecheck`: PASSED
- ✅ `npm run build`: PASSED (42 routes)

## Current Route Structure

### V1 Routes (TO REMOVE)
- `/app/parent/*` - V1 Parent routes (login, dashboard, tasks, children, register)
- `/app/child/*` - V1 Child routes (dashboard, join, rewards)
- `/app/legacy` - Legacy landing page

### V2 Routes (TO MOVE TO ROOT)
- `/app/v2/parent/*` - V2 Parent routes (login, dashboard, tasks, rewards, approvals, register, children/[childId]/activity)
- `/app/v2/child/*` - V2 Child routes (dashboard, join, rewards)
- `/app/v2/page.tsx` - V2 Role selection page
- `/app/v2/playground` - UI Kit playground (keep at /v2/playground)

### API Routes (NO CHANGES)
- `/app/api/*` - Shared API routes (no versioning)

## Migration Strategy

### Step 1: Backup V1 (temporary)
- Rename `/app/parent` → `/app/_v1_backup_parent` (temp)
- Rename `/app/child` → `/app/_v1_backup_child` (temp)
- This allows us to verify V2 works before deleting V1

### Step 2: Move V2 to Root
- `git mv app/v2/parent app/parent` (replaces V1)
- `git mv app/v2/child app/child` (replaces V1)
- `git mv app/v2/page.tsx app/page.tsx` (replaces current redirect)
- `git mv app/v2/layout.tsx app/v2/layout.tsx` (keep for redirects)

### Step 3: Create Redirects in /v2/*
- `/app/v2/page.tsx` → redirect to `/`
- `/app/v2/parent/*` → redirect to `/parent/*`
- `/app/v2/child/*` → redirect to `/child/*`
- `/app/v2/playground` → keep as-is (dev tool)

### Step 4: Remove V1 and Legacy
- Delete `/app/_v1_backup_parent`
- Delete `/app/_v1_backup_child`
- Delete `/app/legacy`

### Step 5: Update All Internal References
- Replace `/v2/parent/*` → `/parent/*` in all files
- Replace `/v2/child/*` → `/child/*` in all files
- Remove references to `/legacy`

## Expected Result

### New Route Structure
- `/` - Role selection (V2)
- `/parent/*` - Parent routes (V2)
- `/child/*` - Child routes (V2)
- `/v2/*` - Redirects to root routes
- `/v2/playground` - UI Kit playground (dev tool)

### Removed
- V1 parent routes
- V1 child routes
- `/legacy` page
