import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServerClient";
import type { UserRole } from "@/types/supabase";

type ProtectedRouteProps = {
  children: ReactNode | ((authUser: any) => ReactNode);
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

  // For now, just check if there's a session
  // In the future, we can add more sophisticated role checking
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

  // For MVP, we'll use a simple check
  // In production, you'd want to check the actual role from the database
  if (typeof children === "function") {
    // For now, pass a simple object
    return <>{children({ profile: { role: "Parent" } })}</>;
  }

  return <>{children}</>;
}
