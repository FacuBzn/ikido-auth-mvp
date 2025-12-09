"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";
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
  const currentParent = useSessionStore((state) => state.parent);
  
  // Refs to prevent duplicate syncs
  const isInitializedRef = useRef(false);
  const isHydratingRef = useRef(false);
  const lastSyncedUserRef = useRef<string | null>(null);

  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let cancelled = false;
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

    const syncParentProfile = async (authUserId: string) => {
      // Prevent multiple simultaneous syncs
      if (isHydratingRef.current) {
        console.debug("[SessionProvider] Sync already in progress, skipping");
        return;
      }

      // Skip if already synced for this exact user
      if (lastSyncedUserRef.current === authUserId) {
        console.debug("[SessionProvider] Already synced for this user:", authUserId);
        return;
      }

      // Skip if current parent matches
      if (currentParent?.auth_user_id === authUserId) {
        console.debug("[SessionProvider] Parent already set for this user");
        lastSyncedUserRef.current = authUserId;
        return;
      }

      isHydratingRef.current = true;

      try {
        const parentData = await getParentByAuthUserId(authUserId);
        if (cancelled) {
          return;
        }

        if (parentData) {
          // Only update if different
          if (
            !currentParent ||
            currentParent.auth_user_id !== parentData.auth_user_id ||
            currentParent.id !== parentData.id
          ) {
            console.debug("[SessionProvider] Setting parent:", parentData.id);
          setParent(parentData);
            lastSyncedUserRef.current = authUserId;
          }
        } else {
          console.warn("[SessionProvider] No parent profile found", { authUserId });
          if (currentParent?.auth_user_id === authUserId) {
            // Clear if we had this parent but profile is gone
            logout();
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[SessionProvider] Failed to hydrate parent profile", {
            message: error instanceof Error ? error.message : String(error),
            authUserId,
          });
        }
      } finally {
        isHydratingRef.current = false;
      }
    };

    const hydrateSession = async () => {
      if (isInitializedRef.current) {
        return; // Only hydrate once on mount
      }

      isInitializedRef.current = true;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (sessionError) {
        if (
          sessionError.message?.includes("refresh") ||
          sessionError.message?.includes("token") ||
          sessionError.status === 400
        ) {
          console.debug("[SessionProvider] Refresh token invalid, clearing session");
          if (!cancelled) {
            logout();
          }
          return;
        }

        console.debug("[SessionProvider] Session check error (non-fatal):", sessionError.message);
        return;
      }

      if (!session || !session.user) {
        if (!cancelled && currentParent) {
          // Only logout if we had a parent but session is gone
          logout();
        }
        return;
      }

      await syncParentProfile(session.user.id);
    };

    subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) {
        return;
      }

      console.debug("[SessionProvider] Auth state changed:", event);

      if (event === "SIGNED_OUT" || !session) {
        lastSyncedUserRef.current = null;
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
      isInitializedRef.current = false;
      lastSyncedUserRef.current = null;
      if (subscription) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, [supabase, setParent, logout, currentParent]);

  return <>{children}</>;
};
