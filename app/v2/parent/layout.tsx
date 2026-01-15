import type { ReactNode } from "react";

/**
 * V2 Parent Layout
 * No server-side auth check here - login page needs to be accessible
 */
export default function V2ParentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
