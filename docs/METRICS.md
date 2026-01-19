# Métricas de Login - Documentación

## Descripción

Sistema de métricas para trackear logins únicos de usuarios (parents y children). El sistema registra cada evento de login y expone un endpoint para consultar métricas agregadas con deduplicación por `user_id`.

**Acceso UI:** `/metrics` (solo para emails en `METRICS_ADMIN_EMAILS`)

**IMPORTANTE:** Esta ruta NO tiene botones ni links en la aplicación. Solo es accesible escribiendo directamente la URL `/metrics` en el navegador.

---

## Configuración de Acceso

### Variable de Entorno: `METRICS_ADMIN_EMAILS`

**Ubicación:** `.env.local` (o variables de entorno del servidor)

**Formato:** Lista de emails separados por coma (sin espacios)

**Ejemplo:**
```bash
METRICS_ADMIN_EMAILS=facu@email.com,admin@example.com
```

**Comportamiento:**
- Si la variable no está configurada o está vacía → **denegar acceso por defecto** (seguro)
- Solo los emails en la lista pueden acceder a `/metrics`
- Los emails se comparan en lowercase (case-insensitive)
- Si un usuario no autorizado intenta acceder → **404 Not Found** (no expone que la ruta existe)

**Nota:** El endpoint `/api/metrics/logins` sigue protegido por autenticación de parent (independiente de esta allowlist).

---

## Arquitectura

### Tabla: `user_login_events`

Almacena cada evento de login individual. El endpoint de métricas usa `COUNT(DISTINCT user_id)` para calcular usuarios únicos.

**Schema:**
```sql
CREATE TABLE public.user_login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('parent', 'child')),
  source text NOT NULL DEFAULT 'web'
);
```

**Índices:**
- `user_login_events_created_at_idx` - Para queries por rango de fechas
- `user_login_events_user_id_idx` - Para deduplicación
- `user_login_events_role_idx` - Para filtros por rol
- `user_login_events_created_at_role_idx` - Compuesto para queries optimizadas

**RLS:**
- Habilitado pero sin policies para `authenticated`/`anon`
- Solo `service_role` (backend) puede insertar/leer

---

## Tracking de Logins

### Child Login

El tracking se integra automáticamente en `/api/child/login` después de un login exitoso.

**Ubicación:** `app/api/child/login/route.ts`

```typescript
// Después de crear la sesión
await trackLogin({
  userId: child.id,
  role: "child",
  request,
});
```

### Parent Login

Como el login de parent usa Supabase Auth directamente desde el frontend (no hay endpoint `/api/parent/login`), se debe llamar al endpoint de tracking después del login exitoso.

**Endpoint:** `POST /api/parent/login/track`

**Uso desde frontend:**
```typescript
// Después de loginParent() exitoso
await fetch('/api/parent/login/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: parent.id })
});
```

**O desde el componente de login:**
```typescript
// En ParentLoginForm.tsx después de login exitoso
try {
  const { parent, session } = await loginParent({ email, password });
  
  // Track login event
  await fetch('/api/parent/login/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: parent.id })
  }).catch(err => {
    // Non-blocking - no afecta el login
    console.error('Failed to track login:', err);
  });
  
  // Continuar con el flujo normal...
} catch (error) {
  // Handle error
}
```

---

## Endpoint de Métricas

### `GET /api/metrics/logins`

Retorna métricas de usuarios únicos que se loguearon en un rango de fechas.

**Autenticación:** Requiere sesión de parent (Supabase Auth)

**Query Params:**
- `from` (opcional): Fecha inicio en formato `YYYY-MM-DD` (default: 30 días atrás)
- `to` (opcional): Fecha fin en formato `YYYY-MM-DD` (default: hoy)

**Ejemplo de Request:**
```bash
GET /api/metrics/logins?from=2025-01-01&to=2025-01-31
```

**Ejemplo de Response:**
```json
{
  "range": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "unique_users_total": 150,
  "unique_users_by_day": [
    { "date": "2025-01-01", "unique_users": 45 },
    { "date": "2025-01-02", "unique_users": 52 },
    { "date": "2025-01-03", "unique_users": 38 }
  ],
  "unique_users_by_role": [
    { "role": "child", "unique_users": 120 },
    { "role": "parent", "unique_users": 30 }
  ]
}
```

**Códigos de Error:**
- `401 UNAUTHORIZED` - No hay sesión de parent
- `403 FORBIDDEN` - Usuario no es parent
- `400 INVALID_INPUT` - Formato de fecha inválido
- `500 DATABASE_ERROR` - Error al consultar métricas

---

## RPC Function: `metrics_unique_logins`

Función SQL que calcula las métricas agregadas con deduplicación.

**Definición:**
```sql
CREATE OR REPLACE FUNCTION public.metrics_unique_logins(
  from_ts timestamptz,
  to_ts timestamptz
)
RETURNS json
```

**Parámetros:**
- `from_ts`: Timestamp de inicio (inclusivo)
- `to_ts`: Timestamp de fin (exclusivo)

