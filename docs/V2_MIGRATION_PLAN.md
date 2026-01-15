# Plan de Migración V2 - UI iKidO

## Resumen

Migración incremental de la UI generada en V0 (`/v0-ui`) hacia la app Next.js existente, usando rutas paralelas `/v2/*` sin afectar las rutas actuales.

## Análisis Inicial

| Aspecto | Valor |
|---------|-------|
| Router | **App Router** (`/app` directory) |
| Framework | Next.js 16 |
| React | 19.2.3 |
| Auth Parent | Supabase Auth + RLS |
| Auth Child | Zustand store (localStorage) + API validation |
| State | Zustand con persistencia |
| V0 Source | `/v0-ui` (READ-ONLY) |

## Estructura Creada

```
app/
└── v2/
    ├── layout.tsx              # Layout base con gradiente IKIDO
    └── playground/
        └── page.tsx            # Playground para validar UI Kit

components/
└── ikido/
    ├── index.ts                # Barrel exports
    ├── buttons.tsx             # PrimaryButton, SecondaryButton, CyanButton
    ├── panel-card.tsx          # PanelCard
    ├── text-input.tsx          # TextInput
    ├── chip-toggle.tsx         # ChipToggle, FilterChipsRow
    └── top-bar.tsx             # TopBar, IkidoLogo, PointsPill

lib/
└── api/
    ├── index.ts                # Barrel exports
    ├── client.ts               # Fetch wrapper con tipos
    ├── parent/
    │   └── auth.ts             # Login/Register mappers
    └── child/
        ├── auth.ts             # Child login API
        ├── tasks.ts            # Tasks API
        └── points.ts           # Points API

styles/
└── ikido-tokens.css            # Design tokens (--ik-*)
```

---

## Plan de Migración por Slices

### Orden de Prioridad

1. **Login Parent** - Flujo crítico, validar auth integration
2. **Login Child** - Segundo flujo de auth
3. **Parent Dashboard** - Vista principal post-login
4. **Child Dashboard** - Vista principal para niños
5. **Rewards** - Feature secundaria
6. **Activity/History** - Feature terciaria

---

## Slice 1: Parent Login (`/v2/parent/login`)

### Archivos a crear

```
app/v2/parent/
├── layout.tsx                   # Layout parent (sin auth check)
└── login/
    ├── page.tsx                 # Server component wrapper
    └── ParentLoginForm.tsx      # Client form component
```

### Checklist

- [ ] **UI States**
  - [ ] Default state (form vacío)
  - [ ] Loading state (spinner en botón)
  - [ ] Error state (credenciales inválidas)
  - [ ] Success state (redirect a dashboard)
- [ ] **Auth Integration**
  - [ ] Conectar con `loginParent()` de Supabase
  - [ ] Actualizar Zustand store via `setParent()`
  - [ ] Delay 150ms antes de navegar
  - [ ] `router.refresh()` después de navigate
- [ ] **Validación**
  - [ ] Email format validation
  - [ ] Password required
  - [ ] Show API error messages
- [ ] **UX**
  - [ ] Link a "Create account" (`/v2/parent/register`)
  - [ ] Link a "Child login" (`/v2/child/join`)

### Componentes iKidO usados

- `PanelCard` - Container principal
- `TextInput` - Email y password
- `PrimaryButton` - Submit
- `IkidoLogo` - Header

---

## Slice 2: Child Login (`/v2/child/join`)

### Archivos a crear

```
app/v2/child/
├── layout.tsx                   # Layout child (sin auth check server)
└── join/
    ├── page.tsx
    └── ChildJoinForm.tsx
```

### Checklist

- [ ] **UI States**
  - [ ] Default (form vacío)
  - [ ] Loading
  - [ ] Error: `INVALID_FAMILY_CODE`
  - [ ] Error: `INVALID_CHILD_CODE`
  - [ ] Success → redirect `/v2/child/dashboard`
- [ ] **Auth Integration**
  - [ ] POST `/api/child/login`
  - [ ] Códigos normalizados UPPERCASE
  - [ ] `setChild()` en Zustand
  - [ ] Delay 120ms antes de navegar
- [ ] **Validación**
  - [ ] `family_code` = 6 caracteres
  - [ ] `child_code` >= 3 caracteres
- [ ] **UX**
  - [ ] Helper text explicando códigos
  - [ ] Link a "Parent login"

### Componentes iKidO usados

- `PanelCard`
- `TextInput` x2
- `PrimaryButton`
- `IkidoLogo`

---

## Slice 3: Parent Dashboard (`/v2/parent/dashboard`)

### Archivos a crear

```
app/v2/parent/
└── dashboard/
    ├── page.tsx                 # Server: auth check + redirect
    └── ParentDashboardClient.tsx
```

### Checklist

- [ ] **UI States**
  - [ ] Loading (hydration Zustand)
  - [ ] Empty state (sin children)
  - [ ] Default state (con children)
  - [ ] Error state (API fail)
