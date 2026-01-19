# iKidO

**iKidO** is a task management and rewards system for families. Parents can assign tasks to children, track their progress, and reward them with GGPoints. Children can complete tasks, earn points, and claim rewards.

## Overview

iKidO helps families gamify household chores and responsibilities:

- **Parents**: Create and assign tasks, track children's progress, approve completed tasks, and manage rewards
- **Children**: View assigned tasks, mark them as complete, earn GGPoints, and request rewards

The application uses a dual authentication system:
- **Parents**: Authenticated via Supabase Auth with full session management
- **Children**: Authenticated via codes (`family_code` + `child_code`) stored in Zustand (localStorage)

## Features

### Parent Features
- User registration and login (Supabase Auth)
- Dashboard with children overview and quick actions
- Task management: create, assign, and approve tasks
- Children management: add and manage child profiles
- Rewards system: create and manage rewards
- Task approvals: approve/reject completed tasks
- Activity tracking: view child activity history

### Child Features
- Code-based login (no email/password required)
- Task dashboard: view assigned tasks and mark them complete
- Points tracking: see current GGPoints balance
- Rewards shop: browse and request rewards
- Task completion tracking with visual feedback

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js LTS
- **Language**: TypeScript
- **UI**: React 19
- **Styling**: TailwindCSS 4
- **Database**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Radix UI + custom IKIDO components

## Prerequisites

- **Node.js**: LTS version (v18 or higher)
- **npm**: Comes with Node.js
- **Supabase Project**: Active project with Auth and PostgreSQL enabled
- **Environment Variables**: See [Variables de entorno](#variables-de-entorno) section

## Local Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ikido-auth-mvp

# Install dependencies
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
# On Windows (PowerShell)
Copy-Item .env.example .env.local

# On macOS/Linux
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```env
# Public variables (accessible in browser)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Server-only variables (NOT exposed to browser)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Optional: Development admin key (only for /api/dev/* endpoints)
DEV_ADMIN_KEY="your-dev-admin-key-here"
```

**Important:**
- `NEXT_PUBLIC_*` variables are exposed to the browser - use only public-safe values
- `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the client
- `.env.local` is gitignored and won't be committed

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Database Setup

The application uses Supabase for database management. SQL migrations are in `scripts/sql/`. Refer to migration documentation for database setup:

- Migration order: `scripts/sql/00-ORDEN_MIGRACIONES.md`
- Period key migration: `docs/MIGRATION_PERIOD_KEY.md` (if applicable)

**Note**: This project does NOT use Prisma. All database operations go through Supabase client libraries.

## Available Commands

### Development

```bash
# Start development server
npm run dev

# Run linter (ESLint)
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run smoke tests (requires dev server running)
npm run smoke-test
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Vercel build (runs lint + typecheck + build)
npm run vercel-build
```

### Utility Scripts

```bash
# Repair user data (admin utility)
npm run repair-user

# Verify period key migration
npm run verify:migration:period
```

## Project Structure

```
app/
├── api/                 # API routes (Next.js Route Handlers)
│   ├── auth/           # Authentication endpoints
│   ├── child/          # Child-related endpoints
│   ├── children/       # Children management
│   ├── parent/         # Parent-related endpoints
│   └── dev/            # Development-only endpoints
├── parent/             # Parent routes
│   ├── dashboard/      # Parent dashboard
│   ├── tasks/          # Task management
│   ├── rewards/        # Rewards management
│   ├── approvals/      # Task approvals
│   └── children/       # Children management
├── child/              # Child routes
│   ├── join/           # Child login (code-based)
│   ├── dashboard/      # Child dashboard
│   └── rewards/        # Rewards shop
└── v2/                 # Legacy redirects (v2 → root)

components/
├── ikido/              # IKIDO design system components
├── ui/                 # Base UI components (Radix UI)
├── child/              # Child-specific components
├── navigation/         # Navigation components
└── common/             # Shared components

lib/
├── repositories/       # Data access layer
├── supabase/          # Supabase client configuration
├── auth/              # Authentication helpers
├── utils/             # Utility functions
└── types/             # TypeScript type definitions

scripts/
├── sql/               # SQL migration scripts
├── migrations/        # Applied migrations
└── *.ts               # Utility scripts

store/
└── useSessionStore.ts # Zustand session store

docs/
├── ARCHITECTURE.md    # Architecture documentation
├── MIGRATION_PERIOD_KEY.md  # Migration guide
└── _reference/        # Archived reference files
```

## Authentication Flow

### Parent Authentication

1. Parent registers via `/parent/register` (creates Supabase Auth user)
2. Parent logs in via `/parent/login` (Supabase Auth session)
3. Server-side layout (`app/parent/layout.tsx`) validates session
4. Session stored in cookies and synchronized via `SessionProvider`

### Child Authentication

1. Parent creates child via `/api/children/create` (generates `child_code` + `family_code`)
2. Child logs in via `/child/join` using codes (no Supabase Auth)
3. Backend validates codes via `/api/child/login`
4. Child profile stored in Zustand (localStorage)
5. Client-side hooks (`useRequireChildAuth`) protect child routes

**Key Points:**
- Children do NOT have Supabase Auth users
- Child sessions are stored client-side only (Zustand + localStorage)
- Each child has a unique `child_code` (e.g., `GERONIMO#3842`)
- All children in a family share the same `family_code`

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- **`users`**: Parent and child profiles (role: `parent` or `child`)
- **`tasks`**: Task templates (global and custom)
- **`child_tasks`**: Assigned tasks with status and period tracking
- **`rewards`**: Available rewards with costs
- **`reward_claims`**: Child reward requests and status

**Row Level Security (RLS)**: Enabled on all tables to ensure data isolation between families.

## Testing

### Smoke Tests

Run smoke tests to verify core functionality:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run smoke tests
npm run smoke-test
```

Smoke tests verify:
- API authentication (401 for unauthenticated requests)
- Route accessibility
- Required field validation

## Deployment

### Vercel (Recommended)

The project includes a `vercel-build` script that runs:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`

**Environment Variables**: Set all `.env.local` variables in Vercel dashboard under Project Settings → Environment Variables.

### Other Platforms

Ensure:
- Node.js 18+ runtime
- Environment variables are set
- Build command: `npm run build`
- Start command: `npm start`

## Troubleshooting

### Build Errors

If you see type errors in `.next/types/validator.ts`:
- These are auto-generated by Next.js
- Run `npm run build` to regenerate
- Usually indicates missing routes (can be ignored if routes are intentionally removed)

### Database Connection Issues

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
3. Ensure Supabase project is active and database is accessible

### Authentication Issues

- **Parent login fails**: Check Supabase Auth settings, verify email confirmation if enabled
- **Child login fails**: Verify `child_code` and `family_code` match what was created
- **Session not persisting**: Check browser cookies/localStorage settings

## Contributing

This is a private MVP project. For questions or issues, contact the maintainer.

## License

Private - All rights reserved
