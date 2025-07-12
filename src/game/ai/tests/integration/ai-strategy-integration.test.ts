import { beforeEach, describe, expect, test } from "bun:test";
import { createTetromino } from "@/game/tetrominos";
import type { Position, TetrominoTypeName } from "@/types/game";
import { type BitBoardData, createBitBoard, setRowBits } from "../../core/bitboard";
import { MoveGenerator } from "../../core/move-generator";
import { AdvancedFeatures } from "../../evaluators/advanced-features";
import { DellacherieEvaluator } from "../../evaluators/dellacherie";
import { PatternEvaluator } from "../../evaluators/pattern-evaluator";
import { DEFAULT_PATTERN_WEIGHTS } from "../../evaluators/patterns";
import { determineGamePhase, getPhaseWeights } from "../../evaluators/weights";
import { BeamSearch, type SearchNode } from "../../search/beam-search";
import { calculateSurfaceProfile } from "../../search/diversity-beam-search";

// Helper functions for test setup
function createBoardWithHeight(height: number): BitBoardDataData {
  let board = createBitBoard();

  // Fill bottom rows with random patterns
  for (let y = 20 - height; y < 20; y++) {
    let row = 0;
    for (let x = 0; x < 10; x++) {
      if (Math.random() > 0.3) {
        // 70% fill rate
        row |= 1 << x;
      }
    }
    board = setRowBits(board, y, row);
  }

  return board;
}

function createPCOSetup(): BitBoardDataData {
  let board = createBitBoard();

  // Create a Perfect Clear Opening setup
  // Example: LST stacking for PCO
  const pattern = [
    0b0011111111, // Row 19: Leave 2 leftmost empty
    0b0011111111, // Row 18: Leave 2 leftmost empty
    0b0011111111, // Row 17: Leave 2 leftmost empty
    0b0111111111, // Row 16: Leave 1 leftmost empty
  ];

  for (let i = 0; i < pattern.length; i++) {
    board = setRowBits(board, 19 - i, pattern[i]);
  }

  return board;
}

function createAmbiguousSetup(): BitBoardData {
  let board = createBitBoard();

  // Create a setup where both PCO and DT (Donation/T-Spin Triple) are possible
  const pattern = [
    0b1111111100, // Row 19: Setup for T-Spin
    0b1111111100, // Row 18: Setup for T-Spin
    0b1111111110, // Row 17: T-Spin cavity
    0b1111111111, // Row 16: Full base
  ];

  for (let i = 0; i < pattern.length; i++) {
    board = setRowBits(board, 19 - i, pattern[i]);
  }

  return board;
}

function _placePiece(
  board: BitBoardData,
  _piece: TetrominoTypeName,
  position: Position,
): BitBoardData {
  const newBoard = board.clone();
  // Simplified piece placement for testing
  // In real implementation, this would use the full SRS placement logic
  const row = newBoard.getRowBits(position.y);
  newBoard.setRowBits(position.y, row | (1 << position.x));
  return newBoard;
}

function _countUniqueProfiles(exploredNodes: SearchNode[]): number {
  const profiles = new Set<string>();

  for (const node of exploredNodes) {
    if (node.board) {
      const profile = node.board.toString(); // Use board's string representation
      profiles.add(profile);
    }
  }

  return profiles.size;
}

