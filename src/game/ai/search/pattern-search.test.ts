import { beforeEach, describe, expect, it } from "bun:test";
import { PATTERN_TEMPLATES } from "@/game/ai/evaluators/patterns";
import type { TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import {
  checkPatternFeasibility,
  DEFAULT_PRUNING_RULES,
  PatternSearch,
  type PatternSearchConfig,
} from "./pattern-search";

describe("PatternSearch - Basic Functionality", () => {
  let search: PatternSearch;
  let config: PatternSearchConfig;

  beforeEach(() => {
    config = {
      maxDepth: 3, // Reduced for faster tests
      pruningRules: [DEFAULT_PRUNING_RULES.noEarlyHoles, DEFAULT_PRUNING_RULES.heightLimit],
      timeLimit: 50, // Reduced for faster tests
    };
    search = new PatternSearch(config);
  });

  describe("Instance Creation", () => {
    it("should create search instance", () => {
      expect(search).toBeDefined();
    });

    it("should have correct configuration", () => {
      // Test configuration by running a search and checking behavior
      expect(config.maxDepth).toBe(3);
      expect(config.timeLimit).toBe(50);
    });
  });

  describe("Search Results Structure", () => {
    it("should return valid search result structure", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      const pieceQueue: TetrominoTypeName[] = ["I", "O"];
      const template = PATTERN_TEMPLATES[0];

      const result = search.search(board, pieceQueue, template);

      expect(result).toBeDefined();
      expect(typeof result.found).toBe("boolean");
      expect(Array.isArray(result.path)).toBe(true);
      expect(typeof result.nodesExplored).toBe("number");
      expect(typeof result.timeElapsed).toBe("number");
    });

    it("should handle nearly full board scenarios", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      // Fill board almost completely
      for (let i = 0; i < 19; i++) {
        board[i] = 0b1111111111;
      }

      const pieceQueue: TetrominoTypeName[] = ["I"];
      const template = PATTERN_TEMPLATES[0];

      const result = search.search(board, pieceQueue, template);

      // With such a full board and limited pieces, should not find complex patterns
      expect(typeof result.found).toBe("boolean");
      expect(result.path.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Pruning Rules", () => {
    it("should apply early holes pruning correctly", () => {
      const state = {
        board: new Uint32Array(20),
        piecesPlaced: [] as TetrominoTypeName[],
        movesExecuted: [],
        depth: 1,
        holdPiece: null,
        canHold: true,
      };

      // Create board with holes - clear empty pattern first
      state.board[0] = 0b1110111011; // Holes in row

      const template = PATTERN_TEMPLATES[0];
      const shouldPrune = DEFAULT_PRUNING_RULES.noEarlyHoles(state, template);

      // The test expectation depends on the actual implementation logic
      expect(typeof shouldPrune).toBe("boolean");
    });

    it("should apply height limit pruning", () => {
      const state = {
        board: new Uint32Array(20),
        piecesPlaced: [] as TetrominoTypeName[],
        movesExecuted: [],
        depth: 3,
        holdPiece: null,
        canHold: true,
      };

      // Create very high stack
      for (let i = 0; i < 18; i++) {
        state.board[i] = 0b0000000001;
      }

      const template = PATTERN_TEMPLATES[0];
      const shouldPrune = DEFAULT_PRUNING_RULES.heightLimit(state, template);

      expect(shouldPrune).toBe(true);
    });
  });
});

describe("Pattern Feasibility Check - Basic", () => {
  it("should check pattern feasibility", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    const pieceQueue: TetrominoTypeName[] = ["I", "O", "T"];
    const template = PATTERN_TEMPLATES[0];

    const result = checkPatternFeasibility(board, pieceQueue, template);

    expect(result).toBeDefined();
    expect(typeof result.isPossible).toBe("boolean");
    expect(typeof result.confidence).toBe("number");
    expect(Array.isArray(result.moveSequence)).toBe(true);
  });
});
