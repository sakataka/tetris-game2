import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameEventBus } from "@/shared/events/game-event-bus";
import { WorkerEventBridge } from "@/shared/events/worker-bridge";
import type { GameState } from "@/types/game";
import type { WorkerResponse } from "@/workers/ai-worker";

// Mock Worker for testing
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  onmessageerror: ((error: MessageEvent) => void) | null = null;

  constructor(public url: string) {}

  postMessage(message: any) {
    // Simulate async message handling
    setTimeout(() => {
      if (this.onmessage) {
        let response: WorkerResponse;

        // Mock different responses based on message type
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
                  thinkingTime: 10,
                  evaluationCount: 100,
                  timedOut: false,
                },
                metrics: { time: 10 },
              },
            };
            break;

          case "GET_METRICS":
            response = {
              type: "METRICS_REPORT",
              payload: {
                evaluationCount: 5,
                totalTime: 50,
                averageTime: 10,
                maxTime: 15,
              },
            };
            break;

          default:
            response = {
              type: "WORKER_READY",
              payload: {
                version: "1.0.0",
                capabilities: ["ai-evaluation", "metrics"],
              },
            };
        }

        this.onmessage(new MessageEvent("message", { data: response }));
      }
    }, 10);
  }

  terminate() {
    // Cleanup
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === "message") {
      this.onmessage = listener as any;
    }
  }

  removeEventListener(type: string, listener: EventListener) {
    if (type === "message") {
      this.onmessage = null;
    }
  }
}

// Mock Worker constructor
(global as any).Worker = MockWorker;

describe("Worker Event Bridge Integration", () => {
  let eventBus: GameEventBus;
  let bridge: WorkerEventBridge;

  beforeEach(() => {
    vi.clearAllMocks();
    eventBus = new GameEventBus();
    bridge = new WorkerEventBridge(eventBus, {
      workerPath: "/src/workers/ai-worker.ts",
      maxRetries: 3,
      timeoutMs: 5000,
      fallbackToMainThread: true,
    });
  });

  afterEach(() => {
    bridge.destroy();
  });

  it("should initialize worker successfully", async () => {
    // Wait a bit for initialization
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check stats
    const stats = bridge.getStats();
    expect(stats.isHealthy).toBe(true);
  });

  it("should handle AI initialization", async () => {
    // Wait for worker to be ready
    await new Promise((resolve) => setTimeout(resolve, 50));

    const config = {
      thinkingTimeLimit: 1000,
      evaluator: "dellacherie" as const,
      enableLogging: false,
      fallbackOnTimeout: true,
      useDynamicWeights: true,
    };

    const weights = {
      landingHeight: -4.0,
      linesCleared: 5.0,
      potentialLinesFilled: 2.0,
      rowTransitions: -1.0,
      columnTransitions: -1.0,
      holes: -7.0,
      wells: -3.0,
      blocksAboveHoles: -2.0,
      wellOpen: 1.0,
      escapeRoute: 2.0,
      bumpiness: -2.0,
      maxHeight: -3.0,
      rowFillRatio: 1.0,
    };

    // Should not throw
    await expect(bridge.initializeAI(config, weights, false)).resolves.toBeUndefined();
  });

  it("should handle AI evaluation requests", async () => {
    // Wait for worker to be ready
    await new Promise((resolve) => setTimeout(resolve, 50));

    const mockGameState: GameState = {
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
    };

    // Mock the evaluation (it will use fallback since we're not in a real worker environment)
    // This tests the fallback functionality
    let aiResult: any = null;
    eventBus.subscribe("AI_MOVE_CALCULATED", (event) => {
      aiResult = event.payload.result;
    });

    // Trigger the evaluation
    eventBus.emitSync({
      type: "POSITION_NEEDS_EVALUATION",
      payload: { gameState: mockGameState },
    });

    // Wait for async processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should have received a result
    expect(aiResult).toBeTruthy();
  });

  it("should track performance metrics", async () => {
    // Wait for worker to be ready
    await new Promise((resolve) => setTimeout(resolve, 50));

    const initialStats = bridge.getStats();
    expect(initialStats.messagesSent).toBe(0);
    expect(initialStats.messagesReceived).toBeGreaterThan(0); // Worker ready message

    // Send a metrics request
    await bridge.getWorkerMetrics();

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    const finalStats = bridge.getStats();
    expect(finalStats.messagesSent).toBeGreaterThan(0);
  });

  it("should handle difficulty changes", async () => {
    // Wait for worker to be ready
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should not throw
    await expect(bridge.setDifficulty("hard")).resolves.toBeUndefined();
  });

  it("should emit events correctly", async () => {
    let workerInitialized = false;
    eventBus.subscribe("WORKER_INITIALIZED", () => {
      workerInitialized = true;
    });

    // Wait for worker initialization
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(workerInitialized).toBe(true);
  });

  it("should handle worker termination gracefully", () => {
    expect(() => bridge.terminateWorker()).not.toThrow();

    const stats = bridge.getStats();
    expect(stats.isHealthy).toBe(false);
  });

  it("should reset metrics correctly", async () => {
    // Wait for worker to be ready
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should not throw
    await expect(bridge.resetWorkerMetrics()).resolves.toBeUndefined();
  });
});
