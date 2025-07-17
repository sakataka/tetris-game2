// UI Components

// API
export type {
  HighScoreEntry,
  ScoreStatistics,
  ScoreStorageAdapter as ScoreStorageAdapterType,
} from "./api/scoreStorage";
export {
  createScoreStorageAdapter,
  createScoreStorageAdapter as ScoreStorageAdapter,
  scoreStorage,
} from "./api/scoreStorage";
export type { LineClearData, UseScoringReturn } from "./lib/useScoring";
// Hooks
export { useScoring, useScoringAnimationState, useScoringData } from "./lib/useScoring";

// Store
export { useHighScoreStore } from "./model/highScoreSlice";
export type {
  ComboState,
  FloatingScoreEvent,
  ScoreAnimationState,
  ScoreData,
  ScoreDisplayProps,
} from "./ui/ScoreDisplay";
export { ScoreDisplay } from "./ui/ScoreDisplay";
