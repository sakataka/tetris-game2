import type { TetrominoTypeName } from "../types/game";
import { TETROMINO_TYPES } from "../utils/constants";

/**
 * 7-Bag system implementation for fair tetromino distribution.
 * Ensures all 7 pieces appear exactly once before any piece repeats.
 */
export class PieceBagManager {
  private bag: TetrominoTypeName[] = [];

  /**
   * Gets the next piece from the bag.
   * Automatically refills the bag when empty.
   */
  getNextPiece(): TetrominoTypeName {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    const piece = this.bag.pop();
    if (!piece) {
      throw new Error("Failed to get piece from bag");
    }
    return piece;
  }

  /**
   * Checks if the bag is empty.
   */
  isEmpty(): boolean {
    return this.bag.length === 0;
  }

  /**
   * Gets the current state of the bag (for debugging/testing).
   */
  getBag(): TetrominoTypeName[] {
    return [...this.bag];
  }

  /**
   * Sets the bag state (for testing purposes).
   */
  setBag(pieces: TetrominoTypeName[]): void {
    this.bag = [...pieces];
  }

  /**
   * Refills the bag with all 7 piece types and shuffles them.
   */
  private refillBag(): void {
    this.bag = [...TETROMINO_TYPES];
    this.shuffle(this.bag);
  }

  /**
   * Fisher-Yates shuffle algorithm for array randomization.
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
