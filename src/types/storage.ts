/**
 * Type definitions for persistent storage data structures
 */

export interface HighScore {
  score: number;
  lines: number;
  level: number;
  date: string;
}

export interface GameSettings {
  language: "ja" | "en";
  volume: number;
  showGhostPiece: boolean;
  enableTSpinDetection: boolean;
  enableAIFeatures: boolean;
}
