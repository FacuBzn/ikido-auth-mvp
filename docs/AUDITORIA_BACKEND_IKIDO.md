# 🔍 AUDITORÍA BACKEND IKIDO — TASKS + GGPOINTS + SUPABASE

**Fecha:** 2025-01-27  
**Auditor:** Technical Lead Senior  
**Objetivo:** Entender arquitectura actual para rediseñar sistema de tareas como "Task Templates + Task Occurrences (1w)"

---

## 📋 RESUMEN EJECUTIVO

El sistema actual de IKIDO maneja tareas como asignaciones únicas (`child_tasks`) sin concepto de periodicidad semanal. Los puntos se gestionan mediante `users.points_balance` (source of truth) y `ggpoints_ledger` (auditoría). Existen **2 endpoints duplicados de aprobación** (`/api/parent/tasks/approve` y `/api/parent/child-tasks/approve`), ambos con CAS para race conditions. El flujo actual no previene duplicación de asignaciones en la misma semana. **Riesgos críticos:** falta de constraint único para evitar asignaciones duplicadas, inconsistencia potencial entre `points_balance` y ledger si falla el insert, y ausencia de `period_key` para agrupar tareas semanales.

---

## A) HIGH-LEVEL ARCHITECTURE

### Stack Tecnológico
- **Framework:** Next.js 14+ (App Router)
- **API Routes:** `app/api/**/route.ts` (POST/GET handlers)
- **Database:** Supabase (PostgreSQL)
- **Auth:**
  - **Parents:** Supabase Auth (JWT cookies, `auth.uid()`)
  - **Children:** Custom JWT cookies (`ikido-child-session`, httpOnly)
- **Clientes Supabase:**
  - `adminClient`: SERVICE_ROLE (bypass RLS) — usado en endpoints child
  - `serverClient`: Row-level client — usado en endpoints parent
- **Repositorios:** `lib/repositories/**` (lógica de negocio aislada)

### Carpetas Relevantes
```
app/api/
├── child/          # Endpoints para niños (cookie session)
│   ├── tasks/      # Listar, completar, stats, paginado
│   ├── points/     # Obtener balance
│   └── rewards/    # Listar, request, claim
├── parent/         # Endpoints para padres (Supabase Auth)
│   ├── tasks/      # Listar, asignar, aprobar, eliminar, custom-create
│   ├── child-tasks/# Listar, aprobar, pending-approval
│   └── rewards/    # CRUD + claims (approve/reject)
└── dev/            # Reset tasks (desarrollo)

lib/
├── repositories/   # Lógica de negocio
│   ├── childTaskRepository.ts
│   ├── taskRepository.ts
│   └── pointsRepository.ts
├── auth/
│   ├── childSession.ts      # JWT cookies para niños
│   └── authHelpers.ts        # getAuthenticatedUser (parents)
└── supabase/
    ├── adminClient.ts        # SERVICE_ROLE singleton
    └── serverClient.ts       # Row-level client
```

---

## B) INVENTARIO DE ENDPOINTS

### Tabla Completa de Endpoints

| Route Path | Método | Auth | Tablas | V1/V2 | Respuesta JSON | Riesgos |
|------------|--------|------|--------|-------|----------------|---------|
| `/api/child/tasks` | POST | Child cookie | `users`, `child_tasks`, `tasks` | V2 | `{ tasks: [...], ggpoints: number }` | Cache: `force-dynamic`. Usa `points_balance` como source of truth ✅ |
| `/api/child/tasks/complete` | POST | Child cookie | `child_tasks` | V2 | `ChildTaskInstance` | No valida duplicación. Cambia `status` a `completed` ✅ |
| `/api/child/tasks/paginated` | POST | Child cookie | `users`, `child_tasks`, `tasks` | V2 | `{ tasks, ggpoints, nextCursor, hasMore, totalCount }` | Optimizado para grandes listas ✅ |
| `/api/child/tasks/stats` | POST | Child cookie | `child_tasks` | V2 | `{ total, pending, completed, approved, totalPoints }` | Stats sin fetch completo ✅ |
| `/api/child/points` | POST | Child cookie | `users` | V2 | `{ ggpoints: number }` | Lee `points_balance` directamente ✅ |
| `/api/child/rewards` | POST | Child cookie | `rewards`, `users` | V2 | `{ rewards: [...], ggpoints: number }` | Fallback a schema básico si PR13 no aplicado ⚠️ |
| `/api/child/rewards/request` | POST | Child cookie | `rewards` | V2 | `{ success, reward }` | Cambia `status` a `requested` ✅ |
| `/api/child/rewards/claim` | POST | Child cookie | `rewards`, `users`, `ggpoints_ledger` | V2 | `{ success, reward, ggpoints, already_claimed? }` | **ATOMIC CAS** para race conditions ✅. Rollback si falla points update ✅ |
| `/api/parent/tasks/list` | GET | Parent (Supabase) | `tasks`, `child_hidden_tasks` | V2 | `{ tasks: [...], total, limit, offset }` | Filtra hidden tasks por childId ✅ |
| `/api/parent/tasks/assign` | POST | Parent (Supabase) | `tasks`, `users`, `child_tasks` | V2 | `ChildTaskInstance[]` | **NO previene duplicación** ⚠️. Valida ownership ✅ |
| `/api/parent/tasks/approve` | POST | Parent (Supabase) | `child_tasks`, `users`, `ggpoints_ledger` | V2 | `{ success, child_task_id, points_earned, ggpoints }` | **CAS + rollback** ✅. Idempotente ✅. **DUPLICADO** con `/api/parent/child-tasks/approve` ⚠️ |
| `/api/parent/tasks/delete` | POST | Parent (Supabase) | `tasks`, `child_hidden_tasks` | V2 | `{ success, action: "hidden"\|"deleted" }` | Global = hide, Custom = delete ✅ |
| `/api/parent/tasks/custom-create-and-assign` | POST | Parent (Supabase) | `tasks`, `child_tasks` | V2 | `{ success, task, childTask?, assigned }` | Rollback si falla asignación ✅ |
| `/api/parent/child-tasks/list` | GET | Parent (Supabase) | `child_tasks`, `tasks` | V2 | `{ data: [...], count }` | Query params: `?child_id=UUID` ✅ |
| `/api/parent/child-tasks/approve` | POST | Parent (Supabase) | `child_tasks`, `users`, `ggpoints_ledger` | V2 | `{ success, child_task_id, points_earned, ggpoints_child }` | **CAS + rollback** ✅. Idempotente ✅. **DUPLICADO** con `/api/parent/tasks/approve` ⚠️ |
| `/api/parent/child-tasks/pending-approval` | GET | Parent (Supabase) | `child_tasks`, `tasks`, `users` | V2 | `{ tasks: [...], child: {...}, ggpoints_child }` | Filtra `status = 'completed'` ✅ |
| `/api/parent/rewards/list` | GET | Parent (Supabase) | `rewards`, `users` | V2 | `{ rewards: [...] }` | Filtra por `child_user_id` ✅ |
| `/api/parent/rewards/create` | POST | Parent (Supabase) | `rewards` | V2 | `{ reward }` | Valida ownership ✅ |
| `/api/parent/rewards/update` | POST | Parent (Supabase) | `rewards` | V2 | `{ reward }` | Solo si `status = 'available'` ✅ |
| `/api/parent/rewards/delete` | POST | Parent (Supabase) | `rewards` | V2 | `{ success }` | Solo si `status = 'available'` ✅ |
| `/api/parent/rewards/claims/list` | GET | Parent (Supabase) | `rewards` | V2 | `{ claims: [...] }` | Filtra `status = 'requested'` ✅ |
| `/api/parent/rewards/claims/approve` | POST | Parent (Supabase) | `rewards`, `users`, `ggpoints_ledger` | V2 | `{ success, reward, ggpoints_child }` | **ATOMIC CAS** ✅. Rollback ✅ |
| `/api/parent/rewards/claims/reject` | POST | Parent (Supabase) | `rewards` | V2 | `{ success, reward }` | Cambia `status` a `rejected` ✅ |

