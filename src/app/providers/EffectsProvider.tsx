import type React from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import {
  type EffectConfig,
  type GameEffectsManager,
  gameEffects,
} from "@/shared/effects/gameEffects";

interface EffectsContextValue {
  gameEffects: GameEffectsManager;
  updateConfig: (config: Partial<EffectConfig>) => void;
  getConfig: () => EffectConfig;
}

const EffectsContext = createContext<EffectsContextValue | null>(null);

export interface EffectsProviderProps {
  children: React.ReactNode;
  config?: Partial<EffectConfig>;
}

export function EffectsProvider({ children, config }: EffectsProviderProps) {
  const managerRef = useRef<GameEffectsManager>(gameEffects);

  useEffect(() => {
    const manager = managerRef.current;

    // Update configuration if provided
    if (config) {
      manager.updateConfig(config);
    }

    // Setup default effects
    manager.setupDefaultEffects();

    // Cleanup on unmount
    return () => {
      // Note: We don't destroy the singleton instance completely
      // Just clean up any event listeners specific to this provider
    };
  }, [config]);

  const value: EffectsContextValue = {
    gameEffects: managerRef.current,
    updateConfig: (newConfig) => {
      managerRef.current.updateConfig(newConfig);
    },
    getConfig: () => managerRef.current.getConfig(),
  };

  return <EffectsContext.Provider value={value}>{children}</EffectsContext.Provider>;
}

/**
 * Hook to access the game effects system
 */
export function useGameEffects(): EffectsContextValue {
  const context = useContext(EffectsContext);
  if (!context) {
    throw new Error("useGameEffects must be used within an EffectsProvider");
  }
  return context;
}

/**
 * Hook to emit game events
 */
export function useEmitGameEvent() {
  const { gameEffects } = useGameEffects();

  return (eventType: string, payload?: unknown) => {
    gameEffects.emit(eventType, payload);
  };
}