**Retorna:**
```json
{
  "unique_users_total": number,
  "unique_users_by_role": [
    { "role": "parent"|"child", "unique_users": number }
  ],
  "unique_users_by_day": [
    { "date": "YYYY-MM-DD", "unique_users": number }
  ]
}
```

**Nota:** Usa `COUNT(DISTINCT user_id)` para garantizar deduplicación correcta.

---

## Migración SQL

**Archivo:** `scripts/sql/32-user-login-events-table.sql`

**Pasos para aplicar:**
1. Abrir Supabase SQL Editor
2. Ejecutar el contenido del archivo
3. Verificar que la tabla y función se crearon correctamente:
   ```sql
   SELECT COUNT(*) FROM user_login_events;
   SELECT metrics_unique_logins('2025-01-01'::timestamptz, '2025-01-31'::timestamptz);
   ```

---

## Helper: `trackLogin()`

**Ubicación:** `lib/metrics/trackLogin.ts`

**Función:**
```typescript
export async function trackLogin(params: {
  userId: string;
  role: "parent" | "child";
  request?: NextRequest;
  source?: string;
}): Promise<void>
```

**Características:**
- **Non-blocking:** Si falla el insert, no rompe el flujo de login
- **Best-effort:** Loguea errores pero no lanza excepciones
- **Usa adminClient:** Bypassa RLS para insertar eventos

**Ejemplo de uso:**
```typescript
import { trackLogin } from "@/lib/metrics/trackLogin";

// Después de login exitoso
await trackLogin({
  userId: user.id,
  role: "parent",
  request,
  source: "web" // opcional, default: "web"
});
```

---

## Smoke Tests

**Script:** `scripts/smoke-metrics.ts`

**Ejecutar:**
```bash
npm run smoke-metrics
```

**Tests incluidos:**
1. Request sin autenticación → espera `401`
2. Request con query params sin auth → espera `401`
3. Validación de formato de fecha (requiere auth)

**Nota:** Para tests completos con autenticación, se necesita:
1. Servidor dev corriendo: `npm run dev`
2. Login como parent
3. Usar cookie de sesión en las requests

---

## Ejemplos de Uso

### Consultar métricas de últimos 30 días (default)
```bash
curl -X GET "http://localhost:3000/api/metrics/logins" \
  -H "Cookie: sb-access-token=..."
```

### Consultar métricas de enero 2025
```bash
curl -X GET "http://localhost:3000/api/metrics/logins?from=2025-01-01&to=2025-01-31" \
  -H "Cookie: sb-access-token=..."
```

### Desde frontend (React)
```typescript
async function fetchLoginMetrics(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  
  const response = await fetch(`/api/metrics/logins?${params.toString()}`, {
    credentials: 'include' // Incluye cookies de sesión
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }
  
  return response.json();
}

// Uso
const metrics = await fetchLoginMetrics('2025-01-01', '2025-01-31');
console.log(`Total unique users: ${metrics.unique_users_total}`);
```

---

## Notas Importantes

1. **Deduplicación:** El endpoint SIEMPRE usa `COUNT(DISTINCT user_id)`. Si un usuario hace login 10 veces, cuenta como 1 único.

2. **Non-blocking tracking:** Si `trackLogin()` falla (por ejemplo, tabla no existe o error de DB), el login continúa normalmente. Los errores se loguean pero no afectan el flujo.

3. **RLS:** La tabla `user_login_events` solo es accesible desde el backend usando `adminClient`. No hay policies para `authenticated`/`anon`.

4. **Performance:** Los índices están optimizados para queries por rango de fechas y por rol. Para rangos muy grandes (>90 días), considerar agregar paginación.

5. **Parent login tracking:** Como parent usa Supabase Auth directo, el tracking debe hacerse desde el frontend llamando a `/api/parent/login/track` después del login exitoso.

---

## Troubleshooting

### Error: "Table user_login_events does not exist"
**Solución:** Ejecutar la migración SQL `scripts/sql/32-user-login-events-table.sql` en Supabase.

### Error: "Function metrics_unique_logins does not exist"
**Solución:** La función se crea en la misma migración. Verificar que se ejecutó correctamente.

### Métricas retornan 0 usuarios
**Verificar:**
1. Que los logins están siendo trackeados (revisar tabla `user_login_events`)
2. Que el rango de fechas es correcto
3. Que hay eventos en ese rango

### 401 al consultar endpoint
**Solución:** Asegurarse de estar autenticado como parent y que la cookie de sesión se envía en la request.

---

## Próximos Pasos (Opcional)

- [ ] Agregar métricas de `last_24h`, `last_7d`, `last_30d` como campos adicionales
- [ ] Dashboard de métricas en UI de parent
- [ ] Exportar métricas a CSV
- [ ] Alertas cuando hay caídas en logins
- [ ] Métricas de retención (usuarios que volvieron a loguearse)

---

**Última actualización:** 2025-01-27
