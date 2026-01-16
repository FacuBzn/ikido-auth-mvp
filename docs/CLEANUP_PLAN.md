# Cleanup Plan - Unused Files/Folders

## Baseline Results
- ✅ `npm run lint`: PASSED
- ✅ `npm run typecheck`: PASSED  
- ✅ `npm run build`: PASSED (42 routes)

## FASE 1 - Auditoría Completa

### SAFE DELETE (100% no usado - se puede borrar directo)

1. **`components/AuthForm.tsx`**
   - Evidencia: 0 imports en código activo
   - Riesgo: BAJO

2. **`components/AuthGuard.tsx`**
   - Evidencia: 0 imports (se usa ProtectedRoute en su lugar)
   - Riesgo: BAJO

3. **`components/dashboard-card.tsx`**
   - Evidencia: 0 imports
   - Riesgo: BAJO

4. **`components/reward-card.tsx`**
   - Evidencia: 0 imports (hay `components/ikido/reward-card.tsx` que sí se usa)
   - Riesgo: BAJO

5. **`components/task-card.tsx`**
   - Evidencia: 0 imports
   - Riesgo: BAJO

6. **`components/role-selection.tsx`**
   - Evidencia: 0 imports
   - Riesgo: BAJO

7. **`lib/api/` (carpeta completa)**
   - Evidencia: 0 imports en código activo
   - Riesgo: BAJO

8. **`lib/repositories/mock/`**
   - Evidencia: 0 imports, README.md no existe
   - Riesgo: BAJO

9. **`proxy.ts` (raíz)**
   - Evidencia: No hay middleware.ts que lo use, no está en package.json scripts
   - Riesgo: MEDIO (podría ser usado en futuro, pero no ahora)

### ARCHIVE (probablemente no usado, pero útil como referencia)

1. **`v0-ui/` (carpeta completa)**
   - Evidencia: Solo referenciado en docs/comentarios, no en código activo
   - Acción: Mover a `docs/_reference/v0-ui/`
   - Riesgo: BAJO (es referencia para diseño)

2. **`iKidO-Dev-Tasks-Reset.postman_collection.json`**
   - Evidencia: Archivo de referencia para desarrollo/testing
   - Acción: Mover a `docs/_reference/`
   - Riesgo: BAJO

### DO NOT TOUCH (usado o riesgo alto)

- Todas las rutas en `app/` (V1, V2, legacy) - están activas
- `components/ui/` - usado en V1
- `components/ikido/` - usado en V2
- `components/Header.tsx` - usado en layouts V1
- `components/SessionProvider.tsx` - usado en layout.tsx
- `components/ThemeProvider.tsx` - usado en layout.tsx
- `components/ProtectedRoute.tsx` - usado en parent routes
- `components/navigation/BackButton.tsx` - usado en varios forms
- `components/common/ScrollToTopButton.tsx` - usado en TasksManagement
- `components/child/ChildSummaryCard.tsx` - usado en ChildDashboardClient
- `scripts/` - usado por package.json (repair-user, smoke-test)
- `lib/supabase/` - usado en toda la app
- `lib/repositories/` (excepto mock) - usado en API routes
- `lib/utils.ts` - usado en múltiples lugares
- `lib/authHelpers.ts` - usado en API routes
- `lib/rewards/defaultRewards.ts` - usado en seed endpoints
- `hooks/` - usado en componentes
- `store/` - usado en componentes
- `types/` - usado en toda la app
- `docs/` (excepto migraciones) - documentación viva
- `public/` - assets usados
- `styles/` - estilos usados

## FASE 2 - Ejecución

### Pasos:
1. Crear `docs/_reference/` si no existe
2. Mover `v0-ui/` → `docs/_reference/v0-ui/`
3. Mover `iKidO-Dev-Tasks-Reset.postman_collection.json` → `docs/_reference/`
4. Eliminar archivos SAFE DELETE con `git rm`
5. Verificar imports rotos
6. Ejecutar validaciones
