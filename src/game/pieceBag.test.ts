import { describe, expect, it } from "bun:test";
import { GAME_CONSTANTS } from "../utils/gameConstants";
import {
  createPieceBag,
  // Legacy compatibility imports for backward compatibility tests
  createPieceBagManager,
  getBagContents,
  getGenerationHistory,
  getNextPiece,
  getPiecesRemaining,
  isEmpty,
  PieceBagManager,
  resetBag,
  setBagForTesting,
} from "./pieceBag";

describe("Functional PieceBag (mizchi-style)", () => {
  describe("createPieceBag", () => {
    it("should create a bag with all 7 pieces shuffled", () => {
      const bag = createPieceBag();
      expect(bag.currentBag.length).toBe(7);
      expect(bag.generatedPieces.length).toBe(0);
      expect(bag.bagCount).toBe(1);

      // Should contain all 7 unique pieces
      const sortedBag = [...bag.currentBag].sort();
      expect(sortedBag).toEqual([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort());
    });

    it("should create reproducible bags with seed", () => {
      const bag1 = createPieceBag(12345);
      const bag2 = createPieceBag(12345);

      expect(bag1.currentBag).toEqual(bag2.currentBag);
      expect(bag1.seed).toBe(12345);
    });
  });

  describe("getNextPiece", () => {
    it("should return first piece and updated state", () => {
      const initialBag = createPieceBag();
      const [piece, newBag] = getNextPiece(initialBag);

      expect(typeof piece).toBe("string");
      expect(GAME_CONSTANTS.TYPES.TETROMINO_TYPES.includes(piece)).toBe(true);
      expect(newBag.currentBag.length).toBe(6);
      expect(newBag.generatedPieces).toEqual([piece]);
      expect(newBag.bagCount).toBe(1);
    });

    it("should refill bag automatically when empty", () => {
      const bag = setBagForTesting(createPieceBag(), ["I"]); // Set bag with only one piece

      // Get the last piece
      const [lastPiece, newBag] = getNextPiece(bag);
      expect(lastPiece).toBe("I");
      expect(newBag.currentBag.length).toBe(0);

      // Get next piece should trigger refill
      const [nextPiece, refilledBag] = getNextPiece(newBag);
      expect(typeof nextPiece).toBe("string");
      expect(refilledBag.currentBag.length).toBe(6); // 7 - 1 taken
      expect(refilledBag.bagCount).toBe(2);
    });

    it("should return all 7 pieces exactly once before refilling", () => {
      let bag = createPieceBag(12345); // Use seed for predictable order
      const pieces: string[] = [];

      // Get 7 pieces (one complete bag)
      for (let i = 0; i < 7; i++) {
        const [piece, newBag] = getNextPiece(bag);
        pieces.push(piece);
        bag = newBag;
      }

      // Should contain all 7 unique pieces
      expect(pieces.sort()).toEqual([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort());
      expect(new Set(pieces).size).toBe(7);
    });

    it("should handle multiple bag generations", () => {
      let bag = createPieceBag(12345);
      const pieces: string[] = [];

      // Get 14 pieces (two complete bags)
      for (let i = 0; i < 14; i++) {
        const [piece, newBag] = getNextPiece(bag);
        pieces.push(piece);
        bag = newBag;
      }

      // First 7 should be unique, next 7 should also be unique
      const firstBag = pieces.slice(0, 7).sort();
      const secondBag = pieces.slice(7, 14).sort();

      expect(firstBag).toEqual([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort());
      expect(secondBag).toEqual([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort());
      expect(bag.bagCount).toBe(2);
    });
  });

  describe("isEmpty", () => {
    it("should return false for new bag", () => {
      const bag = createPieceBag();
      expect(isEmpty(bag)).toBe(false);
    });

    it("should return true for empty bag", () => {
      const emptyBag = setBagForTesting(createPieceBag(), []);
      expect(isEmpty(emptyBag)).toBe(true);
    });
  });

  describe("getBagContents", () => {
    it("should return readonly bag contents", () => {
      const bag = setBagForTesting(createPieceBag(), ["I", "O", "T"]);
      const contents = getBagContents(bag);

      expect(contents).toEqual(["I", "O", "T"]);
      // Verify it's readonly (TypeScript compile-time check)
      expect(Array.isArray(contents)).toBe(true);
    });
  });

  describe("setBagForTesting", () => {
    it("should create new bag with specified pieces", () => {
      const originalBag = createPieceBag();
      const testPieces = ["I", "O", "T"] as const;
      const newBag = setBagForTesting(originalBag, testPieces);

      expect(getBagContents(newBag)).toEqual(testPieces);
      expect(newBag.bagCount).toBe(originalBag.bagCount);
      expect(newBag.seed).toBe(originalBag.seed);
    });

    it("should preserve immutability of original bag", () => {
      const originalBag = createPieceBag();
      const originalContents = getBagContents(originalBag);

      setBagForTesting(originalBag, ["I"]);

      expect(getBagContents(originalBag)).toEqual(originalContents);
    });
  });

  describe("utility functions", () => {
    it("getPiecesRemaining should return correct count", () => {
      const bag = setBagForTesting(createPieceBag(), ["I", "O", "T"]);
      expect(getPiecesRemaining(bag)).toBe(3);
    });

    it("getGenerationHistory should track generated pieces", () => {
      const bag = createPieceBag();
      const [piece1, bag1] = getNextPiece(bag);
      const [piece2, bag2] = getNextPiece(bag1);

      expect(getGenerationHistory(bag2)).toEqual([piece1, piece2]);
    });

    it("resetBag should create fresh bag with same seed", () => {
      const bag = createPieceBag(12345);
      const [, usedBag] = getNextPiece(bag);

      const resetBagInstance = resetBag(usedBag);

      expect(resetBagInstance.currentBag.length).toBe(7);
      expect(resetBagInstance.generatedPieces.length).toBe(0);
      expect(resetBagInstance.bagCount).toBe(1);
      expect(resetBagInstance.seed).toBe(12345);
    });
  });

  describe("immutability guarantees", () => {
    it("should not modify original bag when getting next piece", () => {
      const originalBag = createPieceBag();
      const originalContents = getBagContents(originalBag);

      getNextPiece(originalBag);

      expect(getBagContents(originalBag)).toEqual(originalContents);
    });

    it("should not allow modification of returned bag contents", () => {
      const bag = setBagForTesting(createPieceBag(), ["I", "O", "T"]);
      const contents = getBagContents(bag);

      // This should be prevented at compile time by readonly typing
      // At runtime, we can verify the array is a copy
      expect(contents).not.toBe(bag.currentBag);
    });
  });
});

// === BACKWARD COMPATIBILITY TESTS ===
// These tests ensure the legacy class-based API still works during transition

describe("Legacy PieceBagManager (backward compatibility)", () => {
  it("should create an empty bag initially", () => {
    const manager = new PieceBagManager();
    expect(manager.isEmpty()).toBe(false); // New bag starts with pieces
  });

  it("should refill bag and return all 7 pieces exactly once before refilling", () => {
    const manager = new PieceBagManager();
    const pieces: string[] = [];

    // Get 7 pieces (one complete bag)
    for (let i = 0; i < 7; i++) {
      pieces.push(manager.getNextPiece());
    }

    // Should contain all 7 unique pieces
    expect(pieces.sort()).toEqual([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort());
    expect(new Set(pieces).size).toBe(7);
  });

  it("should refill bag automatically when empty", () => {
    const manager = new PieceBagManager();

    // Get more than 7 pieces (should trigger refill)
    const pieces: string[] = [];
    for (let i = 0; i < 14; i++) {
      pieces.push(manager.getNextPiece());
    }

    // First 7 should be unique, next 7 should also be unique
    const firstBag = pieces.slice(0, 7).sort();
    const secondBag = pieces.slice(7, 14).sort();

    expect(firstBag).toEqual([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort());
    expect(secondBag).toEqual([...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort());
  });

  it("should allow setting bag state for testing", () => {
    const manager = new PieceBagManager();
    const testBag = ["I", "O", "T"];

    manager.setBag(testBag);
    expect(manager.getBag()).toEqual(testBag);

    // Should get pieces in order (first element first)
    expect(manager.getNextPiece()).toBe("I");
    expect(manager.getNextPiece()).toBe("O");
    expect(manager.getNextPiece()).toBe("T");
  });

  it("should correctly report empty state", () => {
    const manager = new PieceBagManager();
    expect(manager.isEmpty()).toBe(false); // Starts with full bag

    manager.setBag([]);
    expect(manager.isEmpty()).toBe(true);

    manager.setBag(["I"]);
    expect(manager.isEmpty()).toBe(false);

    manager.getNextPiece();
    expect(manager.isEmpty()).toBe(true);
  });

  it("should return immutable copy of bag state", () => {
    const manager = new PieceBagManager();
    manager.setBag(["I", "O", "T"]);

    const bag = manager.getBag();
    bag.push("S"); // Modify the returned array

    // Original bag should be unchanged
    expect(manager.getBag()).toEqual(["I", "O", "T"]);
  });
});

describe("createPieceBagManager (legacy)", () => {
  it("should create a new PieceBagManager instance", () => {
    const manager = createPieceBagManager();
    expect(manager).toBeInstanceOf(PieceBagManager);
    expect(manager.isEmpty()).toBe(false); // Starts with full bag
  });
});
