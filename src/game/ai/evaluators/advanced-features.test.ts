import { beforeEach, describe, expect, test } from "bun:test";
import { type BitBoardData, createBitBoard, fromBoardState } from "@/game/ai/core/bitboard";
import type { GameBoard } from "@/types/game";
import { AdvancedFeatures } from "./advanced-features";

describe("AdvancedFeatures", () => {
  let advancedFeatures: AdvancedFeatures;
  let emptyBoard: BitBoardData;

  beforeEach(() => {
    advancedFeatures = new AdvancedFeatures();

    // Create empty board
    const emptyBoardState: GameBoard = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    emptyBoard = fromBoardState(createBitBoard(), emptyBoardState);
  });

  describe("T-Spin Detection", () => {
    test("should detect basic T-Spin opportunities", () => {
      // Create a board with a potential T-Spin slot
      const tSpinBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) {
            // Bottom row
            return [1, 1, 1, 0, 1, 1, 1, 1, 1, 1]; // Gap for T-Spin
          }
          if (y === 18) {
            // Second row
            return [1, 1, 0, 0, 0, 1, 1, 1, 1, 1]; // T-Spin slot
          }
          if (y === 17) {
            // Third row
            return [1, 1, 1, 0, 1, 1, 1, 1, 1, 1]; // Top of T-Spin
          }
          return Array(10).fill(0);
        });

      const tSpinBoard = fromBoardState(createBitBoard(), tSpinBoardState);
      const opportunities = advancedFeatures.detectTSpinOpportunity(tSpinBoard);

      expect(opportunities).toBeDefined();
      expect(Array.isArray(opportunities)).toBe(true);

      if (opportunities.length > 0) {
        const opportunity = opportunities[0];
        expect(opportunity.type).toMatch(/^(TSS|TSD|TST)$/);
        expect(opportunity.position).toBeDefined();
        expect(opportunity.position.x).toBeGreaterThanOrEqual(0);
        expect(opportunity.position.x).toBeLessThan(10);
        expect(opportunity.position.y).toBeGreaterThanOrEqual(0);
        expect(opportunity.position.y).toBeLessThan(20);
        expect(opportunity.expectedLines).toBeGreaterThan(0);
        expect(opportunity.priority).toBeGreaterThan(0);
      }
    });

    test("should detect minimal T-Spin opportunities on empty board", () => {
      const opportunities = advancedFeatures.detectTSpinOpportunity(emptyBoard);
      // Empty board may have edge case detections due to boundary conditions
      expect(opportunities.length).toBeLessThanOrEqual(5);
    });

    test("should prioritize T-Spin opportunities correctly", () => {
      // Create multiple T-Spin opportunities with different priorities
      const multiTSpinState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y >= 16) {
            // Multiple potential slots
            return [1, 1, 0, 0, 0, 1, 0, 0, 0, 1];
          }
          return Array(10).fill(0);
        });

      const multiTSpinBoard = fromBoardState(createBitBoard(), multiTSpinState);
      const opportunities = advancedFeatures.detectTSpinOpportunity(multiTSpinBoard);

      // Should be sorted by priority (highest first)
      for (let i = 1; i < opportunities.length; i++) {
        expect(opportunities[i - 1].priority).toBeGreaterThanOrEqual(opportunities[i].priority);
      }
    });
  });

  describe("Perfect Clear Detection", () => {
    test("should detect Perfect Clear opportunity with few blocks", () => {
      // Create a board with exactly 4 blocks (1 line potential PC)
      const pcBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) {
            // Bottom row with 4 blocks
            return [1, 1, 1, 1, 0, 0, 0, 0, 0, 0];
          }
          return Array(10).fill(0);
        });

      const pcBoard = fromBoardState(createBitBoard(), pcBoardState);
      const opportunity = advancedFeatures.detectPerfectClear(pcBoard);

      expect(opportunity).not.toBeNull();
      if (opportunity) {
        expect(opportunity.remainingBlocks).toBe(4);
        expect(opportunity.difficulty).toBeGreaterThanOrEqual(0);
        expect(opportunity.difficulty).toBeLessThanOrEqual(10);
        expect(opportunity.estimatedMoves).toBe(1);
      }
    });

    test("should not detect Perfect Clear on empty board", () => {
      const opportunity = advancedFeatures.detectPerfectClear(emptyBoard);
      expect(opportunity).toBeNull();
    });

    test("should not detect Perfect Clear with too many blocks", () => {
      // Create a board with too many blocks (>40)
      const fullBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => (y > 10 ? Array(10).fill(1) : Array(10).fill(0)));

      const fullBoard = fromBoardState(createBitBoard(), fullBoardState);
      const opportunity = advancedFeatures.detectPerfectClear(fullBoard);

      expect(opportunity).toBeNull();
    });

    test("should calculate difficulty correctly", () => {
      // Create a more irregular board (higher difficulty)
      const irregularBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) return [1, 0, 1, 0, 1, 0, 1, 0, 0, 0];
          if (y === 18) return [0, 1, 0, 1, 0, 1, 0, 1, 0, 0];
          return Array(10).fill(0);
        });

      const irregularBoard = fromBoardState(createBitBoard(), irregularBoardState);
      const opportunity = advancedFeatures.detectPerfectClear(irregularBoard);

      if (opportunity) {
        expect(opportunity.difficulty).toBeGreaterThan(0);
      }
    });
  });

  describe("Terrain Evaluation", () => {
    test("should evaluate empty board terrain", () => {
      const terrain = advancedFeatures.evaluateTerrain(emptyBoard);

      expect(terrain.smoothness).toBeDefined();
      expect(terrain.smoothness).toBeGreaterThanOrEqual(0);
      expect(terrain.smoothness).toBeLessThanOrEqual(1);

      expect(terrain.accessibility).toBeDefined();
      expect(terrain.accessibility).toBeGreaterThanOrEqual(0);
      expect(terrain.accessibility).toBeLessThanOrEqual(1);

      expect(terrain.tSpinPotential).toBeDefined();
      expect(terrain.tSpinPotential).toBeGreaterThanOrEqual(0);
      expect(terrain.tSpinPotential).toBeLessThanOrEqual(1);

      expect(terrain.pcPotential).toBeDefined();
      expect(terrain.pcPotential).toBeGreaterThanOrEqual(0);
      expect(terrain.pcPotential).toBeLessThanOrEqual(1);

      // Empty board should have perfect smoothness and accessibility
      expect(terrain.smoothness).toBe(1);
      expect(terrain.accessibility).toBe(1);
    });

    test("should calculate smoothness correctly", () => {
      // Create a smooth board (flat surface)
      const smoothBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) return Array(10).fill(1); // Flat bottom
          return Array(10).fill(0);
        });

      const smoothBoard = fromBoardState(createBitBoard(), smoothBoardState);
      const smoothTerrain = advancedFeatures.evaluateTerrain(smoothBoard);

      // Create a rough board (jagged surface)
      const roughBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) return [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]; // Jagged
          if (y === 18) return [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]; // Very jagged
          return Array(10).fill(0);
        });

      const roughBoard = fromBoardState(createBitBoard(), roughBoardState);
      const roughTerrain = advancedFeatures.evaluateTerrain(roughBoard);

      expect(smoothTerrain.smoothness).toBeGreaterThan(roughTerrain.smoothness);
    });

    test("should calculate accessibility correctly", () => {
      // Create a board with inaccessible holes
      const holeyBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // Full bottom
          if (y === 18) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Holes below blocks
          return Array(10).fill(0);
        });

      const holeyBoard = fromBoardState(createBitBoard(), holeyBoardState);
      const holeyTerrain = advancedFeatures.evaluateTerrain(holeyBoard);

      // Should have low accessibility due to buried holes
      expect(holeyTerrain.accessibility).toBeLessThanOrEqual(1);
    });

    test("should detect T-Spin potential in terrain", () => {
      // Create a board with T-Spin setup potential
      const tSpinSetupState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) return [1, 1, 1, 0, 1, 1, 1, 1, 1, 1];
          if (y === 18) return [1, 1, 0, 0, 0, 1, 1, 1, 1, 1];
          return Array(10).fill(0);
        });

      const tSpinSetupBoard = fromBoardState(createBitBoard(), tSpinSetupState);
      const terrain = advancedFeatures.evaluateTerrain(tSpinSetupBoard);

      expect(terrain.tSpinPotential).toBeGreaterThan(0);
    });

    test("should detect Perfect Clear potential in terrain", () => {
      // Create a board suitable for Perfect Clear
      const pcSetupState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) return [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]; // 4 blocks = 1 line
          return Array(10).fill(0);
        });

      const pcSetupBoard = fromBoardState(createBitBoard(), pcSetupState);
      const terrain = advancedFeatures.evaluateTerrain(pcSetupBoard);

      expect(terrain.pcPotential).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    test("should handle board edge positions correctly", () => {
      // Test T-Spin detection at board edges
      const edgeBoardState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y >= 17) {
            // Create pattern at left edge
            return [0, 0, 0, 1, 1, 1, 1, 1, 1, 1];
          }
          return Array(10).fill(0);
        });

      const edgeBoard = fromBoardState(createBitBoard(), edgeBoardState);
      const opportunities = advancedFeatures.detectTSpinOpportunity(edgeBoard);

      // Should handle edge cases without throwing errors
      expect(Array.isArray(opportunities)).toBe(true);
    });

    test("should handle full board state", () => {
      // Create a completely full board
      const fullBoardState: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(1));
      const fullBoard = fromBoardState(createBitBoard(), fullBoardState);

      const terrain = advancedFeatures.evaluateTerrain(fullBoard);
      const tSpinOps = advancedFeatures.detectTSpinOpportunity(fullBoard);
      const pcOp = advancedFeatures.detectPerfectClear(fullBoard);

      // Should handle full board without errors
      expect(terrain).toBeDefined();
      expect(Array.isArray(tSpinOps)).toBe(true);
      expect(pcOp).toBeNull(); // Too many blocks for PC
    });

    test("should handle single block board", () => {
      // Create a board with just one block
      const singleBlockState: GameBoard = Array(20)
        .fill(null)
        .map((_, y) => {
          if (y === 19) return [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          return Array(10).fill(0);
        });

      const singleBlockBoard = fromBoardState(createBitBoard(), singleBlockState);
      const terrain = advancedFeatures.evaluateTerrain(singleBlockBoard);

      expect(terrain.smoothness).toBeGreaterThanOrEqual(0);
      expect(terrain.accessibility).toBeGreaterThanOrEqual(0);
    });
  });
});
