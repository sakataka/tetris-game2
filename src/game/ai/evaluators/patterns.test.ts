import { beforeEach, describe, expect, it } from "bun:test";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import {
  calculatePatternBonus,
  evaluateWithPatterns,
  type GamePhase,
  MidGamePatternDetector,
  PATTERN_TEMPLATES,
  type PatternMatch,
  PatternMatcher,
} from "./patterns";

describe("PatternMatcher", () => {
  let patternMatcher: PatternMatcher;

  beforeEach(() => {
    patternMatcher = new PatternMatcher();
  });

  describe("Pattern Detection", () => {
    it("should detect PCO standard pattern", () => {
      // Create a board with PCO formation
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      // Row 0: L L J J S Z □ □ □ □ (6 blocks)
      board[0] = 0b0000111111;
      // Row 1: L J J T T □ □ □ □ □ (5 blocks)
      board[1] = 0b0000011111;
      // Row 2: O O □ □ □ □ □ □ □ □ (2 blocks)
      board[2] = 0b0000000011;

      const pieceQueue = ["I", "L", "J", "O", "T", "S", "Z"] as any;
      const matches = patternMatcher.detectPatterns(board, pieceQueue, 3);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].pattern.name).toBe("PCO_standard");
    });

    it("should not detect patterns when height constraints not met", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      // Fill board to height 5 (too high for PCO)
      for (let i = 0; i < 5; i++) {
        board[i] = 0b0011111111;
      }

      const pieceQueue = ["I", "L", "J", "O", "T", "S", "Z"] as any;
      const matches = patternMatcher.detectPatterns(board, pieceQueue, 5);

      const pcoMatches = matches.filter((m) => m.pattern.name.includes("PCO"));
      expect(pcoMatches.length).toBe(0);
    });

    it("should detect DT Cannon LS-base pattern", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      // DT Cannon LS-base formation
      board[0] = 0b0000001111; // L L O O
      board[1] = 0b0000001111; // S L J J
      board[2] = 0b0000000111; // S S J
      board[3] = 0b0000011000; // T-slot

      const pieceQueue = ["T", "L", "S", "J", "O"] as any;
      const matches = patternMatcher.detectPatterns(board, pieceQueue, 4);

      const dtMatches = matches.filter((m) => m.pattern.name.includes("DT"));
      expect(dtMatches.length).toBeGreaterThan(0);
    });

    it("should handle empty board", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      const pieceQueue = ["I", "O", "T"] as any;

      const matches = patternMatcher.detectPatterns(board, pieceQueue, 0);

      // Empty board might match some patterns that start from empty
      expect(matches).toBeDefined();
    });

    it("should prioritize patterns by confidence", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      board[0] = 0b0000111111;
      board[1] = 0b0000011111;

      const pieceQueue = ["I", "L", "J", "O", "T", "S", "Z"] as any;
      const matches = patternMatcher.detectPatterns(board, pieceQueue, 2);

      if (matches.length > 1) {
        for (let i = 1; i < matches.length; i++) {
          expect(matches[i - 1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
        }
      }
    });
  });

  describe("Pattern Template Access", () => {
    it("should get pattern by name", () => {
      const pco = patternMatcher.getPattern("PCO_standard");
      expect(pco).toBeDefined();
      expect(pco?.name).toBe("PCO_standard");
      expect(pco?.attackValue).toBe(10);
      expect(pco?.successRate).toBe(0.846);
    });

    it("should return undefined for non-existent pattern", () => {
      const pattern = patternMatcher.getPattern("NON_EXISTENT");
      expect(pattern).toBeUndefined();
    });

    it("should get all patterns", () => {
      const patterns = patternMatcher.getAllPatterns();
      expect(patterns.length).toBe(PATTERN_TEMPLATES.length);
      expect(patterns.every((p) => p.name && p.attackValue > 0)).toBe(true);
    });
  });
});

describe("MidGamePatternDetector", () => {
  let detector: MidGamePatternDetector;

  beforeEach(() => {
    detector = new MidGamePatternDetector();
  });

  it("should detect ST-Stack opportunity when conditions are met", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    // Create a board with ST-notch pattern
    board[4] = 0b1111010111; // Pattern with notch
    board[3] = 0b1111111111;
    board[2] = 0b1111111111;
    board[1] = 0b1111111111;
    board[0] = 0b1111111111;

    const pieceQueue = ["S", "T", "I", "O"] as any;
    const hasOpportunity = detector.detectSTStackOpportunity(board, pieceQueue, 5);

    expect(hasOpportunity).toBe(true);
  });

  it("should not detect ST-Stack when pieces not available", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    board[4] = 0b1111010111;

    const pieceQueue = ["I", "O", "L", "J"] as any; // No S or T
    const hasOpportunity = detector.detectSTStackOpportunity(board, pieceQueue, 5);

    expect(hasOpportunity).toBe(false);
  });

  it("should not detect ST-Stack when height too low", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    const pieceQueue = ["S", "T"] as any;

    const hasOpportunity = detector.detectSTStackOpportunity(board, pieceQueue, 2);

    expect(hasOpportunity).toBe(false);
  });

  it("should not detect ST-Stack when height too high", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    const pieceQueue = ["S", "T"] as any;

    const hasOpportunity = detector.detectSTStackOpportunity(board, pieceQueue, 17);

    expect(hasOpportunity).toBe(false);
  });
});

