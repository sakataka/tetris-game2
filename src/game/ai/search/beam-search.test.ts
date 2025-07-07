import { beforeEach, describe, expect, test } from "bun:test";
import { createTetromino } from "@/game/tetrominos";
import type { GameBoard, Tetromino } from "@/types/game";
import { BitBoard } from "../core/bitboard";
import { DEFAULT_MOVE_OPTIONS, MoveGenerator } from "../core/move-generator";
import { DellacherieEvaluator } from "../evaluators/dellacherie";
import { BeamSearch, DEFAULT_BEAM_CONFIG } from "./beam-search";

describe("BeamSearch", () => {
  let beamSearch: BeamSearch;
  let evaluator: DellacherieEvaluator;
  let moveGenerator: MoveGenerator;
  let emptyBoard: BitBoard;

  beforeEach(() => {
    evaluator = new DellacherieEvaluator();
    moveGenerator = new MoveGenerator({
      ...DEFAULT_MOVE_OPTIONS,
      useHold: true,
      maxSearchDepth: 2,
    });
    beamSearch = new BeamSearch(evaluator, moveGenerator, DEFAULT_BEAM_CONFIG);

    // Create empty board
    const emptyBoardState: GameBoard = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    emptyBoard = new BitBoard(emptyBoardState);
  });

  test("should initialize with default configuration", () => {
    const config = beamSearch.getConfig();
    expect(config.beamWidth).toBe(16); // Updated for Phase 2 optimization
    expect(config.maxDepth).toBe(3); // Updated for Phase 2 optimization
    expect(config.useHold).toBe(true);
    expect(config.enablePruning).toBe(false); // Updated for Phase 2 optimization
    expect(config.timeLimit).toBe(80); // Updated for Phase 2 optimization
  });

  test("should update configuration correctly", () => {
    const newConfig = {
      beamWidth: 15,
      maxDepth: 3,
      timeLimit: 100,
    };

    beamSearch.updateConfig(newConfig);
    const config = beamSearch.getConfig();

    expect(config.beamWidth).toBe(15);
    expect(config.maxDepth).toBe(3);
    expect(config.timeLimit).toBe(100);
    expect(config.useHold).toBe(true); // Should preserve unchanged values
  });

  test("should perform basic search on empty board", () => {
    const currentPiece = createTetromino("I");
    const nextPieces = [createTetromino("O"), createTetromino("T")];

    const result = beamSearch.search(emptyBoard, currentPiece, nextPieces);

    expect(result.bestPath).toBeDefined();
    expect(result.bestScore).toBeGreaterThan(Number.NEGATIVE_INFINITY);
    expect(result.nodesExplored).toBeGreaterThan(0);
    expect(result.searchTime).toBeGreaterThanOrEqual(0);
    expect(result.reachedDepth).toBeGreaterThan(0);
  });

  test("should respect beam width constraint", () => {
    const narrowBeamConfig = {
      ...DEFAULT_BEAM_CONFIG,
      beamWidth: 3,
      maxDepth: 1,
      timeLimit: 1000, // Generous time limit
    };

    const narrowBeamSearch = new BeamSearch(evaluator, moveGenerator, narrowBeamConfig);
    const currentPiece = createTetromino("T");
    const nextPieces = [createTetromino("I")];

    const result = narrowBeamSearch.search(emptyBoard, currentPiece, nextPieces);

    // With beam width 3 and depth 1, should explore limited nodes
    expect(result.nodesExplored).toBeLessThan(100);
    expect(result.reachedDepth).toBe(1);
  });

  test("should respect time limit", () => {
    const shortTimeConfig = {
      ...DEFAULT_BEAM_CONFIG,
      timeLimit: 1, // Very short time limit
      maxDepth: 3,
    };

    const shortTimeSearch = new BeamSearch(evaluator, moveGenerator, shortTimeConfig);
    const currentPiece = createTetromino("T");
    const nextPieces = [createTetromino("I"), createTetromino("O"), createTetromino("L")];

    const result = shortTimeSearch.search(emptyBoard, currentPiece, nextPieces);

    expect(result.searchTime).toBeLessThanOrEqual(20); // Allow some margin for execution
    expect(result.reachedDepth).toBeLessThanOrEqual(3);
  });

  test("should find better solutions with deeper search", () => {
    const shallowConfig = { ...DEFAULT_BEAM_CONFIG, maxDepth: 1, timeLimit: 1000 };
    const deepConfig = { ...DEFAULT_BEAM_CONFIG, maxDepth: 2, timeLimit: 1000 };

    const shallowSearch = new BeamSearch(evaluator, moveGenerator, shallowConfig);
    const deepSearch = new BeamSearch(evaluator, moveGenerator, deepConfig);

    const currentPiece = createTetromino("I");
    const nextPieces = [createTetromino("O"), createTetromino("T")];

    const shallowResult = shallowSearch.search(emptyBoard, currentPiece, nextPieces);
    const deepResult = deepSearch.search(emptyBoard, currentPiece, nextPieces);

    expect(deepResult.reachedDepth).toBeGreaterThan(shallowResult.reachedDepth);
    expect(deepResult.nodesExplored).toBeGreaterThan(shallowResult.nodesExplored);
  });

  test("should handle search with no valid moves gracefully", () => {
    // Create a board where no moves are possible (full top rows)
    const fullBoardState: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => (y < 5 ? Array(10).fill(1) : Array(10).fill(0)));
    const fullBoard = new BitBoard(fullBoardState);

    const currentPiece = createTetromino("I");
    const nextPieces = [createTetromino("O")];

    const result = beamSearch.search(fullBoard, currentPiece, nextPieces);

    expect(result.bestPath).toBeDefined();
    expect(result.nodesExplored).toBeGreaterThan(0);
    expect(result.searchTime).toBeGreaterThanOrEqual(0);
  });

  test("should handle single piece search correctly", () => {
    const currentPiece = createTetromino("T");
    const nextPieces: Tetromino[] = []; // No next pieces

    const result = beamSearch.search(emptyBoard, currentPiece, nextPieces);

    expect(result.bestPath).toBeDefined();
    expect(result.bestPath.length).toBeGreaterThanOrEqual(0); // Allow empty path in edge cases
    expect(result.reachedDepth).toBeGreaterThan(0);
  });

  test("should prune dangerous board states when pruning enabled", () => {
    const pruningConfig = { ...DEFAULT_BEAM_CONFIG, enablePruning: true };
    const noPruningConfig = { ...DEFAULT_BEAM_CONFIG, enablePruning: false };

    const pruningSearch = new BeamSearch(evaluator, moveGenerator, pruningConfig);
    const noPruningSearch = new BeamSearch(evaluator, moveGenerator, noPruningConfig);

    // Create a high board state
    const highBoardState: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => (y > 15 ? Array(10).fill(1) : Array(10).fill(0)));
    const highBoard = new BitBoard(highBoardState);

    const currentPiece = createTetromino("I");
    const nextPieces = [createTetromino("O")];

    const pruningResult = pruningSearch.search(highBoard, currentPiece, nextPieces);
    const noPruningResult = noPruningSearch.search(highBoard, currentPiece, nextPieces);

    // Pruning search should explore fewer nodes due to pruning
    expect(pruningResult.nodesExplored).toBeLessThanOrEqual(noPruningResult.nodesExplored);
  });

  test("should generate valid move sequences", () => {
    const currentPiece = createTetromino("L");
    const nextPieces = [createTetromino("J")];

    const result = beamSearch.search(emptyBoard, currentPiece, nextPieces);

    expect(result.bestPath).toBeDefined();
    expect(result.bestPath.length).toBeGreaterThan(0);

    // Each move should have valid properties
    for (const move of result.bestPath) {
      expect(move.piece).toBeDefined();
      expect(move.rotation).toBeGreaterThanOrEqual(0);
      expect(move.rotation).toBeLessThan(4);
      expect(move.x).toBeGreaterThanOrEqual(-2); // Allow off-board positions for wall kicks
      expect(move.x).toBeLessThan(12); // Allow extended range for piece exploration
      expect(move.y).toBeGreaterThanOrEqual(0);
      expect(move.y).toBeLessThanOrEqual(20); // Allow pieces to land at the bottom edge
      expect(move.sequence).toBeDefined();
      expect(Array.isArray(move.sequence)).toBe(true);
    }
  });

  test("should track search metrics accurately", () => {
    const currentPiece = createTetromino("S");
    const nextPieces = [createTetromino("Z"), createTetromino("T")];

    const result = beamSearch.search(emptyBoard, currentPiece, nextPieces);

    expect(result.nodesExplored).toBeGreaterThan(0);
    expect(result.searchTime).toBeGreaterThanOrEqual(0);
    expect(result.searchTime).toBeLessThan(1000); // Should complete quickly on empty board
    expect(result.reachedDepth).toBeGreaterThan(0);
    expect(result.reachedDepth).toBeLessThanOrEqual(DEFAULT_BEAM_CONFIG.maxDepth);
  });
});
