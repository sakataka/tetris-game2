/**
 * AI Worker Manager
 * High-level interface for managing AI workers and fallbacks
 */

import type { AdvancedAIConfig, AdvancedAIDecision } from "@/game/ai/core/advanced-ai-engine";
import type { AIConfig, AIDecision } from "@/game/ai/core/ai-engine";
import type { EvaluationWeights } from "@/game/ai/evaluators/dellacherie";
import type { GameState } from "@/types/game";
import type { GameEventBus } from "../events/game-event-bus";
import { type WorkerBridgeConfig, WorkerEventBridge } from "../events/worker-bridge";

export interface AIWorkerConfig {
  difficulty: "easy" | "medium" | "hard" | "expert";
  enableWorker: boolean;
  workerPath: string;
  timeoutMs: number;
  maxRetries: number;
  useAdvancedAI: boolean;
}

export class AIWorkerManager {
  private bridge: WorkerEventBridge | null = null;
  private eventBus: GameEventBus;
  private config: AIWorkerConfig;
  private isProcessing = false;
  private isInitialized = false;

  constructor(eventBus: GameEventBus, config: AIWorkerConfig) {
    this.eventBus = eventBus;
    this.config = config;

    if (config.enableWorker) {
      this.initializeWorkerBridge();
    }

    this.setupEventHandlers();
  }

  /**
   * Initialize the worker bridge
   */
  private initializeWorkerBridge(): void {
    const bridgeConfig: WorkerBridgeConfig = {
      workerPath: this.config.workerPath,
      maxRetries: this.config.maxRetries,
      timeoutMs: this.config.timeoutMs,
      fallbackToMainThread: true,
    };

    this.bridge = new WorkerEventBridge(this.eventBus, bridgeConfig);
  }

  /**
   * Setup event handlers for AI requests
   */
  private setupEventHandlers(): void {
    // Listen for AI move requests
    this.eventBus.subscribe("AI_MOVE_REQUESTED", async (payload) => {
      if (this.isProcessing) {
        console.warn("AI is already processing a move, skipping request");
        return;
      }

      await this.processAIMove(payload.gameState);
    });

    // Listen for difficulty changes
    this.eventBus.subscribe("AI_DIFFICULTY_CHANGED", async (payload) => {
      this.config.difficulty = payload.difficulty;

      // Send difficulty change to worker if available
      if (this.bridge) {
        try {
          await this.bridge.setDifficulty(payload.difficulty);
        } catch (error) {
          console.error("Failed to update worker difficulty:", error);
        }
      }
    });

    // Listen for worker initialization
    this.eventBus.subscribe("WORKER_INITIALIZED", () => {
      this.initializeAIInWorker();
    });
  }

  /**
   * Initialize AI engine in the worker
   */
  private async initializeAIInWorker(): Promise<void> {
    if (!this.bridge) return;

    try {
      // Get default AI configuration
      const aiConfig = this.getDefaultAIConfig();
      const weights = this.getDefaultWeights();

      await this.bridge.initializeAI(aiConfig, weights, this.config.useAdvancedAI);
      this.isInitialized = true;

      console.log("AI Engine initialized in worker");
    } catch (error) {
      console.error("Failed to initialize AI in worker:", error);
    }
  }

  /**
   * Get default AI configuration
   */
  private getDefaultAIConfig(): AIConfig | AdvancedAIConfig {
    const baseConfig: AIConfig = {
      thinkingTimeLimit: this.config.timeoutMs,
      evaluator: "dellacherie",
      enableLogging: process.env.NODE_ENV === "development",
      fallbackOnTimeout: true,
      useDynamicWeights: true,
    };

    if (this.config.useAdvancedAI) {
      const advancedConfig: AdvancedAIConfig = {
        ...baseConfig,
        beamSearchConfig: {
          beamWidth: 5,
          maxDepth: 3,
          useHold: true,
          enablePruning: true,
          timeLimit: this.config.timeoutMs / 2,
          enableDiversity: false,
          diversityConfig: {
            baseDiversityRatio: 0.2,
            depthDiscountFactor: 0.95,
            uncertaintyPenalty: 0.1,
            complexityBonusWeight: 0.1,
            dynamicDiversityRatio: false,
          },
        },
        holdSearchOptions: {
          allowHoldUsage: true,
          holdPenalty: 10,
          maxHoldUsage: 2,
        },
        enableAdvancedFeatures: true,
        enableSearchLogging: false,
        enablePatternDetection: true,
      };
      return advancedConfig;
    }

    return baseConfig;
  }

