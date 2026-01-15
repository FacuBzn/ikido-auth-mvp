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

### PR 7: Activity (Opcional)

**Archivos:**
- `app/v2/parent/activity/*`
- `components/ikido/child-selector.tsx`

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