describe("Pattern Bonus Calculation", () => {
  it("should calculate bonus based on attack value and success rate", () => {
    const match: PatternMatch = {
      pattern: {
        name: "PCO_standard",
        requiredPieces: ["I", "L", "J", "O", "T", "S", "Z"] as any,
        occupiedMask: new Uint32Array(20),
        emptyMask: new Uint32Array(20),
        holdPiece: "I" as any,
        attackValue: 10,
        successRate: 0.846,
      },
      moveSequence: [],
      confidence: 0.9,
      estimatedTurns: 7,
    };

    const bonus = calculatePatternBonus(match, "early");
    expect(bonus).toBeGreaterThan(0);

    // Early game should have higher bonus
    const earlyBonus = calculatePatternBonus(match, "early");
    const lateBonus = calculatePatternBonus(match, "late");
    expect(earlyBonus).toBeGreaterThan(lateBonus);
  });

  it("should apply B2B bonus for T-Spin patterns", () => {
    const dtMatch: PatternMatch = {
      pattern: {
        name: "DT_LS_base",
        requiredPieces: ["L", "S", "J", "O", "T"] as any,
        occupiedMask: new Uint32Array(20),
        emptyMask: new Uint32Array(20),
        holdPiece: "T" as any,
        attackValue: 12,
        successRate: 0.4,
      },
      moveSequence: [],
      confidence: 0.8,
      estimatedTurns: 5,
    };

    const bonus = calculatePatternBonus(dtMatch, "early");
    expect(bonus).toBeGreaterThan(0);

    // DT Cannon should have high value due to B2B bonus
    const baseBonus = 12 * 0.4 * 0.8 * 1.5 * 1.2 * 1.2 * 20; // With all multipliers
    expect(bonus).toBeCloseTo(baseBonus, 1);
  });

  it("should respect custom pattern weights", () => {
    const match: PatternMatch = {
      pattern: {
        name: "PCO_standard",
        requiredPieces: [] as any,
        occupiedMask: new Uint32Array(20),
        emptyMask: new Uint32Array(20),
        attackValue: 10,
        successRate: 0.8,
      },
      moveSequence: [],
      confidence: 1.0,
      estimatedTurns: 5,
    };

    const customWeights = {
      PCO: 200, // Double the default
      DT_Cannon: 120,
      ST_Stack: 80,
      patternTransitionPenalty: -30,
    };

    const defaultBonus = calculatePatternBonus(match, "mid");
    const customBonus = calculatePatternBonus(match, "mid", customWeights);

    expect(customBonus).toBeCloseTo(defaultBonus * 2, 1);
  });
});

describe("Pattern Evaluation Integration", () => {
  it("should enhance base score with pattern bonus", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    board[0] = 0b0000111111; // PCO-like formation
    board[1] = 0b0000011111;
    board[2] = 0b0000000011;

    const pieceQueue = ["I", "L", "J", "O", "T", "S", "Z"] as any;
    const baseScore = 100;

    const enhancedScore = evaluateWithPatterns(board, pieceQueue, "early", baseScore, 3);

    expect(enhancedScore).toBeGreaterThan(baseScore);
  });

  it("should return base score when no patterns detected", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    // Random filled board unlikely to match patterns
    for (let i = 0; i < 10; i++) {
      board[i] = 0b1010101010;
    }

    const pieceQueue = ["I"] as any;
    const baseScore = 100;

    const score = evaluateWithPatterns(board, pieceQueue, "mid", baseScore, 10);

    expect(score).toBe(baseScore);
  });

  it("should handle different game phases appropriately", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    // Create a more complete PCO formation that will be detected
    board[0] = 0b0000111111; // 6 blocks
    board[1] = 0b0000011111; // 5 blocks
    board[2] = 0b0000000011; // 2 blocks
    const pieceQueue = ["I", "L", "J", "O", "T", "S", "Z"] as any;
    const baseScore = 100;

    const phases: GamePhase[] = ["early", "mid", "late", "danger"];
    const scores = phases.map(
      (phase) => evaluateWithPatterns(board, pieceQueue, phase, baseScore, 3), // height 3 for pattern detection
    );

    // Verify we get pattern bonus in early phase
    expect(scores[0]).toBeGreaterThan(baseScore);

    // Early phase should give highest bonus for patterns
    if (scores[0] > baseScore) {
      expect(scores[0]).toBeGreaterThan(scores[2]); // early > late
      expect(scores[0]).toBeGreaterThan(scores[3]); // early > danger
    }
  });
});
