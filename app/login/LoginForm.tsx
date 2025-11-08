"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm, type AuthFormValues } from "@/components/AuthForm";
import { getDashboardPathByRole } from "@/lib/authRoutes";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { useSessionStore } from "@/store/useSessionStore";
import type { SessionProfile } from "@/store/useSessionStore";
import type { UserRole } from "@/types/supabase";

const isUserRole = (role: unknown): role is UserRole =>
  role === "Parent" || role === "Child";

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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setServerError(sessionError.message);
      throw sessionError;
    }

    if (!session) {
      const fallback = new Error("No session was created. Please try again.");
      setServerError(fallback.message);
      throw fallback;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      setServerError(profileError.message);
      throw profileError;
    }

    const resolvedRole = isUserRole(profileData?.role)
      ? profileData!.role
      : isUserRole(session.user.user_metadata.role)
        ? session.user.user_metadata.role
        : null;

    if (!resolvedRole) {
      const fallback = new Error(
        "Your account does not have a valid role assigned. Contact support."
      );
      setServerError(fallback.message);
      throw fallback;
    }

    const profile: SessionProfile = {
      id: session.user.id,
      email: session.user.email ?? profileData?.email ?? email,
      name: profileData?.name ?? (session.user.user_metadata?.name as string | undefined) ?? null,
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

