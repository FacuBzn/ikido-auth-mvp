"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: "parent" | "child";
};

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const router = useRouter();
  const parent = useSessionStore((state) => state.parent);
  const child = useSessionStore((state) => state.child);

  useEffect(() => {
    if (requiredRole === "parent" && !parent) {
      router.replace("/parent/login");
      return;
    }
    if (requiredRole === "child" && !child) {
      router.replace("/child/join");
      return;
    }
  }, [parent, child, requiredRole, router]);

  // Don't render children if not authenticated
  if (requiredRole === "parent" && !parent) {
    return null;
  }
  if (requiredRole === "child" && !child) {
    return null;
  }

  return <>{children}</>;
};