### Endpoints Duplicados Identificados

1. **`/api/parent/tasks/approve`** vs **`/api/parent/child-tasks/approve`**
   - Ambos hacen lo mismo: aprobar `child_task` y sumar puntos
   - Ambos usan CAS + rollback
   - Diferencia: respuesta usa `ggpoints` vs `ggpoints_child`
   - **Recomendación:** Consolidar en uno solo (sugerido: `/api/parent/child-tasks/approve`)

### Endpoints Críticos para Rediseño

- ✅ `/api/parent/tasks/assign` — **Modificar:** agregar `period_key` y validar unique constraint
- ✅ `/api/parent/tasks/approve` — **Modificar:** mantener lógica CAS, agregar validación de `period_key`
- ✅ `/api/child/tasks` — **Modificar:** filtrar por `period_key` (semana actual)
- ✅ `/api/child/tasks/complete` — **Sin cambios** (solo cambia status)
- ✅ `/api/parent/child-tasks/list` — **Modificar:** agregar filtro por `period_key`

---

## C) MODELO DE DATOS (Supabase Schema Inferido)

### Tabla: `users`
```sql
users (
  id: uuid PRIMARY KEY,
  auth_id: uuid | NULL,              -- NULL para children, UUID para parents
  email: text | NULL,                 -- NULL para children
  name: text | NULL,
  role: 'parent' | 'child',
  parent_id: uuid | NULL,             -- FK a users.id (parent)
  parent_auth_id: uuid | NULL,        -- auth.uid() del parent (para RLS)
  child_code: text | NULL,            -- Unique: "GERONIMO#3842"
  family_code: text | NULL,           -- 6 chars: "ABC123"
  points_balance: integer DEFAULT 0,   -- ⚠️ SOURCE OF TRUTH para puntos
  created_at: timestamptz
)
```

**Índices:**
- `idx_users_parent_id` (parent_id)
- `idx_users_child_code` (child_code) — asumido
- `idx_users_family_code` (family_code) — asumido

**Constraints faltantes:**
- ❌ Unique constraint en `(child_code, family_code)` — podría prevenir duplicados

---

### Tabla: `tasks` (Task Templates)
```sql
tasks (
  id: uuid PRIMARY KEY,
  title: text NOT NULL,
  description: text | NULL,
  points: integer NOT NULL CHECK (points >= 0),
  is_global: boolean NOT NULL DEFAULT false,
  created_by_parent_id: uuid | NULL,  -- FK a users.id (NULL si global)
  created_at: timestamptz DEFAULT now()
)
```

**Índices:**
- `idx_tasks_parent` (created_by_parent_id) WHERE created_by_parent_id IS NOT NULL
- `idx_tasks_is_global` (is_global) WHERE is_global = true

**Campos sugeridos para rediseño:**
- ✅ `cadence: 'weekly' | 'daily' | 'one-time'` — default: `'weekly'`
- ✅ `default_points: integer` — puntos por defecto (puede override en assignment)

---

### Tabla: `child_tasks` (Task Occurrences)
```sql
child_tasks (
  id: uuid PRIMARY KEY,
  task_id: uuid NOT NULL,             -- FK a tasks.id
  child_id: uuid NOT NULL,            -- FK a users.id
  parent_id: uuid NOT NULL,            -- FK a users.id (parent)
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected',
  points: integer NOT NULL CHECK (points >= 0),
  assigned_at: timestamptz DEFAULT now(),
  completed_at: timestamptz | NULL,
  approved_at: timestamptz | NULL      -- ⚠️ NO EXISTE en DB real (solo status)
)
```

**Índices actuales:**
- `idx_child_tasks_child` (child_id)
- `idx_child_tasks_parent` (parent_id)
- `idx_child_tasks_status` (status)
- `idx_child_tasks_child_status` (child_id, status)

