# Route Protection Patterns

## Overview

This document describes the official patterns for protecting routes in the iKidO application.

## 1. Layout-based (Parent Routes)

**Pattern:** Server Component layout with Supabase Auth check

**Location:** `app/parent/layout.tsx`

**How it works:**
- Layout Server Component makes auth check with Supabase
- Redirects to `/parent/login` if not authenticated
- All pages under `/parent/*` are automatically protected
- Pages only render content, no need for individual auth checks

**Used in:** `/parent/*` routes (via `app/parent/layout.tsx`)

**Example:**
```typescript
// app/parent/layout.tsx
export default async function ParentLayout({ children }) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    redirect("/parent/login");
  }
  
  return <>{children}</>;
}
```

## 2. Client Hooks (Child Routes)

**Pattern:** Client-side hook with Zustand store check

**Location:** Client Components under `/child/*`

**How it works:**
- Children do NOT use Supabase Auth
- Cannot validate auth server-side (no Zustand access from RSC)
- Hook `useRequireChildAuth()` checks Zustand store
- Redirects to `/child/join` if not authenticated
- Loader shown while Zustand hydrates from localStorage

**Used in:** `/child/*` routes

**Example:**
```typescript
// app/child/dashboard/ChildDashboardClient.tsx
"use client";

export function ChildDashboardClient() {
  useRequireChildAuth(); // Handles redirect if no auth
  
  // Component logic...
}
```

## 3. ProtectedRoute Wrapper (Optional)

**Pattern:** Server Component wrapper that passes user data as prop

**Location:** `components/ProtectedRoute.tsx`

**How it works:**
- Wrapper Server Component validates auth
- Passes user profile data to children via render prop
- Used when pages need user.id for database queries

**Used in:** `/parent/tasks`, `/parent/children` (pages that need parent.id)

**Example:**
```typescript
// app/parent/tasks/page.tsx
export default function ParentTasksPage() {
  return (
    <ProtectedRoute allowedRoles={["Parent"]}>
      {({ profile }) => <TasksManagement parentId={profile.id} />}
    </ProtectedRoute>
  );
}
```

## Decision Tree

```
Is the route under /parent/*?
├─ YES → Layout handles auth (Server-side)
└─ NO
   └─ Is the route under /child/*?
      ├─ YES → Client hook handles auth (Client-side)
      └─ NO → Public route (no protection)
```

## Best Practices

1. **Parent routes:** Always use layout-based protection (fast, server-side)
2. **Child routes:** Always use client hooks with hydration check
3. **ProtectedRoute:** Only use when you need to pass user data as prop
4. **Never mix patterns:** Stick to one pattern per route group
5. **Loaders:** Always show loader while Zustand hydrates for child routes

