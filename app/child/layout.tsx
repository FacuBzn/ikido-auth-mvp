import type { ReactNode } from "react";

// IMPORTANT: Children do NOT use Supabase Auth
// Auth checking must be done 100% client-side with useRequireChildAuth()
// This layout only wraps children without any auth logic

export default function ChildLayout({ children }: { children: ReactNode }) {
  // No server-side auth check possible for children
  // Client components will handle auth with useRequireChildAuth()
  return <>{children}</>;
}

