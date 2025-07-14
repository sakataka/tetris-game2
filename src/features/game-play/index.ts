// UI Components

// API
export { GameEngineAdapter, gameEngineAdapter } from "./api/gameEngineAdapter";
export type { UseGamePlayReturn } from "./lib/useGamePlay";

// Hooks
export { useGamePlay, useGamePlayActions, useGamePlayState } from "./lib/useGamePlay";
// Store
export { useGamePlayStore } from "./model/gamePlaySlice";
export type { GameBoardProps } from "./ui/GameBoard";
export { GameBoard } from "./ui/GameBoard";