  /**
   * Get default evaluation weights based on difficulty
   */
  private getDefaultWeights(): EvaluationWeights {
    // Basic weights that work well for different difficulties
    const baseWeights: EvaluationWeights = {
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

    // Adjust weights based on difficulty
    switch (this.config.difficulty) {
      case "easy":
        return {
          ...baseWeights,
          holes: -3.0,
          maxHeight: -1.0,
          bumpiness: -1.0,
        };
      case "medium":
        return baseWeights;
      case "hard":
        return {
          ...baseWeights,
          holes: -10.0,
          maxHeight: -5.0,
          bumpiness: -3.0,
          linesCleared: 7.0,
        };
      case "expert":
        return {
          ...baseWeights,
          holes: -15.0,
          maxHeight: -8.0,
          bumpiness: -5.0,
          linesCleared: 10.0,
          wellOpen: 3.0,
          escapeRoute: 5.0,
        };
      default:
        return baseWeights;
    }
  }

  /**
   * Process AI move request
   */
  private async processAIMove(gameState: GameState): Promise<void> {
    this.isProcessing = true;

    try {
      let result: AIDecision | AdvancedAIDecision;

      if (this.bridge && this.isInitialized) {
        // Use worker for AI evaluation
        result = await this.bridge.evaluatePosition(gameState);
      } else {
        // Fallback to main thread
        result = await this.evaluatePositionMainThread(gameState);
      }

      // Emit the AI move result
      this.eventBus.emitSync("AI_MOVE_CALCULATED", {
        result,
        responseTime: result.thinkingTime,
        source: this.bridge && this.isInitialized ? "worker" : "main-thread",
      });
    } catch (error) {
      console.error("AI move calculation failed:", error);

      this.eventBus.emitSync("AI_ERROR", {
        error: error instanceof Error ? error.message : "AI calculation failed",
        requestId: undefined,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Fallback AI evaluation on main thread
   */
  private async evaluatePositionMainThread(
    gameState: GameState,
  ): Promise<AIDecision | AdvancedAIDecision> {
    if (this.config.useAdvancedAI) {
      // Dynamic import to avoid blocking
      const { AdvancedAIEngine } = await import("@/game/ai/core/advanced-ai-engine");
      const aiEngine = new AdvancedAIEngine(this.getDefaultAIConfig() as AdvancedAIConfig);
      return aiEngine.findBestMove(gameState);
    }
    // Dynamic import to avoid blocking
    const { AIEngine } = await import("@/game/ai/core/ai-engine");
    const aiEngine = new AIEngine(this.getDefaultAIConfig() as AIConfig);
    return aiEngine.findBestMove(gameState);
  }

  /**
   * Request AI move evaluation
   */
  public async requestAIMove(gameState: GameState): Promise<void> {
    this.eventBus.emitSync("AI_MOVE_REQUESTED", { gameState });
  }

  /**
   * Change AI difficulty
   */
  public async changeDifficulty(difficulty: "easy" | "medium" | "hard" | "expert"): Promise<void> {
    this.eventBus.emitSync("AI_DIFFICULTY_CHANGED", { difficulty });
  }

  /**
   * Check if AI is currently processing
   */
  public isAIProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Check if AI is initialized
   */
  public isAIInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get worker statistics
   */
  public getStats() {
    return this.bridge?.getStats() || null;
  }

  /**
   * Get worker metrics from worker thread
   */
  public async getWorkerMetrics(): Promise<void> {
    if (this.bridge) {
      await this.bridge.getWorkerMetrics();
    }
  }

  /**
   * Reset worker metrics
   */
  public async resetWorkerMetrics(): Promise<void> {
    if (this.bridge) {
      await this.bridge.resetWorkerMetrics();
    }
  }

  /**
   * Update AI configuration
   */
  public updateConfig(config: Partial<AIWorkerConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.enableWorker && !this.bridge) {
      this.initializeWorkerBridge();
    } else if (!config.enableWorker && this.bridge) {
      this.bridge.destroy();
      this.bridge = null;
      this.isInitialized = false;
    }

    // If we're changing AI type or other core settings, reinitialize
    if ((config.useAdvancedAI !== undefined || config.difficulty) && this.bridge) {
      this.isInitialized = false;
      this.initializeAIInWorker();
    }
  }

  /**
   * Enable or disable worker
   */
  public setWorkerEnabled(enabled: boolean): void {
    this.updateConfig({ enableWorker: enabled });
  }

  /**
   * Switch between basic and advanced AI
   */
  public setAdvancedAI(useAdvanced: boolean): void {
    this.updateConfig({ useAdvancedAI: useAdvanced });
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.bridge?.destroy();
    this.bridge = null;
    this.isProcessing = false;
    this.isInitialized = false;
  }
}
