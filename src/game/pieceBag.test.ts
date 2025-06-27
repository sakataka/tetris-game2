import { describe, expect, it } from "bun:test";
import { GAME_CONSTANTS } from "../utils/gameConstants";
import { createPieceBagManager, PieceBagManager } from "./pieceBag";

describe("PieceBagManager", () => {
  it("should create an empty bag initially", () => {
    const manager = new PieceBagManager();
    expect(manager.isEmpty()).toBe(true);
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

    // Should get pieces in reverse order (pop from end)
    expect(manager.getNextPiece()).toBe("T");
    expect(manager.getNextPiece()).toBe("O");
    expect(manager.getNextPiece()).toBe("I");
  });

  it("should correctly report empty state", () => {
    const manager = new PieceBagManager();
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

describe("createPieceBagManager", () => {
  it("should create a new PieceBagManager instance", () => {
    const manager = createPieceBagManager();
    expect(manager).toBeInstanceOf(PieceBagManager);
    expect(manager.isEmpty()).toBe(true);
  });
});
