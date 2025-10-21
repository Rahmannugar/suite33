import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      setUser: (user) => set({ user }),
    }),
    {
      name: "suite33-user",
    }
  )
);
