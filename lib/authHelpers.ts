import { redirect } from "next/navigation";
import { cache } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import type { Database, UserRole } from "@/types/supabase";

export const getServerSession = cache(async (): Promise<Session | null> => {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[auth:getServerSession] Failed to read session", error);
    return null;
  }

  return session;
});

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
    const session = await getServerSession();
    if (!session?.user) {
      return null;
    }

    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("[auth:getAuthenticatedUser] Failed to fetch user role", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      user: session.user,
      profile: {
        id: data.id,
        email: data.email ?? session.user.email ?? "",
        name: data.name,
        role: data.role,
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

