## iKidO (GGPoints) – Auth MVP

Base project for the iKidO (GGPoints) MVP: a family web app where parents assign tasks, kids complete them, and both track GGPoints and rewards. This repository contains a production-ready authentication module built with Next.js 14, Supabase, TailwindCSS, and Zustand.

### Features
- Registration and login flows with Supabase Auth.
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
Create a `.env.local` file with your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> Remember to run `npx supabase login` and `prisma generate` only when working with Prisma migrations (not part of this auth module yet).

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to access the app. The middleware will redirect you automatically to `/login` when necessary.

### Deployment
- The app is ready for Vercel. Add the Supabase environment variables on the Vercel dashboard.
- Consider enabling Supabase email auto-confirmation for a frictionless signup on the MVP.

### Next Steps
- Hook Supabase tables (`children`, `tasks`, `rewards`) to the dashboards.
- Expand `ProtectedRoute` usage in nested routes/layouts as you ship new modules.
- Add integration/e2e tests (Playwright / Cypress) for full auth coverage.
