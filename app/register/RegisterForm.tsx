"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm, type AuthFormValues } from "@/components/AuthForm";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { useSessionStore } from "@/store/useSessionStore";
import type { SessionProfile } from "@/store/useSessionStore";
import { fromDatabaseUserRole, isUserRole, toDatabaseUserRole } from "@/types/supabase";

export const RegisterForm = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const setAuthState = useSessionStore((state) => state.setAuthState);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const handleRegister = async ({ email, password, name, role }: AuthFormValues) => {
    setServerError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name,
        },
      },
    });

    if (error) {
      const message = error.message.includes("User already registered")
        ? "This email is already registered. Please sign in instead."
        : error.message;
      setServerError(message);
      throw new Error(message);
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

    if (!authenticatedUser || !session) {
      const fallback = new Error(
        "Your account was created, but we could not verify the session. Please confirm your email."
      );
      setServerError(fallback.message);
      throw fallback;
    }

    const normalizedRole = toDatabaseUserRole(role);

    const { error: upsertError } = await supabase.from("users").upsert({
      id: authenticatedUser.id,
      email,
      name: name ?? null,
      role: normalizedRole,
    });

    if (upsertError) {
      setServerError(upsertError.message);
      throw upsertError;
    }

    const resolvedRole = isUserRole(role)
      ? role
      : isUserRole(authenticatedUser.user_metadata.role)
        ? authenticatedUser.user_metadata.role
        : fromDatabaseUserRole(authenticatedUser.user_metadata.role);

    if (!resolvedRole) {
      const fallback = new Error("Account role is invalid. Please contact support.");
      setServerError(fallback.message);
      throw fallback;
    }

    const profile: SessionProfile = {
      id: authenticatedUser.id,
      email: authenticatedUser.email ?? email,
      name:
        name ??
        (typeof authenticatedUser.user_metadata?.name === "string"
          ? authenticatedUser.user_metadata.name
          : null),
      role: resolvedRole,
    };

    setAuthState(session, profile);

    router.replace(getDashboardPathByRole(resolvedRole));
    router.refresh();
  };

  return <AuthForm variant="register" onSubmit={handleRegister} serverError={serverError} />;
};