- [ ] **Auth**
  - [ ] Server-side auth check en `page.tsx`
  - [ ] `useRequireParentAuth()` como fallback
- [ ] **Data Fetching**
  - [ ] Lista de children
  - [ ] Family code display
  - [ ] Tasks pendientes de aprobación
- [ ] **Actions**
  - [ ] Navigate to Tasks
  - [ ] Navigate to Children management
  - [ ] Logout

### Componentes iKidO usados

- `TopBar` (con logout)
- `PanelCard`
- `StatCard` (stats)
- `ListRow` (children list)
- `PrimaryButton`, `SecondaryButton`

---

## Slice 4: Child Dashboard (`/v2/child/dashboard`)

### Archivos a crear

```
app/v2/child/
└── dashboard/
    ├── page.tsx
    └── ChildDashboardClient.tsx
```

### Checklist

- [ ] **UI States**
  - [ ] Loading (hydration)
  - [ ] Empty (sin tareas asignadas)
  - [ ] Default (con tareas)
  - [ ] Error
- [ ] **Auth**
  - [ ] `useRequireChildAuth()` hook
  - [ ] Redirect a `/v2/child/join` si no auth
- [ ] **Data Fetching**
  - [ ] GET `/api/child/tasks`
  - [ ] GET `/api/child/points`
- [ ] **Actions**
  - [ ] Marcar tarea como completada
  - [ ] Navigate to Rewards
  - [ ] Logout

### Componentes iKidO usados

- `TopBar` (con `coins`)
- `PanelCard`
- Task cards (crear nuevo componente)
- `PrimaryButton`

---

## Slice 5: Rewards (`/v2/child/rewards`)

### Archivos a crear

```
app/v2/child/
└── rewards/
    ├── page.tsx
    └── ChildRewardsClient.tsx
```

### Checklist

- [ ] **UI States**
  - [ ] Loading
  - [ ] Empty (sin rewards disponibles)
  - [ ] Default (grid de rewards)
  - [ ] Can't afford state (grayed out)
- [ ] **Auth**
  - [ ] `useRequireChildAuth()`
- [ ] **Data**
  - [ ] Lista de rewards
  - [ ] Points balance
- [ ] **Actions**
  - [ ] Claim reward (if points sufficient)

### Componentes iKidO usados

- `TopBar`
- `RewardCard` (migrar de V0)
- `PointsPill`

---

## Slice 6: Activity History (`/v2/parent/activity`)

### Archivos a crear

```
app/v2/parent/
└── activity/
    ├── page.tsx
    └── ActivityClient.tsx
```

### Checklist

- [ ] **UI States**
  - [ ] Loading
  - [ ] Empty
  - [ ] Default (lista de actividad)
  - [ ] Filtered (por child)
- [ ] **Auth**
  - [ ] Server-side check
- [ ] **Data**
  - [ ] Activity history (points ledger)
  - [ ] Child selector
- [ ] **Filters**
  - [ ] By child
  - [ ] By type (earned/spent)

### Componentes iKidO usados

- `TopBar`
- `ChildSelector` (migrar de V0)
- `FilterChipsRow`
- `ListRow`

---

## Componentes Pendientes de Migrar

Desde `/v0-ui/components/ikido/`:

| Componente | Prioridad | Slice |
|------------|-----------|-------|
| `avatar.tsx` | Media | Dashboard |
| `stat-card.tsx` | Alta | Dashboard |
| `reward-card.tsx` | Alta | Rewards |
| `list-row.tsx` | Alta | Dashboard/Activity |
| `child-selector.tsx` | Media | Activity |
| `mobile-screen-shell.tsx` | Baja | Opcional |

---

## Plan de PRs

### PR 1: Foundation ✅ COMPLETADO

**Archivos:**
- `styles/ikido-tokens.css`
- `components/ikido/*`
- `lib/api/*`
- `app/v2/layout.tsx`
- `app/v2/playground/page.tsx`
- `app/globals.css` (import tokens)
- `docs/V2_MIGRATION_PLAN.md`

**Validación:**
1. `npm run dev`
2. Navegar a `/v2/playground`
3. Verificar todos los componentes renderizan correctamente

---

### PR 2: Parent Login ✅ COMPLETADO

**Archivos creados:**
- `app/v2/parent/layout.tsx` - Layout wrapper
- `app/v2/parent/login/page.tsx` - Server component
- `app/v2/parent/login/ParentLoginForm.tsx` - Client form con UI IKIDO
- `app/v2/parent/dashboard/page.tsx` - Placeholder con auth check
- `app/v2/parent/dashboard/ParentDashboardPlaceholder.tsx` - UI placeholder
- `app/v2/parent/register/page.tsx` - Placeholder "Coming Soon"

