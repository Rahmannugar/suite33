import { create } from "zustand";

interface InsightState {
  insight: string | null;
  setInsight: (text: string) => void;
  clearInsight: () => void;
}

export const useInsightStore = create<InsightState>((set) => ({
  insight: null,
  setInsight: (text) => set({ insight: text }),
  clearInsight: () => set({ insight: null }),
}));
