import { redirect } from "next/navigation";
import { cache } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getDashboardPathByRole, getLoginPathByRole } from "@/lib/authRoutes";
import { createServerClient } from "@/lib/supabase/serverClient";
import {
  fromDatabaseUserRole,
  isUserRole,
  type Database,
  type UserRole,
} from "@/types/supabase";

const isSessionMissingError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as { message?: string; status?: number };
  return authError.message === "Auth session missing!" || authError.status === 400;
};

export const getServerSession = cache(
  async (): Promise<{ session: Session; user: User } | null> => {
  const supabase = await createServerClient();
    const [
      { data: sessionResult, error: sessionError },
      { data: userResult, error: userError },
    ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

    if (sessionError && !isSessionMissingError(sessionError)) {
      console.error("[auth:getServerSession] Failed to read session", sessionError);
      return null;
    }

    if (userError) {
      if (isSessionMissingError(userError)) {
        return null;
      }
      console.error("[auth:getServerSession] Failed to validate user", userError);
      return null;
    }

    const session = sessionResult.session;
    const user = userResult.user;

    if (!session || !user) {
      return null;
    }

    return { session, user };
  }
);

export type AuthenticatedUser = {
  user: User;
  profile: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    family_code?: string | null; // For parents
    child_code?: string | null; // For children
    points_balance?: number;
  };
};

export const getAuthenticatedUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const authState = await getServerSession();
    if (!authState) {
      return null;
    }

    const { user } = authState;
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, family_code, child_code, points_balance")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[auth:getAuthenticatedUser] Failed to fetch user role", error);
      return null;
    }

    if (!data) {
      return null;
    }

    const metadataRole = isUserRole(user.user_metadata?.role)
      ? user.user_metadata.role
      : fromDatabaseUserRole(user.user_metadata?.role);

    const resolvedRole = fromDatabaseUserRole(data.role) ?? metadataRole;

    if (!resolvedRole) {
      return null;
    }

    return {
      user,
      profile: {
        id: data.id,
        email: data.email ?? user.email ?? "",
        name: data.name,
        role: resolvedRole,
        family_code: data.family_code ?? null,
        child_code: data.child_code ?? null,
        points_balance: data.points_balance ?? 0,
      },
    };
  }
);

export const ensureRoleAccess = async (allowedRoles: UserRole[]) => {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    redirect(getLoginPathByRole(allowedRoles[0] ?? "Parent"));
  }

  if (!allowedRoles.includes(authUser.profile.role)) {
    redirect(getDashboardPathByRole(authUser.profile.role));
  }

  return authUser;
};

export const redirectParentIfNeeded = async () => {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    redirect("/parent/login");
    return;
  }
  if (authUser.profile.role !== "Parent") {
    redirect(getDashboardPathByRole(authUser.profile.role));
    return;
  }
  return authUser;
};

export const redirectChildIfNeeded = async () => {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    redirect("/child/join");
    return;
  }
  if (authUser.profile.role !== "Child") {
    redirect(getDashboardPathByRole(authUser.profile.role));
    return;
  }
  return authUser;
};

export const redirectByRole = async (requiredRole: UserRole) => {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    redirect(getLoginPathByRole(requiredRole));
    return;
  }
  if (authUser.profile.role !== requiredRole) {
    redirect(getDashboardPathByRole(authUser.profile.role));
    return;
  }
  return authUser;
};

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

export const upsertUserProfile = async (
  payload: UserInsert
): Promise<void> => {
  const supabase = await createServerClient();
  const { error } = await supabase.from("users").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
};