**Constraints faltantes:**
- ❌ **CRÍTICO:** Unique constraint `(child_id, task_id, period_key)` — previene duplicación semanal
- ❌ Check constraint: `status = 'approved' => approved_at IS NOT NULL` (si se agrega columna)

**Campos sugeridos para rediseño:**
- ✅ `period_key: text NOT NULL` — formato: `"2025-W04"` (ISO week)
- ✅ `assigned_for_date: date` — fecha objetivo de la semana (ej: lunes de la semana)
- ✅ `week_start_date: date` — alternativa a `assigned_for_date` (redundante, elegir uno)
- ✅ `approved_at: timestamptz | NULL` — agregar columna real (actualmente solo existe en types, no en DB)

**Migración sugerida:**
```sql
ALTER TABLE child_tasks
  ADD COLUMN period_key TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN assigned_for_date DATE,
  ADD COLUMN approved_at TIMESTAMPTZ;

-- Backfill: calcular period_key desde assigned_at
UPDATE child_tasks
SET period_key = TO_CHAR(assigned_at, 'IYYY-"W"IW'),
    assigned_for_date = DATE_TRUNC('week', assigned_at)::DATE
WHERE period_key = 'legacy';

-- Unique constraint
CREATE UNIQUE INDEX idx_child_tasks_unique_period
  ON child_tasks (child_id, task_id, period_key)
  WHERE status != 'rejected'; -- Opcional: permitir re-asignación si fue rechazada
```

---

### Tabla: `ggpoints_ledger` (Auditoría de Puntos)
```sql
ggpoints_ledger (
  id: uuid PRIMARY KEY,
  child_id: uuid NOT NULL,            -- FK a users.id
  parent_id: uuid NOT NULL,           -- FK a users.id
  child_task_id: uuid | NULL,         -- FK a child_tasks.id (NULL si es reward claim)
  delta: integer NOT NULL,            -- Positivo (approval) o negativo (claim)
  reason: text | NULL,
  created_at: timestamptz DEFAULT now()
)
```

**Índices:**
- `idx_ledger_child` (child_id)
- `idx_ledger_parent` (parent_id)
- `idx_ledger_parent_child` (parent_id, child_id)

**Riesgos:**
- ⚠️ Insert es "best effort" — si falla, `points_balance` se actualiza pero no hay registro
- ⚠️ No hay constraint que valide `SUM(ledger.delta) = users.points_balance` (reconciliación manual)

---

### Tabla: `rewards`
```sql
rewards (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  cost: integer NOT NULL,
  claimed: boolean DEFAULT false,
  child_user_id: uuid NOT NULL,       -- FK a users.id
  claimed_at: timestamptz | NULL,
  created_at: timestamptz DEFAULT now(),
  -- PR13: Request/Approve flow
  status: 'available' | 'requested' | 'approved' | 'rejected',
  requested_at: timestamptz | NULL,
  approved_at: timestamptz | NULL,
  rejected_at: timestamptz | NULL,
  decided_by_parent_id: uuid | NULL,  -- FK a users.id
  reject_reason: text | NULL
)
```

**Índices:**
- `idx_rewards_status` (status)
- `idx_rewards_child_status` (child_user_id, status)

**Constraints:**
- ✅ Check: `status IN ('available', 'requested', 'approved', 'rejected')`
- ⚠️ Lógica: `status = 'approved' => claimed = true` (no hay constraint DB, solo lógica app)

---

### Tabla: `child_hidden_tasks` (Soft Delete Visual)
```sql
child_hidden_tasks (
  parent_id: uuid NOT NULL,
  child_id: uuid NOT NULL,
  task_id: uuid NOT NULL,
  PRIMARY KEY (parent_id, child_id, task_id)
)
```

**Uso:** Oculta tareas globales para un child específico (no las elimina de `tasks`)

---

## D) FLUJOS END-TO-END

### Flujo 1: Parent Asigna Tarea

```
1. Parent → POST /api/parent/tasks/assign
   Body: { task_id, child_user_id, points? }
   
2. Route Handler:
   - Valida auth (Supabase Auth)
   - Obtiene parent_id desde auth.uid() (NUNCA desde client)
   - Llama: assignTaskToChildren()
   
3. Repository (childTaskRepository.ts):
   - Verifica task existe
   - Valida child pertenece a parent
   - INSERT child_tasks:
     {
       task_id,
       child_id,
       parent_id,
       status: 'pending',
       points: task.points (o override si viene en body)
     }
   
4. ⚠️ PROBLEMA: No valida si ya existe child_task con mismo (child_id, task_id)
   - Permite asignaciones duplicadas
   - No hay period_key para agrupar por semana
   
5. Response: ChildTaskInstance[]
```

**Riesgos:**
- ❌ Duplicación si parent asigna misma tarea 2 veces
- ❌ No hay concepto de "semana" — todas las asignaciones son independientes

---

### Flujo 2: Child Completa Tarea

```
1. Child → POST /api/child/tasks/complete
   Body: { child_task_id }
   
2. Route Handler:
   - Valida child session cookie
   - Llama: markTaskCompleted()
   
3. Repository:
   - Verifica child_task pertenece a child (por child_code + family_code)
   - Valida status != 'completed' && status != 'approved'
   - UPDATE child_tasks:
     SET status = 'completed',
         completed_at = NOW()
     WHERE id = child_task_id
   
4. ⚠️ No suma puntos — parent debe aprobar primero
   
5. Response: ChildTaskInstance (status: 'completed')
```

**Riesgos:**
- ✅ Seguro — solo cambia status
- ⚠️ No valida si task ya estaba completed (pero repository sí lo hace)

---

### Flujo 3: Parent Aprueba Tarea

