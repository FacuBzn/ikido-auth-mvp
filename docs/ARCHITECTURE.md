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

- **Auth:** Zustand store (localStorage) + API validation
- **Protection:** Client-side hooks (`useRequireChildAuth`)
- **Session:** No usa Supabase Auth
- **Login:** Via `/api/child/login` con `child_code` + `family_code`

**Rutas principales:**
- `/child/join` - Login con child_code + family_code
- `/child/dashboard` - Dashboard del child
- `/child/rewards` - Premios disponibles

**Layout:** `app/child/layout.tsx` - No hace auth check (solo wrapper)

**Flujo de autenticación:**
1. Child ingresa `child_code` + `family_code` en `/child/join`
2. Frontend valida formato (family_code = 6 chars, child_code >= 3 chars)
3. POST a `/api/child/login` con códigos normalizados (UPPERCASE)
4. Backend valida:
   - Existe parent con `family_code`
   - Existe child con `child_code` asociado a ese parent
5. Si válido, devuelve datos de child + parent
6. Frontend guarda child en Zustand
7. Navega a `/child/dashboard`

**Importante:**
- Children NO tienen Supabase Auth users
- Children son identificados por `child_code` único (ej: `GERONIMO#3842`)
- Parent debe crear el child primero vía `/api/children/create`

Ver documentación completa: [docs/CHILD_LOGIN_FLOW.md](./CHILD_LOGIN_FLOW.md)

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

#### `tasks` (Task Templates)
Task templates disponibles para asignar (globales o custom por padre):
- `id`: UUID
- `title`: string
- `description`: string | null
- `points
`: number
- `is_global`: boolean (true para tareas del sistema, false para custom)
- `created_by_parent_id`: UUID | null (FK a users, NULL para globales)
- `created_at`: timestamp

#### `child_tasks` (Task Instances)
Tareas asignadas a niños específicos:
- `id`: UUID
- `task_id`: UUID (FK a tasks - template)
- `child_id`: UUID (FK a users)
- `parent_id`: UUID (FK a users)
- `status`: enum ('pending', 'in_progress', 'completed', 'approved', 'rejected')
- `points`: number (puede diferir de points
)
- `assigned_at`: timestamp
- `completed_at`: timestamp | null
- `approved_at`: timestamp | null

#### `ggpoints_ledger` (Points History)
Historial de movimientos de puntos por niño:
- `id`: UUID
- `child_id`: UUID (FK a users)
- `parent_id`: UUID (FK a users)
- `child_task_id`: UUID | null (FK a child_tasks)
- `delta`: integer (puede ser positivo o negativo)
- `reason`: string | null
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
Child submits join form con child_code + family_code
  ↓
POST /api/child/login
  ↓
Backend normaliza inputs a UPPERCASE
  ↓
Busca parent por family_code
  ↓
Busca child por child_code + parent_id
  ↓
Valida relación parent-child
  ↓
Devuelve { child, parent }
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

**Importante:**
- Child **NO** usa Supabase Auth
- Validación 100% server-side en `/api/child/login`
- Códigos normalizados a UPPERCASE automáticamente
- Errores específicos: `INVALID_FAMILY_CODE`, `INVALID_CHILD_CODE`

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

## Módulo de Tareas y Puntos (Tasks & GGPoints)

### Arquitectura del Módulo

El módulo de tareas sigue una arquitectura limpia con separación clara de responsabilidades:

```
lib/repositories/
  ├── taskRepository.ts          # Templates (globales y custom)
  ├── childTaskRepository.ts     # Asignaciones a niños
  └── pointsRepository.ts        # Ledger y balance de puntos

app/api/
  ├── parent/
  │   └── tasks/
  │       ├── list/route.ts      # GET - Lista tareas disponibles
  │       ├── assign/route.ts    # POST - Asigna tarea a niños
  │       └── approve/route.ts   # POST - Aprueba y suma puntos
  └── child/
      └── tasks/
          ├── route.ts           # POST - Lista tareas del niño
          └── complete/route.ts  # POST - Marca como completada
```

### Repositorios

