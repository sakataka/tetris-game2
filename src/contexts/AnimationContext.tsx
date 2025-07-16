import type React from "react";
import { createContext, useContext, useState } from "react";
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

// Integrated fine-tune configuration (previously from fine-tune.json)
const DEFAULT_FINE_TUNE_CONFIG: FineTuneConfig = {
  uiTimings: {
    buttonHover: {
      duration: 120,
      targetResponseTime: 60,
    },
    buttonPress: {
      duration: 100,
      targetResponseTime: 30,
    },
    commonTimings: {
      quick: 120,
      normal: 300,
      slow: 600,
    },
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
    patterns: {
      light: 10,
      medium: 25,
      heavy: 50,
    },
    enabledByDefault: true,
  },
};

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
  const [config] = useState<FineTuneConfig>(DEFAULT_FINE_TUNE_CONFIG);
  const [isConfigLoaded] = useState(true);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    commonTimings: config.uiTimings.commonTimings,
    prefersReducedMotion,
    config,
    performanceTargets: config.performance.targets,
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
