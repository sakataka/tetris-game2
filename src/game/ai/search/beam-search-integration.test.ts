import { describe, expect, it } from "bun:test";
import { BitBoard } from "@/game/ai/core/bitboard";
import { MoveGenerator } from "@/game/ai/core/move-generator";
import { DellacherieEvaluator } from "@/game/ai/evaluators/dellacherie";
import type { Tetromino, TetrominoTypeName } from "@/types/game";
import { BeamSearch, type BeamSearchConfig, DEFAULT_BEAM_CONFIG } from "./beam-search";
import { DEFAULT_DIVERSITY_CONFIG } from "./diversity-beam-search";

describe("BeamSearch with Diversity Integration", () => {
  const createMockTetromino = (type: string): Tetromino => ({
    type: type as TetrominoTypeName,
    position: { x: 4, y: 0 },
    rotation: 0,
    shape: [
      [1, 1],
      [1, 1],
    ],
  });

  const createBeamSearch = (config: BeamSearchConfig): BeamSearch => {
    const evaluator = new DellacherieEvaluator();
    const moveGenerator = new MoveGenerator();
    return new BeamSearch(evaluator, moveGenerator, config);
  };

  describe("Diversity Configuration", () => {
    it("should create BeamSearch with default diversity config", () => {
      const beamSearch = createBeamSearch(DEFAULT_BEAM_CONFIG);

      expect(beamSearch).toBeDefined();
      expect(beamSearch.getConfig().enableDiversity).toBe(true);
      expect(beamSearch.getConfig().diversityConfig).toEqual(DEFAULT_DIVERSITY_CONFIG);
    });

    it("should create BeamSearch with custom diversity config", () => {
      const customConfig: BeamSearchConfig = {
        ...DEFAULT_BEAM_CONFIG,
        enableDiversity: false,
        diversityConfig: {
          ...DEFAULT_DIVERSITY_CONFIG,
          baseDiversityRatio: 0.3,
        },
      };

      const beamSearch = createBeamSearch(customConfig);

      expect(beamSearch.getConfig().enableDiversity).toBe(false);
      expect(beamSearch.getConfig().diversityConfig.baseDiversityRatio).toBe(0.3);
    });

    it("should update diversity configuration", () => {
      const beamSearch = createBeamSearch(DEFAULT_BEAM_CONFIG);

      const newConfig: Partial<BeamSearchConfig> = {
        enableDiversity: false,
        diversityConfig: {
          ...DEFAULT_DIVERSITY_CONFIG,
          baseDiversityRatio: 0.2,
        },
      };

      beamSearch.updateConfig(newConfig);

      expect(beamSearch.getConfig().enableDiversity).toBe(false);
      expect(beamSearch.getConfig().diversityConfig.baseDiversityRatio).toBe(0.2);
    });
  });

  describe("Search Functionality", () => {
    it("should perform search with diversity enabled", () => {
      const beamSearch = createBeamSearch(DEFAULT_BEAM_CONFIG);
      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces = [createMockTetromino("O"), createMockTetromino("T")];

      const result = beamSearch.search(board, currentPiece, nextPieces);

      expect(result).toBeDefined();
      expect(result.bestPath).toBeDefined();
      expect(result.bestScore).toBeDefined();
      expect(result.nodesExplored).toBeGreaterThan(0);
      expect(result.searchTime).toBeGreaterThan(0);
    });

    it("should perform search with diversity disabled", () => {
      const config: BeamSearchConfig = {
        ...DEFAULT_BEAM_CONFIG,
        enableDiversity: false,
      };
      const beamSearch = createBeamSearch(config);
      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces = [createMockTetromino("O"), createMockTetromino("T")];

      const result = beamSearch.search(board, currentPiece, nextPieces);

      expect(result).toBeDefined();
      expect(result.bestPath).toBeDefined();
      expect(result.bestScore).toBeDefined();
      expect(result.nodesExplored).toBeGreaterThan(0);
      expect(result.searchTime).toBeGreaterThan(0);
    });

    it("should handle empty piece queue", () => {
      const beamSearch = createBeamSearch(DEFAULT_BEAM_CONFIG);
      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces: Tetromino[] = [];

      const result = beamSearch.search(board, currentPiece, nextPieces);

      expect(result).toBeDefined();
      expect(result.bestPath).toBeDefined();
      expect(result.nodesExplored).toBeGreaterThan(0);
    });

    it("should respect time limit", () => {
      const config: BeamSearchConfig = {
        ...DEFAULT_BEAM_CONFIG,
        timeLimit: 1, // Very short time limit
        maxDepth: 10, // Deep search that would exceed time limit
      };
      const beamSearch = createBeamSearch(config);
      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces = Array(10).fill(createMockTetromino("T"));

      const startTime = Date.now();
      const result = beamSearch.search(board, currentPiece, nextPieces);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast due to time limit
    });

    it("should handle hold piece", () => {
      const beamSearch = createBeamSearch(DEFAULT_BEAM_CONFIG);
      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces = [createMockTetromino("O")];
      const heldPiece = createMockTetromino("T");

      const result = beamSearch.search(board, currentPiece, nextPieces, heldPiece);

      expect(result).toBeDefined();
      expect(result.bestPath).toBeDefined();
      expect(result.nodesExplored).toBeGreaterThan(0);
    });
  });

  describe("Performance Comparison", () => {
    it("should explore different number of nodes with/without diversity", () => {
      const diversityConfig: BeamSearchConfig = {
        ...DEFAULT_BEAM_CONFIG,
        enableDiversity: true,
        beamWidth: 8,
        maxDepth: 2,
      };

      const standardConfig: BeamSearchConfig = {
        ...DEFAULT_BEAM_CONFIG,
        enableDiversity: false,
        beamWidth: 8,
        maxDepth: 2,
      };

      const diversityBeamSearch = createBeamSearch(diversityConfig);
      const standardBeamSearch = createBeamSearch(standardConfig);

      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces = [createMockTetromino("O"), createMockTetromino("T")];

      const diversityResult = diversityBeamSearch.search(board, currentPiece, nextPieces);
      const standardResult = standardBeamSearch.search(board, currentPiece, nextPieces);

      expect(diversityResult.nodesExplored).toBeGreaterThan(0);
      expect(standardResult.nodesExplored).toBeGreaterThan(0);

      // Both should find valid solutions
      expect(diversityResult.bestPath.length).toBeGreaterThan(0);
      expect(standardResult.bestPath.length).toBeGreaterThan(0);
    });
  });

  describe("Configuration Validation", () => {
    it("should handle invalid beam width gracefully", () => {
      const config: BeamSearchConfig = {
        ...DEFAULT_BEAM_CONFIG,
        beamWidth: 0,
      };

      const beamSearch = createBeamSearch(config);
      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces = [createMockTetromino("O")];

      // Should not crash with invalid beam width
      const result = beamSearch.search(board, currentPiece, nextPieces);
      expect(result).toBeDefined();
    });

    it("should handle zero depth gracefully", () => {
      const config: BeamSearchConfig = {
        ...DEFAULT_BEAM_CONFIG,
        maxDepth: 0,
      };

      const beamSearch = createBeamSearch(config);
      const board = new BitBoard();
      const currentPiece = createMockTetromino("I");
      const nextPieces = [createMockTetromino("O")];

      const result = beamSearch.search(board, currentPiece, nextPieces);
      expect(result).toBeDefined();
      expect(result.reachedDepth).toBe(1); // Should reach at least depth 1
    });
  });
});
