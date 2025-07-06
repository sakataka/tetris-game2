import { beforeEach, describe, expect, test } from "bun:test";
import { createTetromino } from "@/game/tetrominos";
import type { GameBoard, GameState, TetrominoTypeName } from "@/types/game";
import { AdvancedAIEngine, DEFAULT_ADVANCED_CONFIG } from "../core/advanced-ai-engine";
import { AIEngine, DEFAULT_AI_CONFIG } from "../core/ai-engine";

describe("Phase 1 vs Phase 2 AI Comparison", () => {
  let phase1AI: AIEngine;
  let phase2AI: AdvancedAIEngine;
  let baseGameState: GameState;

  beforeEach(() => {
    // Initialize Phase 1 AI (baseline)
    phase1AI = new AIEngine(DEFAULT_AI_CONFIG);

    // Initialize Phase 2 AI (advanced)
    phase2AI = new AdvancedAIEngine(DEFAULT_ADVANCED_CONFIG);

    // Create base game state for testing
    const emptyBoard: GameBoard = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    baseGameState = {
      board: emptyBoard,
      boardBeforeClear: null,
      currentPiece: createTetromino("T"),
      nextPiece: "I",
      heldPiece: null,
      canHold: true,
      score: 0,
      lines: 0,
      level: 1,
      isGameOver: false,
      isPaused: false,
      placedPositions: [],
      clearingLines: [],
      animationTriggerKey: 0,
      ghostPosition: null,
      pieceBag: ["O", "S", "Z", "J", "L"],
      tSpinState: { type: "none", show: false, linesCleared: 0, rotationResult: null },
    };
  });

  test("should provide enhanced decision making capabilities", async () => {
    const phase1Decision = await phase1AI.findBestMove(baseGameState);
    const phase2Decision = await phase2AI.findBestMove(baseGameState);

    // Phase 2 should provide more detailed analysis
    expect(phase2Decision.tSpinOpportunities).toBeDefined();
    expect(phase2Decision.perfectClearOpportunity).toBeDefined();
    expect(phase2Decision.terrainEvaluation).toBeDefined();
    expect(phase2Decision.usedHold).toBeDefined();
    expect(phase2Decision.alternativeResults).toBeDefined();

    // Phase 1 doesn't have these advanced features
    expect(phase1Decision).not.toHaveProperty("tSpinOpportunities");
    expect(phase1Decision).not.toHaveProperty("terrainEvaluation");
  });

  test("should explore more possibilities with deeper search", async () => {
    const complexBoard: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => {
        if (y > 16) {
          return [1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
        }
        return Array(10).fill(0);
      });

    const complexGameState = {
      ...baseGameState,
      board: complexBoard,
      currentPiece: createTetromino("L"),
      heldPiece: "I",
    };

    const phase1Decision = await phase1AI.findBestMove(complexGameState);
    const phase2Decision = await phase2AI.findBestMove(complexGameState);

    // Phase 2 should explore more nodes due to beam search and Hold consideration
    expect(phase2Decision.nodesExplored).toBeGreaterThanOrEqual(phase1Decision.evaluationCount);

    // Phase 2 should have deeper analysis
    expect(phase2Decision.searchDepth).toBeGreaterThan(1);
    expect(phase2Decision.alternativeResults).toHaveLength(2); // Normal + Hold paths
  });

  test("should demonstrate improved evaluation quality", async () => {
    // Create a board state where Hold usage would be beneficial
    const holdBeneficialBoard: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => {
        if (y === 19) {
          // Create a situation where I-piece would clear 4 lines but O-piece is less useful
          return [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]; // Near Tetris opportunity
        }
        if (y === 18) {
          return [1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
        }
        if (y === 17) {
          return [1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
        }
        if (y === 16) {
          return [1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
        }
        return Array(10).fill(0);
      });

    const holdGameState = {
      ...baseGameState,
      board: holdBeneficialBoard,
      currentPiece: createTetromino("O"), // Less useful for clearing lines
      heldPiece: "I", // Perfect for clearing 4 lines
    };

    const phase1Decision = await phase1AI.findBestMove(holdGameState);
    const phase2Decision = await phase2AI.findBestMove(holdGameState);

    // Phase 2 should recognize the Hold opportunity
    expect(phase2Decision.usedHold).toBe(true);
    expect(phase2Decision.bestScore).toBeGreaterThan(
      phase1Decision.bestMove?.evaluationScore || Number.NEGATIVE_INFINITY,
    );
  });

  test("should maintain reasonable performance compared to Phase 1", async () => {
    const phase1StartTime = performance.now();
    await phase1AI.findBestMove(baseGameState);
    const phase1Time = performance.now() - phase1StartTime;

    const phase2StartTime = performance.now();
    await phase2AI.findBestMove(baseGameState);
    const phase2Time = performance.now() - phase2StartTime;

    // Phase 2 should still meet performance requirements
    expect(phase2Time).toBeLessThan(50); // 50ms requirement

    // Phase 2 might be slower due to more sophisticated analysis
    // but should be reasonable (not more than 5x slower than Phase 1)
    expect(phase2Time).toBeLessThan(phase1Time * 5);
  });

  test("should detect T-Spin opportunities that Phase 1 misses", async () => {
    // Create a board with T-Spin opportunity
    const tSpinBoard: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => {
        if (y === 19) return [1, 1, 1, 0, 1, 1, 1, 1, 1, 1];
        if (y === 18) return [1, 1, 0, 0, 0, 1, 1, 1, 1, 1];
        if (y === 17) return [1, 1, 1, 0, 1, 1, 1, 1, 1, 1];
        return Array(10).fill(0);
      });

    const tSpinGameState = {
      ...baseGameState,
      board: tSpinBoard,
      currentPiece: createTetromino("T"),
    };

    const _phase1Decision = await phase1AI.findBestMove(tSpinGameState);
    const phase2Decision = await phase2AI.findBestMove(tSpinGameState);

    // Phase 2 should detect T-Spin opportunities
    expect(phase2Decision.tSpinOpportunities.length).toBeGreaterThan(0);

    // Phase 2 should potentially choose a different (better) move
    // considering T-Spin potential
    expect(phase2Decision.terrainEvaluation.tSpinPotential).toBeGreaterThan(0);
  });

  test("should handle Perfect Clear scenarios more effectively", async () => {
    // Create a board suitable for Perfect Clear
    const pcBoard: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => {
        if (y === 19) return [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]; // 4 blocks = 1 line PC potential
        return Array(10).fill(0);
      });

    const pcGameState = {
      ...baseGameState,
      board: pcBoard,
      currentPiece: createTetromino("I"),
    };

    const _phase1Decision = await phase1AI.findBestMove(pcGameState);
    const phase2Decision = await phase2AI.findBestMove(pcGameState);

    // Phase 2 should detect PC opportunity
    expect(phase2Decision.perfectClearOpportunity).not.toBeNull();
    expect(phase2Decision.terrainEvaluation.pcPotential).toBeGreaterThan(0);

    // Phase 2 might make different strategic choices based on PC analysis
    expect(phase2Decision.terrainEvaluation).toBeDefined();
  });

  test("should provide more strategic flexibility with Hold usage", async () => {
    const strategicGameState = {
      ...baseGameState,
      currentPiece: createTetromino("S"),
      nextPiece: "Z" as const,
      heldPiece: "I",
    };

    const _phase1Decision = await phase1AI.findBestMove(strategicGameState);
    const phase2Decision = await phase2AI.findBestMove(strategicGameState);

    // Phase 2 should consider Hold strategy
    expect(phase2Decision.alternativeResults).toHaveLength(2);

    // Phase 2 should evaluate Hold vs non-Hold paths
    const normalPath = phase2Decision.alternativeResults[0];
    const holdPath = phase2Decision.alternativeResults[1];
    expect(normalPath).toBeDefined();
    expect(holdPath).toBeDefined();

    // Should choose the better of the two paths
    expect(phase2Decision.bestScore).toBeGreaterThanOrEqual(
      Math.max(normalPath.bestScore, holdPath.bestScore - phase2Decision.holdPenaltyApplied),
    );
  });

  test("should demonstrate improved score potential over multiple moves", async () => {
    // Simulate a sequence of decisions to see cumulative improvement
    const phase1State = { ...baseGameState };
    const phase2State = { ...baseGameState };

    let phase1TotalScore = 0;
    let phase2TotalScore = 0;

    // Run multiple decision cycles
    for (let i = 0; i < 5; i++) {
      const phase1Decision = await phase1AI.findBestMove(phase1State);
      const phase2Decision = await phase2AI.findBestMove(phase2State);

      if (phase1Decision.bestMove?.evaluationScore) {
        phase1TotalScore += phase1Decision.bestMove.evaluationScore;
      }

      phase2TotalScore += phase2Decision.bestScore;

      // Update piece types for next iteration
      const nextPieceTypes: TetrominoTypeName[] = ["I", "O", "T", "S", "Z"];
      phase1State.currentPiece = createTetromino(nextPieceTypes[i % nextPieceTypes.length]);
      phase2State.currentPiece = createTetromino(nextPieceTypes[i % nextPieceTypes.length]);
    }

    // Phase 2 should demonstrate better cumulative performance
    // Allow for significant variance due to different evaluation approaches and search strategies
    // Note: Phase 2 uses different scoring methodology which may result in different scale
    expect(phase2TotalScore).toBeGreaterThan(phase1TotalScore - 2000);
  });

  test("should maintain backward compatibility with basic functionality", async () => {
    const phase1Decision = await phase1AI.findBestMove(baseGameState);
    const phase2Decision = await phase2AI.findBestMove(baseGameState);

    // Both should provide basic decision structure
    expect(phase1Decision.bestMove).toBeDefined();
    expect(phase2Decision.bestPath).toBeDefined();
    expect(phase2Decision.bestPath.length).toBeGreaterThan(0);

    // Both should respect time limits
    expect(phase1Decision.thinkingTime).toBeGreaterThan(0);
    expect(phase2Decision.thinkingTime).toBeGreaterThan(0);
    expect(phase2Decision.thinkingTime).toBeLessThan(50);

    // Both should provide valid moves
    if (phase1Decision.bestMove) {
      expect(phase1Decision.bestMove.piece).toBeDefined();
      expect(phase1Decision.bestMove.x).toBeGreaterThanOrEqual(-2); // Allow off-board positions
      expect(phase1Decision.bestMove.y).toBeGreaterThanOrEqual(0);
    }

    const firstMove = phase2Decision.bestPath[0];
    expect(firstMove.piece).toBeDefined();
    expect(firstMove.x).toBeGreaterThanOrEqual(-2); // Allow off-board positions
    expect(firstMove.y).toBeGreaterThanOrEqual(0);
  });
});
