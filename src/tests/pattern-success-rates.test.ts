import { describe, expect, it } from "bun:test";

import { PATTERN_TEMPLATES, PatternMatcher } from "@/game/ai/evaluators/patterns";
import { checkPatternFeasibility } from "@/game/ai/search/pattern-search";
import type { TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

/**
 * Pattern Success Rate Validation Tests
 *
 * This test suite validates that the implemented pattern success rates
 * match the expected rates specified in the GitHub issue:
 * - PCO standard (I-piece hold): 84.6% success rate
 * - PCO vertical I: 61.2% success rate
 * - DT Cannon LS-base: 40% success rate
 * - ST-Stack unit: 90% success rate
 */

describe("Pattern Success Rate Validation", () => {
  const patternMatcher = new PatternMatcher();

  describe("Perfect Clear Opener (PCO) Success Rates", () => {
    it("should achieve 84.6% success rate for PCO standard with I-piece hold", () => {
      const pcoStandard = PATTERN_TEMPLATES.find((t) => t.name === "PCO_standard");
      expect(pcoStandard).toBeDefined();
      expect(pcoStandard!.successRate).toBe(0.846);
      expect(pcoStandard!.holdPiece).toBe("I");
      expect(pcoStandard!.attackValue).toBe(10);
    });

    it("should achieve 61.2% success rate for PCO with vertical I placement", () => {
      const pcoVertical = PATTERN_TEMPLATES.find((t) => t.name === "PCO_vertical_I");
      expect(pcoVertical).toBeDefined();
      expect(pcoVertical!.successRate).toBe(0.612);
      expect(pcoVertical!.holdPiece).toBeUndefined();
      expect(pcoVertical!.attackValue).toBe(10);
    });

    it("should correctly validate PCO feasibility with optimal piece queue", () => {
      // Create empty board for PCO
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);

      // Optimal piece queue for PCO (all required pieces available)
      const optimalQueue: TetrominoTypeName[] = ["L", "J", "O", "T", "S", "Z", "I"];
      const pcoTemplate = PATTERN_TEMPLATES.find((t) => t.name === "PCO_standard")!;

      const result = checkPatternFeasibility(board, optimalQueue, pcoTemplate);

      expect(result.isPossible).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8); // Should be high with optimal queue
    });

    it("should reduce confidence with suboptimal piece queue", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);

      // Missing key pieces for PCO
      const suboptimalQueue: TetrominoTypeName[] = ["T", "T", "T", "T", "T", "T", "T"];
      const pcoTemplate = PATTERN_TEMPLATES.find((t) => t.name === "PCO_standard")!;

      const result = checkPatternFeasibility(board, suboptimalQueue, pcoTemplate);

      expect(result.isPossible).toBe(false);
      expect(result.confidence).toBe(0); // Should be very low/zero with missing pieces
    });
  });

  describe("DT Cannon Success Rates", () => {
    it("should achieve 40% success rate for DT Cannon LS-base", () => {
      const dtCannon = PATTERN_TEMPLATES.find((t) => t.name === "DT_LS_base");
      expect(dtCannon).toBeDefined();
      expect(dtCannon!.successRate).toBe(0.4);
      expect(dtCannon!.holdPiece).toBe("T");
      expect(dtCannon!.attackValue).toBe(12);
    });

    it("should validate DT Cannon setup requirements", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);

      // Queue with required pieces for DT Cannon
      const dtQueue: TetrominoTypeName[] = ["L", "S", "J", "O", "T", "I", "Z"];
      const dtTemplate = PATTERN_TEMPLATES.find((t) => t.name === "DT_LS_base")!;

      const result = checkPatternFeasibility(board, dtQueue, dtTemplate);

      // Should be possible with all required pieces
      expect(result.isPossible).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.3); // Should reflect template success rate
    });

    it("should require specific piece arrangement for DT Cannon", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);

      // Missing L piece which is critical for LS-base
      const incompleteQueue: TetrominoTypeName[] = ["S", "J", "O", "T", "I", "Z", "I"];
      const dtTemplate = PATTERN_TEMPLATES.find((t) => t.name === "DT_LS_base")!;

      const result = checkPatternFeasibility(board, incompleteQueue, dtTemplate);

      expect(result.isPossible).toBe(false);
    });
  });

  describe("ST-Stack Success Rates", () => {
    it("should achieve 90% success rate for ST-Stack unit", () => {
      const stStack = PATTERN_TEMPLATES.find((t) => t.name === "ST_Stack_unit");
      expect(stStack).toBeDefined();
      expect(stStack!.successRate).toBe(0.9);
      expect(stStack!.attackValue).toBe(4);
      expect(stStack!.holdPiece).toBeUndefined(); // No specific hold requirement
    });

    it("should validate ST-Stack height requirements", () => {
      const stTemplate = PATTERN_TEMPLATES.find((t) => t.name === "ST_Stack_unit")!;

      expect(stTemplate.minHeight).toBe(4);
      expect(stTemplate.maxHeight).toBe(16);
    });

    it("should detect ST-Stack opportunities in mid-game", () => {
      // Create mid-game board with appropriate height
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      for (let i = 0; i < 6; i++) {
        board[i] = 0b1111111111; // Fill bottom rows
      }

      // Create notch pattern that could support ST-Stack
      board[6] = 0b1111010111; // Row with notch

      const stQueue: TetrominoTypeName[] = ["S", "T", "I", "O", "J", "L", "Z"];
      const stTemplate = PATTERN_TEMPLATES.find((t) => t.name === "ST_Stack_unit")!;

      const result = checkPatternFeasibility(board, stQueue, stTemplate);

      // ST-Stack should be highly feasible with S and T available
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe("Pattern Detection Integration", () => {
    it("should correctly prioritize patterns by success rate and attack value", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      const fullQueue: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

      const patterns = patternMatcher.detectPatterns(board, fullQueue, 2);

      if (patterns.length > 1) {
        // Patterns should be sorted by confidence (which incorporates success rate)
        for (let i = 0; i < patterns.length - 1; i++) {
          expect(patterns[i].confidence).toBeGreaterThanOrEqual(patterns[i + 1].confidence);
        }
      }
    });

    it("should adjust confidence based on piece queue position", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);

      // Queue with I-piece first (optimal for PCO)
      const earlyIQueue: TetrominoTypeName[] = ["I", "L", "J", "O", "T", "S", "Z"];
      const pcoTemplate = PATTERN_TEMPLATES.find((t) => t.name === "PCO_standard")!;

      const earlyResult = checkPatternFeasibility(board, earlyIQueue, pcoTemplate);

      // Queue with I-piece later (suboptimal)
      const lateIQueue: TetrominoTypeName[] = ["L", "J", "O", "T", "S", "Z", "I"];
      const lateResult = checkPatternFeasibility(board, lateIQueue, pcoTemplate);

      // Early I-piece should have higher confidence
      expect(earlyResult.confidence).toBeGreaterThan(lateResult.confidence);
    });

    it("should validate pattern mask accuracy", () => {
      // Test that pattern masks are correctly defined
      for (const template of PATTERN_TEMPLATES) {
        expect(template.occupiedMask).toBeDefined();
        expect(template.emptyMask).toBeDefined();
        expect(template.occupiedMask.length).toBeGreaterThan(0);
        expect(template.emptyMask.length).toBeGreaterThan(0);

        // Ensure masks don't conflict (occupied and empty shouldn't overlap)
        for (
          let row = 0;
          row < Math.min(template.occupiedMask.length, template.emptyMask.length);
          row++
        ) {
          const overlap = template.occupiedMask[row] & template.emptyMask[row];
          expect(overlap).toBe(0);
        }
      }
    });
  });

  describe("Success Rate Statistical Validation", () => {
    it("should demonstrate pattern success rates through simulation", async () => {
      // This test simulates multiple scenarios to validate success rates
      const simulationResults: Record<string, { attempts: number; successes: number }> = {};

      for (const template of PATTERN_TEMPLATES) {
        simulationResults[template.name] = { attempts: 0, successes: 0 };

        // Run 50 simulations per pattern
        for (let sim = 0; sim < 50; sim++) {
          const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);

          // Generate random but reasonable piece queue
          const queue = generateRandomPieceQueue(7);
          const result = checkPatternFeasibility(board, queue, template);

          simulationResults[template.name].attempts++;
          if (result.isPossible && result.confidence > 0.5) {
            simulationResults[template.name].successes++;
          }
        }
      }

      // Validate that simulation results roughly align with expected success rates
      for (const template of PATTERN_TEMPLATES) {
        const { attempts, successes } = simulationResults[template.name];
        const observedRate = successes / attempts;
        const expectedRate = template.successRate;

        console.log(
          `${template.name}: Expected ${(expectedRate * 100).toFixed(1)}%, Observed ${(observedRate * 100).toFixed(1)}%`,
        );

        // Allow for statistical variance (±30% tolerance for small sample size)
        const tolerance = 0.3;
        expect(observedRate).toBeGreaterThanOrEqual(expectedRate * (1 - tolerance));
        expect(observedRate).toBeLessThanOrEqual(expectedRate * (1 + tolerance) + 0.1);
      }
    });
  });
});

/**
 * Generate a random piece queue that includes all 7 tetromino types
 */
function generateRandomPieceQueue(length: number): TetrominoTypeName[] {
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
  const queue: TetrominoTypeName[] = [];

  for (let i = 0; i < length; i++) {
    if (i < 7) {
      // First 7 pieces ensure all types are included
      queue.push(pieces[i]);
    } else {
      // Additional pieces are random
      queue.push(pieces[Math.floor(Math.random() * pieces.length)]);
    }
  }

  // Shuffle the queue
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  return queue;
}
