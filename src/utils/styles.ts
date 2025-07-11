/**
 * UI Styling Constants
 *
 * This file contains UI styling patterns and Tailwind CSS class combinations.
 * For game logic constants, configuration values, and numeric constants, see gameConstants.ts
 *
 * Common Tailwind CSS class patterns used throughout the application
 * Helps maintain consistency and reduces duplication
 */
import { GAME_CONSTANTS } from "./gameConstants";

/**
 * Card component styling patterns
 */
export const CARD_STYLES = {
  base: "bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl",
  hover: `hover:bg-gray-900/60 hover:border-gray-600 transition-all duration-[${GAME_CONSTANTS.TIMING.TRANSITION_DURATION}ms]`,
  interactive: "hover:shadow-2xl transform hover:scale-105",
} as const;

/**
 * Game board styling patterns
 */
export const BOARD_STYLES = {
  container: "grid gap-[1px] bg-gray-700 p-1 rounded-sm",
  cell: `w-[${GAME_CONSTANTS.BOARD.CELL_SIZE}px] h-[${GAME_CONSTANTS.BOARD.CELL_SIZE}px] rounded-sm transition-all duration-150`,
  cellBorder: "border border-white/20 shadow-sm",
  emptyCellBorder: "border border-gray-700/50",
  activePiece: "shadow-white/50 shadow-lg ring-1 ring-white/30",
  ghostPiece: "opacity-30 border border-white/30 shadow-sm bg-gray-400/20",
  clearingLine: "shadow-white/80 shadow-xl ring-2 ring-white/50 animate-pulse",
} as const;

/**
 * Modal and overlay styling patterns
 */
export const MODAL_STYLES = {
  backdrop: "bg-gray-900/70 backdrop-blur-sm",
  panel: "bg-gray-900 border-gray-700 shadow-lg",
  overlay: "bg-gray-900/95 border-gray-700 backdrop-blur-sm",
  separator: "h-px bg-gray-700",
} as const;

/**
 * Control and interactive element styling patterns
 */
export const CONTROL_STYLES = {
  button:
    "bg-gray-900/70 backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800/70 transition-colors border",
  interactiveItem: "bg-gray-800/30 hover:bg-gray-700/30 transition-colors",
  toggleOn: "bg-blue-600",
  toggleOff: "bg-gray-600",
  toggleThumb: "w-3 h-3 rounded-full bg-white transition-transform",
} as const;
