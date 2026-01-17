import type { ReactNode } from "react";

/**
 * V2 Child Layout
 * No server-side auth check - child auth uses Zustand only
 */
export default function V2ChildLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
