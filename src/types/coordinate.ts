/**
 * Unified coordinate system for the Tetris game.
 *
 * Coordinate System Convention:
 * - x: Horizontal position (0 = leftmost column, increases rightward)
 * - y: Vertical position (0 = topmost row, increases downward)
 *
 * This follows the standard game coordinate system where:
 * - x corresponds to column index in board arrays
 * - y corresponds to row index in board arrays
 * - Board access pattern: board[y][x] or board[coordinate.y][coordinate.x]
 */

import type { Position } from "./game";

/**
 * Type alias for coordinate position.
 * Uses the same structure as Position interface for consistency.
 */
export type Coordinate = Position;

/**
 * Factory function to create a coordinate object.
 * Provides a convenient way to create coordinates with validation.
 *
 * @param x - Horizontal position (column)
 * @param y - Vertical position (row)
 * @returns Coordinate object with x and y properties
 *
 * @example
 * ```typescript
 * const origin = coord(0, 0);
 * const center = coord(5, 10);
 * ```
 */
export const coord = (x: number, y: number): Coordinate => ({ x, y });

/**
 * Checks if two coordinates are equal.
 *
 * @param a - First coordinate
 * @param b - Second coordinate
 * @returns True if coordinates are equal, false otherwise
 *
 * @example
 * ```typescript
 * const pos1 = coord(1, 2);
 * const pos2 = coord(1, 2);
 * const pos3 = coord(2, 1);
 *
 * coordEquals(pos1, pos2); // true
 * coordEquals(pos1, pos3); // false
 * ```
 */
export const coordEquals = (a: Coordinate, b: Coordinate): boolean => a.x === b.x && a.y === b.y;

/**
 * Adds two coordinates together.
 *
 * @param a - First coordinate
 * @param b - Second coordinate
 * @returns New coordinate with summed x and y values
 *
 * @example
 * ```typescript
 * const pos1 = coord(1, 2);
 * const offset = coord(3, 4);
 * const result = coordAdd(pos1, offset); // { x: 4, y: 6 }
 * ```
 */
export const coordAdd = (a: Coordinate, b: Coordinate): Coordinate => coord(a.x + b.x, a.y + b.y);

/**
 * Subtracts the second coordinate from the first.
 *
 * @param a - First coordinate
 * @param b - Second coordinate
 * @returns New coordinate with subtracted x and y values
 *
 * @example
 * ```typescript
 * const pos1 = coord(5, 7);
 * const offset = coord(2, 3);
 * const result = coordSubtract(pos1, offset); // { x: 3, y: 4 }
 * ```
 */
export const coordSubtract = (a: Coordinate, b: Coordinate): Coordinate =>
  coord(a.x - b.x, a.y - b.y);

/**
 * Checks if a coordinate is within the bounds of a rectangular area.
 *
 * @param coordinate - Coordinate to check
 * @param width - Width of the area
 * @param height - Height of the area
 * @returns True if coordinate is within bounds, false otherwise
 *
 * @example
 * ```typescript
 * const pos = coord(5, 3);
 * const inBounds = coordInBounds(pos, 10, 20); // true
 * const outOfBounds = coordInBounds(pos, 3, 2); // false
 * ```
 */
export const coordInBounds = (coordinate: Coordinate, width: number, height: number): boolean =>
  coordinate.x >= 0 && coordinate.x < width && coordinate.y >= 0 && coordinate.y < height;

/**
 * Converts array indices (row, col) to coordinate (x, y).
 * This is useful when iterating through 2D arrays and need to convert
 * array indices to game coordinates.
 *
 * @param row - Row index
 * @param col - Column index
 * @returns Coordinate where x = col and y = row
 *
 * @example
 * ```typescript
 * // When iterating through a 2D array
 * for (let row = 0; row < array.length; row++) {
 *   for (let col = 0; col < array[row].length; col++) {
 *     const coordinate = indicesToCoord(row, col);
 *     // coordinate.x = col, coordinate.y = row
 *   }
 * }
 * ```
 */
export const indicesToCoord = (row: number, col: number): Coordinate => coord(col, row);

/**
 * Converts coordinate (x, y) to array indices (row, col).
 * This is useful when you have a coordinate and need to access
 * the corresponding position in a 2D array.
 *
 * @param coordinate - Coordinate to convert
 * @returns Object with row and col properties
 *
 * @example
 * ```typescript
 * const pos = coord(3, 5);
 * const { row, col } = coordToIndices(pos);
 * // row = 5, col = 3
 * // Access array: array[row][col] or array[pos.y][pos.x]
 * ```
 */
export const coordToIndices = (coordinate: Coordinate): { row: number; col: number } => ({
  row: coordinate.y,
  col: coordinate.x,
});
