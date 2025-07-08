import { beforeEach, describe, expect, it } from "bun:test";
import { PATTERN_TEMPLATES } from "@/game/ai/evaluators/patterns";
import {
  checkPatternFeasibility,
  DEFAULT_PRUNING_RULES,
  PatternSearch,
  type PatternSearchConfig,
} from "@/game/ai/search/pattern-search";
import type { TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

describe("PatternSearch", () => {
  let search: PatternSearch;
  let config: PatternSearchConfig;

  beforeEach(() => {
    config = {
      maxDepth: 7,
      pruningRules: [DEFAULT_PRUNING_RULES.noEarlyHoles, DEFAULT_PRUNING_RULES.heightLimit],
      timeLimit: 100,
    };
    search = new PatternSearch(config);
  });

  describe("Basic Search Functionality", () => {
    it("should create search instance", () => {
      expect(search).toBeDefined();
    });

    it("should search for PCO pattern completion", () => {
      // Create a board close to PCO completion
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      board[0] = 0b0000111100; // Partial PCO formation
      board[1] = 0b0000011100;

      const pieceQueue: TetrominoTypeName[] = ["L", "J", "I", "O"];
      const pcoTemplate = PATTERN_TEMPLATES.find((t) => t.name === "PCO_standard");

      if (pcoTemplate) {
        const result = search.search(board, pieceQueue, pcoTemplate);

        expect(result.found).toBeDefined();
        expect(result.nodesExplored).toBeGreaterThan(0);
        expect(result.timeElapsed).toBeGreaterThan(0);
        expect(result.path).toBeDefined();
      }
    });

    it("should respect time limit", () => {
      const quickConfig: PatternSearchConfig = {
        maxDepth: 10,
        pruningRules: [],
        timeLimit: 1, // Very short time limit
      };
      const quickSearch = new PatternSearch(quickConfig);

      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      const pieceQueue: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
      const template = PATTERN_TEMPLATES[0];

      const startTime = Date.now();
      const _result = quickSearch.search(board, pieceQueue, template);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(50); // Should timeout quickly
    });

    it("should respect depth limit", () => {
      const shallowConfig: PatternSearchConfig = {
        maxDepth: 2,
        pruningRules: [],
        timeLimit: 1000,
      };
      const shallowSearch = new PatternSearch(shallowConfig);

      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      const pieceQueue: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
      const template = PATTERN_TEMPLATES[0];

      const result = shallowSearch.search(board, pieceQueue, template);

      // With shallow depth, should explore fewer nodes (depth 2 = ~56*56 = 3136 max)
      expect(result.nodesExplored).toBeLessThan(5000);
    });
  });

  describe("Pruning Rules", () => {
    it("should apply no early holes pruning", () => {
      const state = {
        board: new Uint32Array(20),
        piecesPlaced: [] as TetrominoTypeName[],
        movesExecuted: [],
        depth: 1, // Early in search
        holdPiece: null,
        canHold: true,
      };

      // Create board with irreversible holes (filled cells above empty cells)
      state.board[0] = 0b1110111011; // Bottom row with gaps
      state.board[1] = 0b1111011111; // Row above with filled cell over gap

      const template = PATTERN_TEMPLATES[0];
      const shouldPrune = DEFAULT_PRUNING_RULES.noEarlyHoles(state, template);

      expect(shouldPrune).toBe(true);
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

      // Create very high board
      for (let i = 0; i < 18; i++) {
        state.board[i] = 0b1111111111;
      }

      const template = PATTERN_TEMPLATES[0];
      const shouldPrune = DEFAULT_PRUNING_RULES.heightLimit(state, template);

      expect(shouldPrune).toBe(true);
    });

    it("should apply symmetry reduction", () => {
      const move1 = {
        piece: "I" as TetrominoTypeName,
        rotation: 0 as const,
        x: 5,
        y: 0,
        sequence: [],
      };

      const move2 = {
        piece: "I" as TetrominoTypeName,
        rotation: 0 as const,
        x: 5, // Same position
        y: 0,
        sequence: [],
      };

      const state = {
        board: new Uint32Array(20),
        piecesPlaced: ["I", "I"] as TetrominoTypeName[],
        movesExecuted: [move1, move2],
        depth: 3,
        holdPiece: null,
        canHold: true,
      };

      const shouldPrune = DEFAULT_PRUNING_RULES.symmetryReduction(state);

      expect(shouldPrune).toBe(true);
    });
  });

  describe("Search Results", () => {
    it("should return valid search result structure", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      const pieceQueue: TetrominoTypeName[] = ["I"];
      const template = PATTERN_TEMPLATES[0];

      const result = search.search(board, pieceQueue, template);

      expect(result).toHaveProperty("found");
      expect(result).toHaveProperty("path");
      expect(result).toHaveProperty("nodesExplored");
      expect(result).toHaveProperty("timeElapsed");

      expect(typeof result.found).toBe("boolean");
      expect(Array.isArray(result.path)).toBe(true);
      expect(typeof result.nodesExplored).toBe("number");
      expect(typeof result.timeElapsed).toBe("number");
    });

    it("should find empty path when no solution exists", () => {
      const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
      // Fill board almost completely (impossible to complete any pattern)
      for (let i = 0; i < 19; i++) {
        board[i] = 0b1111111111;
      }

      const pieceQueue: TetrominoTypeName[] = ["I"];
      const template = PATTERN_TEMPLATES[0];

      const result = search.search(board, pieceQueue, template);

      expect(result.found).toBe(false);
      expect(result.path.length).toBe(0);
    });
  });
});