**Patrón de auth reutilizado:**
- `loginParent()` de `lib/repositories/parentRepository.ts`
- `createBrowserClient()` de Supabase SSR
- `setParent()` en Zustand store
- Delay 150ms + `router.push()` + `router.refresh()`

**Validación:**
1. `npm run dev`
2. Navegar a `/v2/parent/login`
3. Login con credenciales válidas → redirect a `/v2/parent/dashboard`
4. Login con credenciales inválidas → error message en panel
5. Loading state visible durante submit
6. Link "Create one now" → `/v2/parent/register` (placeholder)

---

### PR 3: Child Login ✅ COMPLETADO

**Archivos creados:**
- `app/v2/child/layout.tsx` - Layout wrapper
- `app/v2/child/join/page.tsx` - Server component
- `app/v2/child/join/ChildJoinForm.tsx` - Client form con UI IKIDO
- `app/v2/child/dashboard/page.tsx` - Dashboard placeholder
- `app/v2/child/dashboard/ChildDashboardClient.tsx` - Client con auth guard Zustand

**Patrón de auth reutilizado:**
- `POST /api/child/login` con `child_code` only
- `setChild()` en Zustand store (persist localStorage)
- No Supabase Auth para children
- Client-side guard via `hasHydrated` + `child` check

**Validación:**
1. Join con código válido → redirect a `/v2/child/dashboard`
2. Código inválido → error "Invalid child code..."
3. Código muy corto (<3 chars) → error client-side
4. Dashboard sin auth → redirect a `/v2/child/join`
5. Logout → limpia store y redirect a join

---

### PR 4: Parent Dashboard ✅ COMPLETADO (Hardened)

**Archivos creados/modificados:**
- `app/v2/parent/dashboard/page.tsx` - Server component con data fetching
- `app/v2/parent/dashboard/ParentDashboardClient.tsx` - Client UI completa IKIDO
- `app/v2/parent/tasks/page.tsx` - Placeholder con auth check
- `app/v2/parent/children/[childId]/activity/page.tsx` - Placeholder con auth check
- (Eliminado) `ParentDashboardPlaceholder.tsx` - Ya no necesario

**Origen de datos (mismo que V1):**
- `supabase.auth.getUser()` → auth check
- `supabase.from("users").eq("auth_id", user.id)` → parent data
- `supabase.from("users").eq("parent_id", parent.id)` → children list
- `POST /api/children/create` → agregar child

**Acciones implementadas:**
- Copy Family Code → navigator.clipboard + feedback "Copied!"
- Copy Child Code → navigator.clipboard + feedback "Copied!"
- Logout → useSessionStore.logout() + redirect
- Add Child → inline form + POST API
- Go to Tasks → /v2/parent/tasks (placeholder)
- Child Tasks → /v2/parent/tasks?childId=... (placeholder)
- Child Activity → /v2/parent/children/[id]/activity (placeholder)

**Validación:**
1. Auth check funciona (redirect a login si no auth)
2. Lista children carga correctamente (0, 1, N children)
3. Family Code con Copy funciona
4. Add Child funciona
5. Child cards con Tasks/Activity buttons navegan correctamente
6. Logout funciona
7. Scroll funciona con 5+ children

---

### PR 5: Child Dashboard ✅ COMPLETADO

**Archivos creados/modificados:**
- `app/v2/child/dashboard/ChildDashboardClient.tsx` - Dashboard completo con tasks y puntos
- `app/v2/child/rewards/page.tsx` - Placeholder con auth guard
- `components/ikido/top-bar.tsx` - Añadido prop `loading` a PointsPill

**Origen de datos (mismo que V1 - `app/child/dashboard/ChildDashboardClient.tsx`):**
- `POST /api/child/tasks` → lista de tasks + ggpoints
- `POST /api/child/points` → ggpoints actualizados
- `POST /api/child/tasks/complete` → marcar task completado

**Flujo implementado:**
1. Auth guard client-side con Zustand + hydration check
2. Fetch tasks y points al montar
3. Renderizar welcome card + points display
4. Lista de tasks separada: pending primero, completed después
5. Botón "Complete" con optimistic UI + refetch
6. Feedback "+X GGPoints earned!" animado
7. Navegación a Rewards (placeholder)
8. Refresh manual de datos

**Validación:**
1. ✅ Auth redirect funciona (no child → /v2/child/join)
2. ✅ Tasks cargan correctamente
3. ✅ Points balance visible en header y card
4. ✅ Complete task funciona con feedback
5. ✅ Empty state cuando no hay tasks
6. ✅ Loading state mientras carga
7. ✅ Error state si API falla

---

### PR 6: Rewards ✅ COMPLETADO (Hardened in 6.1)

**Archivos creados:**
- `app/api/child/rewards/route.ts` - Endpoint lista rewards + ggpoints
- `app/api/child/rewards/claim/route.ts` - Endpoint claim reward (deducir puntos)
- `app/v2/child/rewards/page.tsx` - Página funcional con shop completo
- `components/ikido/reward-card.tsx` - Componente RewardCard IKIDO
- `components/ikido/index.ts` - Actualizado con export de RewardCard

