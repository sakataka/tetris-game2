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
  clearingLine: "shadow-white/80 shadow-xl ring-2 ring-white/50 animate-pulse",
} as const;

/**
 * Button styling patterns
 */
export const BUTTON_STYLES = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white font-semibold",
  success: "bg-green-600 hover:bg-green-700 text-white font-semibold",
  danger: "bg-red-600 hover:bg-red-700 text-white font-semibold",
  ghost: "bg-transparent hover:bg-gray-700/50 text-gray-300",
  base: "px-4 py-2 rounded-md transition-colors duration-200",
} as const;

/**
 * Text styling patterns
 */
export const TEXT_STYLES = {
  heading: "text-lg font-bold text-gray-300",
  subheading: "text-md font-semibold text-gray-400",
  body: "text-sm text-gray-300",
  muted: "text-xs text-gray-500",
  score: "text-2xl font-bold text-white",
  label: "text-sm font-medium text-gray-400",
} as const;

/**
 * Layout spacing patterns
 */
export const SPACING = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

/**
 * Animation class patterns
 */
export const ANIMATION_STYLES = {
  fadeIn: "animate-in fade-in duration-200",
  fadeOut: "animate-out fade-out duration-200",
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-200",
  slideUp: "animate-in slide-in-from-bottom-4 duration-300",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
} as const;

/**
 * Responsive grid patterns
 */
export const GRID_STYLES = {
  desktop: "hidden md:grid md:grid-cols-4 md:gap-8",
  mobile: "md:hidden space-y-6",
  gameBoard: "col-span-2 row-span-2 flex justify-center",
} as const;

/**
 * Glass morphism effect patterns
 */
export const GLASS_STYLES = {
  light: "bg-white/10 backdrop-blur-sm",
  medium: "bg-white/20 backdrop-blur-md",
  strong: "bg-white/30 backdrop-blur-lg",
  dark: "bg-black/20 backdrop-blur-sm",
} as const;

/**
 * Helper function to combine style patterns
 */
export function combineStyles(...styles: (string | undefined | false)[]): string {
  return styles.filter(Boolean).join(" ");
}
