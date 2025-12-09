import type { ReactNode } from "react";

/**
 * Parent Layout - NO hace auth check aquí para evitar loops
 * 
 * Las rutas protegidas (dashboard, tasks, children) deben usar
 * el layout en (auth) group o hacer su propio check de auth.
 * 
 * Las rutas públicas (login, register) no requieren auth.
 */
export default function ParentLayout({
  children,
}: {
  children: ReactNode;
}) {
  // No auth check here - prevents redirect loops on login/register
  // Protected routes will handle their own auth via (auth) layout
  return <>{children}</>;
}