**Origen de datos:**
- Tabla `rewards` de Supabase (id, name, cost, claimed, child_user_id, claimed_at)
- Tabla `ggpoints_ledger` para deducir puntos al claim

**Endpoints creados:**
- `POST /api/child/rewards` → `{ rewards[], ggpoints }`
- `POST /api/child/rewards/claim` → `{ success, reward, ggpoints }`

**Flujo implementado:**
1. Auth guard client-side con Zustand
2. Fetch rewards y ggpoints al montar
3. Grid 2x2 de RewardCards (available primero, claimed después)
4. Indicador "Not enough" si puntos insuficientes
5. Click en reward habilitado → Modal de confirmación IKIDO
6. Confirm claim → optimistic update + API call + refetch
7. Success feedback animado
8. Error handling con revert de optimistic update

**Validación:**
1. ✅ Auth redirect funciona
2. ✅ Rewards cargan correctamente
3. ✅ Points balance visible
4. ✅ Claim funciona (modal + deducción)
5. ✅ Empty state cuando no hay rewards
6. ✅ "Not enough" cuando puntos insuficientes
7. ✅ Loading/error states

---

### PR 7: Parent Activity History ✅ COMPLETADO

**Archivos creados:**
- `app/v2/parent/children/[childId]/activity/page.tsx` - Server component con validación
- `app/v2/parent/children/[childId]/activity/ChildActivityClient.tsx` - Client UI con filtros

**Origen de datos:**
- `users` → child info + points_balance
- `child_tasks` + `tasks` → tasks completed/approved/pending
- `rewards` → rewards claimed

**Queries usadas:**
- `users.eq("id", childId).eq("parent_id", parentId)` → validar ownership
- `child_tasks.eq("child_id", childId).select("*, task:tasks(*)")` → tasks con título
- `rewards.eq("child_user_id", childId).eq("claimed", true)` → rewards reclamados

**Flujo implementado:**
1. Server-side auth check (getAuthenticatedUser)
2. Validar parent record exists
3. Validar childId pertenece al parent (404 si no)
4. Fetch tasks + rewards
5. Normalizar a ActivityEvent[]
6. Ordenar por fecha desc
7. Client component con filtros

**Filtros (client-side):**
- All: todos los eventos
- Tasks: completed + approved
- Pending: tasks pendientes
- Rewards: rewards reclamados

**UI Features:**
- Child summary card (nombre + balance)
- Filter chips con contadores
- Lista scrolleable de eventos
- Cada evento: ícono, título, subtitle, points delta (+/-), status badge, fecha
- Empty states por filtro

**Validación:**
1. ✅ Auth check funciona
2. ✅ 404 si child no pertenece al parent
3. ✅ Lista eventos carga correctamente
4. ✅ Filtros funcionan
5. ✅ Empty state cuando no hay eventos

---

### PR 8: Parent Manage Tasks ✅ COMPLETADO

**Archivos creados:**
- `app/v2/parent/tasks/page.tsx` - Server component con auth + fetch children
- `app/v2/parent/tasks/ParentTasksClient.tsx` - Client UI con selector, lists, acciones

**Endpoints V1 reutilizados:**
- `GET /api/parent/tasks/list?childId=...&limit=...` → task templates disponibles
- `GET /api/parent/child-tasks/list?child_id=...` → tasks asignadas al child
- `POST /api/parent/tasks/assign` → asignar task a child
- `POST /api/parent/tasks/delete` → eliminar asignación

**Flujo implementado:**
1. Server-side auth check
2. Fetch children list para selector
3. Child selector con dropdown scrolleable (no chips)
4. Sección "Tasks for {child}": pending/completed separados
5. Sección "Assign Task": lista templates con botón Assign
6. Sección "Create Custom Task": form inline (link a V1 por limitación)
7. Botón Refresh para refetch manual
8. Delete task assignment con confirmación

**UI Features:**
- Child selector dropdown escalable (N hijos)
- Status badges: Pending (amarillo), Completed (cyan), Approved (verde)
- Task cards con título, descripción, puntos
- URL sync con ?childId para deep linking
- Empty states por sección

**Validación:**
1. ✅ Auth check funciona
2. ✅ Child selector funciona con N hijos
3. ✅ Tasks asignadas cargan correctamente
4. ✅ Assign task funciona
5. ✅ Delete assignment funciona
6. ✅ Status se actualiza tras refresh
7. ✅ URL sync con childId
8. ✅ Custom task creation funciona

---

### PR 8.2: Custom Task Creation ✅ COMPLETADO

**Endpoint nuevo:**
- `POST /api/parent/tasks/custom-create-and-assign`

