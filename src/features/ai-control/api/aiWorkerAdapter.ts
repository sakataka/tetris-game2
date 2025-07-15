import type { AdvancedAIDecision } from "@/game/ai";
import type { GameState } from "@/types/game";
import type { AISettings } from "../ui/AIControlPanel";

interface AIWorkerMessage {
  type: "START" | "STOP" | "PAUSE" | "RESUME" | "STEP" | "UPDATE_SETTINGS" | "MOVE_REQUEST";
  payload?: {
    gameState?: GameState;
    settings?: AISettings;
    requestId?: string;
  };
}

interface AIWorkerResponse {
  type: "DECISION" | "ERROR" | "THINKING_START" | "THINKING_END" | "STATUS";
  payload?: {
    decision?: AdvancedAIDecision;
    error?: string;
    status?: string;
    thinkingTime?: number;
    requestId?: string;
  };
}

/**
 * Adapter for communicating with the AI Worker
 * This isolates the ai-control feature from direct worker dependencies
 */
export class AIWorkerAdapter {
  private worker: Worker | null = null;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private isInitialized = false;
  private currentSettings: AISettings | null = null;

  /**
   * Check if Web Workers are supported
   */
  isSupported(): boolean {
    return typeof Worker !== "undefined";
  }

  /**
   * Initialize the AI Worker
   */
  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Web Workers not supported");
    }

    if (this.isInitialized) {
      return;
    }

    try {
      // Create AI Worker
      this.worker = new Worker("/src/workers/ai-worker.ts", { type: "module" });

      // Set up message listener
      this.worker.onmessage = (event: MessageEvent<AIWorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      };

      // Handle worker errors
      this.worker.onerror = (error) => {
        console.error("[AIWorkerAdapter] Worker error:", error);
        this.emit("error", new Error(`Worker error: ${error.message}`));
      };

      this.isInitialized = true;
      console.log("[AIWorkerAdapter] Initialized successfully");
    } catch (error) {
      console.error("[AIWorkerAdapter] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Start AI with given settings
   */
  async startAI(settings: AISettings): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.currentSettings = settings;
    this.sendMessage({
      type: "START",
      payload: { settings },
    });

    this.emit("ai-started", { settings });
  }

  /**
   * Stop AI
   */
  async stopAI(): Promise<void> {
    if (!this.worker) return;

    this.sendMessage({ type: "STOP" });
    this.emit("ai-stopped", {});
  }

  /**
   * Pause AI
   */
  pauseAI(): void {
    if (!this.worker) return;

    this.sendMessage({ type: "PAUSE" });
    this.emit("ai-paused", {});
  }

  /**
   * Resume AI
   */
  resumeAI(): void {
    if (!this.worker) return;

    this.sendMessage({ type: "RESUME" });
    this.emit("ai-resumed", {});
  }

  /**
   * Step AI (single move when paused)
   */
  async stepAI(): Promise<AdvancedAIDecision> {
    if (!this.worker) {
      throw new Error("AI Worker not initialized");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("AI step timeout"));
      }, 5000);

      const handleDecision = (data: unknown) => {
        clearTimeout(timeout);
        this.off("decision", handleDecision);
        resolve(data as AdvancedAIDecision);
      };

      this.on("decision", handleDecision);
      this.sendMessage({ type: "STEP" });
    });
  }

  /**
   * Update AI settings
   */
  updateSettings(settings: AISettings): void {
    if (!this.worker) return;

    this.currentSettings = settings;
    this.sendMessage({
      type: "UPDATE_SETTINGS",
      payload: { settings },
    });
  }

  /**
   * Request AI move for given game state
   */
  requestMove(gameState: GameState): void {
    if (!this.worker) return;

    this.sendMessage({
      type: "MOVE_REQUEST",
      payload: { gameState },
    });

    this.emit("thinking-start", {});
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(message: AIWorkerResponse): void {
    switch (message.type) {
      case "DECISION":
        this.emit("decision", message.payload as AdvancedAIDecision);
        this.emit("thinking-end", {});
        break;

      case "ERROR":
        this.emit("error", new Error(message.payload?.error || "AI Worker error"));
        this.emit("thinking-end", {});
        break;

      case "THINKING_START":
        this.emit("thinking-start", {});
        break;

      case "THINKING_END":
        this.emit("thinking-end", {});
        break;

      case "STATUS":
        this.emit("status", message.payload);
        break;

      default:
        console.warn("[AIWorkerAdapter] Unknown message type:", message.type);
    }
  }

  /**
   * Send message to worker
   */
  private sendMessage(message: AIWorkerMessage): void {
    if (!this.worker) {
      console.error("[AIWorkerAdapter] Cannot send message: worker not initialized");
      return;
    }

    try {
      this.worker.postMessage(message);
    } catch (error) {
      console.error("[AIWorkerAdapter] Failed to send message:", error);
      this.emit("error", new Error(`Failed to send message: ${error}`));
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[AIWorkerAdapter] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current settings
   */
  getCurrentSettings(): AISettings | null {
    return this.currentSettings;
  }

  /**
   * Check if AI is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.worker) {
      this.sendMessage({ type: "STOP" });
      this.worker.terminate();
      this.worker = null;
    }

    this.isInitialized = false;
    this.currentSettings = null;
    this.eventListeners.clear();
  }
}

// Singleton instance
export const aiWorkerManager = new AIWorkerAdapter();
