import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAnimationContext } from "@/contexts/AnimationContext";

interface MicroInteractionMetric {
  type: string;
  responseTime: number;
  timestamp: number;
}

// Extend Window interface for metrics storage
declare global {
  interface Window {
    microInteractionMetrics?: MicroInteractionMetric[];
  }
}

interface PerformanceMonitorConfig {
  enableLogging: boolean;
  targetResponseTime: number;
  warningThreshold: number;
}

/**
 * Hook for monitoring micro-interaction response times
 *
 * Measures and tracks UI response times to ensure 60ms target is met
 * Provides warnings when response times exceed targets
 * Stores metrics for analysis and optimization
 */
export const usePerformanceMonitor = (config?: Partial<PerformanceMonitorConfig>) => {
  const { performanceTargets } = useAnimationContext();
  const metricsRef = useRef<MicroInteractionMetric[]>([]);

  const finalConfig = useMemo((): PerformanceMonitorConfig => {
    const defaultConfig: PerformanceMonitorConfig = {
      enableLogging: Boolean(import.meta.env.DEV),
      targetResponseTime: performanceTargets.hoverResponse,
      warningThreshold: performanceTargets.hoverResponse * 1.5, // 90ms warning threshold
    };

    return { ...defaultConfig, ...config };
  }, [performanceTargets.hoverResponse, config]);

  // Initialize global metrics storage
  useEffect(() => {
    if (!window.microInteractionMetrics) {
      window.microInteractionMetrics = [];
    }
  }, []);

  /**
   * Measure response time for a micro-interaction
   *
   * @param eventType - The type of interaction being measured
   * @returns The start timestamp for the measurement
   */
  const measureResponseTime = useCallback(
    (eventType: string): number => {
      const startTime = performance.now();

      // Schedule measurement completion on next frame
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;

        const metric: MicroInteractionMetric = {
          type: eventType,
          responseTime,
          timestamp: Date.now(),
        };

        // Store in local ref
        metricsRef.current.push(metric);

        // Store in global window object for prototype validation
        if (window.microInteractionMetrics) {
          window.microInteractionMetrics.push(metric);

          // Keep only last 100 measurements to prevent memory leaks
          if (window.microInteractionMetrics.length > 100) {
            window.microInteractionMetrics = window.microInteractionMetrics.slice(-100);
          }
        }

        // Performance warnings and logging
        if (finalConfig.enableLogging) {
          if (responseTime > finalConfig.warningThreshold) {
            console.warn(
              `⚠️ Slow micro-interaction: ${eventType} took ${responseTime.toFixed(2)}ms (target: ${finalConfig.targetResponseTime}ms)`,
            );
          } else if (responseTime > finalConfig.targetResponseTime) {
            console.log(
              `⚡ Micro-interaction: ${eventType} took ${responseTime.toFixed(2)}ms (target: ${finalConfig.targetResponseTime}ms)`,
            );
          }
        }
      });

      return startTime;
    },
    [finalConfig],
  );

  /**
   * Get recent metrics for analysis
   *
   * @param limit - Maximum number of recent metrics to return
   * @returns Array of recent metrics
   */
  const getRecentMetrics = useCallback((limit = 10): MicroInteractionMetric[] => {
    return metricsRef.current.slice(-limit);
  }, []);

  /**
   * Get performance statistics
   *
   * @returns Performance analysis object
   */
  const getPerformanceStats = useCallback(() => {
    const metrics = metricsRef.current;

    if (metrics.length === 0) {
      return {
        count: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        targetViolations: 0,
        violationRate: 0,
      };
    }

    const responseTimes = metrics.map((m) => m.responseTime);
    const targetViolations = responseTimes.filter((t) => t > finalConfig.targetResponseTime).length;

    return {
      count: metrics.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      targetViolations,
      violationRate: (targetViolations / metrics.length) * 100,
    };
  }, [finalConfig.targetResponseTime]);

  /**
   * Clear stored metrics
   */
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    if (window.microInteractionMetrics) {
      window.microInteractionMetrics = [];
    }
  }, []);

  /**
   * Measure button interaction response time
   * Specialized helper for button-specific measurements
   */
  const measureButtonResponse = useCallback(
    (action: "hover" | "click" | "press") => {
      return measureResponseTime(`button-${action}`);
    },
    [measureResponseTime],
  );

  return {
    measureResponseTime,
    measureButtonResponse,
    getRecentMetrics,
    getPerformanceStats,
    clearMetrics,
    config: finalConfig,
  };
};
