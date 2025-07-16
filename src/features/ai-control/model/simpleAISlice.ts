import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface SimpleAIState {
  isEnabled: boolean;
  toggleAI: () => void;
  setEnabled: (enabled: boolean) => void;
}

/**
 * シンプルなAI状態管理
 */
export const useSimpleAIStore = create<SimpleAIState>()(
  devtools(
    (set) => ({
      isEnabled: false,

      toggleAI: () => set((state) => ({ isEnabled: !state.isEnabled }), false, "toggleAI"),

      setEnabled: (enabled: boolean) => set({ isEnabled: enabled }, false, "setEnabled"),
    }),
    { name: "simple-ai-store" },
  ),
);
