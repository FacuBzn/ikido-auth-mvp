import type { ReactNode } from "react";
import { Header } from "@/components/Header";

/**
 * Parent Layout (V1) - Includes legacy Header
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
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

