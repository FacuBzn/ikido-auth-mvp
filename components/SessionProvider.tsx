"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabaseClient";
import { useSessionStore } from "@/store/useSessionStore";
import { getParentByAuthUserId } from "@/lib/repositories/parentRepository";

type SessionProviderProps = {
  children: ReactNode;
};

/**
 * SessionProvider - Hydrates Zustand store with Supabase session
 * Uses onAuthStateChange to handle session refresh automatically
 */
export const SessionProvider = ({ children }: SessionProviderProps) => {
  const setParent = useSessionStore((state) => state.setParent);
  const logout = useSessionStore((state) => state.logout);

  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let cancelled = false;

    const syncParentProfile = async (authUserId: string) => {
      try {
        const parentData = await getParentByAuthUserId(authUserId);
        if (cancelled) {
          return;
        }

        if (parentData) {
          setParent(parentData);
        } else {
          console.warn("[SessionProvider] No parent profile found during hydration", {
            authUserId,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("[SessionProvider] Failed to hydrate parent profile", {
            message: error.message,
            authUserId,
          });
        } else {
          console.error("[SessionProvider] Unknown error hydrating parent profile", {
            error,
            authUserId,
          });
        }
      }
    };

    const hydrateSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        if (
          sessionError.message?.includes("refresh") ||
          sessionError.message?.includes("token") ||
          sessionError.status === 400
        ) {
          console.debug("[SessionProvider] Refresh token invalid, clearing session:", sessionError.message);
          if (!cancelled) {
            logout();
          }
          return;
        }

        console.debug("[SessionProvider] Session check error (non-fatal):", sessionError.message);
        return;
      }

      if (!session || !session.user) {
        if (!cancelled) {
          logout();
        }
        return;
      }

      await syncParentProfile(session.user.id);
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) {
        return;
      }

      if (event === "SIGNED_OUT" || !session) {
        logout();
        return;
      }

      if (session?.user) {
        await syncParentProfile(session.user.id);
      }
    });

    void hydrateSession();

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase, setParent, logout]);

  return <>{children}</>;
};
