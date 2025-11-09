import { redirect } from "next/navigation";
import { cache } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import {
  fromDatabaseUserRole,
  isUserRole,
  type Database,
  type UserRole,
} from "@/types/supabase";

export const getServerSession = cache(
  async (): Promise<{ session: Session; user: User } | null> => {
  const supabase = await createSupabaseServerComponentClient();
    const [
      { data: sessionResult, error: sessionError },
      { data: userResult, error: userError },
    ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

    if (sessionError) {
      console.error("[auth:getServerSession] Failed to read session", sessionError);
      return null;
    }

    if (userError) {
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
  };
};

export const getAuthenticatedUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const authState = await getServerSession();
    if (!authState) {
      return null;
    }

    const { user } = authState;
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role")
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
      },
    };
  }
);

export const ensureRoleAccess = async (allowedRoles: UserRole[]) => {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    redirect("/login");
  }

  if (!allowedRoles.includes(authUser.profile.role)) {
    redirect(getDashboardPathByRole(authUser.profile.role));
  }

  return authUser;
};

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

export const upsertUserProfile = async (
  payload: UserInsert
): Promise<void> => {
  const supabase = await createSupabaseServerComponentClient();
  const { error } = await supabase.from("users").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
};

