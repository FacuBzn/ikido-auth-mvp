import type { ReactNode } from "react";
import { ensureRoleAccess, type AuthenticatedUser } from "@/lib/authHelpers";
import type { UserRole } from "@/types/supabase";

type ProtectedRouteProps = {
  children: ReactNode | ((authUser: AuthenticatedUser) => ReactNode);
  allowedRoles?: UserRole[];
};

const DEFAULT_ALLOWED_ROLES: UserRole[] = ["Parent", "Child"];

export default async function ProtectedRoute({
  children,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
}: ProtectedRouteProps) {
  const authUser = await ensureRoleAccess(allowedRoles);

  if (typeof children === "function") {
    return <>{children(authUser)}</>;
  }

  return <>{children}</>;
}

