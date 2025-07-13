/**
 * Celebration Metrics Hook
 * Performance measurement for level celebration animations
 */

import { useCallback, useState } from "react";

export interface CelebrationMetrics {
  celebrationDuration: number;
  userCancellationCount: number;
  totalCelebrations: number;
  frameBudgetUsage: number;
  averageDuration: number;
  cancellationRate: number;
  lastCelebrationTime: number | null;
}

export interface CelebrationMetricsController {
  metrics: CelebrationMetrics;
  measureCelebration: (startTime: number, cancelled: boolean) => void;
  measureFrameBudget: (budgetUsed: number) => void;
  resetMetrics: () => void;
  getAnalytics: () => {
    playerSatisfactionScore: number;
    performanceScore: number;
    optimalDuration: number;
  };
}

const INITIAL_METRICS: CelebrationMetrics = {
  celebrationDuration: 0,
  userCancellationCount: 0,
  totalCelebrations: 0,
  frameBudgetUsage: 0,
  averageDuration: 0,
  cancellationRate: 0,
  lastCelebrationTime: null,
};

/**
 * Hook for measuring and analyzing level celebration performance
 */
export const useCelebrationMetrics = (): CelebrationMetricsController => {
  const [metrics, setMetrics] = useState<CelebrationMetrics>(INITIAL_METRICS);

  const measureCelebration = useCallback((startTime: number, cancelled: boolean) => {
    const duration = performance.now() - startTime;

    setMetrics((prev) => {
      const newTotalCelebrations = prev.totalCelebrations + 1;
      const newCancellationCount = prev.userCancellationCount + (cancelled ? 1 : 0);
      const newTotalDuration = prev.celebrationDuration + duration;

      const updatedMetrics = {
        celebrationDuration: newTotalDuration,
        userCancellationCount: newCancellationCount,
        totalCelebrations: newTotalCelebrations,
        frameBudgetUsage: prev.frameBudgetUsage,
        averageDuration: newTotalDuration / newTotalCelebrations,
        cancellationRate: newCancellationCount / newTotalCelebrations,
        lastCelebrationTime: Date.now(),
      };

      // Log metrics for prototype evaluation
      console.log("🎉 Level celebration metrics:", {
        duration: Math.round(duration),
        cancelled,
        averageDuration: Math.round(updatedMetrics.averageDuration),
        cancellationRate: Math.round(updatedMetrics.cancellationRate * 100),
        totalCelebrations: newTotalCelebrations,
      });

      return updatedMetrics;
    });
  }, []);

  const measureFrameBudget = useCallback((budgetUsed: number) => {
    setMetrics((prev) => ({
      ...prev,
      frameBudgetUsage: Math.max(prev.frameBudgetUsage, budgetUsed),
    }));
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics(INITIAL_METRICS);
  }, []);

  const getAnalytics = useCallback(() => {
    // Calculate player satisfaction score (0-1)
    // Lower cancellation rate = higher satisfaction
    const playerSatisfactionScore = Math.max(0, 1 - metrics.cancellationRate);

    // Calculate performance score (0-1)
    // Based on frame budget usage and average duration
    const durationScore = metrics.averageDuration <= 3000 ? 1 : 3000 / metrics.averageDuration;
    const budgetScore = metrics.frameBudgetUsage <= 16 ? 1 : 16 / metrics.frameBudgetUsage;
    const performanceScore = (durationScore + budgetScore) / 2;

    // Calculate optimal duration based on metrics
    // If high cancellation rate, suggest shorter duration
    const baseOptimalDuration = 3000; // 3 seconds
    const cancellationPenalty = metrics.cancellationRate * 1000; // Up to 1 second reduction
    const optimalDuration = Math.max(1000, baseOptimalDuration - cancellationPenalty);

    return {
      playerSatisfactionScore,
      performanceScore,
      optimalDuration,
    };
  }, [metrics]);

  return {
    metrics,
    measureCelebration,
    measureFrameBudget,
    resetMetrics,
    getAnalytics,
  };
};
