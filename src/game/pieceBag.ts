import type { TetrominoTypeName } from "../types/game";
import { TETROMINO_TYPES } from "../utils/constants";

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
 */
export class PieceBagManager {
  private bag: TetrominoTypeName[] = [];

  /**
   * Gets the next piece from the bag.
   * Automatically refills the bag when empty using the 7-bag algorithm.
   *
   * @returns The next tetromino type to spawn
   * @throws Error if bag operations fail unexpectedly
   */
  getNextPiece(): TetrominoTypeName {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    const piece = this.bag.pop();
    if (!piece) {
      throw new Error("Failed to get piece from bag - this should never happen");
    }
    return piece;
  }

  /**
   * Checks if the bag is currently empty.
   * Useful for testing bag refill behavior.
   *
   * @returns true if the bag contains no pieces
   */
  isEmpty(): boolean {
    return this.bag.length === 0;
  }

  /**
   * Gets the current state of the bag.
   * Returns an immutable copy to prevent external modification.
   *
   * @returns Array of tetromino types currently in the bag
   */
  getBag(): TetrominoTypeName[] {
    return [...this.bag];
  }

  // === TESTING UTILITIES ===
  // The following methods are primarily intended for testing purposes
  // and should not be used in normal game logic.

  /**
   * Sets the bag state directly.
   *
   * ⚠️ **FOR TESTING ONLY** ⚠️
   * This method bypasses the normal 7-bag algorithm and should only be used
   * in tests to set up specific scenarios.
   *
   * @param pieces Array of tetromino types to set as the bag contents
   */
  setBag(pieces: TetrominoTypeName[]): void {
    this.bag = [...pieces];
  }

  // === PRIVATE IMPLEMENTATION ===

  /**
   * Refills the bag with all 7 piece types and shuffles them.
   * This implements the core 7-bag algorithm.
   */
  private refillBag(): void {
    this.bag = [...TETROMINO_TYPES];
    this.shuffle(this.bag);
  }

  /**
   * Fisher-Yates shuffle algorithm for array randomization.
   * Ensures each permutation has equal probability.
   *
   * @param array Array to shuffle in-place
   */
  private shuffle(array: TetrominoTypeName[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

/**
 * Creates a new piece bag manager instance.
 */
export function createPieceBagManager(): PieceBagManager {
  return new PieceBagManager();
}
