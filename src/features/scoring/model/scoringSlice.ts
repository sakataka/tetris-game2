import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type HighScoreEntry, type ScoreStatistics, scoreStorage } from "../api/scoreStorage";
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

  // High scores
  currentHighScore: HighScoreEntry | null;
  highScoresList: HighScoreEntry[];
  scoreStatistics: ScoreStatistics | null;
  isNewHighScore: boolean;
  gameStartTime: number;
  gameMode: "normal" | "ai" | "challenge";

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

  // High score actions
  addNewHighScore: (playerName?: string) => Promise<void>;
  loadHighScores: () => Promise<void>;
  clearHighScores: () => Promise<void>;
  deleteHighScore: (id: string) => Promise<void>;
  isHighScore: (score: number) => Promise<boolean>;
  getScoreRank: (score: number) => Promise<number>;
  setGameMode: (mode: "normal" | "ai" | "challenge") => void;
  setGameStartTime: (time: number) => void;
  exportHighScores: () => Promise<string>;
  importHighScores: (jsonData: string) => Promise<void>;

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

      // High scores
      currentHighScore: null,
      highScoresList: [],
      scoreStatistics: null,
      isNewHighScore: false,
      gameStartTime: 0,
      gameMode: "normal",

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
          // High score state is preserved on game reset
          isNewHighScore: false,
          gameStartTime: Date.now(),
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

      // High score actions
      addNewHighScore: async (playerName?: string) => {
        const state = _get();
        const duration = state.gameStartTime ? Date.now() - state.gameStartTime : undefined;

        try {
          const entry = await scoreStorage.saveHighScore(
            {
              score: state.score,
              lines: state.lines,
              level: state.level,
            },
            playerName,
            duration,
            state.gameMode,
          );

          // Update current high score if this is better
          const currentBest = state.currentHighScore;
          const isNewBest = !currentBest || entry.score > currentBest.score;

          set(() => ({
            currentHighScore: isNewBest ? entry : currentBest,
            isNewHighScore: isNewBest,
          }));

          // Reload the full list
          await _get().loadHighScores();
        } catch (error) {
          console.error("Failed to save high score:", error);
        }
      },

      loadHighScores: async () => {
        try {
          const [highScores, statistics] = await Promise.all([
            scoreStorage.getHighScores(),
            scoreStorage.getStatistics(),
          ]);

          set(() => ({
            highScoresList: highScores,
            currentHighScore: highScores[0] || null,
            scoreStatistics: statistics,
          }));
        } catch (error) {
          console.error("Failed to load high scores:", error);
        }
      },

      clearHighScores: async () => {
        try {
          await scoreStorage.clearHighScores();
          set(() => ({
            highScoresList: [],
            currentHighScore: null,
            isNewHighScore: false,
          }));
        } catch (error) {
          console.error("Failed to clear high scores:", error);
        }
      },

      deleteHighScore: async (id: string) => {
        try {
          await scoreStorage.deleteHighScore(id);
          await _get().loadHighScores();
        } catch (error) {
          console.error("Failed to delete high score:", error);
        }
      },

      isHighScore: async (score: number) => {
        try {
          return await scoreStorage.isHighScore(score);
        } catch (error) {
          console.error("Failed to check if high score:", error);
          return false;
        }
      },

      getScoreRank: async (score: number) => {
        try {
          return await scoreStorage.getScoreRank(score);
        } catch (error) {
          console.error("Failed to get score rank:", error);
          return -1;
        }
      },

      setGameMode: (mode) => set(() => ({ gameMode: mode })),
      setGameStartTime: (time) => set(() => ({ gameStartTime: time })),

      exportHighScores: async () => {
        try {
          return await scoreStorage.exportHighScores();
        } catch (error) {
          console.error("Failed to export high scores:", error);
          throw error;
        }
      },

      importHighScores: async (jsonData: string) => {
        try {
          await scoreStorage.importHighScores(jsonData);
          await _get().loadHighScores();
        } catch (error) {
          console.error("Failed to import high scores:", error);
          throw error;
        }
      },
    }),
    { name: "scoring-store" },
  ),
);
