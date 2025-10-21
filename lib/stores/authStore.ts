import { create } from "zustand";
import { User } from "../types/user";


interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
}));
