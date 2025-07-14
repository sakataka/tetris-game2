/**
 * AI Web Worker for non-blocking game AI computation
 * Handles AI evaluation, move calculation, and strategy execution
 * Communicates with main thread via structured message passing
 */

import {
  type AdvancedAIConfig,
  type AdvancedAIDecision,
  AdvancedAIEngine,
} from "@/game/ai/core/advanced-ai-engine";
import { type AIConfig, type AIDecision, AIEngine } from "@/game/ai/core/ai-engine";
import type { EvaluationWeights } from "@/game/ai/evaluators/dellacherie";
import type { GameState } from "@/types/game";

// Security: Expected origins for postMessage validation
const EXPECTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://tetris-game.yourdomain.com",
];

// Performance monitoring
interface PerformanceMetrics {
  evaluationCount: number;
  totalTime: number;
  averageTime: number;
  maxTime: number;
}

const metrics: PerformanceMetrics = {
  evaluationCount: 0,
  totalTime: 0,
  averageTime: 0,
  maxTime: 0,
};

/**
 * Message types for worker communication
 */
export type WorkerMessage =
  | {
      type: "INIT_AI";
      payload: {
        config: AIConfig | AdvancedAIConfig;
        weights: EvaluationWeights;
        useAdvanced?: boolean;
      };
    }
  | { type: "EVALUATE_POSITION"; payload: { gameState: GameState; timeoutMs: number } }
  | { type: "SET_DIFFICULTY"; payload: { difficulty: "easy" | "medium" | "hard" | "expert" } }
  | { type: "GET_METRICS"; payload: {} }
  | { type: "RESET_METRICS"; payload: {} }
  | { type: "TERMINATE"; payload: {} };

export type WorkerResponse =
  | {
      type: "AI_INITIALIZED";
      payload: { success: boolean; version: string; engine: "basic" | "advanced" };
    }
  | {
      type: "POSITION_EVALUATED";
      payload: { result: AIDecision | AdvancedAIDecision; metrics: { time: number } };
    }
  | { type: "DIFFICULTY_CHANGED"; payload: { difficulty: string; weights: EvaluationWeights } }
  | { type: "METRICS_REPORT"; payload: PerformanceMetrics }
  | { type: "ERROR"; payload: { message: string; code: string } }
  | { type: "WORKER_READY"; payload: { version: string; capabilities: string[] } };

// AI engine instance
let aiEngine: AIEngine | AdvancedAIEngine | null = null;
let isAdvancedEngine = false;

/**
 * Validate message origin for security
 */
function validateOrigin(origin: string): boolean {
  if (!origin) return false;
  return EXPECTED_ORIGINS.some(
    (expectedOrigin) =>
      origin === expectedOrigin ||
      (expectedOrigin.includes("localhost") && origin.includes("localhost")),
  );
}

/**
 * Update performance metrics
 */
function updateMetrics(executionTime: number): void {
  metrics.evaluationCount++;
  metrics.totalTime += executionTime;
  metrics.averageTime = metrics.totalTime / metrics.evaluationCount;
  metrics.maxTime = Math.max(metrics.maxTime, executionTime);
}

/**
 * Send response back to main thread
 */
function sendResponse(response: WorkerResponse): void {
  try {
    self.postMessage(response);
  } catch (error) {
    console.error("Failed to send worker response:", error);
  }
}

/**
 * Handle AI position evaluation
 */
async function handleEvaluatePosition(gameState: GameState, timeoutMs: number): Promise<void> {
  if (!aiEngine) {
    sendResponse({
      type: "ERROR",
      payload: { message: "AI engine not initialized", code: "AI_NOT_INITIALIZED" },
    });
    return;
  }

  const startTime = performance.now();

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI evaluation timeout")), timeoutMs);
    });

    // Run AI evaluation with timeout
    const evaluationPromise = aiEngine.findBestMove(gameState);
    const result = await Promise.race([evaluationPromise, timeoutPromise]);

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    updateMetrics(executionTime);

    sendResponse({
      type: "POSITION_EVALUATED",
      payload: {
        result,
        metrics: { time: executionTime },
      },
    });
  } catch (error) {
    const endTime = performance.now();
    updateMetrics(endTime - startTime);

    sendResponse({
      type: "ERROR",
      payload: {
        message: error instanceof Error ? error.message : "Unknown AI error",
        code: "AI_EVALUATION_FAILED",
      },
    });

    console.error("AI evaluation failed:", error);
  }
}

