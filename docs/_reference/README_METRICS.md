# Collections de Postman - API de Métricas

## Archivos Disponibles

1. **`iKidO-Metrics.postman_collection.json`** - Collection de Postman con todos los endpoints
2. **`METRICS_API_EXAMPLES.md`** - Ejemplos de uso con curl, JavaScript y Python

---

## Importar en Postman

### Opción 1: Importar desde archivo

1. Abre Postman
2. Click en **Import** (botón superior izquierdo)
3. Selecciona **File** → **Upload Files**
4. Selecciona `iKidO-Metrics.postman_collection.json`
5. Click en **Import**

### Opción 2: Importar desde URL (si está en repo)

1. Abre Postman
2. Click en **Import**
3. Selecciona **Link**
4. Pega la URL del archivo JSON
5. Click en **Import**

---

## Configurar Variables de Entorno

### Crear Environment en Postman

1. Click en el ícono de **Environments** (lado izquierdo)
2. Click en **+** para crear nuevo environment
3. Nombre: `iKidO Local` (o el que prefieras)

### Variables Requeridas

Agrega las siguientes variables:

| Variable | Valor Inicial | Descripción |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | URL base de la API |
| `parent_user_id` | (vacío) | UUID del parent (se obtiene después de login) |
| `today` | (vacío) | Fecha de hoy en formato YYYY-MM-DD |
| `yesterday` | (vacío) | Fecha de ayer en formato YYYY-MM-DD |
| `last_7_days` | (vacío) | Fecha de hace 7 días en formato YYYY-MM-DD |

### Variables Opcionales (para autenticación)

Si usas cookies de sesión manualmente:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `session_cookie` | (vacío) | Cookie de sesión de Supabase Auth |

---

## Autenticación

### Opción 1: Usar Cookies de Sesión (Recomendado)

1. Login como parent en la aplicación web (`http://localhost:3000/parent/login`)
2. Abre DevTools (F12) → Application/Storage → Cookies
3. Busca la cookie de Supabase (ej: `sb-xxx-auth-token`)
4. Copia el valor completo
5. En Postman, agrega un **Header** en cada request:
   - Key: `Cookie`
   - Value: `sb-xxx-auth-token=VALOR_COPIADO`

### Opción 2: Configurar en Collection

1. Selecciona la collection `iKidO Metrics API`
2. Ve a la pestaña **Authorization**
3. Selecciona tipo: **No Auth** (las requests individuales manejan su propia auth)
4. O configura **Bearer Token** si tienes un token JWT

---

## Requests Incluidos

### 1. Track Parent Login
- **Método:** POST
- **Endpoint:** `/api/parent/login/track`
- **Auth:** Requerida (parent session)
- **Body:** `{ "user_id": "uuid" }`
- **Descripción:** Registra un evento de login de parent

### 2. Get Login Metrics - Default
- **Método:** GET
- **Endpoint:** `/api/metrics/logins`
- **Auth:** Requerida (parent session)
- **Query Params:** Ninguno (usa default: últimos 30 días)
- **Descripción:** Obtiene métricas de usuarios únicos

### 3. Get Login Metrics - Custom Range
- **Método:** GET
- **Endpoint:** `/api/metrics/logins?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **Auth:** Requerida (parent session)
- **Query Params:** `from`, `to`
- **Descripción:** Obtiene métricas en rango personalizado

### 4. Get Login Metrics - Last 7 days
- **Método:** GET
- **Endpoint:** `/api/metrics/logins?from={last_7_days}&to={today}`
- **Auth:** Requerida (parent session)
- **Descripción:** Obtiene métricas de últimos 7 días

### 5. Get Login Metrics - Last 24 hours
- **Método:** GET
- **Endpoint:** `/api/metrics/logins?from={yesterday}&to={today}`
- **Auth:** Requerida (parent session)
- **Descripción:** Obtiene métricas de últimas 24 horas

### 6. Get Login Metrics - Without Auth (Test)
- **Método:** GET
- **Endpoint:** `/api/metrics/logins`
- **Auth:** No (test de seguridad)
- **Expected:** 401 Unauthorized

### 7. Get Login Metrics - Invalid Date Format (Test)
- **Método:** GET
- **Endpoint:** `/api/metrics/logins?from=invalid-date&to=2025-01-31`
- **Auth:** Requerida (parent session)
- **Expected:** 400 Bad Request

---

## Ejecutar Requests

### Pasos Básicos

1. **Selecciona el environment** (arriba a la derecha en Postman)
2. **Asegúrate de tener sesión activa** (login en la web primero)
3. **Selecciona un request** de la collection
4. **Click en Send**

### Ejemplo: Obtener Métricas

1. Selecciona `Get Login Metrics - Default`
2. Verifica que `base_url` esté configurado
3. Agrega header `Cookie` con tu sesión (si no está configurada automáticamente)
4. Click en **Send**
5. Revisa la respuesta JSON

---

## Ejemplos de Respuestas

### Success Response (200 OK)

```json
{
  "range": {
    "from": "2024-12-28",
    "to": "2025-01-27"
  },
  "unique_users_total": 150,
  "unique_users_by_day": [
    {
      "date": "2024-12-28",
      "unique_users": 12
    },
    {
      "date": "2025-01-27",
      "unique_users": 8
    }
  ],
  "unique_users_by_role": [
    {
      "role": "child",
      "unique_users": 120
    },
    {
      "role": "parent",
      "unique_users": 30
    }
  ]
}
```

### Error Response (401 Unauthorized)

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "INVALID_INPUT",
  "message": "Date format must be YYYY-MM-DD"
}
```

---

## Troubleshooting

### Error: "Could not get response"
- Verifica que el servidor esté corriendo (`npm run dev`)
- Verifica que `base_url` esté correcto
- Verifica la conexión a internet

### Error: 401 Unauthorized
- Verifica que tengas sesión activa de parent
- Verifica que la cookie de sesión esté presente en los headers
- Intenta hacer login nuevamente en la web

### Error: 500 Database Error
- Verifica que la migración SQL se ejecutó correctamente
- Verifica que la tabla `user_login_events` existe
- Verifica que la función `metrics_unique_logins` existe
- Revisa los logs del servidor

### Métricas retornan 0
- Verifica que hay eventos de login registrados
- Verifica que el rango de fechas es correcto
- Verifica que los logins están siendo trackeados (revisa tabla `user_login_events`)

---

## Próximos Pasos

1. **Importar la collection** en Postman
2. **Configurar variables de entorno**
3. **Hacer login como parent** en la web
4. **Copiar cookie de sesión** a Postman
5. **Ejecutar requests** para probar los endpoints

Para más ejemplos, ver `METRICS_API_EXAMPLES.md`.
