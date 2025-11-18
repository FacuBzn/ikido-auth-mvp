"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore, selectProfile, selectSession } from "@/store/useSessionStore";
import { getDashboardPathByRole, getLoginPathByRole } from "@/lib/authRoutes";
import type { UserRole } from "@/types/supabase";

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
};

export const AuthGuard = ({ children, allowedRoles, redirectTo }: AuthGuardProps) => {
  const router = useRouter();
  const session = useSessionStore(selectSession);
  const profile = useSessionStore(selectProfile);

  useEffect(() => {
    if (!session || !profile) {
      const loginPath = redirectTo || getLoginPathByRole(allowedRoles[0] ?? "Parent");
      router.push(loginPath);
      return;
    }

    if (!allowedRoles.includes(profile.role)) {
      router.push(getDashboardPathByRole(profile.role));
      return;
    }
  }, [session, profile, allowedRoles, redirectTo, router]);

  if (!session || !profile) {
    return null;
  }

  if (!allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
};

