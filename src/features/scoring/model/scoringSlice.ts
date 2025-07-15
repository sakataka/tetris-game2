import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { FloatingScoreEvent } from "../ui/ScoreDisplay";

interface ScoringState {
  // Core score data
  score: number;
  lines: number;
  level: number;
  previousScore: number;

  // Animation state
  isAnimating: boolean;
  scoreIncrement: number;
  animationStartTime: number;

  // Combo system
  comboCount: number;
  comboActive: boolean;
  comboLastUpdate: number;
  maxCombo: number;

  // Floating score events
  floatingScoreEvents: FloatingScoreEvent[];

  // Statistics
  totalLinesCleared: number;
  totalTSpins: number;
  totalPerfectClears: number;
  totalTetrises: number;
  totalSingles: number;
  totalDoubles: number;
  totalTriples: number;

  // Actions
  setScore: (score: number) => void;
  setLines: (lines: number) => void;
  setLevel: (level: number) => void;
  setPreviousScore: (score: number) => void;

  // Animation actions
  setAnimating: (animating: boolean) => void;
  setScoreIncrement: (increment: number) => void;
  setAnimationStartTime: (time: number) => void;

  // Combo actions
  setComboCount: (count: number) => void;
  setComboActive: (active: boolean) => void;
  setComboLastUpdate: (time: number) => void;
  updateMaxCombo: (count: number) => void;

  // Floating score actions
  addFloatingScoreEvent: (event: FloatingScoreEvent) => void;
  removeFloatingScoreEvent: (id: string) => void;
  clearFloatingScoreEvents: () => void;

  // Statistics actions
  incrementTotalLines: (lines: number) => void;
  incrementTSpins: () => void;
  incrementPerfectClears: () => void;
  incrementTetrises: () => void;
  incrementSingles: () => void;
  incrementDoubles: () => void;
  incrementTriples: () => void;

  // Utility actions
  reset: () => void;
  resetStatistics: () => void;
}

export const useScoringStore = create<ScoringState>()(
  devtools(
    (set, _get) => ({
      // Initial state
      score: 0,
      lines: 0,
      level: 0,
      previousScore: 0,

      // Animation state
      isAnimating: false,
      scoreIncrement: 0,
      animationStartTime: 0,

      // Combo system
      comboCount: 0,
      comboActive: false,
      comboLastUpdate: 0,
      maxCombo: 0,

      // Floating score events
      floatingScoreEvents: [],

      // Statistics
      totalLinesCleared: 0,
      totalTSpins: 0,
      totalPerfectClears: 0,
      totalTetrises: 0,
      totalSingles: 0,
      totalDoubles: 0,
      totalTriples: 0,

      // Core data actions
      setScore: (score) => set(() => ({ score })),
      setLines: (lines) => set(() => ({ lines })),
      setLevel: (level) => set(() => ({ level })),
      setPreviousScore: (score) => set(() => ({ previousScore: score })),

      // Animation actions
      setAnimating: (animating) =>
        set(() => ({
          isAnimating: animating,
          animationStartTime: animating ? Date.now() : 0,
        })),
      setScoreIncrement: (increment) => set(() => ({ scoreIncrement: increment })),
      setAnimationStartTime: (time) => set(() => ({ animationStartTime: time })),

      // Combo actions
      setComboCount: (count) =>
        set((state) => {
          const newMaxCombo = Math.max(state.maxCombo, count);
          return {
            comboCount: count,
            maxCombo: newMaxCombo,
          };
        }),
      setComboActive: (active) => set(() => ({ comboActive: active })),
      setComboLastUpdate: (time) => set(() => ({ comboLastUpdate: time })),
      updateMaxCombo: (count) =>
        set((state) => ({
          maxCombo: Math.max(state.maxCombo, count),
        })),

      // Floating score actions
      addFloatingScoreEvent: (event) =>
        set((state) => ({
          floatingScoreEvents: [...state.floatingScoreEvents, event],
        })),
      removeFloatingScoreEvent: (id) =>
        set((state) => ({
          floatingScoreEvents: state.floatingScoreEvents.filter((event) => event.id !== id),
        })),
      clearFloatingScoreEvents: () => set(() => ({ floatingScoreEvents: [] })),

      // Statistics actions
      incrementTotalLines: (lines) =>
        set((state) => ({
          totalLinesCleared: state.totalLinesCleared + lines,
        })),
      incrementTSpins: () =>
        set((state) => ({
          totalTSpins: state.totalTSpins + 1,
        })),
      incrementPerfectClears: () =>
        set((state) => ({
          totalPerfectClears: state.totalPerfectClears + 1,
        })),
      incrementTetrises: () =>
        set((state) => ({
          totalTetrises: state.totalTetrises + 1,
        })),
      incrementSingles: () =>
        set((state) => ({
          totalSingles: state.totalSingles + 1,
        })),
      incrementDoubles: () =>
        set((state) => ({
          totalDoubles: state.totalDoubles + 1,
        })),
      incrementTriples: () =>
        set((state) => ({
          totalTriples: state.totalTriples + 1,
        })),

      // Utility actions
      reset: () =>
        set(() => ({
          score: 0,
          lines: 0,
          level: 0,
          previousScore: 0,
          isAnimating: false,
          scoreIncrement: 0,
          animationStartTime: 0,
          comboCount: 0,
          comboActive: false,
          comboLastUpdate: 0,
          floatingScoreEvents: [],
          // Note: Statistics are NOT reset on game reset
          // Only reset when explicitly calling resetStatistics()
        })),

      resetStatistics: () =>
        set(() => ({
          totalLinesCleared: 0,
          totalTSpins: 0,
          totalPerfectClears: 0,
          totalTetrises: 0,
          totalSingles: 0,
          totalDoubles: 0,
          totalTriples: 0,
          maxCombo: 0,
        })),
    }),
    { name: "scoring-store" },
  ),
);