#### `taskRepository.ts`
Maneja **task templates** (catálogo de tareas disponibles):
- `getGlobalTasks()` - Tareas del sistema (is_global = true)
- `getParentCustomTasks()` - Tareas custom del padre
- `listAvailableTasksForParent()` - Ambas combinadas
- `createCustomTask()` - Crear tarea custom
- `updateCustomTask()` - Editar tarea custom
- `deleteCustomTask()` - Eliminar tarea custom

#### `childTaskRepository.ts`
Maneja **asignaciones** de tareas a niños:
- `assignTaskToChild()` - Asignar a un niño
- `assignTaskToChildren()` - Asignar a múltiples niños
- `getTasksForChild()` - Tareas de un niño (autenticado)
- `getTasksForChildByCodes()` - Tareas por códigos (admin client)
- `markTaskCompleted()` - Marcar como completada (no suma puntos)
- `updateChildTaskStatus()` - Cambiar estado (approve/reject/etc)

#### `pointsRepository.ts`
Maneja el **ledger de puntos** y balance:
- `approveTaskAndAddPoints()` - Aprueba tarea y suma puntos (ATOMIC via RPC)
- `getPointsHistory()` - Historial de movimientos
- `getPointsBalance()` - Balance actual del niño
- `getFamilyScoreboard()` - Ranking de hijos por puntos
- `addManualPointsAdjustment()` - Ajuste manual de puntos

### Flujos de Negocio

#### Flujo Padre → Hijo

1. **Padre lista tareas disponibles**
   - GET `/api/parent/tasks/list`
   - Retorna: tareas globales + tareas custom del padre

2. **Padre asigna tarea a hijo(s)**
   - POST `/api/parent/tasks/assign`
   - Body: `{ task_id, child_user_id, points? }`
   - Crea entrada en `child_tasks` con status = 'pending'

3. **Hijo ve sus tareas**
   - POST `/api/child/tasks`
   - Body: `{ child_code, family_code }`
   - Usa admin client (SERVICE_ROLE)
   - Retorna: tareas en status 'pending' o 'in_progress'

4. **Hijo marca tarea como completada**
   - POST `/api/child/tasks/complete`
   - Body: `{ child_task_id, child_code, family_code }`
   - Cambia status a 'completed', NO suma puntos

5. **Padre aprueba tarea**
   - POST `/api/parent/tasks/approve`
   - Body: `{ child_task_id }`
   - Ejecuta RPC `approve_child_task_and_add_points`:
     * Cambia status a 'approved'
     * Inserta en `ggpoints_ledger`
     * Actualiza `users.points_balance`

### Seguridad (RLS)

#### Tabla `tasks`
- **SELECT**: Parents autenticados ven globales + sus custom
- **INSERT**: Parents autenticados solo tareas custom (is_global = false)
- **UPDATE/DELETE**: Solo creador (created_by_parent_id)

#### Tabla `child_tasks`
- **SELECT**: Parent solo ve tareas de sus hijos
- **INSERT**: Parent solo asigna a sus hijos
- **UPDATE**: Parent solo modifica tareas de sus hijos
- **Endpoints child**: Usan SERVICE_ROLE (bypass RLS)

#### Tabla `ggpoints_ledger`
- **SELECT**: Parent ve movimientos de sus hijos
- **INSERT**: Solo via RPC o parent autenticado

### Códigos de Error Estándar

```typescript
"INVALID_INPUT"         // Falta parámetro requerido
"UNAUTHORIZED"          // No autenticado o credenciales inválidas
"FORBIDDEN"             // Sin permisos para esta operación
"TASK_NOT_FOUND"        // Template no existe o sin acceso
"CHILD_TASK_NOT_FOUND"  // Asignación no existe o sin acceso
"INVALID_STATUS"        // Estado no válido para operación
"DATABASE_ERROR"        // Error genérico de base de datos
```

### Logs Normalizados

Todos los repositorios y endpoints siguen el patrón:

```typescript
console.log("[tasks:operation] Description", { context });
console.error("[tasks:operation] Error", { code, message });
```

Ejemplos:
- `[tasks:assign] Parent assigning task { parent_id, task_id, child_ids }`
- `[child:tasks] Fetching tasks for child { child_code }`
- `[points:approve] Task approved and points added { child_task_id }`

