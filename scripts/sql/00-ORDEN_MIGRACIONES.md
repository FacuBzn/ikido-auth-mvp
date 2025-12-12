# ORDEN DE EJECUCIÓN DE MIGRACIONES

## ⚠️ IMPORTANTE: Ejecutar en este orden exacto

Ejecuta estos scripts en Supabase SQL Editor en el orden indicado:

### 1. Permitir NULL en auth_id y email
**Archivo:** `scripts/sql/06-allow-null-auth-email.sql`
**Propósito:** Permite que children tengan auth_id y email como NULL
**Ejecutar primero:** ✅

### 2. Agregar columna family_code
**Archivo:** `scripts/sql/07-add-family-code-column.sql`
**Propósito:** Agrega columna family_code y migra datos existentes
**Ejecutar segundo:** ✅

### 3. Política RLS para insert children
**Archivo:** `scripts/sql/08-rls-policy-parent-insert-child.sql`
**Propósito:** Crea política RLS que permite a parents insertar children
**Ejecutar tercero:** ✅

## Verificación post-migración

Después de ejecutar todas las migraciones, ejecuta:

```sql
-- Verificar estructura de tabla
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name IN ('auth_id', 'email', 'family_code');

-- Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Verificar datos migrados
SELECT 
    role,
    COUNT(*) as total,
    COUNT(family_code) as with_family_code,
    COUNT(auth_id) as with_auth_id
FROM public.users
GROUP BY role;
```

## Resultado esperado

- ✅ `auth_id` puede ser NULL
- ✅ `email` puede ser NULL
- ✅ `family_code` existe y está poblado para parents y children existentes
- ✅ Política `parent_can_insert_child` existe y está activa

---

### 4. Tasks & GGPoints schema y reglas

**Archivo:** `scripts/sql/18-tasks-schema.sql`  
**Propósito:** Crear tablas `tasks`, `child_tasks` y `ggpoints_ledger` con índices y seed data de tareas globales.

**Archivo:** `scripts/sql/19-tasks-rls-policies.sql`  
**Propósito:** Definir políticas RLS para `tasks`, `child_tasks` y `ggpoints_ledger` que permiten a padres gestionar sus tareas y asignaciones.

**Archivo:** `scripts/sql/20-approve-task-function.sql`  
**Propósito:** Crear función RPC `approve_child_task_and_add_points` para aprobar tareas y actualizar puntos de forma atómica.

**Orden recomendado (después de las migraciones existentes):**

1. `18-tasks-schema.sql` - Crear tablas e índices
2. `19-tasks-rls-policies.sql` - Habilitar RLS y crear políticas
3. `20-approve-task-function.sql` - Crear función RPC para aprobación atómica

**Verificación post-migración:**

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'child_tasks', 'ggpoints_ledger');

-- Verificar seed data
SELECT COUNT(*) as global_tasks_count
FROM public.tasks
WHERE is_global = true;

-- Verificar función RPC
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'approve_child_task_and_add_points';
```

**Resultado esperado:**

- ✅ Tablas `tasks`, `child_tasks`, `ggpoints_ledger` creadas con índices
- ✅ 8 tareas globales insertadas en `tasks`
- ✅ RLS habilitado en las tres tablas
- ✅ Políticas RLS creadas para padres autenticados
- ✅ Función `approve_child_task_and_add_points` disponible

