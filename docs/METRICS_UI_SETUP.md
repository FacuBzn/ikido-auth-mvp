# Setup de Pantalla de Métricas (UI)

## Resumen

Pantalla interna de métricas accesible solo para emails autorizados en `METRICS_ADMIN_EMAILS`. Implementada en `/metrics` con UI IKIDO mobile-first.

**IMPORTANTE:** Esta ruta NO tiene botones ni links en la aplicación. Solo es accesible escribiendo directamente la URL `/metrics` en el navegador.

---

## Configuración Requerida

### Variable de Entorno

Agregar en `.env.local`:

```bash
METRICS_ADMIN_EMAILS=tu-email@example.com,otro-email@example.com
```

**Formato:**
- Emails separados por coma (sin espacios)
- Case-insensitive (se normalizan a lowercase)
- Si no está configurada o está vacía → **denegar acceso por defecto** (seguro)

---

## Archivos Creados/Modificados

### Nuevos Archivos

1. **`lib/auth/requireMetricsAdmin.ts`**
   - Helper para validar acceso a métricas
   - `requireMetricsAdmin()`: Lanza `notFound()` si no autorizado
   - `isMetricsAdmin()`: Retorna boolean (para render condicional)

2. **`app/metrics/page.tsx`**
   - Server component que protege la ruta
   - Llama `requireMetricsAdmin()` antes de renderizar
   - Si no autorizado → 404

3. **`app/metrics/MetricsClient.tsx`**
   - Client component con UI IKIDO
   - Fetch de `/api/metrics/logins` con cache: "no-store"
   - Filtros de fecha (From/To)
   - Muestra: total, por rol, por día

### Archivos Modificados

1. **`app/parent/dashboard/page.tsx`**
   - ~~Eliminada verificación `isMetricsAdmin()`~~ (ya no necesaria)
   - ~~Eliminada prop `canAccessMetrics`~~ (ya no necesaria)

2. **`app/parent/dashboard/ParentDashboardClient.tsx`**
   - ~~Eliminado card "Login Metrics"~~ (ya no se muestra ningún link/botón)

3. **`docs/METRICS.md`**
   - Agregada sección de configuración de acceso

---

## Flujo de Acceso

### Usuario Autorizado

1. Login como parent con email en `METRICS_ADMIN_EMAILS`
2. Escribir directamente en el navegador: `/metrics`
3. Server component valida acceso → renderiza `MetricsClient`
4. Client component fetch `/api/metrics/logins` → muestra datos

### Usuario NO Autorizado

1. Login como parent con email **NO** en `METRICS_ADMIN_EMAILS`
2. Si intenta acceder directamente a `/metrics`:
   - Server component llama `requireMetricsAdmin()`
   - `requireMetricsAdmin()` detecta email no autorizado
   - Llama `notFound()` → **404 Not Found**
   - No expone que la ruta existe

---

## UI Components Usados

- `TopBar` - Barra superior con botón Back
- `PanelCard` - Cards para secciones
- `PrimaryButton` - Botón "Apply Filter"
- Inputs nativos HTML5 `type="date"` con estilos IKIDO

---

## Características de la UI

### Mobile-First Design
- Layout responsive
- Cards apiladas verticalmente
- Scroll para lista de días

### Estados
- **Loading:** Spinner mientras fetch
- **Error:** Banner rojo con mensaje
- **Empty:** Mensaje cuando no hay data
- **Success:** Muestra métricas organizadas

### Secciones
1. **Date Range Filters:** From/To con botón Apply
2. **Total Unique Users:** Número grande destacado
3. **By Role:** Pills con parent vs child
4. **By Day:** Lista scrolleable con fecha + count

---

## Seguridad

### Server-Side Protection
- ✅ Validación en `page.tsx` (server component)
- ✅ `requireMetricsAdmin()` valida email antes de renderizar
- ✅ Si no autorizado → `notFound()` (404 discreto)

### Client-Side (UI Only)
- ✅ Link solo aparece si `canAccessMetrics === true`
- ⚠️ **Nota:** La protección real es server-side. El link es solo UX.

### Endpoint Protection
- ✅ `/api/metrics/logins` sigue protegido por auth de parent
- ✅ Independiente de `METRICS_ADMIN_EMAILS` (doble capa de seguridad)

---

## Testing

### Caso 1: Usuario Autorizado

1. Configurar `METRICS_ADMIN_EMAILS=tu-email@example.com`
2. Login con ese email
3. Escribir directamente en el navegador: `/metrics`
4. Verificar:
   - ✅ Página carga y muestra métricas
   - ✅ Filtros de fecha funcionan
   - ✅ Botón "Back" navega a `/parent/dashboard`

### Caso 2: Usuario NO Autorizado

1. Configurar `METRICS_ADMIN_EMAILS=otro-email@example.com`
2. Login con email diferente
3. Escribir directamente en el navegador: `/metrics`
4. Verificar:
   - ✅ Acceso directo a `/metrics` → **404**

### Caso 3: Variable No Configurada

1. No configurar `METRICS_ADMIN_EMAILS` (o vacía)
2. Login con cualquier email
3. Escribir directamente en el navegador: `/metrics`
4. Verificar:
   - ✅ Acceso directo → **404**

---

## Troubleshooting

### "404 al acceder a /metrics"
- ✅ Verificar que el email esté en `METRICS_ADMIN_EMAILS`
- ✅ Verificar formato: emails separados por coma, sin espacios
- ✅ Verificar que el email del usuario sea el correcto (revisar en Supabase)

### "Error al cargar métricas"
- ✅ Verificar que la migración SQL se ejecutó (`32-user-login-events-table.sql`)
- ✅ Verificar que hay eventos de login registrados
- ✅ Revisar console del navegador para errores

---

## Próximos Pasos (Opcional)

- [ ] Agregar gráficos (recharts ya está en dependencies)
- [ ] Exportar métricas a CSV
- [ ] Filtros adicionales (por source, por child específico)
- [ ] Comparación de períodos (semana vs semana anterior)

---

**Última actualización:** 2025-01-27
