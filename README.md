## iKidO (GGPoints) – Auth MVP

Base project for the iKidO (GGPoints) MVP: a family web app where parents assign tasks, kids complete them, and both track GGPoints and rewards. This repository contains a production-ready authentication module built with Next.js 16, Supabase, TailwindCSS, and Zustand.

### Features
- Public landing page with role selection (Parent/Child)
- Registration and login flows backed by Supabase Auth
- Role-aware redirects (`Parent` / `Child`) and protected dashboards
- Session persistence and global store with Zustand + real-time Supabase listeners
- Nested layouts for route protection (Server Components)
- Client-side hooks for child authentication
- Minimal, responsive UI with TailwindCSS
- Modular file structure prepared for future domain modules (tasks, rewards, etc.)

### Stack
- **Next.js 16** (App Router) + TypeScript
- **React 19**
- **Supabase** (Auth + Postgres)
- **TailwindCSS**
- **Zustand** for client-side session state

### Project Structure
```
app/
  layout.tsx                 # Root layout with SessionProvider
  page.tsx                   # Landing page with role selection
  parent/
    layout.tsx              # Parent auth protection (Server Component)
  login/
    page.tsx
      ParentLoginForm.tsx
  register/
    page.tsx
      ParentRegisterForm.tsx
    dashboard/
      page.tsx
      ParentDashboardClient.tsx
    tasks/
      page.tsx
    children/
      page.tsx
  child/
    layout.tsx              # Child wrapper (no auth check)
    join/
      page.tsx
      ChildJoinForm.tsx
  dashboard/
      page.tsx
      ChildDashboardClient.tsx
    rewards/
      page.tsx
components/
  SessionProvider.tsx        # Hydrates Zustand from Supabase
  ProtectedRoute.tsx         # Server Component wrapper
  Header.tsx
hooks/
  useRequireParentAuth.ts   # Client hook for parent routes
  useRequireChildAuth.ts    # Client hook for child routes
lib/
  repositories/
    parentRepository.ts
    childRepository.ts
  supabase/
    serverClient.ts
    config.ts
  supabaseClient.ts
store/
  useSessionStore.ts        # Zustand store with hydration flag
types/
  supabase.ts
docs/
  ARCHITECTURE.md           # Architecture documentation
  ROUTE_PROTECTION_PATTERNS.md
```

### Route Protection

- **Parent routes** (`/parent/*`): Protected by Server Component layout
- **Child routes** (`/child/*`): Protected by client-side hooks
- See [docs/ROUTE_PROTECTION_PATTERNS.md](docs/ROUTE_PROTECTION_PATTERNS.md) for details

### Environment Variables
- Copy `.env.example` to `.env.local`.
- Fill in the Supabase credentials for your project:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

> The project currently relies on Supabase Auth and Postgres only; Prisma migrations are not required for this module.

### Development

1. Install dependencies with `npm install`.
2. Duplicate `.env.example` into `.env.local` and add your Supabase keys.
3. Run the development server with `npm run dev`.

Visit `http://localhost:3000` to access the app. Unauthenticated users land on the public home page, while authenticated users are redirected to their dashboard.

### Quality checks
- `npm run lint` – ESLint via `next lint`.
- `npm run typecheck` – TypeScript in no-emit mode.
- `npm run build` – Production build of the Next.js app (outputs to `dist/`).

### Deployment
- Configure a Vercel project pointing to this repository and set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the dashboard for Development, Preview, and Production environments.
- Optionally wire the build command to `npm run vercel-build` to enforce linting and type checking before `next build`.
- Consider enabling Supabase email auto-confirmation for a frictionless signup on the MVP.

### Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Complete architecture overview
- **[Route Protection Patterns](docs/ROUTE_PROTECTION_PATTERNS.md)** - How routes are protected

### Database Migration

The project uses a consolidated `users` table for both parents and children. If migrating from a legacy `children` table, see:

- `scripts/migration/01-backup-children.sql`
- `scripts/migration/02-migrate-children-to-users.sql`
- `scripts/migration/03-create-indexes.sql`
- `scripts/migration/04-drop-children-table.sql`

**IMPORTANT:** Always backup your database before running migration scripts.

### Next Steps
- Connect tasks and rewards to Supabase tables in dashboards
- Add integration/e2e tests (Playwright / Cypress) for full auth coverage
- Implement task completion and reward claiming flows
