import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserClient } from "@/lib/supabaseClient";

export type Parent = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  family_code: string;
  created_at: string;
};

export type Child = {
  id: string;
  parent_id: string;
  name: string;
  family_code?: string; // Family code from parent
  child_code?: string; // Optional internal identifier
  points_balance?: number;
  created_at: string;
};

type SessionStore = {
  parent: Parent | null;
  child: Child | null;
  _hasHydrated: boolean;
  setParent: (parent: Parent) => void;
  setChild: (child: Child) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      parent: null,
      child: null,
      _hasHydrated: false,
      setParent: (parent) => {
        set({ parent, child: null }); // Clear child when setting parent
      },
      setChild: (child) => {
        set({ child, parent: null }); // Clear parent when setting child
      },
      logout: async () => {
        const state = useSessionStore.getState();
        // If there's a parent, sign out from Supabase Auth
        if (state.parent) {
          const supabase = createBrowserClient();
          await supabase.auth.signOut();
        }
        // Clear both parent and child
        set({ parent: null, child: null });
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: "ikido-session-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
