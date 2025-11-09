import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "../types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  lastSigned: number | null;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    const data = JSON.parse(str);
    const now = Date.now();

    if (data.state?.lastSigned && now - data.state.lastSigned > SIX_HOURS) {
      localStorage.removeItem(name);
      return null;
    }

    return str;
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      lastSigned: null,
      setUser: (user) => set({ user, lastSigned: Date.now() }),
    }),
    {
      name: "suite33-user",
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        user: state.user,
        lastSigned: state.lastSigned,
      }),
    }
  )
);
