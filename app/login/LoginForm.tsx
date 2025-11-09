"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm, type AuthFormValues } from "@/components/AuthForm";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { useSessionStore } from "@/store/useSessionStore";
import type { SessionProfile } from "@/store/useSessionStore";
import { fromDatabaseUserRole, isUserRole } from "@/types/supabase";

export const LoginForm = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthState = useSessionStore((state) => state.setAuthState);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const handleLogin = async ({ email, password }: AuthFormValues) => {
    setServerError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setServerError(error.message);
      throw error;
    }

    const [{ data: sessionResult, error: sessionError }, { data: userResult, error: userError }] =
      await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

    if (sessionError) {
      setServerError(sessionError.message);
      throw sessionError;
    }

    if (userError) {
      setServerError(userError.message);
      throw userError;
    }

    const session = sessionResult.session;
    const authenticatedUser = userResult.user;

    if (!session || !authenticatedUser) {
      const fallback = new Error("No session was created. Please try again.");
      setServerError(fallback.message);
      throw fallback;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", authenticatedUser.id)
      .maybeSingle();

    if (profileError) {
      setServerError(profileError.message);
      throw profileError;
    }

    const profileRole = fromDatabaseUserRole(profileData?.role) ?? null;
    const metadataRole = isUserRole(authenticatedUser.user_metadata.role)
      ? authenticatedUser.user_metadata.role
      : fromDatabaseUserRole(authenticatedUser.user_metadata.role);

    const resolvedRole = profileRole ?? metadataRole ?? null;

    if (!resolvedRole) {
      const fallback = new Error(
        "Your account does not have a valid role assigned. Contact support."
      );
      setServerError(fallback.message);
      throw fallback;
    }

    const profile: SessionProfile = {
      id: authenticatedUser.id,
      email: authenticatedUser.email ?? profileData?.email ?? email,
      name:
        profileData?.name ??
        (typeof authenticatedUser.user_metadata?.name === "string"
          ? authenticatedUser.user_metadata.name
          : null),
      role: resolvedRole,
    };

    setAuthState(session, profile);

    const redirectTarget = searchParams.get("redirectTo");
    if (redirectTarget?.startsWith("/dashboard")) {
      router.replace(redirectTarget);
    } else {
      router.replace(getDashboardPathByRole(resolvedRole));
    }
    router.refresh();
  };

  return <AuthForm variant="login" onSubmit={handleLogin} serverError={serverError} />;
};