**Body:**
```json
{
  "childId": "uuid",
  "title": "string",
  "points": 10,
  "description": "optional string"
}
```

**Tablas usadas:**
1. `tasks` - INSERT con:
   - `title`: string
   - `description`: string | null
   - `points`: number (1-100)
   - `is_global`: false (custom)
   - `created_by_parent_id`: parent internal ID

2. `child_tasks` - INSERT con:
   - `task_id`: UUID del task creado
   - `child_id`: childId del request
   - `parent_id`: parent internal ID
   - `status`: "pending"
   - `points`: hereda del task

**Validaciones server-side:**
- Parent autenticado (getAuthenticatedUser)
- Child pertenece al parent (ownership check)
- Title no vacío
- Points entre 1-100

**Rollback:**
- Si falla INSERT en child_tasks, se elimina el task template creado

**UI actualizada:**
- Eliminado link/workaround a V1
- Form funcional: title, description, points
- On success: refetch de assigned + templates

**Validación:**
1. ✅ Create custom task funciona
2. ✅ Task aparece en "Tasks for {child}"
3. ✅ Child puede completar la task
4. ✅ Parent ve status actualizado tras refresh

---

### PR 9: Role Select (Entrypoint) ✅ COMPLETADO

**Archivos creados:**
- `app/v2/page.tsx` - Server component con landing V2
- `app/v2/ChildContinueCard.tsx` - Client component para detectar child session

**Funcionalidades:**
- Header IKIDO con logo
- Título "Choose your role"
- 2 role cards (Parent + Child) con CTAs
- UX inteligente:
  - Si parent session (server): muestra "Continue as Parent"
  - Si child en Zustand (client): muestra "Continue as Child"
- Divider dinámico cuando hay sesión activa

**Arquitectura:**
- Server component principal detecta parent session via `getServerSession()`
- Client subcomponent `ChildContinueCard` lee Zustand store
- Hydration handling para evitar SSR mismatch

**Validación:**
1. ✅ Sin sesiones: muestra solo 2 role cards
2. ✅ Con parent session: muestra "Continue as Parent" + divider
3. ✅ Con child session: muestra "Continue as Child" (tras hydration)
4. ✅ CTAs navegan correctamente

---

### PR 10: Cleanup Links V1 ✅ COMPLETADO

**Objetivo:**
Eliminar links dispersos a V1 y centralizar acceso legacy.

**Links eliminados de:**
- `app/v2/child/dashboard/ChildDashboardClient.tsx` - "/child/dashboard"
- `app/v2/child/rewards/page.tsx` - "/child/rewards"
- `app/v2/parent/dashboard/ParentDashboardClient.tsx` - "/parent/dashboard"
- `app/v2/parent/tasks/ParentTasksClient.tsx` - "/parent/tasks"
- `app/v2/parent/register/page.tsx` - "/parent/register" (cambiado a back to login)

**Link Legacy centralizado:**
- Ubicación: `/v2` (role select page)
- Texto: "Use Legacy Version (V1)"
- Destino: `/` (root V1)
- Estilo: discreto (opacity 60%, hover visible)

**Navegación V2 verificada:**
- `/v2` → login/join
- `/v2/parent/dashboard` → tasks, activity
- `/v2/parent/tasks` → back dashboard
- `/v2/child/dashboard` → rewards
- `/v2/child/rewards` → back dashboard
- `/v2/parent/children/[childId]/activity` → back dashboard

**Validación:**
1. ✅ grep "href=\"/parent/" = 0 matches en /app/v2
2. ✅ grep "href=\"/child/" = 0 matches en /app/v2
3. ✅ Link legacy único en /v2
4. ✅ Build OK

---

### PR 11: V2 Default Entrypoint ✅ COMPLETADO

**Objetivo:**
Hacer V2 el default y crear landing legacy para V1.

**Archivos modificados:**
- `app/page.tsx` - Redirect "/" → "/v2"
- `app/v2/page.tsx` - Link legacy apunta a "/legacy"

**Archivos creados:**
- `app/legacy/page.tsx` - Landing para acceso V1

**Rutas resultantes:**
| Ruta | Comportamiento |
|------|----------------|
| `/` | Redirect → `/v2` |
| `/v2` | Role select V2 (nuevo default) |
| `/legacy` | Landing con accesos V1 |
| `/parent/*` | V1 parent routes (sin cambios) |
| `/child/*` | V1 child routes (sin cambios) |

**Legacy page incluye:**
- Parent: Login, Dashboard, Tasks
- Child: Join, Dashboard, Rewards
- Back to V2 button
- Notice: "V1 maintained for compatibility"

**Validación:**
1. ✅ "/" redirige a "/v2"
2. ✅ "/legacy" muestra accesos V1
3. ✅ Link en /v2 apunta a "/legacy"
4. ✅ Build OK (34 páginas)

---

### PR 12: Production Readiness ✅ COMPLETADO

#### A) Seguridad (must-have) ✅

