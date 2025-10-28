import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  lastSigned: number | null;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      lastSigned: null,
      setUser: (user) => set({ user, lastSigned: Date.now() }),
    }),
    {
      name: "suite33-user",
      partialize: (state) => ({
        user: state.user,
        lastSigned: state.lastSigned,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.lastSigned && Date.now() - state.lastSigned > SIX_HOURS) {
          return { user: null, lastSigned: null };
        }
      },
    }
  )
);
