import type { TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

/**
 * 7-Bag system implementation for fair tetromino distribution.
 * Ensures all 7 pieces appear exactly once before any piece repeats.
 *
 * The 7-bag system works as follows:
 * 1. Fill a "bag" with one of each tetromino type (I, O, T, S, Z, J, L)
 * 2. Shuffle the bag randomly
 * 3. Draw pieces from the bag in order
 * 4. When the bag is empty, refill and shuffle again
 *
 * This prevents long droughts of specific pieces and ensures fair distribution.
 *
 * Following mizchi-style functional TypeScript design patterns:
 * - Immutable state with readonly modifiers
 * - Pure functions without side effects
 * - Functional state transitions
 */

/**
 * Immutable piece bag state following mizchi-style functional design.
 * All fields are readonly to ensure immutability.
 */
export interface PieceBag {
  readonly currentBag: readonly TetrominoTypeName[];
  readonly generatedPieces: readonly TetrominoTypeName[];
  readonly bagCount: number;
  readonly seed?: number; // For reproducible randomness in testing
}

/**
 * Creates a new piece bag with initial state.
 * Factory function following functional programming patterns.
 *
 * @param seed Optional seed for reproducible randomness (primarily for testing)
 * @returns New immutable PieceBag instance
 */
export const createPieceBag = (seed?: number): PieceBag => ({
  currentBag: shuffleWithSeed([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES], seed),
  generatedPieces: [],
  bagCount: 1,
  seed,
});

/**
 * Gets the next piece from the bag using pure functional approach.
 * Returns a tuple of [nextPiece, newBagState] for immutable state transitions.
 *
 * @param bag Current bag state
 * @returns Tuple of [next piece, updated bag state]
 * @throws Error if bag operations fail unexpectedly
 */
export const getNextPiece = (bag: PieceBag): [TetrominoTypeName, PieceBag] => {
  const workingBag =
    bag.currentBag.length > 0
      ? bag.currentBag
      : shuffleWithSeed([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES], bag.seed);

  if (workingBag.length === 0) {
    throw new Error("Failed to get piece from bag - this should never happen");
  }

  const [nextPiece, ...remainingPieces] = workingBag;

  return [
    nextPiece,
    {
      currentBag: remainingPieces,
      generatedPieces: [...bag.generatedPieces, nextPiece],
      bagCount: bag.currentBag.length === 0 ? bag.bagCount + 1 : bag.bagCount,
      seed: bag.seed,
    },
  ];
};

/**
 * Gets the current bag contents as an immutable array.
 * Returns a copy to ensure external code cannot modify the internal state.
 *
 * @param bag Current bag state
 * @returns Array of tetromino types currently in the bag
 */
export const getBagContents = (bag: PieceBag): readonly TetrominoTypeName[] => [...bag.currentBag];

/**
 * Sets the bag state directly for testing purposes.
 * Creates a new bag state with specified pieces.
 *
 * ⚠️ **FOR TESTING ONLY** ⚠️
 * This function bypasses the normal 7-bag algorithm and should only be used
 * in tests to set up specific scenarios.
 *
 * @param bag Current bag state
 * @param pieces Array of tetromino types to set as the bag contents
 * @returns New bag state with specified pieces
 */
export const setBagForTesting = (
  bag: PieceBag,
  pieces: readonly TetrominoTypeName[],
): PieceBag => ({
  ...bag,
  currentBag: [...pieces],
});

// === UTILITY FUNCTIONS ===

/**
 * Fisher-Yates shuffle algorithm with optional seed for reproducible randomness.
 * Pure function that does not modify the input array.
 *
 * @param array Array to shuffle
 * @param seed Optional seed for reproducible randomness
 * @returns New shuffled array
 */
const shuffleWithSeed = (array: TetrominoTypeName[], seed?: number): TetrominoTypeName[] => {
  const shuffled = [...array];

  if (seed !== undefined) {
    // Reproducible shuffle using Linear Congruential Generator
    let currentSeed = seed;
    for (let i = shuffled.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const randomValue = currentSeed / 233280;
      const j = Math.floor(randomValue * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } else {
    // Standard random shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }

  return shuffled;
};

// === BACKWARD COMPATIBILITY ===
// Temporary compatibility layer for gradual migration