```
1. Parent → POST /api/parent/tasks/approve (o /api/parent/child-tasks/approve)
   Body: { child_task_id }
   
2. Route Handler:
   - Valida auth
   - Obtiene parent_id desde session
   - Valida ownership (child_task.parent_id === parent_id)
   - Valida status === 'completed' (no pending, no rejected)
   
3. ATOMIC SEQUENCE (CAS):
   
   Step 1: UPDATE child_tasks
     SET status = 'approved'
     WHERE id = child_task_id
       AND status = 'completed'  -- Solo si aún está completed
   
   Step 2: UPDATE users (CAS)
     SET points_balance = points_balance + pointsEarned
     WHERE id = child_id
       AND points_balance = currentPoints  -- CAS
   
   Step 3: INSERT ggpoints_ledger (best effort)
     { child_id, parent_id, delta: +pointsEarned, reason, child_task_id }
   
4. ⚠️ Si Step 2 falla (CAS), hace ROLLBACK de Step 1
   ✅ Si Step 3 falla, continúa (ledger es solo auditoría)
   
5. Response: { success, points_earned, ggpoints: newBalance }
```

**Riesgos:**
- ✅ CAS previene race conditions
- ✅ Rollback si falla points update
- ⚠️ Ledger insert puede fallar silenciosamente (no crítico)
- ⚠️ No valida `period_key` — podría aprobar tarea de semana pasada

---

### Flujo 4: GGPoints Impact

```
Source of Truth: users.points_balance

CRÉDITOS (suman):
- Parent aprueba child_task → +points (via CAS)
- Parent ajuste manual → +delta (via pointsRepository)

DÉBITOS (restan):
- Child claim reward → -cost (via CAS en /api/child/rewards/claim)

AUDITORÍA:
- ggpoints_ledger registra todos los movimientos
- ⚠️ No hay constraint que valide SUM(ledger.delta) = points_balance
```

**Riesgos:**
- ⚠️ Inconsistencia si ledger insert falla (points_balance se actualiza pero no hay registro)
- ⚠️ No hay reconciliación automática

---

### Flujo 5: Rewards Claim

```
1. Child → POST /api/child/rewards/claim
   Body: { reward_id }
   
2. Route Handler:
   - Valida child session
   - Verifica reward.claimed === false
   - Verifica points_balance >= reward.cost
   
3. ATOMIC SEQUENCE:
   
   Step 1: UPDATE rewards
     SET claimed = true, claimed_at = NOW()
     WHERE id = reward_id
       AND claimed = false  -- Previene double-claim
   
   Step 2: UPDATE users (CAS)
     SET points_balance = points_balance - cost
     WHERE id = child_id
       AND points_balance = currentPoints  -- CAS
       AND points_balance >= cost  -- Aún tiene suficiente
   
   Step 3: INSERT ggpoints_ledger (best effort)
     { child_id, parent_id, delta: -cost, reason: "Claimed reward: ..." }
   
4. ⚠️ Si Step 2 falla, hace ROLLBACK de Step 1
   
5. Response: { success, reward, ggpoints: newBalance }
```

**Riesgos:**
- ✅ CAS previene race conditions
- ✅ Rollback si falla points update
- ⚠️ Ledger insert puede fallar silenciosamente

---

### Flujo 6: Refresh GGPoints en UI

```
Child Dashboard:
- POST /api/child/tasks → retorna { tasks, ggpoints }
- POST /api/child/points → retorna { ggpoints }
- POST /api/child/rewards → retorna { rewards, ggpoints }

Parent Dashboard:
- GET /api/parent/child-tasks/pending-approval → retorna { ggpoints_child }
- GET /api/parent/child-tasks/list → no retorna puntos (solo tasks)

⚠️ Todos leen users.points_balance directamente (source of truth)
✅ No hay cálculo en memoria (excepto getTotalPointsForChild que es solo para reconciliación)
```

**Riesgos:**
- ✅ Consistente — todos usan `points_balance`
- ⚠️ No hay cache — cada request hace query a DB (puede ser lento con muchos children)

---

## E) BUGS / RIESGOS ACTUALES DETECTADOS

### Severidad: CRÍTICA 🔴

1. **Duplicación de Asignaciones**
   - **Ubicación:** `app/api/parent/tasks/assign/route.ts` + `lib/repositories/childTaskRepository.ts:assignTaskToChild()`
   - **Problema:** No hay unique constraint `(child_id, task_id, period_key)`
   - **Impacto:** Parent puede asignar misma tarea múltiples veces
   - **Fix sugerido:** Agregar `period_key` y unique constraint

2. **Endpoints Duplicados de Aprobación**
   - **Ubicación:** `/api/parent/tasks/approve` y `/api/parent/child-tasks/approve`
   - **Problema:** Misma lógica en 2 lugares (mantenimiento duplicado)
   - **Impacto:** Confusión sobre cuál usar, posibles inconsistencias
   - **Fix sugerido:** Consolidar en `/api/parent/child-tasks/approve`

3. **Falta de `period_key` para Agrupar Tareas Semanales**
   - **Ubicación:** Schema `child_tasks`
   - **Problema:** No hay forma de agrupar tareas por semana
   - **Impacto:** No se puede implementar "tareas semanales" sin migración
   - **Fix sugerido:** Agregar `period_key: text` y `assigned_for_date: date`

---

### Severidad: ALTA 🟠

4. **Ledger Insert Puede Fallar Silenciosamente**
   - **Ubicación:** `app/api/parent/tasks/approve/route.ts:318-332`
   - **Problema:** Si `ggpoints_ledger.insert()` falla, solo loguea error pero continúa
   - **Impacto:** Auditoría incompleta, difícil reconciliación
   - **Fix sugerido:** Retry con exponential backoff o queue async

5. **No Hay Validación de `period_key` en Aprobación**
   - **Ubicación:** `app/api/parent/tasks/approve/route.ts`
   - **Problema:** Parent puede aprobar tarea de semana pasada
   - **Impacto:** Inconsistencia temporal
   - **Fix sugerido:** Validar `period_key === currentWeek` antes de aprobar