| Endpoint | Auth | Ownership | Errors |
|----------|------|-----------|--------|
| `/api/child/rewards` | `requireChildSession` | Via `session.child_id` filter | 401/500 |
| `/api/child/rewards/claim` | `requireChildSession` | Explicit check `reward.child_user_id === session.child_id` | 401/403/404/400/500 |
| `/api/parent/tasks/custom-create-and-assign` | `getAuthenticatedUser` + role check | `child.parent_id === parent.id` | 401/403/400/500 |

#### B) Consistencia de datos (must-have) ✅

**Rewards claim (atomic + idempotent + CAS):**
1. ✅ UPDATE reward WHERE claimed=false (prevents double-claim)
2. ✅ UPDATE users SET points_balance with Compare-And-Swap (CAS):
   - `.eq("points_balance", currentPoints)` - only if unchanged
   - `.gte("points_balance", cost)` - still have enough
   - If CAS fails: refetch balance, retry 1 time
3. ✅ Ledger insert ONLY if both updates succeed
4. ✅ Rollback reward.claimed if points update fails or CAS exhausted
5. ✅ Returns `already_claimed: true` for idempotent handling
6. ✅ Returns 409 CONCURRENT_MODIFICATION if retries exhausted

**GGPoints consistency (users.points_balance as source of truth):**
| Endpoint | Source | Status |
|----------|--------|--------|
| `/api/child/points` | `users.points_balance` | ✅ Aligned |
| `/api/child/tasks` (ggpoints field) | `users.points_balance` | ✅ Aligned |
| `/api/child/rewards` | `users.points_balance` | ✅ Aligned |
| `/api/child/rewards/claim` | `users.points_balance` (write) | ✅ Aligned |
| `/api/parent/tasks/approve` | RPC updates `points_balance` | ✅ Aligned |
| `getTotalPointsForChild()` | Calculates from child_tasks | ⚠️ Reconciliation only |

**Custom-create-and-assign:**
1. ✅ Rollback: deletes task template if child_tasks insert fails
2. ✅ Logs with operation tags for debugging

#### C) Caching/refresh (must-have) ✅

**API Routes (dynamic):**
- `app/api/child/rewards/route.ts` - Added `dynamic = "force-dynamic"`
- `app/api/child/rewards/claim/route.ts` - Added `dynamic = "force-dynamic"`
- `app/api/parent/tasks/custom-create-and-assign/route.ts` - Already had `dynamic`

**Server Pages (dynamic):**
- `app/v2/parent/dashboard/page.tsx` - ✅ `dynamic = "force-dynamic"`
- `app/v2/parent/tasks/page.tsx` - ✅ `dynamic = "force-dynamic"`
- `app/v2/parent/children/[childId]/activity/page.tsx` - ✅ `dynamic = "force-dynamic"`

**Client Fetches (no-store):**
- `ParentTasksClient.tsx` - Added `cache: "no-store"` to GET requests

#### D) Smoke Tests ✅

**Script:** `scripts/smoke-tests.ts`

**Run:** `npm run smoke-test` (requires dev server running)

**Tests included:**
- API: 401 for unauthenticated requests (rewards, claim, custom-create, tasks/list)
- API: 400/401 for missing required fields
- Pages: /v2 loads (200)
- Pages: / redirects to /v2 (307/308)
- Pages: /legacy loads (200)

#### E) Comandos de Validación

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Build
npm run build

