import { useCallback, useState } from "react";

interface ScoreAnimationMetrics {
  scoreCountDuration: number;
  comboResponseTime: number;
  tetrisFlashDuration: number;
  frameBudgetUsage: number;
  lastMeasurement: string;
}

interface PerformanceTargets {
  SCORE_COUNT_MAX: 1000; // ms - Maximum counting duration
  COMBO_RESPONSE_MAX: 120; // ms - Maximum combo feedback delay
  TETRIS_FLASH_MAX: 200; // ms - Maximum flash effect duration
  FRAME_BUDGET_MAX: 16; // ms - Maximum per-frame impact
  GAMEPLAY_INTERRUPTION: 0; // Subjective: No gameplay disruption
}

const GAMING_PERFORMANCE_TARGETS: PerformanceTargets = {
  SCORE_COUNT_MAX: 1000,
  COMBO_RESPONSE_MAX: 120,
  TETRIS_FLASH_MAX: 200,
  FRAME_BUDGET_MAX: 16,
  GAMEPLAY_INTERRUPTION: 0,
};

/**
 * Performance monitoring hook for score animation system
 * Meets Issue #137 requirement: Frame Budget監視統合
 */
export function useScoreAnimationMetrics() {
  const [metrics, setMetrics] = useState<ScoreAnimationMetrics>({
    scoreCountDuration: 0,
    comboResponseTime: 0,
    tetrisFlashDuration: 0,
    frameBudgetUsage: 0,
    lastMeasurement: "",
  });

  const measureScoreAnimation = useCallback(
    (type: "scoreCount" | "comboResponse" | "tetrisFlash", startTime: number) => {
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime;
        const timestamp = new Date().toISOString();

        setMetrics((prev) => ({
          ...prev,
          [`${type}Duration`]: duration,
          lastMeasurement: `${type}: ${duration.toFixed(2)}ms at ${timestamp}`,
        }));

        // Performance budget checks
        const target =
          type === "scoreCount"
            ? GAMING_PERFORMANCE_TARGETS.SCORE_COUNT_MAX
            : type === "comboResponse"
              ? GAMING_PERFORMANCE_TARGETS.COMBO_RESPONSE_MAX
              : type === "tetrisFlash"
                ? GAMING_PERFORMANCE_TARGETS.TETRIS_FLASH_MAX
                : GAMING_PERFORMANCE_TARGETS.FRAME_BUDGET_MAX;

        if (duration > target) {
          console.warn(
            `⚠️ Score animation exceeded budget: ${type} ${duration.toFixed(2)}ms > ${target}ms`,
          );
        }

        // Frame budget usage estimation
        const frameBudgetUsage = (duration / GAMING_PERFORMANCE_TARGETS.FRAME_BUDGET_MAX) * 100;
        if (frameBudgetUsage > 100) {
          console.warn(`⚠️ Frame budget exceeded: ${frameBudgetUsage.toFixed(1)}%`);
        }

        setMetrics((prev) => ({
          ...prev,
          frameBudgetUsage: Math.max(prev.frameBudgetUsage, frameBudgetUsage),
        }));
      });
    },
    [],
  );

  const measureFrameBudget = useCallback((animationType: string, duration: number) => {
    const frameBudgetUsage = (duration / GAMING_PERFORMANCE_TARGETS.FRAME_BUDGET_MAX) * 100;

    setMetrics((prev) => ({
      ...prev,
      frameBudgetUsage: Math.max(prev.frameBudgetUsage, frameBudgetUsage),
      lastMeasurement: `${animationType} frame budget: ${frameBudgetUsage.toFixed(1)}%`,
    }));

    if (frameBudgetUsage > 100) {
      console.warn(`⚠️ ${animationType} exceeded frame budget: ${frameBudgetUsage.toFixed(1)}%`);
    }

    return frameBudgetUsage;
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      scoreCountDuration: 0,
      comboResponseTime: 0,
      tetrisFlashDuration: 0,
      frameBudgetUsage: 0,
      lastMeasurement: "",
    });
  }, []);

  const getPerformanceSummary = useCallback(() => {
    const summary = {
      scoreCountStatus:
        metrics.scoreCountDuration <= GAMING_PERFORMANCE_TARGETS.SCORE_COUNT_MAX ? "✅" : "❌",
      comboResponseStatus:
        metrics.comboResponseTime <= GAMING_PERFORMANCE_TARGETS.COMBO_RESPONSE_MAX ? "✅" : "❌",
      tetrisFlashStatus:
        metrics.tetrisFlashDuration <= GAMING_PERFORMANCE_TARGETS.TETRIS_FLASH_MAX ? "✅" : "❌",
      frameBudgetStatus: metrics.frameBudgetUsage <= 100 ? "✅" : "❌",
      overallStatus:
        metrics.scoreCountDuration <= GAMING_PERFORMANCE_TARGETS.SCORE_COUNT_MAX &&
        metrics.comboResponseTime <= GAMING_PERFORMANCE_TARGETS.COMBO_RESPONSE_MAX &&
        metrics.tetrisFlashDuration <= GAMING_PERFORMANCE_TARGETS.TETRIS_FLASH_MAX &&
        metrics.frameBudgetUsage <= 100
          ? "🎮 GAMING READY"
          : "⚠️ NEEDS OPTIMIZATION",
    };

    return summary;
  }, [metrics]);

  return {
    metrics,
    targets: GAMING_PERFORMANCE_TARGETS,
    measureScoreAnimation,
    measureFrameBudget,
    resetMetrics,
    getPerformanceSummary,
  };
}