6. **Inconsistencia Potencial: `points_balance` vs `ledger`**
   - **Ubicación:** Todos los endpoints que actualizan puntos
   - **Problema:** No hay constraint que valide `SUM(ledger.delta) = points_balance`
   - **Impacto:** Difícil detectar corrupción de datos
   - **Fix sugerido:** Script de reconciliación periódico o trigger DB

---

### Severidad: MEDIA 🟡

7. **`approved_at` Column No Existe en DB Real**
   - **Ubicación:** `types/supabase.ts:158` vs código real
   - **Problema:** Types dicen que existe, pero queries no la usan (solo `status`)
   - **Impacto:** Confusión, posible error si se intenta usar
   - **Fix sugerido:** Agregar columna real o remover de types

8. **No Hay Índice en `(child_id, task_id, period_key)`**
   - **Ubicación:** Schema `child_tasks`
   - **Problema:** Queries de "tareas de esta semana" serán lentas sin índice
   - **Impacto:** Performance degradada con muchos `child_tasks`
   - **Fix sugerido:** Agregar índice compuesto cuando se agregue `period_key`

9. **Cache: `force-dynamic` en Todos los Endpoints**
   - **Ubicación:** Todos los route handlers
   - **Problema:** No hay cache, cada request hace query a DB
   - **Impacto:** Latencia alta, carga en DB
   - **Fix sugerido:** Cachear `points_balance` con TTL corto (5-10s) o usar SWR

10. **Falta Validación de `points` Range en Assignment Override**
    - **Ubicación:** `app/api/parent/tasks/assign/route.ts:54-74`
    - **Problema:** Valida 1-100, pero no valida si es mayor que `task.points` original
    - **Impacto:** Parent puede asignar más puntos que el template original
    - **Fix sugerido:** Validar `points <= task.points * 1.5` (o similar)

---

### Severidad: BAJA 🟢

11. **Error Messages No Son Consistentes**
    - **Ubicación:** Varios endpoints
    - **Problema:** Algunos usan `ggpoints`, otros `ggpoints_child`
    - **Impacto:** Confusión en frontend
    - **Fix sugerido:** Estandarizar a `ggpoints`

12. **No Hay Paginación en `/api/parent/child-tasks/list`**
    - **Ubicación:** `app/api/parent/child-tasks/list/route.ts`
    - **Problema:** Retorna todas las tasks sin límite
    - **Impacto:** Lento con muchos `child_tasks`
    - **Fix sugerido:** Agregar `limit` y `offset` query params

---

## F) PROPUESTA DE REDISEÑO "CLEAN"

### Arquitectura: Task Templates + Task Occurrences (1w)

**Concepto:**
- **Task Templates** (`tasks`): Definiciones reutilizables (global o custom)
- **Task Occurrences** (`child_tasks`): Instancias semanales asignadas a children
- **Period Key**: `"2025-W04"` (ISO week format) para agrupar por semana

---

### Schema Changes

#### 1. Tabla `tasks` (Task Templates)
```sql
-- Campos nuevos sugeridos:
ALTER TABLE tasks
  ADD COLUMN cadence TEXT DEFAULT 'weekly' CHECK (cadence IN ('weekly', 'daily', 'one-time')),
  ADD COLUMN default_points INTEGER; -- Puntos por defecto (puede override)

-- Ejemplo:
-- { id: '...', title: 'Make bed', cadence: 'weekly', default_points: 10 }
```

#### 2. Tabla `child_tasks` (Task Occurrences)
```sql
-- Campos nuevos:
ALTER TABLE child_tasks
  ADD COLUMN period_key TEXT NOT NULL,           -- "2025-W04"
  ADD COLUMN assigned_for_date DATE NOT NULL,    -- Lunes de la semana
  ADD COLUMN approved_at TIMESTAMPTZ;           -- Agregar columna real

-- Unique constraint (previene duplicación semanal):
CREATE UNIQUE INDEX idx_child_tasks_unique_period
  ON child_tasks (child_id, task_id, period_key)
  WHERE status != 'rejected';

-- Índice para queries semanales:
CREATE INDEX idx_child_tasks_period
  ON child_tasks (child_id, period_key, status);

-- Backfill existente:
UPDATE child_tasks
SET period_key = TO_CHAR(assigned_at, 'IYYY-"W"IW'),
    assigned_for_date = DATE_TRUNC('week', assigned_at)::DATE
WHERE period_key IS NULL;
```

**Ejemplo de Registro:**
```json
{
  "id": "uuid-123",
  "task_id": "task-make-bed",
  "child_id": "child-abc",
  "parent_id": "parent-xyz",
  "period_key": "2025-W04",
  "assigned_for_date": "2025-01-20",  // Lunes de la semana
  "status": "pending",
  "points": 10,
  "assigned_at": "2025-01-20T08:00:00Z"
}
```

---

### Endpoints Modificados / Nuevos

#### 1. `POST /api/parent/tasks/assign` (MODIFICAR)
```typescript
Body: {
  task_id: string,
  child_user_id: string | string[],
  points?: number,
  period_key?: string  // Opcional: default = currentWeek
}

// Lógica:
1. Calcular period_key = body.period_key || getCurrentWeek()
2. Validar unique constraint (child_id, task_id, period_key)
3. Si existe y status != 'rejected', retornar error 409 CONFLICT
4. INSERT child_tasks con period_key y assigned_for_date
```

**Response:**
```json
{
  "child_tasks": [...],
  "period_key": "2025-W04",
  "assigned_for_date": "2025-01-20"
}
```

---

#### 2. `POST /api/parent/child-tasks/approve` (MODIFICAR)
```typescript
// Agregar validación:
1. Validar period_key === currentWeek (o permitir semanas pasadas con flag)
2. Resto de lógica CAS igual
```

---

#### 3. `POST /api/child/tasks` (MODIFICAR)
```typescript
// Filtrar por semana actual:
const currentWeek = getCurrentWeek();
const tasks = await getTasksForChildByCodes({
  childCode,
  familyCode,
  periodKey: currentWeek,  // NUEVO
  supabase
});
```

