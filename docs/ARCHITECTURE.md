# Arquitectura del Proyecto iKidO

## Stack Técnico

- **Next.js 16** (App Router)
- **React 19**
- **Supabase** (Auth + Database)
- **Zustand** (State Management)
- **TypeScript**

## Estructura de Rutas

### Parent Routes (`/parent/*`)

- **Auth:** Supabase Auth + RLS
- **Protection:** Server Component layout con redirect
- **Session:** Sincronizada por SessionProvider

**Rutas principales:**
- `/parent/login` - Login de parent
- `/parent/register` - Registro de parent
- `/parent/dashboard` - Dashboard principal
- `/parent/tasks` - Gestión de tareas
- `/parent/children` - Gestión de children

**Layout:** `app/parent/layout.tsx` - Hace auth check server-side

### Child Routes (`/child/*`)

- **Auth:** Zustand store (localStorage)
- **Protection:** Client-side hooks (`useRequireChildAuth`)
- **Session:** No usa Supabase Auth

**Rutas principales:**
- `/child/join` - Join con family code
- `/child/dashboard` - Dashboard del child
- `/child/rewards` - Premios disponibles

**Layout:** `app/child/layout.tsx` - No hace auth check (solo wrapper)

## Estado Global

### Zustand Store

**Ubicación:** `store/useSessionStore.ts`

- **Parent session** (cuando usa Supabase Auth)
- **Child session** (cuando join con family code)
- **Persisted** en localStorage
- **Hydration flag** (`_hasHydrated`) para evitar FOUC

**Estructura:**
```typescript
{
  parent: Parent | null;
  child: Child | null;
  _hasHydrated: boolean;
  setParent: (parent: Parent) => void;
  setChild: (child: Child) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}
```

## Base de Datos

### Tabla `users`

Almacena tanto parents como children en una sola tabla.

**Campos principales:**
- `id`: UUID (primary key)
- `auth_id`: UUID (referencia a Supabase Auth)
- `email`: string
- `name`: string | null
- `role`: 'parent' | 'child'
- `parent_id`: UUID | null (Foreign key para children)
- `child_code`: string | null (Family code para parents, child code para children)
- `points_balance`: number
- `created_at`: timestamp

**Índices:**
- `idx_users_auth_id` - Para lookups por auth_id
- `idx_users_parent_id` - Para búsquedas de children por parent
- `idx_users_child_code` - Para búsquedas por family code
- `idx_users_role` - Para queries por rol

### Tablas Relacionadas

#### `tasks`
- `id`: UUID
- `title`: string
- `description`: string | null
- `points`: number
- `child_user_id`: UUID (FK a users)
- `completed`: boolean
- `completed_at`: timestamp | null
- `created_at`: timestamp

#### `rewards`
- `id`: UUID
- `name`: string
- `cost`: number
- `claimed`: boolean
- `child_user_id`: UUID (FK a users)
- `claimed_at`: timestamp | null
- `created_at`: timestamp

## Autenticación

### Parent Auth Flow

1. Usuario registra/login con email y password
2. Supabase Auth crea sesión
3. `SessionProvider` sincroniza con Zustand store
4. Layout valida sesión en cada request server-side
5. Si no hay sesión, redirect a `/parent/login`

### Child Auth Flow

1. Child ingresa family code y nombre
2. Sistema busca parent por family code
3. Si child existe en users table, lo retorna
4. Si no existe, error (parent debe crear el child primero)
5. Session guardada en Zustand store (localStorage)
6. Client hooks validan sesión en cada componente

## Componentes Clave

### SessionProvider

**Ubicación:** `components/SessionProvider.tsx`

- Hidrata Zustand store desde Supabase session
- Escucha cambios de auth state
- Previene loops de re-render con refs y flags
- Sincroniza parent profile automáticamente

### ProtectedRoute

**Ubicación:** `components/ProtectedRoute.tsx`

- Wrapper Server Component para rutas protegidas
- Valida auth y pasa user data como prop
- Usado cuando se necesita `parent.id` para queries

### Hooks

- `useRequireParentAuth()` - Redirige a login si no hay parent
- `useRequireChildAuth()` - Redirige a join si no hay child

## Flujo de Navegación

### Login Flow

```
User submits login form
  ↓
loginParent() crea sesión Supabase
  ↓
setParent() actualiza Zustand
  ↓
Delay 150ms (sincronización)
  ↓
router.push("/parent/dashboard")
  ↓
router.refresh() (force Server Component re-fetch)
  ↓
Layout valida auth server-side
  ↓
Dashboard renderiza
```

### Child Join Flow

```
Child submits join form
  ↓
joinChild() busca parent por family code
  ↓
Busca child en users table
  ↓
setChild() actualiza Zustand
  ↓
Delay 120ms (sincronización)
  ↓
router.push("/child/dashboard")
  ↓
Loader muestra mientras Zustand hidrata
  ↓
useRequireChildAuth() valida
  ↓
Dashboard renderiza
```

## Mejores Prácticas

1. **Server Components** para auth checks cuando sea posible
2. **Client Components** solo cuando se necesita interactividad
3. **Layouts anidados** para proteger grupos de rutas
4. **Loaders** mientras Zustand hidrata para evitar FOUC
5. **Delay pequeño** después de setState antes de navegar
6. **router.refresh()** solo cuando destino es Server Component

## Migraciones

### Consolidación de Children

Anteriormente existían dos sistemas:
- Tabla `children` (legacy)
- Tabla `users` con `role="child"`

**Decisión:** Consolidar todo en `users` table.

**Scripts de migración:**
- `scripts/migration/01-backup-children.sql`
- `scripts/migration/02-migrate-children-to-users.sql`
- `scripts/migration/03-create-indexes.sql`
- `scripts/migration/04-drop-children-table.sql`

