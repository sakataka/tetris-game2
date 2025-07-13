import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAdaptivePerformance } from "@/hooks/core/useAdaptivePerformance";

interface FineTuneConfig {
  uiTimings: {
    buttonHover: {
      duration: number;
      targetResponseTime: number;
    };
    buttonPress: {
      duration: number;
      targetResponseTime: number;
    };
    commonTimings: {
      quick: number;
      normal: number;
      slow: number;
    };
  };
  performance: {
    targets: {
      hoverResponse: number;
      clickResponse: number;
      animationDuration: number;
      fpsMinimum: number;
    };
    optimization: {
      useGPUAcceleration: boolean;
      enableWillChange: boolean;
      prefersReducedMotion: string;
    };
  };
  hapticFeedback: {
    patterns: {
      light: number;
      medium: number;
      heavy: number;
    };
    enabledByDefault: boolean;
  };
}

interface AnimationContextValue {
  quality: "full" | "reduced" | "essential";
  orchestrator: null; // Mock implementation for prototype
  commonTimings: {
    quick: number;
    normal: number;
    slow: number;
  };
  prefersReducedMotion: boolean;
  config: FineTuneConfig | null;
  performanceTargets: {
    hoverResponse: number;
    clickResponse: number;
    animationDuration: number;
    fpsMinimum: number;
  };
  isConfigLoaded: boolean;
}

const AnimationContext = createContext<AnimationContextValue | undefined>(undefined);

interface AnimationProviderProps {
  children: React.ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const { animationsEnabled, performanceMode } = useAdaptivePerformance();
  const [config, setConfig] = useState<FineTuneConfig | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Load fine-tune configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/fine-tune.json");
        const fineTuneConfig = await response.json();
        setConfig(fineTuneConfig);
        setIsConfigLoaded(true);
      } catch (error) {
        console.warn("[AnimationContext] Failed to load fine-tune.json, using defaults", error);
        // Fallback configuration
        setConfig({
          uiTimings: {
            buttonHover: { duration: 120, targetResponseTime: 60 },
            buttonPress: { duration: 100, targetResponseTime: 30 },
            commonTimings: { quick: 120, normal: 300, slow: 600 },
          },
          performance: {
            targets: {
              hoverResponse: 60,
              clickResponse: 30,
              animationDuration: 120,
              fpsMinimum: 55,
            },
            optimization: {
              useGPUAcceleration: true,
              enableWillChange: true,
              prefersReducedMotion: "respect",
            },
          },
          hapticFeedback: {
            patterns: { light: 10, medium: 25, heavy: 50 },
            enabledByDefault: true,
          },
        });
        setIsConfigLoaded(true);
      }
    };

    loadConfig();
  }, []);

  // Determine animation quality based on user preferences and performance
  const quality = prefersReducedMotion
    ? "essential"
    : performanceMode === "reduced"
      ? "reduced"
      : animationsEnabled
        ? "full"
        : "essential";

  const value: AnimationContextValue = {
    quality,
    orchestrator: null, // Mock implementation for prototype
    commonTimings: {
      quick: config?.uiTimings?.commonTimings?.quick || 120,
      normal: config?.uiTimings?.commonTimings?.normal || 300,
      slow: config?.uiTimings?.commonTimings?.slow || 600,
    },
    prefersReducedMotion,
    config,
    performanceTargets: {
      hoverResponse: config?.performance?.targets?.hoverResponse || 60,
      clickResponse: config?.performance?.targets?.clickResponse || 30,
      animationDuration: config?.performance?.targets?.animationDuration || 120,
      fpsMinimum: config?.performance?.targets?.fpsMinimum || 55,
    },
    isConfigLoaded,
  };

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
};

export const useAnimationContext = (): AnimationContextValue => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimationContext must be used within an AnimationProvider");
  }
  return context;
};

// Hook for accessing fine-tune configuration directly
export const useFineTuneConfig = () => {
  const { config, isConfigLoaded } = useAnimationContext();
  return { config, isConfigLoaded };
};