**Response:** Igual (solo filtra por semana actual)

---

#### 4. `GET /api/parent/child-tasks/list` (MODIFICAR)
```typescript
Query params:
  ?child_id=UUID
  &period_key=2025-W04  // NUEVO (opcional, default = currentWeek)
  &status=pending|completed|approved  // NUEVO (opcional)
```

---

#### 5. `GET /api/child/tasks/weekly` (NUEVO)
```typescript
// Dashboard semanal para child
Body: {
  child_code: string,
  family_code: string,
  week?: string  // "2025-W04", default = currentWeek
}

Response: {
  week: "2025-W04",
  week_start: "2025-01-20",
  tasks: [...],
  stats: {
    total: 5,
    pending: 2,
    completed: 2,
    approved: 1
  },
  ggpoints: 150
}
```

---

### RPC Recomendado en Supabase

**Función: `approve_child_task_with_period_validation`**
```sql
CREATE OR REPLACE FUNCTION approve_child_task_with_period_validation(
  p_child_task_id UUID,
  p_parent_auth_id UUID,
  p_allow_past_weeks BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_child_task RECORD;
  v_parent_id UUID;
  v_current_week TEXT;
  v_task_week TEXT;
  v_points_earned INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 1. Validar parent
  SELECT id INTO v_parent_id
  FROM users
  WHERE auth_id = p_parent_auth_id AND role = 'parent';
  
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Parent not found';
  END IF;
  
  -- 2. Obtener child_task
  SELECT * INTO v_child_task
  FROM child_tasks
  WHERE id = p_child_task_id AND parent_id = v_parent_id;
  
  IF v_child_task IS NULL THEN
    RAISE EXCEPTION 'Child task not found or does not belong to this parent';
  END IF;
  
  -- 3. Validar status
  IF v_child_task.status != 'completed' THEN
    RAISE EXCEPTION 'Task must be completed before approval. Current status: %', v_child_task.status;
  END IF;
  
  -- 4. Validar period_key (si no se permite semanas pasadas)
  IF NOT p_allow_past_weeks THEN
    v_current_week := TO_CHAR(CURRENT_DATE, 'IYYY-"W"IW');
    IF v_child_task.period_key != v_current_week THEN
      RAISE EXCEPTION 'Cannot approve task from past week. Task week: %, Current week: %', 
        v_child_task.period_key, v_current_week;
    END IF;
  END IF;
  
  -- 5. ATOMIC UPDATE (status + points_balance + ledger)
  UPDATE child_tasks
  SET status = 'approved',
      approved_at = NOW()
  WHERE id = p_child_task_id
    AND status = 'completed';  -- CAS: solo si aún está completed
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task was already approved or status changed';
  END IF;
  
  v_points_earned := v_child_task.points;
  
  -- 6. UPDATE points_balance (CAS)
  UPDATE users
  SET points_balance = points_balance + v_points_earned
  WHERE id = v_child_task.child_id
    AND points_balance = (SELECT points_balance FROM users WHERE id = v_child_task.child_id);
  
  IF NOT FOUND THEN
    -- ROLLBACK: revertir status
    UPDATE child_tasks SET status = 'completed' WHERE id = p_child_task_id;
    RAISE EXCEPTION 'Concurrent modification detected. Please try again.';
  END IF;
  
  -- 7. INSERT ledger (best effort)
  INSERT INTO ggpoints_ledger (child_id, parent_id, child_task_id, delta, reason)
  VALUES (
    v_child_task.child_id,
    v_parent_id,
    p_child_task_id,
    v_points_earned,
    'Approved task: ' || (SELECT title FROM tasks WHERE id = v_child_task.task_id)
  );
  
  -- 8. Retornar resultado
  SELECT points_balance INTO v_new_balance
  FROM users
  WHERE id = v_child_task.child_id;
  
  RETURN json_build_object(
    'success', true,
    'child_task_id', p_child_task_id,
    'points_earned', v_points_earned,
    'ggpoints', v_new_balance
  );
END;
$$;
```

**Uso desde endpoint:**
```typescript
const { data, error } = await supabase.rpc(
  'approve_child_task_with_period_validation',
  {
    p_child_task_id: body.child_task_id,
    p_parent_auth_id: authUser.user.id,
    p_allow_past_weeks: false
  }
);
```

---

### Queries Recomendadas para Dashboard Semanal (Child)

```sql
-- 1. Tareas de la semana actual
SELECT ct.*, t.title, t.description
FROM child_tasks ct
JOIN tasks t ON ct.task_id = t.id
WHERE ct.child_id = $1
  AND ct.period_key = TO_CHAR(CURRENT_DATE, 'IYYY-"W"IW')
ORDER BY ct.assigned_for_date, t.title;

-- 2. Stats de la semana
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  SUM(points) FILTER (WHERE status = 'approved') as points_earned
FROM child_tasks
WHERE child_id = $1
  AND period_key = TO_CHAR(CURRENT_DATE, 'IYYY-"W"IW');

-- 3. Historial de semanas (últimas 4)
SELECT
  period_key,
  assigned_for_date,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  SUM(points) FILTER (WHERE status = 'approved') as points_earned
FROM child_tasks
WHERE child_id = $1
  AND period_key >= TO_CHAR(CURRENT_DATE - INTERVAL '4 weeks', 'IYYY-"W"IW')
GROUP BY period_key, assigned_for_date
ORDER BY period_key DESC;
```

---

### Cómo Evitar Duplicación al Asignar en la Misma Semana

**Opción 1: Unique Constraint (Recomendado)**
```sql
CREATE UNIQUE INDEX idx_child_tasks_unique_period
  ON child_tasks (child_id, task_id, period_key)
  WHERE status != 'rejected';
```

