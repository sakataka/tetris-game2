/**
 * Common Tailwind CSS class patterns used throughout the application
 * Helps maintain consistency and reduces duplication
 */

/**
 * Card component styling patterns
 */
export const CARD_STYLES = {
  base: "bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl",
  hover: "hover:bg-gray-900/60 hover:border-gray-600 transition-all duration-300",
  interactive: "hover:shadow-2xl transform hover:scale-105",
} as const;

/**
 * Game board styling patterns
 */
export const BOARD_STYLES = {
  container: "grid gap-[1px] bg-gray-700 p-1 rounded-sm",
  cell: "w-[30px] h-[30px] rounded-sm transition-all duration-150",
  cellBorder: "border border-white/20 shadow-sm",
  emptyCellBorder: "border border-gray-700/50",
  activePiece: "shadow-white/50 shadow-lg ring-1 ring-white/30",
  ghostPiece: "opacity-30 border border-white/30 shadow-sm bg-gray-400/20",
  clearingLine: "shadow-white/80 shadow-xl ring-2 ring-white/50 animate-pulse",
} as const;
