import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AdvancedAIDecision, AdvancedAIStats } from "@/game/ai";
import type { AISettings } from "../ui/AIControlPanel";

interface AIControlState {
  // AI Status
  isEnabled: boolean;
  isPaused: boolean;
  isThinking: boolean;

  // AI Decision Data
  lastDecision: AdvancedAIDecision | null;
  stats: AdvancedAIStats | null;

  // AI Settings
  aiLevel: "basic" | "advanced";
  beamWidth: number;
  thinkingTimeLimit: number;
  useHold: boolean;
  enableVisualization: boolean;
  playbackSpeed: number;

  // Visualization Data
  searchTree: unknown | null;
  evaluationData: unknown | null;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setPaused: (paused: boolean) => void;
  setThinking: (thinking: boolean) => void;
  setLastDecision: (decision: AdvancedAIDecision | null) => void;
  updateStats: (stats: AdvancedAIStats) => void;
  resetStats: () => void;

  // Settings actions
  updateSettings: (settings: AISettings) => void;
  setAILevel: (level: "basic" | "advanced") => void;
  setBeamWidth: (width: number) => void;
  setThinkingTimeLimit: (limit: number) => void;
  setUseHold: (useHold: boolean) => void;
  setEnableVisualization: (enable: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Visualization actions
  setSearchTree: (tree: unknown) => void;
  setEvaluationData: (data: unknown) => void;
  clearVisualizationData: () => void;

  // Reset actions
  reset: () => void;
}

export const useAIStore = create<AIControlState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isEnabled: false,
      isPaused: false,
      isThinking: false,
      lastDecision: null,
      stats: null,

      // Default settings
      aiLevel: "advanced",
      beamWidth: 5,
      thinkingTimeLimit: 80,
      useHold: true,
      enableVisualization: false,
      playbackSpeed: 1.0,

      // Visualization data
      searchTree: null,
      evaluationData: null,

      // Status actions
      setEnabled: (enabled) => set(() => ({ isEnabled: enabled })),
      setPaused: (paused) => set(() => ({ isPaused: paused })),
      setThinking: (thinking) => set(() => ({ isThinking: thinking })),

      // Decision data actions
      setLastDecision: (decision) => set(() => ({ lastDecision: decision })),
      updateStats: (stats) => set(() => ({ stats })),
      resetStats: () =>
        set(() => ({
          stats: null,
          lastDecision: null,
        })),

      // Settings actions
      updateSettings: (settings) =>
        set(() => ({
          aiLevel: settings.aiLevel,
          beamWidth: settings.beamWidth,
          thinkingTimeLimit: settings.thinkingTimeLimit,
          useHold: settings.useHold,
          enableVisualization: settings.enableVisualization,
          playbackSpeed: settings.playbackSpeed,
        })),

      setAILevel: (level) => set(() => ({ aiLevel: level })),
      setBeamWidth: (width) => set(() => ({ beamWidth: Math.max(1, Math.min(20, width)) })),
      setThinkingTimeLimit: (limit) =>
        set(() => ({ thinkingTimeLimit: Math.max(10, Math.min(200, limit)) })),
      setUseHold: (useHold) => set(() => ({ useHold })),
      setEnableVisualization: (enable) => set(() => ({ enableVisualization: enable })),
      setPlaybackSpeed: (speed) =>
        set(() => ({ playbackSpeed: Math.max(0.1, Math.min(5, speed)) })),

      // Visualization actions
      setSearchTree: (tree) => set(() => ({ searchTree: tree })),
      setEvaluationData: (data) => set(() => ({ evaluationData: data })),
      clearVisualizationData: () =>
        set(() => ({
          searchTree: null,
          evaluationData: null,
        })),

      // Reset action
      reset: () =>
        set(() => ({
          isEnabled: false,
          isPaused: false,
          isThinking: false,
          lastDecision: null,
          stats: null,
          searchTree: null,
          evaluationData: null,
          // Keep settings unchanged during reset
        })),
    }),
    { name: "ai-control-store" },
  ),
);