**Lógica en endpoint:**
```typescript
try {
  await assignTaskToChild({ ... });
} catch (error) {
  if (error.code === '23505') {  // Unique violation
    // Verificar si ya existe con status != 'rejected'
    const existing = await getChildTaskByPeriod({
      childId,
      taskId,
      periodKey
    });
    
    if (existing && existing.status !== 'rejected') {
      return NextResponse.json(
        { error: 'TASK_ALREADY_ASSIGNED', message: 'This task is already assigned for this week' },
        { status: 409 }
      );
    }
  }
}
```

**Opción 2: Check Before Insert**
```typescript
const existing = await supabase
  .from('child_tasks')
  .select('id, status')
  .eq('child_id', childId)
  .eq('task_id', taskId)
  .eq('period_key', periodKey)
  .maybeSingle();

if (existing && existing.status !== 'rejected') {
  return NextResponse.json(
    { error: 'TASK_ALREADY_ASSIGNED', message: 'This task is already assigned for this week' },
    { status: 409 }
  );
}
```

---

### Backfill / Migración de Registros Existentes

**Script SQL:**
```sql
-- 1. Agregar columnas (si no existen)
ALTER TABLE child_tasks
  ADD COLUMN IF NOT EXISTS period_key TEXT,
  ADD COLUMN IF NOT EXISTS assigned_for_date DATE,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. Backfill desde assigned_at
UPDATE child_tasks
SET
  period_key = TO_CHAR(assigned_at, 'IYYY-"W"IW'),
  assigned_for_date = DATE_TRUNC('week', assigned_at)::DATE
WHERE period_key IS NULL;

-- 3. Marcar approved_at desde status (si status = 'approved' y approved_at IS NULL)
UPDATE child_tasks
SET approved_at = completed_at  -- O assigned_at si completed_at IS NULL
WHERE status = 'approved' AND approved_at IS NULL;

-- 4. Agregar NOT NULL constraint (después de backfill)
ALTER TABLE child_tasks
  ALTER COLUMN period_key SET NOT NULL,
  ALTER COLUMN assigned_for_date SET NOT NULL;

-- 5. Agregar unique constraint
CREATE UNIQUE INDEX idx_child_tasks_unique_period
  ON child_tasks (child_id, task_id, period_key)
  WHERE status != 'rejected';

-- 6. Verificación
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT period_key) as unique_weeks,
  MIN(period_key) as earliest_week,
  MAX(period_key) as latest_week
FROM child_tasks;
```

**Reconciliación de Puntos:**
```sql
-- Verificar consistencia points_balance vs ledger
SELECT
  u.id,
  u.name,
  u.points_balance as current_balance,
  COALESCE(SUM(l.delta), 0) as ledger_sum,
  u.points_balance - COALESCE(SUM(l.delta), 0) as discrepancy
FROM users u
LEFT JOIN ggpoints_ledger l ON u.id = l.child_id
WHERE u.role = 'child'
GROUP BY u.id, u.name, u.points_balance
HAVING u.points_balance != COALESCE(SUM(l.delta), 0);
```

---

## G) CHECKLIST DE IMPLEMENTACIÓN (Plan de PRs)

### PR A: Schema + Indexes + Constraints

**Objetivo:** Agregar `period_key`, `assigned_for_date`, `approved_at` y constraints

**Tareas:**
- [ ] Crear migración SQL: `32-add-period-key-to-child-tasks.sql`
  - Agregar columnas `period_key`, `assigned_for_date`, `approved_at`
  - Backfill desde `assigned_at`
  - Agregar NOT NULL constraints
  - Crear unique index `(child_id, task_id, period_key)`
  - Crear índice compuesto `(child_id, period_key, status)`
- [ ] Actualizar `types/supabase.ts` con nuevos campos
- [ ] Agregar helper function: `getCurrentWeek(): string`
- [ ] Agregar helper function: `getWeekStartDate(periodKey: string): Date`
- [ ] Script de verificación: `scripts/verify-period-key-migration.ts`
- [ ] Tests: Verificar backfill correcto, unique constraint funciona

**Archivos a modificar:**
- `scripts/sql/32-add-period-key-to-child-tasks.sql` (nuevo)
- `types/supabase.ts`
- `lib/utils.ts` (helpers)

**Rollback plan:**
- Remover columnas si hay problemas (solo si no hay datos nuevos)

---

### PR B: Endpoints Assign/List/Complete/Approve con period_key

**Objetivo:** Modificar endpoints para usar `period_key`

**Tareas:**
- [ ] Modificar `POST /api/parent/tasks/assign`
  - Calcular `period_key` = currentWeek (o desde body)
  - Validar unique constraint antes de insert
  - Retornar error 409 si ya existe
- [ ] Modificar `POST /api/parent/child-tasks/approve`
  - Validar `period_key === currentWeek` (o flag para permitir pasadas)
  - Usar RPC `approve_child_task_with_period_validation` (opcional)
- [ ] Modificar `POST /api/child/tasks`
  - Filtrar por `period_key = currentWeek`
- [ ] Modificar `GET /api/parent/child-tasks/list`
  - Agregar query param `period_key` (opcional, default = currentWeek)
  - Agregar query param `status` (opcional)
- [ ] Crear `GET /api/child/tasks/weekly` (nuevo)
  - Dashboard semanal con stats
- [ ] Actualizar `lib/repositories/childTaskRepository.ts`
  - `assignTaskToChild()`: agregar `periodKey` param
  - `getTasksForChildByCodes()`: agregar `periodKey` filter
  - `getTasksForChild()`: agregar `periodKey` filter

**Archivos a modificar:**
- `app/api/parent/tasks/assign/route.ts`
- `app/api/parent/child-tasks/approve/route.ts`
- `app/api/child/tasks/route.ts`
- `app/api/parent/child-tasks/list/route.ts`
- `app/api/child/tasks/weekly/route.ts` (nuevo)
- `lib/repositories/childTaskRepository.ts`
- `lib/utils.ts` (helpers)

