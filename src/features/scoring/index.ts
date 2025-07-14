// UI Components

export type { HighScoreEntry, ScoreStatistics } from "./api/scoreStorage";
// API
export { ScoreStorageAdapter, scoreStorage } from "./api/scoreStorage";
export type { LineClearData, UseScoringReturn } from "./lib/useScoring";
// Hooks
export { useScoring, useScoringAnimationState, useScoringData } from "./lib/useScoring";

// Store
export { useScoringStore } from "./model/scoringSlice";
export type {
  ComboState,
  FloatingScoreEvent,
  ScoreAnimationState,
  ScoreData,
  ScoreDisplayProps,
} from "./ui/ScoreDisplay";
export { ScoreDisplay } from "./ui/ScoreDisplay";
