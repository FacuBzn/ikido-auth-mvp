import type { ReactNode } from "react";

/**
 * V2 Layout - Base layout for new UI migration
 * Applies iKidO gradient background and contains shared UI elements
 */
export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen ik-bg-gradient ik-stars">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
