"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { useSessionStore } from "@/store/useSessionStore";
import type { SessionProfile } from "@/store/useSessionStore";
import type { UserRole } from "@/types/supabase";

type SessionProviderProps = {
  children: ReactNode;
};

const isUserRole = (role: unknown): role is UserRole =>
  role === "Parent" || role === "Child";

const buildProfile = (
  session: Session,
  payload?: Partial<SessionProfile>
): SessionProfile | null => {
  const fallbackRole = session.user.user_metadata?.role;

  if (!isUserRole(payload?.role ?? fallbackRole)) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? payload?.email ?? "",
    name:
      payload?.name ??
      (typeof session.user.user_metadata?.name === "string"
        ? session.user.user_metadata?.name
        : null),
    role: payload?.role ?? fallbackRole,
  };
};

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const setAuthState = useSessionStore((state) => state.setAuthState);
  const reset = useSessionStore((state) => state.reset);
  const setLoading = useSessionStore((state) => state.setLoading);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let cancelled = false;

    const resolveProfile = async (session: Session | null) => {
      if (!session || cancelled) {
        reset();
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("[SessionProvider] Failed to load user profile", error);
      }

      const profile = buildProfile(session, data ?? undefined);
      setAuthState(session, profile);
    };

    const bootstrap = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await resolveProfile(session);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await resolveProfile(session);
      }
    );

    void bootstrap();

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [reset, setAuthState, setLoading, supabase]);

  return children;
};