/**
 * Initialize AI engine with configuration
 */
function initializeAI(
  config: AIConfig | AdvancedAIConfig,
  weights: EvaluationWeights,
  useAdvanced = false,
): void {
  try {
    if (useAdvanced) {
      aiEngine = new AdvancedAIEngine(config as AdvancedAIConfig);
      isAdvancedEngine = true;
    } else {
      aiEngine = new AIEngine(config as AIConfig);
      isAdvancedEngine = false;
    }

    // Weights would be used for configuration if the AI engine supports it
    // For now, we'll just acknowledge that weights were provided
    console.log("AI initialized with weights:", Object.keys(weights).length, "features");

    sendResponse({
      type: "AI_INITIALIZED",
      payload: {
        success: true,
        version: "1.0.0",
        engine: isAdvancedEngine ? "advanced" : "basic",
      },
    });
  } catch (error) {
    sendResponse({
      type: "ERROR",
      payload: {
        message: error instanceof Error ? error.message : "AI initialization failed",
        code: "AI_INIT_FAILED",
      },
    });
  }
}

/**
 * Set AI difficulty
 */
function setDifficulty(difficulty: "easy" | "medium" | "hard" | "expert"): void {
  if (!aiEngine) {
    sendResponse({
      type: "ERROR",
      payload: { message: "AI engine not initialized", code: "AI_NOT_INITIALIZED" },
    });
    return;
  }

  try {
    // Difficulty mapping to weights could be implemented here
    // For now, just acknowledge the change
    sendResponse({
      type: "DIFFICULTY_CHANGED",
      payload: {
        difficulty,
        weights: {} as EvaluationWeights, // This would contain actual weights
      },
    });
  } catch (error) {
    sendResponse({
      type: "ERROR",
      payload: {
        message: error instanceof Error ? error.message : "Failed to set difficulty",
        code: "DIFFICULTY_CHANGE_FAILED",
      },
    });
  }
}

/**
 * Main message handler
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  // Security validation
  if (!validateOrigin(event.origin)) {
    console.warn("Rejected message from invalid origin:", event.origin);
    return;
  }

  const { type, payload } = event.data;

  switch (type) {
    case "INIT_AI":
      initializeAI(payload.config, payload.weights, payload.useAdvanced);
      break;

    case "EVALUATE_POSITION":
      handleEvaluatePosition(payload.gameState, payload.timeoutMs);
      break;

    case "SET_DIFFICULTY":
      setDifficulty(payload.difficulty);
      break;

    case "GET_METRICS":
      sendResponse({
        type: "METRICS_REPORT",
        payload: { ...metrics },
      });
      break;

    case "RESET_METRICS":
      metrics.evaluationCount = 0;
      metrics.totalTime = 0;
      metrics.averageTime = 0;
      metrics.maxTime = 0;
      break;

    case "TERMINATE":
      // Cleanup and terminate
      aiEngine = null;
      self.close();
      break;

    default:
      sendResponse({
        type: "ERROR",
        payload: {
          message: `Unknown message type: ${type}`,
          code: "UNKNOWN_MESSAGE_TYPE",
        },
      });
  }
};

/**
 * Handle worker errors
 */
self.onerror = (error) => {
  console.error("Worker error:", error);
  sendResponse({
    type: "ERROR",
    payload: {
      message: "Worker runtime error",
      code: "WORKER_ERROR",
    },
  });
};

/**
 * Handle unhandled promise rejections
 */
self.onunhandledrejection = (event) => {
  console.error("Unhandled promise rejection in worker:", event.reason);
  sendResponse({
    type: "ERROR",
    payload: {
      message: "Unhandled promise rejection",
      code: "PROMISE_REJECTION",
    },
  });
};

// Send ready signal when worker is initialized
sendResponse({
  type: "WORKER_READY",
  payload: {
    version: "1.0.0",
    capabilities: ["ai-evaluation", "metrics", "difficulty-adjustment", "advanced-ai"],
  },
});