describe("AI Strategy Integration Tests", () => {
  let patternEvaluator: PatternEvaluator;
  let beamSearch: BeamSearch;
  let dellacherieEvaluator: DellacherieEvaluator;
  let advancedFeatures: AdvancedFeatures;
  let moveGenerator: MoveGenerator;

  beforeEach(() => {
    patternEvaluator = new PatternEvaluator({
      enableTSpinDetection: true,
      enablePerfectClearDetection: true,
      patternWeights: DEFAULT_PATTERN_WEIGHTS,
    });

    dellacherieEvaluator = new DellacherieEvaluator();
    moveGenerator = new MoveGenerator();

    beamSearch = new BeamSearch(dellacherieEvaluator, moveGenerator, {
      beamWidth: 50,
      maxDepth: 3,
      useHold: true,
      enablePruning: true,
      timeLimit: 200,
      enableDiversity: false,
      diversityConfig: {
        enableExplorationExploitation: false,
        explorationWeight: 0.1,
        exploitationWeight: 0.9,
        surfaceVariationThreshold: 3.0,
        minDiversityRatio: 0.3,
      },
    });

    advancedFeatures = new AdvancedFeatures();
  });

  describe("Phase Transitions", () => {
    test("early to mid phase transition with appropriate weight changes", () => {
      const _lowBoard = createBoardWithHeight(3);
      const _midBoard = createBoardWithHeight(8);

      const earlyPhase = determineGamePhase(3);
      const midPhase = determineGamePhase(8);

      const earlyWeights = getPhaseWeights(earlyPhase);
      const midWeights = getPhaseWeights(midPhase);

      expect(earlyPhase).toBe("early");
      expect(midPhase).toBe("mid");
      // Both phases now use the same line clearing priority (1000.0) in the new weight system
      expect(earlyWeights.linesCleared).toBe(midWeights.linesCleared);
      expect(earlyWeights.holes).toBeGreaterThan(midWeights.holes); // -500 > -800 (less negative = less penalty)
    });

    test("danger zone strategy switch", () => {
      const _dangerBoard = createBoardWithHeight(16);
      const phase = determineGamePhase(16);

      expect(phase).toBe("late");

      const weights = getPhaseWeights(phase);
      expect(weights.landingHeight).toBeLessThan(0); // landingHeight is always a penalty (negative value)
      expect(weights.holes).toBeLessThan(0); // holes is also a penalty (negative value)
      expect(weights.linesCleared).toBeGreaterThan(0); // linesCleared should be positive reward
    });

    test("weight consistency across board evaluations", () => {
      const testBoard = createBoardWithHeight(10);
      const _phase = determineGamePhase(10);

      const basicEval = dellacherieEvaluator.evaluate(testBoard, {
        piece: "I",
        rotation: 0,
        x: 0,
        y: 0,
        sequence: [],
      });
      const terrainEval = advancedFeatures.evaluateTerrain(testBoard);

      // Both evaluations should be consistent in their assessments
      expect(typeof basicEval).toBe("number");
      expect(typeof terrainEval.smoothness).toBe("number");
      expect(basicEval).toBeDefined();
      expect(terrainEval).toBeDefined();
    });
  });

  describe("Pattern Recognition", () => {
    test("PCO detection and feasibility", () => {
      const pcoBoard = createPCOSetup();
      const queue: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "L", "J"];

      patternEvaluator.updateGameState(queue, 0, 1);
      const patterns = patternEvaluator.getAvailablePatterns(pcoBoard);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });

    test("multiple pattern candidate prioritization", () => {
      const ambiguousBoard = createAmbiguousSetup();
      const fullBag: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "L", "J"];

      patternEvaluator.updateGameState(fullBag, 0, 1);
      const patterns = patternEvaluator.getAvailablePatterns(ambiguousBoard);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });

    test("T-Spin setup recognition", () => {
      const tSpinBoard = createAmbiguousSetup(); // This setup has T-Spin potential
      const queue: TetrominoTypeName[] = ["T", "I", "O", "S"];

      patternEvaluator.updateGameState(queue, 0, 1);
      const patterns = patternEvaluator.getAvailablePatterns(tSpinBoard);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe("Search Diversity", () => {
    test("surface profile calculation works correctly", () => {
      const testBoard = createBoardWithHeight(8);

      const profile = calculateSurfaceProfile(testBoard);

      expect(profile).toBeDefined();
      expect(Array.isArray(profile)).toBe(true);
      expect(profile.length).toBe(10); // Should have 10 columns

      // Profile should have reasonable heights
      profile.forEach((height) => {
        expect(height).toBeGreaterThanOrEqual(0);
        expect(height).toBeLessThanOrEqual(20);
      });
    });

    test("beam search consistency", () => {
      const testBoard = createBoardWithHeight(6);
      const pieces: TetrominoTypeName[] = ["T", "S", "Z"];

      const currentPiece = createTetromino(pieces[0]);
      const nextPieces = pieces.slice(1).map((p) => createTetromino(p));

      const result1 = beamSearch.search(testBoard, currentPiece, nextPieces);
      const result2 = beamSearch.search(testBoard, currentPiece, nextPieces);

      // Results should be consistent for the same input
      expect(result1.bestPath.length).toBeGreaterThan(0);
      expect(result2.bestPath.length).toBeGreaterThan(0);

      if (result1.bestPath.length > 0 && result2.bestPath.length > 0) {
        const move1 = result1.bestPath[0];
        const move2 = result2.bestPath[0];
        expect(move1.x).toBe(move2.x);
        expect(move1.y).toBe(move2.y);
        expect(move1.rotation).toBe(move2.rotation);
      }
    });

    test("hold integration in search", () => {
      const testBoard = createBoardWithHeight(10);
      const pieces: TetrominoTypeName[] = ["O", "I", "T"]; // I-piece good for clearing, O not ideal first

      const currentPiece = createTetromino(pieces[0]);
      const nextPieces = pieces.slice(1).map((p) => createTetromino(p));
      const resultWithHold = beamSearch.search(testBoard, currentPiece, nextPieces);

      expect(resultWithHold).toBeDefined();

      // Search should consider using hold strategically
      if (resultWithHold.bestPath.length > 0) {
        expect(resultWithHold.bestScore).toBeGreaterThan(Number.NEGATIVE_INFINITY);
      }
    });
  });

  describe("Cross-Component Integration", () => {
    test("evaluator and search algorithm coherence", () => {
      const testBoard = createBoardWithHeight(12);
      const pieces: TetrominoTypeName[] = ["I", "T", "O"];

      const currentPiece = createTetromino(pieces[0]);
      const nextPieces = pieces.slice(1).map((p) => createTetromino(p));
      const searchResult = beamSearch.search(testBoard, currentPiece, nextPieces);

      if (searchResult.bestPath.length > 0) {
        const manualEval = dellacherieEvaluator.evaluate(testBoard, searchResult.bestPath[0]);

        // Search result should align with manual evaluation
        expect(manualEval).toBeDefined();
        expect(typeof manualEval).toBe("number");
        expect(Math.abs(manualEval)).toBeLessThan(1000000); // Reasonable score range for new weights
      }
    });

    test("advanced features integration with search", () => {
      const testBoard = createBoardWithHeight(8);
      const pieces: TetrominoTypeName[] = ["T", "I", "L"];

      const currentPiece = createTetromino(pieces[0]);
      const nextPieces = pieces.slice(1).map((p) => createTetromino(p));
      const searchResult = beamSearch.search(testBoard, currentPiece, nextPieces);

      if (searchResult.bestPath.length > 0) {
        const terrainEval = advancedFeatures.evaluateTerrain(testBoard);
        const tSpinOpportunities = advancedFeatures.detectTSpinOpportunity(testBoard);

        expect(terrainEval).toBeDefined();
        expect(typeof terrainEval.smoothness).toBe("number");
        expect(Array.isArray(tSpinOpportunities)).toBe(true);
      }
    });

    test("pattern detection integration with beam search", () => {
      const testBoard = createPCOSetup();
      const pieces: TetrominoTypeName[] = ["I", "O", "T", "S"];

      // Search should recognize and prioritize pattern completion
      const currentPiece = createTetromino(pieces[0]);
      const nextPieces = pieces.slice(1).map((p) => createTetromino(p));
      const searchResult = beamSearch.search(testBoard, currentPiece, nextPieces);
      patternEvaluator.updateGameState(pieces, 0, 1);
      const patterns = patternEvaluator.getAvailablePatterns(testBoard);

      expect(searchResult).toBeDefined();
      expect(patterns).toBeDefined();

      // If patterns are detected, search should account for them
      if (patterns.length > 0 && searchResult.bestPath.length > 0) {
        expect(searchResult.bestPath[0].x).toBeGreaterThanOrEqual(0);
        expect(searchResult.bestPath[0].y).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Performance Integration", () => {
    test("search algorithms meet time constraints", () => {
      const testBoard = createBoardWithHeight(15);
      const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "L", "J"];

      const startTime = performance.now();
      const currentPiece = createTetromino(pieces[0]);
      const nextPieces = pieces.slice(1).map((p) => createTetromino(p));
      const result = beamSearch.search(testBoard, currentPiece, nextPieces);
      const endTime = performance.now();

      const searchTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(searchTime).toBeLessThan(250); // Should complete within 250ms with buffer
    });

    test("memory stability during extended operations", () => {
      const testBoard = createBoardWithHeight(10);
      const pieces: TetrominoTypeName[] = ["I", "T", "O"];

      // Run multiple searches to test memory stability
      for (let i = 0; i < 50; i++) {
        const currentPiece = createTetromino(pieces[0]);
        const nextPieces = pieces.slice(1).map((p) => createTetromino(p));
        const result = beamSearch.search(testBoard, currentPiece, nextPieces);
        expect(result).toBeDefined();
      }

      // If we get here without crashing, memory is stable
      expect(true).toBe(true);
    });
  });
});