# Smoke tests (requires dev server in another terminal)
npm run dev &
npm run smoke-test
```

---

## Notas Importantes

### No modificar:
- ❌ `/v0-ui/*` - Source of truth para diseño
- ❌ `/app/parent/*` - Rutas actuales
- ❌ `/app/child/*` - Rutas actuales
- ❌ `/app/api/*` - API routes existentes

### Crear wrappers si falta algo:
- ✅ `/lib/api/*` - Wrappers para endpoints existentes

### Testing manual entre PRs:
1. Rutas v1 siguen funcionando
2. Auth flows no se rompen
3. Zustand store compatible

---

## Timeline Sugerido

Cada PR debería poder completarse de forma independiente. El orden está diseñado para:

1. **Validar foundation** (playground) antes de empezar features
2. **Auth flows primero** - Son prerequisitos para dashboards
3. **Dashboards** - Core de la app
4. **Features secundarias** - Rewards, Activity

---

## Rollback Strategy

Si algo falla en V2:
1. Las rutas v1 siguen funcionando
2. Simplemente no linkear a `/v2/*` en producción
3. Feature flag opcional: `USE_V2_UI=true`

---

## PR13: Parent Task Approval Flow

### Objetivo
Implementar flujo completo de aprobación de tareas por el parent, donde:
- Child completa tarea (status: "completed")
- Parent aprueba tarea (status: "approved", puntos acreditados)
- Points solo se acreditan al aprobar, NO al completar

### Schema child_tasks
```
status: "pending" | "in_progress" | "completed" | "approved" | "rejected"
approved_at: timestamp | null
```

### Endpoints Creados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/parent/child-tasks/pending-approval` | GET | Lista tareas completadas pendientes de aprobación |
| `/api/parent/child-tasks/approve` | POST | Aprueba tarea y acredita puntos con CAS |

### Flujo de Approval (CAS + Idempotente)
```
1. Validar auth (parent) + ownership (child belongs to parent)
2. Si ya está approved → return 200 { already_approved: true }
3. Si no está completed → return 400 INVALID_STATUS
4. UPDATE child_tasks SET status='approved' WHERE status='completed'
   - Si 0 rows → race condition, return idempotente
5. UPDATE users.points_balance con CAS + 1 retry
   - CAS fail → rollback child_tasks, retry o return 409
6. INSERT ggpoints_ledger (best effort)
7. Return { success, points_earned, ggpoints_child }
```

### UI Creada

| Ruta | Descripción |
|------|-------------|
| `/v2/parent/approvals` | Página para aprobar tareas por hijo |
| `/v2/parent/dashboard` | Link a "Approve Tasks" agregado |

### Child Dashboard Updates
- **Auto-refresh**: visibilitychange + focus events
- **Status badges**:
  - `○ Pending` - Tarea por hacer
  - `⏳ Waiting Approval` - Completada, esperando parent
  - `✓ Approved` - Aprobada, puntos acreditados

### /api/child/tasks Response
```typescript
{
  tasks: [{
    child_task_id: string,
    status: "pending" | "completed" | "approved" | ...,
    // ... otros campos
  }],
  ggpoints: number // desde users.points_balance
}
```

### Smoke Tests Agregados
```
✅ pending-approval: 401 without auth
✅ child-tasks/approve: 401 without auth
✅ tasks/approve: 401 without auth
✅ tasks/approve: 400/401 without body
```

### Archivos Creados/Modificados
```
app/api/parent/child-tasks/pending-approval/route.ts  (NEW)
app/api/parent/child-tasks/approve/route.ts           (NEW)
app/api/parent/tasks/approve/route.ts                 (IMPROVED: idempotent, CAS, ggpoints)
app/api/child/tasks/route.ts                          (status field)
app/v2/parent/approvals/page.tsx                      (NEW)
app/v2/parent/approvals/ApprovalsClient.tsx           (NEW)
app/v2/parent/tasks/ParentTasksClient.tsx             (Approve button integrated)
app/v2/parent/dashboard/ParentDashboardClient.tsx     (link added)
app/v2/child/dashboard/ChildDashboardClient.tsx       (auto-refresh, badges)
scripts/smoke-tests.ts                                (new tests)
```

### UI: Approve desde /v2/parent/tasks

La pantalla de "Manage Tasks" ahora muestra tres secciones:
1. **Pending** - Tareas asignadas aún no completadas
2. **⏳ Awaiting Approval** - Tareas completadas por el niño, con botón "Approve"
3. **✓ Approved** - Tareas aprobadas (puntos ya acreditados)

Al hacer click en "Approve":
- Se llama a `POST /api/parent/tasks/approve`
- Se muestra feedback "+X GGPoints granted"
- La tarea se mueve a la sección "Approved"
- El balance del niño se actualiza en tiempo real

### Validación
```bash
npm run lint      # ✅
npm run typecheck # ✅
npm run build     # ✅ 41 routes
npm run smoke-test # (con dev server)
```

### Test Manual del Flujo Completo
```
1. Parent: Asignar tarea a child desde /v2/parent/tasks
2. Child: Completar tarea desde /v2/child/dashboard
   - La tarea aparece como "⏳ Waiting Approval"
   - GGPoints NO aumentan aún
3. Parent: Ver tarea en "Awaiting Approval" en /v2/parent/tasks
4. Parent: Click "Approve"
   - Mensaje "+X GGPoints granted"
   - Tarea se mueve a "Approved"
5. Child: Refrescar /v2/child/dashboard
   - GGPoints ahora reflejan el nuevo balance
   - Tarea aparece como "✓ Approved"
```

---

## PR13: Parent Rewards Admin + Approve Claims

### Resumen del Flujo
El flujo de rewards ahora requiere aprobación del padre:
1. **Parent** crea rewards para el child desde `/v2/parent/rewards`
2. **Child** ve rewards disponibles en `/v2/child/rewards` y hace click "Request"
3. **Parent** ve claims pendientes en la pestaña "Claims" y puede Approve/Reject
4. Si aprueba: se deducen puntos del child y el reward queda como "claimed"
5. Si rechaza: el child puede volver a solicitar

### Schema Migration (Supabase)
Archivo: `docs/supabase/PR13_rewards_status_migration.sql`

Nuevas columnas en tabla `rewards`:
- `status`: 'available' | 'requested' | 'approved' | 'rejected'
- `requested_at`: timestamp cuando el niño solicita
- `approved_at`: timestamp cuando el padre aprueba
- `rejected_at`: timestamp cuando el padre rechaza
- `decided_by_parent_id`: UUID del padre que decidió
- `reject_reason`: razón opcional del rechazo

Reglas de consistencia:
- `status='available'` => `claimed=false`
- `status='requested'` => `claimed=false`
- `status='approved'` => `claimed=true`, `claimed_at` NOT NULL
- `status='rejected'` => `claimed=false`

### Endpoints Nuevos

#### Child Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/child/rewards/request` | Solicita canjear un reward (NO deduce puntos) |

#### Parent Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parent/rewards/list?child_id=` | Lista rewards de un child |
| POST | `/api/parent/rewards/create` | Crea reward para un child |
| POST | `/api/parent/rewards/update` | Edita un reward |
| POST | `/api/parent/rewards/delete` | Elimina un reward |
| GET | `/api/parent/rewards/claims/list?child_id=` | Lista claims pendientes |
| POST | `/api/parent/rewards/claims/approve` | Aprueba claim (deduce puntos) |
| POST | `/api/parent/rewards/claims/reject` | Rechaza claim |

### Seguridad
- Todos los endpoints parent requieren `getAuthenticatedUser()` con `role=Parent`
- Ownership validation: child debe pertenecer al parent
- Approve usa CAS (Compare-And-Swap) con 1 retry para evitar race conditions
- Rollback automático si falla la deducción de puntos
- Idempotencia: aprobar un claim ya aprobado retorna success sin duplicar

### Archivos Creados/Modificados
```
docs/supabase/PR13_rewards_status_migration.sql     (NEW)
types/supabase.ts                                   (UPDATED: rewards type)

# Child Endpoints
app/api/child/rewards/route.ts                      (UPDATED: status fields)
app/api/child/rewards/request/route.ts              (NEW)

# Parent Endpoints
app/api/parent/rewards/list/route.ts                (NEW)
app/api/parent/rewards/create/route.ts              (NEW)
app/api/parent/rewards/update/route.ts              (NEW)
app/api/parent/rewards/delete/route.ts              (NEW)
app/api/parent/rewards/claims/list/route.ts         (NEW)
app/api/parent/rewards/claims/approve/route.ts      (NEW)
app/api/parent/rewards/claims/reject/route.ts       (NEW)

# UI Parent
app/v2/parent/rewards/page.tsx                      (NEW)
app/v2/parent/rewards/ParentRewardsClient.tsx       (NEW)
app/v2/parent/dashboard/ParentDashboardClient.tsx   (UPDATED: link to rewards)

# UI Child
app/v2/child/rewards/page.tsx                       (REWRITTEN: Request flow)

# Tests
scripts/smoke-tests.ts                              (UPDATED: new tests)
```

### UI Parent Rewards (`/v2/parent/rewards`)

**Features:**
- Selector de child (dropdown scrolleable)
- Muestra GGPoints del child seleccionado
- Tabs: "Rewards" y "Claims" (con badge de pendientes)

**Tab Rewards:**
- Lista de rewards con status badges
- Botón "+ New" para crear
- Botones Edit/Delete por reward
- No se puede editar cost si status != 'available'
- No se puede eliminar si status = 'requested' o 'approved'

**Tab Claims:**
- Lista de rewards con status 'requested'
- Botones Approve / Reject por claim
- Al aprobar: deduce puntos, actualiza UI, muestra feedback

### UI Child Rewards (`/v2/child/rewards`)

**Cambios:**
- Botón cambia de "Claim" a "Request"
- Modal de confirmación explica que parent debe aprobar
- Secciones separadas por status:
  - Available: pueden solicitar
  - Awaiting Approval: ya solicitados
  - Rejected: pueden re-solicitar
  - Claimed: ya aprobados

### Smoke Tests
```
✅ /api/parent/rewards/list: 401 without auth
✅ /api/parent/rewards/claims/list: 401 without auth
✅ /api/parent/rewards/claims/approve: 401 without auth
✅ /api/child/rewards/request: 401 without session
```

### Test Manual
```
1. Parent: Ir a /v2/parent/rewards
2. Parent: Seleccionar child y crear reward "Ice Cream" por 50 GG
3. Child: Ir a /v2/child/rewards
   - Ver "Ice Cream" disponible
   - Click "Request" -> Confirmar
   - Reward aparece en "Awaiting Approval"
4. Parent: Ir a tab "Claims"
   - Ver "Ice Cream" con botones Approve/Reject
   - Click "Approve"
   - Mensaje "-50 GG approved"
5. Child: Refresh /v2/child/rewards
   - GGPoints bajaron 50
   - "Ice Cream" aparece en "Claimed"
```

### Validación
```bash
npm run lint      # ✅
npm run typecheck # ✅
npm run build     # ✅
```
