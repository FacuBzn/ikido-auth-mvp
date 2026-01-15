import type { ReactNode } from "react";
import { Header } from "@/components/Header";

/**
 * Child Layout (V1) - Includes legacy Header
 * 
 * IMPORTANT: Children do NOT use Supabase Auth
 * Auth checking must be done 100% client-side with useRequireChildAuth()
 */
export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

