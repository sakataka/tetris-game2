import { beforeEach, describe, expect, test } from "bun:test";
import { createTetromino } from "@/game/tetrominos";
import type { GameBoard, Tetromino } from "@/types/game";
import { type BitBoardData, createBitBoard } from "../core/bitboard";
import { DEFAULT_MOVE_OPTIONS, MoveGenerator } from "../core/move-generator";
import { DellacherieEvaluator } from "../evaluators/dellacherie";
import { BeamSearch, DEFAULT_BEAM_CONFIG } from "./beam-search";
import {
  createHoldSearchState,
  DEFAULT_HOLD_OPTIONS,
  evaluateHoldStrategy,
  getHoldSearchOptions,
  HoldAwareSearch,
  performHoldSearch,
  updateHoldSearchOptions,
} from "./hold-search";

describe("HoldAwareSearch", () => {
  let holdSearch: HoldAwareSearch;
  let beamSearch: BeamSearch;
  let evaluator: DellacherieEvaluator;
  let moveGenerator: MoveGenerator;
  let emptyBoard: BitBoardData;

  // Also test functional API
  let holdSearchState: ReturnType<typeof createHoldSearchState>;

  beforeEach(() => {
    evaluator = new DellacherieEvaluator();
    moveGenerator = new MoveGenerator({
      ...DEFAULT_MOVE_OPTIONS,
      useHold: true,
      maxSearchDepth: 2,
    });
    beamSearch = new BeamSearch(evaluator, moveGenerator, DEFAULT_BEAM_CONFIG);
    holdSearch = new HoldAwareSearch(beamSearch, DEFAULT_HOLD_OPTIONS);
    holdSearchState = createHoldSearchState(beamSearch, DEFAULT_HOLD_OPTIONS);

    // Create empty board
    const emptyBoardState: GameBoard = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    emptyBoard = createBitBoard(emptyBoardState);
  });

  test("should initialize with default configuration", () => {
    const options = holdSearch.getOptions();
    expect(options.allowHoldUsage).toBe(true);
    expect(options.holdPenalty).toBe(5);
    expect(options.maxHoldUsage).toBe(3);

    // Test functional API
    const functionalOptions = getHoldSearchOptions(holdSearchState);
    expect(functionalOptions.allowHoldUsage).toBe(true);
    expect(functionalOptions.holdPenalty).toBe(5);
    expect(functionalOptions.maxHoldUsage).toBe(3);
  });

  test("should update options correctly", () => {
    const newOptions = {
      allowHoldUsage: false,
      holdPenalty: 10,
    };

    holdSearch.updateOptions(newOptions);
    const options = holdSearch.getOptions();

    expect(options.allowHoldUsage).toBe(false);
    expect(options.holdPenalty).toBe(10);
    expect(options.maxHoldUsage).toBe(3); // Should preserve unchanged values

    // Test functional API
    const updatedState = updateHoldSearchOptions(holdSearchState, newOptions);
    const functionalOptions = getHoldSearchOptions(updatedState);
    expect(functionalOptions.allowHoldUsage).toBe(false);
    expect(functionalOptions.holdPenalty).toBe(10);
    expect(functionalOptions.maxHoldUsage).toBe(3);
  });

  test("should perform search without Hold when disabled", () => {
    const disabledHoldOptions = {
      ...DEFAULT_HOLD_OPTIONS,
      allowHoldUsage: false,
    };

    const noHoldSearch = new HoldAwareSearch(beamSearch, disabledHoldOptions);
    const currentPiece = createTetromino("O");
    const nextPieces = [createTetromino("I"), createTetromino("T")];
    const heldPiece = createTetromino("L");

    const result = noHoldSearch.searchWithHold(emptyBoard, currentPiece, nextPieces, heldPiece);

    expect(result.usedHold).toBe(false);
    expect(result.holdPenaltyApplied).toBe(0);
    expect(result.alternativeResults).toHaveLength(1); // Only normal search
  });

  test("should consider both Hold and non-Hold paths", () => {
    const currentPiece = createTetromino("O");
    const nextPieces = [createTetromino("I"), createTetromino("T")];
    const heldPiece = createTetromino("L");

    const result = holdSearch.searchWithHold(emptyBoard, currentPiece, nextPieces, heldPiece);

    expect(result.alternativeResults).toHaveLength(2); // Normal and Hold paths
    expect(result.usedHold).toBeDefined();
    expect(result.holdPenaltyApplied).toBeGreaterThanOrEqual(0);

    // Test functional API
    const functionalResult = performHoldSearch(
      holdSearchState,
      emptyBoard,
      currentPiece,
      nextPieces,
      heldPiece,
    );
    expect(functionalResult.alternativeResults).toHaveLength(2);
    expect(functionalResult.usedHold).toBeDefined();
  });

  test("should apply Hold penalty when Hold is used", () => {
    const highPenaltyOptions = {
      ...DEFAULT_HOLD_OPTIONS,
      holdPenalty: 100, // High penalty to discourage Hold usage
    };

    const penaltySearch = new HoldAwareSearch(beamSearch, highPenaltyOptions);
    const currentPiece = createTetromino("O");
    const nextPieces = [createTetromino("I")];
    const heldPiece = createTetromino("I"); // Better piece in hold

    const result = penaltySearch.searchWithHold(emptyBoard, currentPiece, nextPieces, heldPiece);

    if (result.usedHold) {
      expect(result.holdPenaltyApplied).toBe(100);
    }
  });

  test("should handle search with no held piece", () => {
    const currentPiece = createTetromino("T");
    const nextPieces = [createTetromino("I"), createTetromino("O")];

    const result = holdSearch.searchWithHold(emptyBoard, currentPiece, nextPieces);

    expect(result.bestPath).toBeDefined();
    expect(result.alternativeResults).toHaveLength(2); // Should still try Hold with next piece
  });

  test("should handle search with no next pieces gracefully", () => {
    const currentPiece = createTetromino("I");
    const nextPieces: Tetromino[] = [];
    const heldPiece = createTetromino("T");

    const result = holdSearch.searchWithHold(emptyBoard, currentPiece, nextPieces, heldPiece);

    expect(result.bestPath).toBeDefined();
    expect(result.alternativeResults).toHaveLength(2); // Normal and Hold with held piece
  });

  test("should evaluate piece utility correctly", () => {
    const currentPiece = createTetromino("I");
    const nextPieces = [createTetromino("O")];
    const heldPiece = createTetromino("T");

    const evaluation = holdSearch.evaluateHoldStrategy(
      emptyBoard,
      currentPiece,
      nextPieces,
      heldPiece,
    );

    expect(evaluation.currentPieceScore).toBeGreaterThan(0);
    expect(evaluation.heldPieceScore).toBeGreaterThan(0);
    expect(evaluation.nextPieceScore).toBeGreaterThan(0);
    expect(evaluation.shouldUseHold).toBeDefined();
    expect(evaluation.confidence).toBeGreaterThanOrEqual(0);
    expect(evaluation.confidence).toBeLessThanOrEqual(1);

    // Test functional API
    const functionalEvaluation = evaluateHoldStrategy(
      holdSearchState,
      emptyBoard,
      currentPiece,
      nextPieces,
      heldPiece,
    );
    expect(functionalEvaluation.currentPieceScore).toBeGreaterThan(0);
    expect(functionalEvaluation.shouldUseHold).toBeDefined();
  });

  test("should prefer I-piece when board is high", () => {
    // Create a high board state
    const highBoardState: GameBoard = Array(20)
      .fill(null)
      .map((_, y) =>
        y > 10
          ? Array(10)
              .fill(null)
              .map((_, x) => (x === 9 ? 0 : 1))
          : Array(10).fill(0),
      );
    const highBoard = createBitBoard(highBoardState);

    const currentPiece = createTetromino("O");
    const nextPieces = [createTetromino("T")];
    const heldPiece = createTetromino("I"); // I-piece should have high utility on high board

    const evaluation = holdSearch.evaluateHoldStrategy(
      highBoard,
      currentPiece,
      nextPieces,
      heldPiece,
    );

    // I-piece should have higher utility than O-piece when board is high
    expect(evaluation.heldPieceScore).toBeGreaterThan(evaluation.currentPieceScore);
    expect(evaluation.shouldUseHold).toBe(true);
  });

  test("should select best result based on score", () => {
    const currentPiece = createTetromino("S");
    const nextPieces = [createTetromino("Z")];
    const heldPiece = createTetromino("I");

    const result = holdSearch.searchWithHold(emptyBoard, currentPiece, nextPieces, heldPiece);

    expect(result.alternativeResults).toHaveLength(2);

    // Result should be the best of the alternatives
    const bestAlternative = result.alternativeResults.reduce((best, current) =>
      current.bestScore > best.bestScore ? current : best,
    );

    expect(result.bestScore).toBeGreaterThanOrEqual(
      bestAlternative.bestScore - DEFAULT_HOLD_OPTIONS.holdPenalty,
    );
  });

  test("should handle Hold strategy evaluation with confidence scoring", () => {
    const currentPiece = createTetromino("O"); // Generally less useful
    const nextPieces = [createTetromino("I")]; // Very useful piece
    const heldPiece = createTetromino("T"); // Moderately useful

    const evaluation = holdSearch.evaluateHoldStrategy(
      emptyBoard,
      currentPiece,
      nextPieces,
      heldPiece,
    );

    expect(evaluation.confidence).toBeGreaterThan(0);

    // With significant utility differences, confidence should be reasonably high
    if (
      Math.max(evaluation.nextPieceScore, evaluation.heldPieceScore) -
        evaluation.currentPieceScore >=
      3
    ) {
      expect(evaluation.shouldUseHold).toBe(true);
    }
  });

  test("should preserve search metadata in Hold result", () => {
    const currentPiece = createTetromino("L");
    const nextPieces = [createTetromino("J")];

    const result = holdSearch.searchWithHold(emptyBoard, currentPiece, nextPieces);

    expect(result.bestPath).toBeDefined();
    expect(result.bestScore).toBeDefined();
    expect(result.nodesExplored).toBeGreaterThan(0);
    expect(result.searchTime).toBeGreaterThanOrEqual(0);
    expect(result.reachedDepth).toBeGreaterThan(0);
    expect(result.usedHold).toBeDefined();
    expect(result.alternativeResults).toBeDefined();
    expect(result.holdPenaltyApplied).toBeGreaterThanOrEqual(0);
  });

  test("should handle equal scores by preferring fewer nodes explored", () => {
    // Use a simple board state where scores might be equal
    const currentPiece = createTetromino("I");
    const nextPieces = [createTetromino("I")]; // Same piece type

    const result = holdSearch.searchWithHold(emptyBoard, currentPiece, nextPieces);

    expect(result.alternativeResults).toHaveLength(2);

    // If scores are very close, should prefer path with fewer nodes explored
    const scoreDifference = Math.abs(
      result.alternativeResults[0].bestScore - result.alternativeResults[1].bestScore,
    );
    if (scoreDifference < 1) {
      expect(result.nodesExplored).toBeLessThanOrEqual(
        Math.max(
          result.alternativeResults[0].nodesExplored,
          result.alternativeResults[1].nodesExplored,
        ),
      );
    }
  });
});
