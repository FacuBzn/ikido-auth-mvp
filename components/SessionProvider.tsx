"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { useSessionStore } from "@/store/useSessionStore";
import type { SessionProfile } from "@/store/useSessionStore";
import {
  fromDatabaseUserRole,
  isUserRole,
} from "@/types/supabase";

type SessionProviderProps = {
  children: ReactNode;
};

type PartialProfilePayload = {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

const buildProfile = (
  user: User,
  payload?: PartialProfilePayload
): SessionProfile | null => {
  const metadataRole = isUserRole(user.user_metadata?.role)
    ? user.user_metadata?.role
    : fromDatabaseUserRole(user.user_metadata?.role);

  const payloadRole = fromDatabaseUserRole(payload?.role);
  const resolvedRole = payloadRole ?? metadataRole;

  if (!resolvedRole) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? payload?.email ?? "",
    name:
      payload?.name ??
      (typeof user.user_metadata?.name === "string" ? user.user_metadata?.name : null),
    role: resolvedRole,
  };
};

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const setAuthState = useSessionStore((state) => state.setAuthState);
  const reset = useSessionStore((state) => state.reset);
  const setLoading = useSessionStore((state) => state.setLoading);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let cancelled = false;

    const resolveAuthState = async () => {
      if (cancelled) {
        return;
      }

      const [
        { data: sessionResult, error: sessionError },
        { data: userResult, error: userError },
      ] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

      if (sessionError) {
        console.error("[SessionProvider] Failed to read session", sessionError);
      }

      if (userError) {
        console.error("[SessionProvider] Failed to validate user", userError);
      }

      const session: Session | null = sessionResult.session ?? null;
      const user: User | null = userResult.user ?? null;

      if (!session || !user || cancelled) {
        reset();
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[SessionProvider] Failed to load user profile", error);
      }

      if (cancelled) {
        return;
      }

      const payload: PartialProfilePayload | undefined = data
        ? {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
          }
        : undefined;

      const profile = buildProfile(user, payload);
      setAuthState(session, profile);
    };

    const bootstrap = async () => {
      setLoading(true);
      await resolveAuthState();
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async () => {
      await resolveAuthState();
    });

    void bootstrap();

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [reset, setAuthState, setLoading, supabase]);

  return children;
};

