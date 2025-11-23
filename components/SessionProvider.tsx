"use client";

import { type ReactNode, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabaseClient";
import { useSessionStore } from "@/store/useSessionStore";
import { getParentByAuthUserId } from "@/lib/repositories/parentRepository";

type SessionProviderProps = {
  children: ReactNode;
};

/**
 * SessionProvider - Hydrates Zustand store with Supabase session
 * This is a simplified version for MVP
 */
export const SessionProvider = ({ children }: SessionProviderProps) => {
  const setParent = useSessionStore((state) => state.setParent);
  const parent = useSessionStore((state) => state.parent);

  useEffect(() => {
    // Only hydrate if we don't already have a parent in store
    if (parent) {
      return;
    }

    const hydrateSession = async () => {
      try {
        const supabase = createBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Try to get parent from database
          const parentData = await getParentByAuthUserId(session.user.id);
          if (parentData) {
            setParent(parentData);
          }
        }
      } catch (error) {
        console.error("Failed to hydrate session:", error);
      }
    };

    hydrateSession();
  }, [parent, setParent]);

  return <>{children}</>;
};