describe("Pattern Feasibility Check", () => {
  it("should check pattern feasibility", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    board[0] = 0b0000111111; // Partial PCO
    board[1] = 0b0000011111;

    const pieceQueue: TetrominoTypeName[] = ["I", "L", "J", "O", "T", "S", "Z"];
    const pcoTemplate = PATTERN_TEMPLATES.find((t) => t.name === "PCO_standard");

    if (pcoTemplate) {
      const result = checkPatternFeasibility(board, pieceQueue, pcoTemplate);

      expect(result).toHaveProperty("isPossible");
      expect(result).toHaveProperty("moveSequence");
      expect(result).toHaveProperty("confidence");

      expect(typeof result.isPossible).toBe("boolean");
      expect(Array.isArray(result.moveSequence)).toBe(true);
      expect(typeof result.confidence).toBe("number");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("should return low confidence for impossible patterns", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    // Create board that conflicts with pattern requirements
    for (let i = 0; i < 10; i++) {
      board[i] = 0b1111111111; // Full rows block pattern completion
    }

    const pieceQueue: TetrominoTypeName[] = ["I"];
    const template = PATTERN_TEMPLATES[0];

    const result = checkPatternFeasibility(board, pieceQueue, template);

    expect(result.isPossible).toBe(false);
    expect(result.confidence).toBeLessThan(0.1); // Very low confidence for impossible scenarios
  });

  it("should handle empty piece queue", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    const pieceQueue: TetrominoTypeName[] = [];
    const template = PATTERN_TEMPLATES[0];

    const result = checkPatternFeasibility(board, pieceQueue, template);

    expect(result.isPossible).toBe(false);
    expect(result.confidence).toBe(0.01); // Minimum confidence is now 0.01
  });

  it("should calculate confidence based on search difficulty", () => {
    // Test different scenarios to create confidence diversity
    const scenarios = [
      {
        board: new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT),
        queue: ["I", "O", "T", "S", "Z", "J", "L"],
      },
      {
        board: (() => {
          const b = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
          // Partially filled board that makes some patterns easier
          b[0] = 0b0000111100;
          return b;
        })(),
        queue: ["L", "J", "I", "O", "T"],
      },
      {
        board: new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT),
        queue: ["T", "T", "T"], // Limited pieces
      },
    ];

    const allConfidenceValues: number[] = [];

    for (const scenario of scenarios) {
      const results = PATTERN_TEMPLATES.map((template) =>
        checkPatternFeasibility(scenario.board, scenario.queue, template),
      );
      allConfidenceValues.push(...results.map((r) => r.confidence));
    }

    // Should have varying confidence values across different scenarios
    const uniqueConfidences = new Set(allConfidenceValues);
    expect(uniqueConfidences.size).toBeGreaterThan(1);
  });
});

describe("Pattern Search Performance", () => {
  let perfSearch: PatternSearch;

  beforeEach(() => {
    const perfConfig: PatternSearchConfig = {
      maxDepth: 5,
      pruningRules: [DEFAULT_PRUNING_RULES.noEarlyHoles, DEFAULT_PRUNING_RULES.heightLimit],
      timeLimit: 100,
    };
    perfSearch = new PatternSearch(perfConfig);
  });

  it("should complete search within reasonable time", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    const pieceQueue: TetrominoTypeName[] = ["I", "O", "T", "S"];
    const template = PATTERN_TEMPLATES[0];

    const startTime = Date.now();
    const result = perfSearch.search(board, pieceQueue, template);
    const elapsed = Date.now() - startTime;

    // Should complete within reasonable time (100ms limit + some buffer)
    expect(elapsed).toBeLessThan(200);
    expect(result.timeElapsed).toBeGreaterThan(0);
    expect(result.timeElapsed).toBeLessThan(elapsed + 10); // Allow small tolerance
  });

  it("should explore reasonable number of nodes", () => {
    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    const pieceQueue: TetrominoTypeName[] = ["I", "O", "T"];
    const template = PATTERN_TEMPLATES[0];

    const result = perfSearch.search(board, pieceQueue, template);

    // Should explore some nodes but not explode exponentially
    expect(result.nodesExplored).toBeGreaterThan(0);
    expect(result.nodesExplored).toBeLessThan(10000);
  });

  it("should benefit from pruning rules", () => {
    const noPruningConfig: PatternSearchConfig = {
      maxDepth: 3,
      pruningRules: [],
      timeLimit: 500,
    };

    const withPruningConfig: PatternSearchConfig = {
      maxDepth: 3,
      pruningRules: [DEFAULT_PRUNING_RULES.noEarlyHoles, DEFAULT_PRUNING_RULES.heightLimit],
      timeLimit: 500,
    };

    const noPruningSearch = new PatternSearch(noPruningConfig);
    const withPruningSearch = new PatternSearch(withPruningConfig);

    const board = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
    const pieceQueue: TetrominoTypeName[] = ["I", "O", "T", "S"];
    const template = PATTERN_TEMPLATES[0];

    const noPruningResult = noPruningSearch.search(board, pieceQueue, template);
    const withPruningResult = withPruningSearch.search(board, pieceQueue, template);

    // Pruning should reduce nodes explored
    expect(withPruningResult.nodesExplored).toBeLessThanOrEqual(noPruningResult.nodesExplored);
  });
});
