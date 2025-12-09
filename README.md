# Feature: iKidO Auth MVP

Este módulo implementa la funcionalidad de **autenticación y gestión de códigos familiares para parents y children con dashboards diferenciados**.  
Se apoya en Supabase (Auth + Postgres), Next.js y estado global con Zustand.

---

## 1. Tecnologías utilizadas

- Node.js + TypeScript  
- Next.js 16 (App Router)  
- Supabase (Auth + Postgres)  
- TailwindCSS  
- Zustand para estado de sesión  
- Modular architecture (services, repositories, providers, workers)

---

## 2. Estructura relevante del proyecto

```
app/
├─ layout.tsx
├─ page.tsx
├─ api/
│  ├─ auth/signout/route.ts
│  ├─ child/login/route.ts
│  └─ children/create/route.ts
├─ parent/
│  ├─ (auth)/layout.tsx
│  ├─ layout.tsx
│  ├─ login/
│  ├─ register/
│  ├─ dashboard/
│  ├─ tasks/
│  └─ children/
└─ child/
   ├─ layout.tsx
   ├─ join/
   ├─ dashboard/
   └─ rewards/
lib/
├─ repositories/
├─ supabase/
└─ generateFamilyCode.ts
store/
└─ useSessionStore.ts
docs/
└─ ARCHITECTURE.md
```

Cada módulo cumple una responsabilidad específica declarada en el análisis del code review.

---

## 3. Instalación del repositorio

### 3.1. Requisitos previos
- Node.js LTS  
- NPM (se incluye `package-lock.json`)  
- Proyecto Supabase activo (Auth + Postgres)  
- Variables de entorno correctas (archivo `.env.local`)

### 3.2. Instalación
```sh
npm install
```

### 3.3. Migraciones
No requiere Prisma; la base de datos se maneja vía Supabase.

### 3.4. Generación de Prisma Client
No aplica.

---

## 4. Variables de entorno

Crear archivo `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<supabase-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role>" # Solo para scripts de mantenimiento
```

---

## 5. Comandos útiles

Servidor local:
```sh
npm run dev
```

Build:
```sh
npm run build
```

Tests y chequeos:
```sh
npm run lint
npm run typecheck
```

Workers/colas:
No se usan colas en este módulo.

---

## 6. Flujo Operacional de la Feature

1. El landing (`/`) muestra la selección de rol.
2. Parents usan `/parent/register` para alta (Supabase Auth) y `/parent/login` para sesión; el layout `(auth)` valida la sesión server-side.
3. La creación de children se realiza vía `/api/children/create`, generando `child_code` y asociándolo al `family_code` del parent.
4. Children acceden a `/child/join`, envían `child_code` + `family_code` a `/api/child/login`; el backend valida relaciones y retorna perfil para guardar en Zustand.
5. El store `useSessionStore` persiste la sesión (parent o child) y permite `logout` limpiando credenciales, incluyendo sign out en Supabase para parents.
6. `/api/auth/signout` cierra sesión global en Supabase y sincroniza cookies en la respuesta.

---

## 7. Resumen técnico acotado

- Resuelve autenticación y acceso a dashboards diferenciados para parents y children.
- Recibe entradas desde formularios de login/register y códigos familiares/child.
- Devuelve sesiones de Supabase para parents y perfiles normalizados para children.
- Interactúa con Supabase Auth y la tabla `users` en Postgres.
- Involucra módulos `app/api/*`, `app/parent/*`, `app/child/*`, `lib/repositories`, `lib/supabase`, y `store/useSessionStore`.

Fin del README.
