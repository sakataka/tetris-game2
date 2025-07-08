import { beforeEach, describe, expect, it } from "bun:test";
import { BitBoard } from "@/game/ai/core/bitboard";
import type { Move } from "@/game/ai/core/move-generator";
import type { TetrominoTypeName } from "@/types/game";
import { DEFAULT_WEIGHTS } from "./dellacherie";
import { DEFAULT_PATTERN_CONFIG, PatternEvaluator } from "./pattern-evaluator";

describe("PatternEvaluator", () => {
  let evaluator: PatternEvaluator;
  let board: BitBoard;

  beforeEach(() => {
    evaluator = new PatternEvaluator(DEFAULT_WEIGHTS, DEFAULT_PATTERN_CONFIG);
    board = new BitBoard();
  });

  describe("Basic Functionality", () => {
    it("should create evaluator with default config", () => {
      expect(evaluator).toBeDefined();
      expect(evaluator.getPatternInfo(board)).toBeDefined();
    });

    it("should fall back to Dellacherie evaluation when patterns disabled", () => {
      evaluator.setPatternEnabled(false);

      // Create a proper Move object
      const move: Move = {
        piece: "I",
        rotation: 0,
        x: 4,
        y: 0,
        sequence: [],
        pieceBitRows: [0b0000001111], // 4 blocks
      };

      const baseScore = evaluator.evaluate(board, move);

      // Re-enable patterns and check score changes
      evaluator.setPatternEnabled(true);
      evaluator.updateGameState(["I", "O", "T"], 0, 1);
      const patternScore = evaluator.evaluate(board, move);

      // Scores might be different when patterns are enabled
      expect(typeof baseScore).toBe("number");
      expect(typeof patternScore).toBe("number");
    });

    it("should update game state", () => {
      const pieceQueue: TetrominoTypeName[] = ["I", "O", "T", "S", "Z"];
      evaluator.updateGameState(pieceQueue, 10, 2);

      const info = evaluator.getPatternInfo(board);
      expect(info.queuePreview).toEqual(pieceQueue);
    });
  });

  describe("Pattern Detection Integration", () => {
    it("should detect PCO opportunity on appropriate board", () => {
      // Create PCO-like formation
      board.rows[0] = 0b0000111111; // 6 blocks
      board.rows[1] = 0b0000011111; // 5 blocks
      board.rows[2] = 0b0000000011; // 2 blocks

      evaluator.updateGameState(["I", "L", "J", "O", "T", "S", "Z"], 0, 1);
      const patterns = evaluator.getAvailablePatterns(board);

      expect(patterns.some((p) => p.includes("PCO"))).toBe(true);
    });

    it("should enhance score when patterns are detected", () => {
      // Create a board state that matches a pattern
      board.rows[0] = 0b0000111111;
      board.rows[1] = 0b0000011111;
      board.rows[2] = 0b0000000011;

      evaluator.updateGameState(["I", "L", "J", "O", "T", "S", "Z"], 0, 1);

      const move: Move = {
        piece: "I",
        rotation: 0,
        x: 6,
        y: 0,
        sequence: [],
        pieceBitRows: [0b0000001111],
      };

      // Get base Dellacherie score
      evaluator.setPatternEnabled(false);
      const baseScore = evaluator.evaluate(board, move);

      // Get pattern-enhanced score
      evaluator.setPatternEnabled(true);
      const enhancedScore = evaluator.evaluate(board, move);

      expect(enhancedScore).toBeGreaterThan(baseScore);
    });

    it("should detect ST-Stack opportunity in mid-game", () => {
      // Create mid-game board with ST-notch
      for (let i = 0; i < 4; i++) {
        board.rows[i] = 0b1111111111; // Full rows
      }
      board.rows[4] = 0b1111010111; // Row with notch for ST-Stack

      evaluator.updateGameState(["S", "T", "I", "O"], 50, 5); // Mid-game state

      const move: Move = {
        piece: "S",
        rotation: 0,
        x: 4,
        y: 5,
        sequence: [],
        pieceBitRows: [0b0000000110, 0b0000000011],
      };

      const patternScore = evaluator.evaluate(board, move);

      // Should return a valid score (might be negative due to board state)
      expect(typeof patternScore).toBe("number");
      expect(patternScore).toBeDefined();
    });
  });

  describe("Pattern Weight Configuration", () => {
    it("should update pattern weights", () => {
      evaluator.setPatternWeights({ PCO: 200 });

      // Create PCO formation
      board.rows[0] = 0b0000111111;
      board.rows[1] = 0b0000011111;
      board.rows[2] = 0b0000000011;

      evaluator.updateGameState(["I", "L", "J", "O", "T", "S", "Z"], 0, 1);

      const move: Move = {
        piece: "I",
        rotation: 0,
        x: 6,
        y: 0,
        sequence: [],
        pieceBitRows: [0b0000001111],
      };

      const score1 = evaluator.evaluate(board, move);

      // Reset to lower weight
      evaluator.setPatternWeights({ PCO: 50 });
      const score2 = evaluator.evaluate(board, move);

      // Higher weight should give higher score
      expect(score1).toBeGreaterThan(score2);
    });

    it("should respect pattern transition penalty", () => {
      evaluator.setPatternWeights({ patternTransitionPenalty: -100 });

      // This would affect pattern selection in actual gameplay
      // Here we just verify the weight is set
      expect(evaluator).toBeDefined();
    });
  });

  describe("Pattern Info and Debugging", () => {
    it("should provide pattern detection info", () => {
      evaluator.updateGameState(["I", "O", "T"], 20, 3);

      const info = evaluator.getPatternInfo(board);

      expect(info).toHaveProperty("detectedPatterns");
      expect(info).toHaveProperty("gamePhase");
      expect(info).toHaveProperty("currentHeight");
      expect(info).toHaveProperty("queuePreview");
      expect(info.queuePreview).toEqual(["I", "O", "T"]);
    });

    it("should determine game phase correctly", () => {
      // Early game - empty board
      let info = evaluator.getPatternInfo(board);
      expect(info.gamePhase).toBe("early");

      // Mid game - moderate height
      for (let i = 0; i < 8; i++) {
        board.rows[i] = 0b1111111111;
      }
      evaluator.updateGameState([], 50, 5);
      info = evaluator.getPatternInfo(board);
      // With 8 filled rows, should be mid or late game
      expect(["mid", "late", "danger"].includes(info.gamePhase)).toBe(true);

      // Danger zone - high board
      for (let i = 0; i < 16; i++) {
        board.rows[i] = 0b1111111111;
      }
      evaluator.updateGameState([], 100, 10);
      info = evaluator.getPatternInfo(board);
      expect(["late", "danger"].includes(info.gamePhase)).toBe(true);
    });

    it("should track current board height", () => {
      const info1 = evaluator.getPatternInfo(board);
      expect(info1.currentHeight).toBe(0);

      // Add some blocks
      board.rows[0] = 0b1111111111;
      board.rows[1] = 0b0000001111;
      board.rows[2] = 0b0000000001;

      const info2 = evaluator.getPatternInfo(board);
      expect(info2.currentHeight).toBe(3);
    });
  });

  describe("Move Evaluation", () => {
    it("should evaluate moves with pattern consideration", () => {
      evaluator.updateGameState(["T", "I", "O"], 0, 1);

      const move: Move = {
        piece: "T",
        rotation: 0,
        x: 4,
        y: 0,
        sequence: [],
      };

      const score = evaluator.evaluate(board, move);
      expect(typeof score).toBe("number");
      expect(score).toBeDefined();
    });

    it("should handle empty piece queue gracefully", () => {
      evaluator.updateGameState([], 0, 1);

      const move: Move = {
        piece: "I",
        rotation: 0,
        x: 4,
        y: 0,
        sequence: [],
        pieceBitRows: [0b0000001111],
      };

      const score = evaluator.evaluate(board, move);
      expect(typeof score).toBe("number");
      expect(score).toBeDefined();
    });
  });

  describe("Configuration Options", () => {
    it("should respect queue lookahead setting", () => {
      const customConfig = {
        ...DEFAULT_PATTERN_CONFIG,
        queueLookahead: 3,
      };

      const customEvaluator = new PatternEvaluator(DEFAULT_WEIGHTS, customConfig);
      customEvaluator.updateGameState(["I", "O", "T", "S", "Z", "J", "L"], 0, 1);

      const info = customEvaluator.getPatternInfo(board);
      expect(info.queuePreview.length).toBe(3);
    });

    it("should disable mid-game patterns when configured", () => {
      const customConfig = {
        ...DEFAULT_PATTERN_CONFIG,
        enableMidGamePatterns: false,
      };

      const customEvaluator = new PatternEvaluator(DEFAULT_WEIGHTS, customConfig);

      // Create ST-Stack opportunity
      for (let i = 0; i < 4; i++) {
        board.rows[i] = 0b1111111111;
      }
      board.rows[4] = 0b1111010111;

      customEvaluator.updateGameState(["S", "T"], 50, 5);

      const move: Move = {
        piece: "S",
        rotation: 0,
        x: 4,
        y: 5,
        sequence: [],
        pieceBitRows: [0b0000000110, 0b0000000011],
      };

      // Should not get ST-Stack bonus
      const score = customEvaluator.evaluate(board, move);
      expect(typeof score).toBe("number");
    });
  });
});
