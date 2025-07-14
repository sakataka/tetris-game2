/**
 * Effects System for Cross-cutting Concerns
 * Handles animations, sound effects, analytics, etc. via event-driven effects
 */

export interface EffectConfig {
  enableAnimations: boolean;
  enableSound: boolean;
  enableAnalytics: boolean;
  enableHaptics: boolean;
}

export interface GameEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

export type EffectHandler = (event: GameEvent) => void;

/**
 * Game Effects Manager
 * Centralized system for handling cross-cutting concerns
 */
export class GameEffectsManager {
  private handlers: Map<string, EffectHandler[]> = new Map();
  private config: EffectConfig = {
    enableAnimations: true,
    enableSound: false,
    enableAnalytics: false,
    enableHaptics: false,
  };

  constructor(config?: Partial<EffectConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Register an effect handler for a specific event type
   */
  on(eventType: string, handler: EffectHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Remove an effect handler
   */
  off(eventType: string, handler: EffectHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit a game event to trigger effects
   */
  emit(eventType: string, payload?: any): void {
    const event: GameEvent = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };

    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[GameEffects] Error in effect handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Update effect configuration
   */
  updateConfig(config: Partial<EffectConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): EffectConfig {
    return { ...this.config };
  }

  /**
   * Setup default game effects
   */
  setupDefaultEffects(): void {
    this.setupAnimationEffects();
    this.setupSoundEffects();
    this.setupAnalyticsEffects();
    this.setupHapticsEffects();
  }

  /**
   * Setup animation effects
   */
  private setupAnimationEffects(): void {
    if (!this.config.enableAnimations) return;

    this.on("LINE_CLEARED", (event) => {
      const { lines, positions } = event.payload || {};
      console.log(`[Effects] Line clear animation: ${lines} lines at positions`, positions);
      // Animation logic would be implemented here
    });

    this.on("PIECE_PLACED", (event) => {
      const { piece, position } = event.payload || {};
      console.log("[Effects] Piece placement animation", piece, position);
      // Piece placement effect logic
    });

    this.on("HARD_DROP", (event) => {
      const { distance } = event.payload || {};
      console.log(`[Effects] Hard drop animation: ${distance} cells`);
      // Hard drop trail effect
    });

    this.on("T_SPIN", (event) => {
      const { type } = event.payload || {};
      console.log(`[Effects] T-Spin ${type} animation`);
      // T-Spin celebration effect
    });
  }

  /**
   * Setup sound effects
   */
  private setupSoundEffects(): void {
    if (!this.config.enableSound) return;

    this.on("PIECE_PLACED", () => {
      console.log("[Effects] Playing piece placement sound");
      // playSound('piece-place');
    });

    this.on("LINE_CLEARED", (event) => {
      const { lines } = event.payload || {};
      if (lines === 4) {
        console.log("[Effects] Playing TETRIS sound");
        // playSound('tetris');
      } else {
        console.log("[Effects] Playing line clear sound");
        // playSound('line-clear');
      }
    });

    this.on("HARD_DROP", () => {
      console.log("[Effects] Playing hard drop sound");
      // playSound('hard-drop');
    });

    this.on("T_SPIN", () => {
      console.log("[Effects] Playing T-Spin sound");
      // playSound('t-spin');
    });

    this.on("GAME_OVER", () => {
      console.log("[Effects] Playing game over sound");
      // playSound('game-over');
    });
  }

  /**
   * Setup analytics effects
   */
  private setupAnalyticsEffects(): void {
    if (!this.config.enableAnalytics) return;

    this.on("GAME_STARTED", (event) => {
      console.log("[Effects] Tracking game start", event.payload);
      // analytics.track('game_started', event.payload);
    });

    this.on("GAME_OVER", (event) => {
      console.log("[Effects] Tracking game over", event.payload);
      // analytics.track('game_over', event.payload);
    });

    this.on("LINE_CLEARED", (event) => {
      console.log("[Effects] Tracking line clear", event.payload);
      // analytics.track('line_cleared', event.payload);
    });
  }

  /**
   * Setup haptic feedback effects
   */
  private setupHapticsEffects(): void {
    if (!this.config.enableHaptics || !navigator.vibrate) return;

    this.on("PIECE_PLACED", () => {
      console.log("[Effects] Haptic feedback: piece placed");
      // navigator.vibrate([50]);
    });

    this.on("LINE_CLEARED", (event) => {
      const { lines } = event.payload || {};
      const pattern = lines === 4 ? [100, 50, 100] : [75];
      console.log("[Effects] Haptic feedback: line clear", pattern);
      // navigator.vibrate(pattern);
    });

    this.on("HARD_DROP", () => {
      console.log("[Effects] Haptic feedback: hard drop");
      // navigator.vibrate([100]);
    });
  }

  /**
   * Cleanup all handlers
   */
  destroy(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const gameEffects = new GameEffectsManager();
