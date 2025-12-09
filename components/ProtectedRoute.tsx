import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
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
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
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
    const metadataRole = user.user_metadata?.role;
    const resolvedRole: UserRole =
      metadataRole === "Child" || metadataRole === "Parent"
        ? (metadataRole as UserRole)
        : "Parent";

    return <>{children({ profile: { role: resolvedRole, id: user.id } })}</>;
  }

  return <>{children}</>;
}
