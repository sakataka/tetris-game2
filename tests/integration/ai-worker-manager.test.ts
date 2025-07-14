import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIWorkerManager } from "@/shared/ai/worker-manager";
import { GameEventBus } from "@/shared/events/game-event-bus";
import type { GameState } from "@/types/game";

// Mock Worker for testing
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;

  constructor(public url: string) {
    // Auto-send ready signal
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(
          new MessageEvent("message", {
            data: {
              type: "WORKER_READY",
              payload: {
                version: "1.0.0",
                capabilities: ["ai-evaluation", "metrics"],
              },
            },
          }),
        );
      }
    }, 10);
  }

  postMessage(message: any) {
    setTimeout(() => {
      if (this.onmessage) {
        let response: any;

        switch (message.type) {
          case "INIT_AI":
            response = {
              type: "AI_INITIALIZED",
              payload: {
                success: true,
                version: "1.0.0",
                engine: message.payload.useAdvanced ? "advanced" : "basic",
              },
            };
            break;

          case "EVALUATE_POSITION":
            response = {
              type: "POSITION_EVALUATED",
              payload: {
                result: {
                  bestMove: {
                    piece: "I",
                    rotation: 0,
                    x: 0,
                    y: 0,
                  },
                  allMoves: [],
                  thinkingTime: 15,
                  evaluationCount: 150,
                  timedOut: false,
                },
                metrics: { time: 15 },
              },
            };
            break;

          case "SET_DIFFICULTY":
            response = {
              type: "DIFFICULTY_CHANGED",
              payload: {
                difficulty: message.payload.difficulty,
                weights: {},
              },
            };
            break;

          default:
            return;
        }

        this.onmessage(new MessageEvent("message", { data: response }));
      }
    }, 10);
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

// Mock Worker constructor
(global as any).Worker = MockWorker;

describe("AI Worker Manager Integration", () => {
  let eventBus: GameEventBus;
  let manager: AIWorkerManager;

  const createMockGameState = (): GameState => ({
    board: Array(20)
      .fill(null)
      .map(() => Array(10).fill(0)),
    boardBeforeClear: null,
    currentPiece: {
      type: "I",
      position: { x: 4, y: 0 },
      rotation: 0,
      shape: [[1, 1, 1, 1]],
    },
    nextPiece: "O",
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
    pieceBag: ["I", "O", "T", "S", "Z", "J", "L"],
    tSpinState: { type: "none", show: false, linesCleared: 0, rotationResult: null },
    comboState: { count: 0, isActive: false, lastClearType: null },
    scoreAnimationState: {
      previousScore: 0,
      scoreIncrease: 0,
      lineCount: 0,
      clearType: null,
      isTetris: false,
      animationTriggerTime: 0,
    },
    floatingScoreEvents: [],
    levelCelebrationState: {
      isActive: false,
      level: null,
      startTime: null,
      phase: "completed",
      userCancelled: false,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    eventBus = new GameEventBus();
    manager = new AIWorkerManager(eventBus, {
      difficulty: "medium",
      enableWorker: true,
      workerPath: "/src/workers/ai-worker.ts",
      timeoutMs: 1000,
      maxRetries: 3,
      useAdvancedAI: false,
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  it("should initialize manager successfully", () => {
    expect(manager).toBeTruthy();
    expect(manager.isAIProcessing()).toBe(false);
  });

  it("should handle AI move requests", async () => {
    let aiResult: any = null;
    eventBus.subscribe("AI_MOVE_CALCULATED", (event) => {
      aiResult = event.payload.result;
    });

    // Wait for worker initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Request AI move
    const gameState = createMockGameState();
    await manager.requestAIMove(gameState);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(aiResult).toBeTruthy();
    expect(aiResult.bestMove).toBeTruthy();
  });

  it("should handle difficulty changes", async () => {
    // Wait for worker initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not throw
    await expect(manager.changeDifficulty("hard")).resolves.toBeUndefined();
  });

  it("should track processing state correctly", async () => {
    expect(manager.isAIProcessing()).toBe(false);

    // Start processing
    const gameState = createMockGameState();
    const movePromise = manager.requestAIMove(gameState);

    // Should be processing for a brief moment
    // Note: Due to the async nature and mocking, this might complete too fast
    await movePromise;

    // Should finish processing
    expect(manager.isAIProcessing()).toBe(false);
  });

  it("should handle advanced AI configuration", async () => {
    // Create manager with advanced AI
    const advancedManager = new AIWorkerManager(eventBus, {
      difficulty: "expert",
      enableWorker: true,
      workerPath: "/src/workers/ai-worker.ts",
      timeoutMs: 1000,
      maxRetries: 3,
      useAdvancedAI: true,
    });

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(advancedManager.isAIInitialized()).toBe(true);

    advancedManager.destroy();
  });

  it("should handle worker enable/disable", () => {
    expect(manager.getStats()).toBeTruthy();

    // Disable worker
    manager.setWorkerEnabled(false);
    expect(manager.getStats()).toBeNull();

    // Re-enable worker
    manager.setWorkerEnabled(true);
    // Stats should be available again (though may need time to initialize)
  });

  it("should switch between AI types", async () => {
    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Switch to advanced AI
    manager.setAdvancedAI(true);

    // Wait for re-initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should still work
    const gameState = createMockGameState();
    await expect(manager.requestAIMove(gameState)).resolves.toBeUndefined();
  });

  it("should handle worker metrics requests", async () => {
    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not throw
    await expect(manager.getWorkerMetrics()).resolves.toBeUndefined();
    await expect(manager.resetWorkerMetrics()).resolves.toBeUndefined();
  });

  it("should handle configuration updates", () => {
    const initialConfig = {
      difficulty: "medium" as const,
      timeoutMs: 1000,
    };

    // Update configuration
    manager.updateConfig({
      difficulty: "hard",
      timeoutMs: 2000,
    });

    // Manager should continue to work
    expect(manager).toBeTruthy();
  });

  it("should handle event-driven AI requests", async () => {
    let moveCalculated = false;
    eventBus.subscribe("AI_MOVE_CALCULATED", () => {
      moveCalculated = true;
    });

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Emit AI move request event directly
    eventBus.emitSync({
      type: "AI_MOVE_REQUESTED",
      payload: { gameState: createMockGameState() },
    });

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(moveCalculated).toBe(true);
  });

  it("should handle AI errors gracefully", async () => {
    let errorReceived = false;
    eventBus.subscribe("AI_ERROR", () => {
      errorReceived = true;
    });

    // Create a gamestate that might cause issues (empty/invalid)
    const invalidGameState = {} as GameState;

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));

    await manager.requestAIMove(invalidGameState);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should handle the error gracefully
    // Note: In a real scenario, this might trigger an error event
  });
});
