import { describe, expect, it } from "bun:test";
import { GAME_CONSTANTS } from "../utils/gameConstants";
import { createPieceBag, getBagContents, getNextPiece, setBagForTesting } from "./pieceBag";

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
      const bag = setBagForTesting(createPieceBag(), ["I"]);
      const [piece, newBag] = getNextPiece(bag);

      expect(piece).toBe("I");
      expect(newBag.currentBag.length).toBe(0); // Current bag empty after taking last piece
      expect(newBag.bagCount).toBe(1);

      // Get next piece to trigger refill
      const [_nextPiece, refillBag] = getNextPiece(newBag);
      expect(refillBag.currentBag.length).toBe(6); // New bag with 6 remaining
      expect(refillBag.bagCount).toBe(2);
    });

    it("should return all 7 pieces exactly once before refilling", () => {
      let bag = createPieceBag();
      const pieces = [];

      // Get all 7 pieces from current bag
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
      let bag = createPieceBag();
      const pieces = [];

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

      setBagForTesting(originalBag, ["I", "O"]);

      expect(getBagContents(originalBag)).toEqual(originalContents);
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
