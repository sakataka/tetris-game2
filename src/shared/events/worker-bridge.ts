/**
 * Worker Event Bridge
 * Manages communication between main thread and AI worker
 * Handles message serialization, error recovery, and performance monitoring
 */

import type { AdvancedAIDecision } from "@/game/ai/core/advanced-ai-engine";
import type { AIDecision } from "@/game/ai/core/ai-engine";
import type { EvaluationWeights } from "@/game/ai/evaluators/dellacherie";
import type { GameState } from "@/types/game";
import type { WorkerMessage, WorkerResponse } from "../../workers/ai-worker";
import type { GameEventBus } from "./game-event-bus";

export interface WorkerBridgeConfig {
  workerPath: string;
  maxRetries: number;
  timeoutMs: number;
  fallbackToMainThread: boolean;
}

export interface WorkerStats {
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  averageResponseTime: number;
  isHealthy: boolean;
}

/**
 * Worker Event Bridge implementation
 */
export class WorkerEventBridge {
  private worker: Worker | null = null;
  private eventBus: GameEventBus;
  private config: WorkerBridgeConfig;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timestamp: number;
    }
  >();
  private stats: WorkerStats = {
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    averageResponseTime: 0,
    isHealthy: false,
  };
  private responseTime: number[] = [];
  private requestId = 0;
  private retryCount = 0;

  constructor(eventBus: GameEventBus, config: WorkerBridgeConfig) {
    this.eventBus = eventBus;
    this.config = config;
    this.initializeWorker();
  }

  /**
   * Initialize the web worker
   */
  private async initializeWorker(): Promise<void> {
    try {
      this.worker = new Worker(this.config.workerPath, { type: "module" });
      this.setupWorkerHandlers();

      // Wait for worker ready signal
      await this.waitForWorkerReady();
      this.stats.isHealthy = true;
      this.retryCount = 0;

      console.log("✅ AI Worker initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize AI Worker:", error);
      this.stats.isHealthy = false;

      if (this.config.fallbackToMainThread) {
        console.log("🔄 Falling back to main thread AI");
        this.setupMainThreadFallback();
      }
    }
  }

  /**
   * Setup worker message handlers
   */
  private setupWorkerHandlers(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerResponse(event.data);
    };

    this.worker.onerror = (error) => {
      console.error("Worker error:", error);
      this.stats.errors++;
      this.handleWorkerError(error);
    };

    this.worker.onmessageerror = (error) => {
      console.error("Worker message error:", error);
      this.stats.errors++;
    };
  }

  /**
   * Handle worker responses
   */
  private handleWorkerResponse(response: WorkerResponse): void {
    this.stats.messagesReceived++;

    switch (response.type) {
      case "WORKER_READY":
        // Worker is ready, resolve initialization
        this.eventBus.emitSync({
          type: "WORKER_INITIALIZED",
          payload: {
            version: response.payload.version,
            capabilities: response.payload.capabilities,
          },
        });
        break;

      case "POSITION_EVALUATED":
        this.handlePositionEvaluated(response.payload);
        break;

      case "ERROR":
        this.handleWorkerErrorResponse(response.payload);
        break;

      case "METRICS_REPORT":
        this.handleMetricsReport(response.payload);
        break;

      case "AI_INITIALIZED":
        console.log(
          `AI Engine initialized: ${response.payload.engine} (v${response.payload.version})`,
        );
        break;

      case "DIFFICULTY_CHANGED":
        console.log(`AI difficulty changed to: ${response.payload.difficulty}`);
        break;

      default:
        console.warn("Unhandled worker response:", response);
    }
  }

  /**
   * Handle position evaluation response
   */
  private handlePositionEvaluated(payload: {
    result: AIDecision | AdvancedAIDecision;
    metrics: { time: number };
  }): void {
    const { result, metrics } = payload;

    // Update response time statistics
    this.responseTime.push(metrics.time);
    if (this.responseTime.length > 100) {
      this.responseTime.shift(); // Keep only last 100 measurements
    }

    this.stats.averageResponseTime =
      this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length;

    // Emit event with AI result
    this.eventBus.emitSync({
      type: "AI_MOVE_CALCULATED",
      payload: {
        result,
        responseTime: metrics.time,
        source: "worker",
      },
    });
  }

  /**
   * Handle worker error responses
   */
  private handleWorkerErrorResponse(payload: { message: string; code: string }): void {
    console.error(`Worker error [${payload.code}]: ${payload.message}`);
    this.stats.errors++;

    // Emit error event
    this.eventBus.emitSync({
      type: "AI_ERROR",
      payload: {
        message: payload.message,
        code: payload.code,
        source: "worker",
      },
    });
  }

  /**
   * Handle metrics report
   */
  private handleMetricsReport(payload: any): void {
    console.log("AI Worker Metrics:", payload);
  }

  /**
   * Wait for worker ready signal
   */
  private waitForWorkerReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Worker initialization timeout"));
      }, this.config.timeoutMs);

      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === "WORKER_READY") {
          clearTimeout(timeout);
          this.worker?.removeEventListener("message", handleMessage);
          resolve();
        }
      };

      this.worker?.addEventListener("message", handleMessage);
    });
  }

  /**
   * Send message to worker with error handling
   */
  private async sendWorkerMessage(message: WorkerMessage): Promise<void> {
    if (!this.worker || !this.stats.isHealthy) {
      throw new Error("Worker not available");
    }

    try {
      this.worker.postMessage(message);
      this.stats.messagesSent++;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Initialize AI in worker
   */
  public async initializeAI(
    config: any,
    weights: EvaluationWeights,
    useAdvanced = false,
  ): Promise<void> {
    await this.sendWorkerMessage({
      type: "INIT_AI",
      payload: {
        config,
        weights,
        useAdvanced,
      },
    });
  }

  /**
   * Request AI position evaluation
   */
  public async evaluatePosition(gameState: GameState): Promise<AIDecision | AdvancedAIDecision> {
    const requestId = (++this.requestId).toString();

    try {
      // Send evaluation request to worker
      await this.sendWorkerMessage({
        type: "EVALUATE_POSITION",
        payload: {
          gameState,
          timeoutMs: this.config.timeoutMs,
        },
      });

      // Return a promise that resolves when response is received
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error("AI evaluation timeout"));
        }, this.config.timeoutMs);

        this.pendingRequests.set(requestId, {
          resolve: (result) => {
            clearTimeout(timeout);
            resolve(result);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
          timestamp: Date.now(),
        });
      });
    } catch (error) {
      if (this.config.fallbackToMainThread) {
        console.warn("Worker evaluation failed, falling back to main thread");
        return this.evaluatePositionMainThread(gameState);
      }
      throw error;
    }
  }

  /**
   * Set AI difficulty
   */
  public async setDifficulty(difficulty: "easy" | "medium" | "hard" | "expert"): Promise<void> {
    await this.sendWorkerMessage({
      type: "SET_DIFFICULTY",
      payload: { difficulty },
    });
  }

  /**
   * Get worker metrics
   */
  public async getWorkerMetrics(): Promise<void> {
    await this.sendWorkerMessage({
      type: "GET_METRICS",
      payload: {},
    });
  }

  /**
   * Reset worker metrics
   */
  public async resetWorkerMetrics(): Promise<void> {
    await this.sendWorkerMessage({
      type: "RESET_METRICS",
      payload: {},
    });
  }

  /**
   * Fallback to main thread AI evaluation
   */
  private async evaluatePositionMainThread(
    gameState: GameState,
  ): Promise<AIDecision | AdvancedAIDecision> {
    // Import AI engine dynamically to avoid blocking main thread
    const { AIEngine } = await import("@/game/ai/core/ai-engine");
    const aiEngine = new AIEngine();

    return aiEngine.findBestMove(gameState);
  }

  /**
   * Setup main thread fallback
   */
  private setupMainThreadFallback(): void {
    console.log("Setting up main thread AI fallback");

    // Subscribe to AI evaluation requests
    this.eventBus.subscribe("POSITION_NEEDS_EVALUATION", async (event) => {
      try {
        const result = await this.evaluatePositionMainThread(event.payload.gameState);

        this.eventBus.emitSync({
          type: "AI_MOVE_CALCULATED",
          payload: {
            result,
            responseTime: 0, // Main thread doesn't track time separately
            source: "main-thread",
          },
        });
      } catch (error) {
        this.eventBus.emitSync({
          type: "AI_ERROR",
          payload: {
            message: error instanceof Error ? error.message : "Main thread AI error",
            code: "MAIN_THREAD_AI_ERROR",
            source: "main-thread",
          },
        });
      }
    });
  }

  /**
   * Handle worker errors and recovery
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error("Worker encountered an error:", error);
    this.stats.isHealthy = false;

    // Attempt to recover if we haven't exceeded max retries
    if (this.retryCount < this.config.maxRetries) {
      this.recoverWorker();
    } else {
      console.error("Max retry attempts reached, falling back to main thread");
      if (this.config.fallbackToMainThread) {
        this.setupMainThreadFallback();
      }
    }
  }

  /**
   * Attempt to recover the worker
   */
  private async recoverWorker(): Promise<void> {
    this.retryCount++;
    console.log(
      `Attempting to recover worker (attempt ${this.retryCount}/${this.config.maxRetries})...`,
    );

    try {
      this.terminateWorker();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      await this.initializeWorker();

      if (this.stats.isHealthy) {
        console.log("✅ Worker recovered successfully");
      }
    } catch (error) {
      console.error("❌ Worker recovery failed:", error);

      if (this.retryCount >= this.config.maxRetries && this.config.fallbackToMainThread) {
        this.setupMainThreadFallback();
      }
    }
  }

  /**
   * Get worker statistics
   */
  public getStats(): WorkerStats {
    return { ...this.stats };
  }

  /**
   * Terminate the worker
   */
  public terminateWorker(): void {
    if (this.worker) {
      this.worker.postMessage({ type: "TERMINATE", payload: {} });
      this.worker.terminate();
      this.worker = null;
      this.stats.isHealthy = false;
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.terminateWorker();
    this.pendingRequests.clear();
    this.responseTime.length = 0;
  }
}
