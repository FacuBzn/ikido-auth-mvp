## iKidO (GGPoints) – Auth MVP

Base project for the iKidO (GGPoints) MVP: a family web app where parents assign tasks, kids complete them, and both track GGPoints and rewards. This repository contains a production-ready authentication module built with Next.js 16, Supabase, TailwindCSS, and Zustand.

### Features
- Public landing page with calls to action for sign in and registration.
- Registration and login flows backed by Supabase Auth.
- Role-aware redirects (`Parent` / `Child`) and protected dashboards.
- Session persistence and global store with Zustand + real-time Supabase listeners.
- Middleware-based route protection (App Router compatible).
- Minimal, responsive UI with TailwindCSS.
- Modular file structure prepared for future domain modules (tasks, rewards, etc.).

### Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (Auth + Postgres)
- TailwindCSS
- Zustand for client-side session state

### Project Structure
```
app/
  layout.tsx
  page.tsx
  login/
    page.tsx
    LoginForm.tsx
  register/
    page.tsx
    RegisterForm.tsx
  dashboard/
    parent/page.tsx
    child/page.tsx
components/
  AuthForm.tsx
  Header.tsx
  ProtectedRoute.tsx
  SessionProvider.tsx
lib/
  authHelpers.ts
  authRoutes.ts
  supabase/
    browserClient.ts
    serverClient.ts
    config.ts
  utils.ts
store/
  useSessionStore.ts
types/
  supabase.ts
middleware.ts
```

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

### Next Steps
- Hook Supabase tables (`children`, `tasks`, `rewards`) to the dashboards.
- Expand `ProtectedRoute` usage in nested routes/layouts as you ship new modules.
- Add integration/e2e tests (Playwright / Cypress) for full auth coverage.
