import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "@/types/supabase";

export type SessionProfile = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

type SessionState = {
  session: Session | null;
  profile: SessionProfile | null;
  loading: boolean;
};

type SessionActions = {
  setAuthState: (session: Session | null, profile: SessionProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  profile: null,
  loading: true,
  setAuthState: (session, profile) =>
    set({
      session,
      profile,
      loading: false,
    }),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({
      session: null,
      profile: null,
      loading: false,
    }),
}));

export const selectSession = (state: SessionStore) => state.session;
export const selectProfile = (state: SessionStore) => state.profile;
export const selectIsLoading = (state: SessionStore) => state.loading;