**Testing:**
- [ ] Test: Asignar misma tarea 2 veces en misma semana → 409
- [ ] Test: Asignar misma tarea en semanas diferentes → OK
- [ ] Test: Aprobar tarea de semana actual → OK
- [ ] Test: Aprobar tarea de semana pasada → Error (o flag)
- [ ] Test: Child ve solo tareas de semana actual

---

### PR C: UI Changes (Parent Approvals + Child Dashboard Weekly)

**Objetivo:** Actualizar UI para mostrar tareas semanales

**Tareas:**
- [ ] Parent: Modificar componente de asignación
  - Mostrar selector de semana (default = actual)
  - Mostrar error si tarea ya asignada
- [ ] Parent: Modificar componente de aprobaciones
  - Agrupar por semana
  - Mostrar `period_key` en UI
- [ ] Child: Modificar dashboard
  - Mostrar solo tareas de semana actual
  - Agregar selector de semana (ver semanas pasadas)
  - Mostrar stats semanales
- [ ] Child: Agregar componente "Weekly Summary"
  - Tareas completadas esta semana
  - Puntos ganados esta semana
  - Historial de semanas anteriores

**Archivos a modificar:**
- `app/parent/**/*.tsx` (componentes de asignación/aprobación)
- `app/child/**/*.tsx` (dashboard)
- `components/**/*.tsx` (componentes compartidos)

**Testing:**
- [ ] E2E: Parent asigna tarea → aparece en child dashboard
- [ ] E2E: Child completa tarea → aparece en parent approvals
- [ ] E2E: Parent aprueba → puntos se suman correctamente
- [ ] E2E: Cambiar semana en selector → muestra tareas correctas

---

### PR D: Smoke Tests + Concurrencia

**Objetivo:** Validar race conditions y concurrencia

**Tareas:**
- [ ] Test: 2 parents aprueban misma tarea simultáneamente → solo 1 éxito
- [ ] Test: Parent asigna + Child completa simultáneamente → OK
- [ ] Test: Child claim reward + Parent aprueba task simultáneamente → CAS funciona
- [ ] Test: 10 requests concurrentes de approval → solo 1 éxito, resto idempotente
- [ ] Test: Load test con 100 children, 50 tasks cada uno
- [ ] Script: `scripts/smoke-tests-period-key.ts`

**Archivos a crear:**
- `scripts/smoke-tests-period-key.ts`
- `__tests__/api/concurrency.test.ts`

**Testing:**
- [ ] Ejecutar smoke tests en staging
- [ ] Verificar no hay race conditions
- [ ] Verificar performance aceptable (< 200ms p95)

---

### PR E: Data Migration/Backfill + Reconciliación

**Objetivo:** Migrar datos existentes y reconciliar puntos

**Tareas:**
- [ ] Script: `scripts/migration/backfill-period-key.ts`
  - Leer todos `child_tasks` sin `period_key`
  - Calcular desde `assigned_at`
  - Actualizar en batch
- [ ] Script: `scripts/migration/reconcile-points.ts`
  - Comparar `points_balance` vs `SUM(ledger.delta)`
  - Reportar discrepancias
  - Opcional: corregir discrepancias (con confirmación)
- [ ] Script: `scripts/migration/verify-migration.ts`
  - Verificar todos los registros tienen `period_key`
  - Verificar unique constraint no tiene duplicados
  - Verificar índices creados correctamente
- [ ] Documentación: `docs/MIGRATION_PERIOD_KEY.md`
  - Pasos de migración
  - Rollback plan
  - Troubleshooting

**Archivos a crear:**
- `scripts/migration/backfill-period-key.ts`
- `scripts/migration/reconcile-points.ts`
- `scripts/migration/verify-migration.ts`
- `docs/MIGRATION_PERIOD_KEY.md`

**Testing:**
- [ ] Ejecutar en staging con datos de producción (snapshot)
- [ ] Verificar 0 discrepancias en puntos
- [ ] Verificar todos los registros migrados
- [ ] Verificar performance no degradada

---

## TOP 5 CHANGES RECOMMENDED

### 1. 🔴 Agregar `period_key` y Unique Constraint
**Prioridad:** CRÍTICA  
**Impacto:** Previene duplicación, habilita agrupación semanal  
**Esfuerzo:** Medio (migración + backfill)  
**Riesgo:** Bajo (si se hace correctamente con backfill)

### 2. 🟠 Consolidar Endpoints de Aprobación
**Prioridad:** ALTA  
**Impacto:** Reduce duplicación, simplifica mantenimiento  
**Esfuerzo:** Bajo (eliminar uno, actualizar referencias)  
**Riesgo:** Bajo (solo refactor)

### 3. 🟡 Agregar RPC para Aprobación Atómica
**Prioridad:** MEDIA  
**Impacto:** Mejora atomicidad, reduce código duplicado  
**Esfuerzo:** Medio (crear función SQL + actualizar endpoint)  
**Riesgo:** Medio (requiere testing exhaustivo)

### 4. 🟡 Validar `period_key` en Aprobación
**Prioridad:** MEDIA  
**Impacto:** Previene aprobar tareas de semanas pasadas  
**Esfuerzo:** Bajo (agregar validación)  
**Riesgo:** Bajo

### 5. 🟢 Agregar Índices Compuestos para Queries Semanales
**Prioridad:** BAJA  
**Impacto:** Mejora performance de queries semanales  
**Esfuerzo:** Bajo (crear índices)  
**Riesgo:** Bajo (solo índices)

---

## CONCLUSIÓN

El sistema actual es **funcional pero no escalable** para tareas semanales. La falta de `period_key` impide agrupar tareas por semana y previene duplicación. Los endpoints duplicados de aprobación generan confusión. La propuesta de rediseño con `period_key` + unique constraint + validaciones semanales resuelve estos problemas sin romper funcionalidad existente.

**Próximos pasos:**
1. Revisar y aprobar propuesta
2. Crear PR A (Schema)
3. Ejecutar migración en staging
4. Continuar con PRs B-E

---

**Fin del documento de auditoría.**
