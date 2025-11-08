"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm, type AuthFormValues } from "@/components/AuthForm";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { useSessionStore } from "@/store/useSessionStore";
import type { SessionProfile } from "@/store/useSessionStore";
import type { UserRole } from "@/types/supabase";

const isUserRole = (role: unknown): role is UserRole =>
  role === "Parent" || role === "Child";

export const RegisterForm = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const setAuthState = useSessionStore((state) => state.setAuthState);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const handleRegister = async ({ email, password, name, role }: AuthFormValues) => {
    setServerError(null);

    const { data, error } = await supabase.auth.signUp({
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
      setServerError(error.message);
      throw error;
    }

    const user = data.user;

    if (!user) {
      const fallback = new Error("We could not create your account. Please try again.");
      setServerError(fallback.message);
      throw fallback;
    }

    const { error: upsertError } = await supabase.from("users").upsert({
      id: user.id,
      email,
      name: name ?? null,
      role,
    });

    if (upsertError) {
      setServerError(upsertError.message);
      throw upsertError;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setServerError(sessionError.message);
      throw sessionError;
    }

    if (!session) {
      const fallback = new Error(
        "Your account was created, but we could not verify the session. Please confirm your email."
      );
      setServerError(fallback.message);
      throw fallback;
    }

    const resolvedRole = isUserRole(role)
      ? role
      : isUserRole(user.user_metadata.role)
        ? user.user_metadata.role
        : null;

    if (!resolvedRole) {
      const fallback = new Error("Account role is invalid. Please contact support.");
      setServerError(fallback.message);
      throw fallback;
    }

    const profile: SessionProfile = {
      id: user.id,
      email: user.email ?? email,
      name: name ?? null,
      role: resolvedRole,
    };

    setAuthState(session, profile);

    router.replace(getDashboardPathByRole(resolvedRole));
    router.refresh();
  };

  return <AuthForm variant="register" onSubmit={handleRegister} serverError={serverError} />;
};

