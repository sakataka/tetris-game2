import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
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

    it("should generate different bag sequences with seed progression", () => {
      const seed = 12345;
      const bag1 = createPieceBag(seed);
      const bag2 = createPieceBag(seed);

      // First bags should be identical
      expect(bag1.currentBag).toEqual(bag2.currentBag);

      // Exhaust first bag from both
      let currentBag1 = bag1;
      let currentBag2 = bag2;
      const firstBagPieces1 = [];
      const firstBagPieces2 = [];

      for (let i = 0; i < 7; i++) {
        const [piece1, newBag1] = getNextPiece(currentBag1);
        const [piece2, newBag2] = getNextPiece(currentBag2);

        firstBagPieces1.push(piece1);
        firstBagPieces2.push(piece2);
        currentBag1 = newBag1;
        currentBag2 = newBag2;
      }

      // First bags should produce same sequences
      expect(firstBagPieces1).toEqual(firstBagPieces2);

      // At this point, both bags should be empty
      expect(currentBag1.currentBag.length).toBe(0);
      expect(currentBag2.currentBag.length).toBe(0);

      // Generate second bags - these should be different from first bags
      const [secondBag1Piece1, secondBag1State] = getNextPiece(currentBag1);
      const [secondBag2Piece1, secondBag2State] = getNextPiece(currentBag2);

      // Second bags should also be identical to each other
      expect(secondBag1Piece1).toEqual(secondBag2Piece1);
      expect(secondBag1State.currentBag).toEqual(secondBag2State.currentBag);

      // Verify seed progression - seed should be updated when new bag is generated
      expect(secondBag1State.seed).toBe(seed + 1); // seed + bagCount (1)
      expect(secondBag2State.seed).toBe(seed + 1);

      // Verify bagCount increment
      expect(secondBag1State.bagCount).toBe(2);
      expect(secondBag2State.bagCount).toBe(2);
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

  describe("Property-based testing with fast-check", () => {
    it("should always create bags with exactly 7 unique pieces", () => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const bag = createPieceBag(seed);
          const pieces = getBagContents(bag);
          const uniquePieces = new Set(pieces);

          // Should have exactly 7 pieces
          expect(pieces.length).toBe(7);
          // All pieces should be unique
          expect(uniquePieces.size).toBe(7);
          // Should contain all tetromino types
          expect([...uniquePieces].sort()).toEqual(
            [...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort(),
          );
        }),
      );
    });

    it("should produce identical bags for identical seeds", () => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const bag1 = createPieceBag(seed);
          const bag2 = createPieceBag(seed);

          expect(getBagContents(bag1)).toEqual(getBagContents(bag2));
          expect(bag1.seed).toBe(bag2.seed);
          expect(bag1.bagCount).toBe(bag2.bagCount);
        }),
      );
    });

    it("should maintain immutability when getting next piece", () => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const originalBag = createPieceBag(seed);
          const originalContents = getBagContents(originalBag);

          const [_piece, newBag] = getNextPiece(originalBag);

          // Original bag should be unchanged
          expect(getBagContents(originalBag)).toEqual(originalContents);
          // New bag should be different
          expect(getBagContents(newBag)).not.toEqual(originalContents);
          // New bag should have one fewer piece
          expect(getBagContents(newBag).length).toBe(originalContents.length - 1);
        }),
      );
    });

    it("should eventually generate all 7 pieces in a complete cycle", () => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          let bag = createPieceBag(seed);
          const generatedPieces = [];

          // Generate all 7 pieces
          for (let i = 0; i < 7; i++) {
            const [piece, newBag] = getNextPiece(bag);
            generatedPieces.push(piece);
            bag = newBag;
          }

          // Should have generated all 7 unique pieces
          const uniquePieces = new Set(generatedPieces);
          expect(uniquePieces.size).toBe(7);
          expect([...uniquePieces].sort()).toEqual(
            [...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort(),
          );
        }),
      );
    });

    it("should handle multiple bag generations correctly", () => {
      fc.assert(
        fc.property(
          fc.integer().filter((x) => x !== 0),
          fc.integer({ min: 1, max: 5 }),
          (seed, bagCount) => {
            let bag = createPieceBag(seed);
            const allPieces = [];

            // Generate multiple complete bags
            for (let i = 0; i < bagCount * 7; i++) {
              const [piece, newBag] = getNextPiece(bag);
              allPieces.push(piece);
              bag = newBag;
            }

            // Each complete bag should contain all 7 pieces
            for (let bagIndex = 0; bagIndex < bagCount; bagIndex++) {
              const bagPieces = allPieces.slice(bagIndex * 7, (bagIndex + 1) * 7);
              const uniquePieces = new Set(bagPieces);
              expect(uniquePieces.size).toBe(7);
              expect([...uniquePieces].sort()).toEqual(
                [...GAME_CONSTANTS.TYPES.TETROMINO_TYPES].sort(),
              );
            }

            // Final bag count should be correct
            expect(bag.bagCount).toBe(bagCount);
          },
        ),
      );
    });
  });
});
