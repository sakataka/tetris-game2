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
  payload?: unknown;
  timestamp: number;
}

export type EffectHandler = (event: GameEvent) => void;

export interface GameEffectsManager {
  on(eventType: string, handler: EffectHandler): void;
  off(eventType: string, handler: EffectHandler): void;
  emit(eventType: string, payload?: unknown): void;
  updateConfig(config: Partial<EffectConfig>): void;
  getConfig(): EffectConfig;
  setupDefaultEffects(): void;
  destroy(): void;
}

/**
 * Game Effects Manager
 * Centralized system for handling cross-cutting concerns
 */
export function createGameEffectsManager(config?: Partial<EffectConfig>): GameEffectsManager {
  const handlers: Map<string, EffectHandler[]> = new Map();
  let currentConfig: EffectConfig = {
    enableAnimations: true,
    enableSound: false,
    enableAnalytics: false,
    enableHaptics: false,
  };

  if (config) {
    currentConfig = { ...currentConfig, ...config };
  }

  /**
   * Setup animation effects
   */
  const setupAnimationEffects = (): void => {
    if (!currentConfig.enableAnimations) return;

    on("LINE_CLEARED", (event) => {
      const payload = event.payload as { lines?: number[]; positions?: unknown } | undefined;
      const { lines, positions } = payload || {};
      console.log(`[Effects] Line clear animation: ${lines} lines at positions`, positions);
      // Animation logic would be implemented here
    });

    on("PIECE_PLACED", (event) => {
      const payload = event.payload as { piece?: unknown; position?: unknown } | undefined;
      const { piece, position } = payload || {};
      console.log("[Effects] Piece placement animation", piece, position);
      // Piece placement effect logic
    });

    on("HARD_DROP", (event) => {
      const payload = event.payload as { distance?: number } | undefined;
      const { distance } = payload || {};
      console.log(`[Effects] Hard drop animation: ${distance} cells`);
      // Hard drop trail effect
    });

    on("T_SPIN", (event) => {
      const payload = event.payload as { type?: string } | undefined;
      const { type } = payload || {};
      console.log(`[Effects] T-Spin ${type} animation`);
      // T-Spin celebration effect
    });
  };

  /**
   * Setup sound effects
   */
  const setupSoundEffects = (): void => {
    if (!currentConfig.enableSound) return;

    on("PIECE_PLACED", () => {
      console.log("[Effects] Playing piece placement sound");
      // playSound('piece-place');
    });

    on("LINE_CLEARED", (event) => {
      const payload = event.payload as { lines?: number[] } | undefined;
      const { lines } = payload || {};
      if (lines && lines.length === 4) {
        console.log("[Effects] Playing TETRIS sound");
        // playSound('tetris');
      } else {
        console.log("[Effects] Playing line clear sound");
        // playSound('line-clear');
      }
    });

    on("HARD_DROP", () => {
      console.log("[Effects] Playing hard drop sound");
      // playSound('hard-drop');
    });

    on("T_SPIN", () => {
      console.log("[Effects] Playing T-Spin sound");
      // playSound('t-spin');
    });

    on("GAME_OVER", () => {
      console.log("[Effects] Playing game over sound");
      // playSound('game-over');
    });
  };

  /**
   * Setup analytics effects
   */
  const setupAnalyticsEffects = (): void => {
    if (!currentConfig.enableAnalytics) return;

    on("GAME_STARTED", (event) => {
      console.log("[Effects] Tracking game start", event.payload);
      // analytics.track('game_started', event.payload);
    });

    on("GAME_OVER", (event) => {
      console.log("[Effects] Tracking game over", event.payload);
      // analytics.track('game_over', event.payload);
    });

    on("LINE_CLEARED", (event) => {
      console.log("[Effects] Tracking line clear", event.payload);
      // analytics.track('line_cleared', event.payload);
    });
  };

  /**
   * Setup haptic feedback effects
   */
  const setupHapticsEffects = (): void => {
    if (!currentConfig.enableHaptics || !navigator.vibrate) return;

    on("PIECE_PLACED", () => {
      console.log("[Effects] Haptic feedback: piece placed");
      // navigator.vibrate([50]);
    });

    on("LINE_CLEARED", (event) => {
      const payload = event.payload as { lines?: number[] } | undefined;
      const { lines } = payload || {};
      const pattern = lines && lines.length === 4 ? [100, 50, 100] : [75];
      console.log("[Effects] Haptic feedback: line clear", pattern);
      // navigator.vibrate(pattern);
    });

    on("HARD_DROP", () => {
      console.log("[Effects] Haptic feedback: hard drop");
      // navigator.vibrate([100]);
    });
  };

  /**
   * Register an effect handler for a specific event type
   */
  const on = (eventType: string, handler: EffectHandler): void => {
    if (!handlers.has(eventType)) {
      handlers.set(eventType, []);
    }
    handlers.get(eventType)?.push(handler);
  };

  return {
    /**
     * Register an effect handler for a specific event type
     */
    on,

    /**
     * Remove an effect handler
     */
    off(eventType: string, handler: EffectHandler): void {
      const eventHandlers = handlers.get(eventType);
      if (eventHandlers) {
        const index = eventHandlers.indexOf(handler);
        if (index !== -1) {
          eventHandlers.splice(index, 1);
        }
      }
    },

    /**
     * Emit a game event to trigger effects
     */
    emit(eventType: string, payload?: unknown): void {
      const event: GameEvent = {
        type: eventType,
        payload,
        timestamp: Date.now(),
      };

      const eventHandlers = handlers.get(eventType);
      if (eventHandlers) {
        eventHandlers.forEach((handler) => {
          try {
            handler(event);
          } catch (error) {
            console.error(`[GameEffects] Error in effect handler for ${eventType}:`, error);
          }
        });
      }
    },

    /**
     * Update effect configuration
     */
    updateConfig(config: Partial<EffectConfig>): void {
      currentConfig = { ...currentConfig, ...config };
    },

    /**
     * Get current configuration
     */
    getConfig(): EffectConfig {
      return { ...currentConfig };
    },

    /**
     * Setup default game effects
     */
    setupDefaultEffects(): void {
      setupAnimationEffects();
      setupSoundEffects();
      setupAnalyticsEffects();
      setupHapticsEffects();
    },

    /**
     * Cleanup all handlers
     */
    destroy(): void {
      handlers.clear();
    },
  };
}

// Singleton instance
export const gameEffects = createGameEffectsManager();

// Export alias for backward compatibility
export { createGameEffectsManager as GameEffectsManager };
