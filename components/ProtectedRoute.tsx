import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/serverClient";
import type { UserRole } from "@/types/supabase";

type ProtectedChildRenderer = (authUser: { profile: { role: UserRole; id: string } }) => ReactNode;

type ProtectedRouteProps = {
  children: ReactNode | ProtectedChildRenderer;
  allowedRoles?: UserRole[];
};

const DEFAULT_ALLOWED_ROLES: UserRole[] = ["Parent", "Child"];

export default async function ProtectedRoute({
  children,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
}: ProtectedRouteProps) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (allowedRoles.includes("Parent")) {
      redirect("/parent/login");
    } else if (allowedRoles.includes("Child")) {
      redirect("/child/join");
    } else {
      redirect("/");
    }
    return null;
  }

  if (typeof children === "function") {
    const metadataRole = session.user.user_metadata?.role;
    const resolvedRole: UserRole =
      metadataRole === "Child" || metadataRole === "Parent"
        ? (metadataRole as UserRole)
        : "Parent";

    return <>{children({ profile: { role: resolvedRole, id: session.user.id } })}</>;
  }

  return <>{children}</>;
}
