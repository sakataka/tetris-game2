/**
 * Animation Orchestrator Hook - Prototype Implementation
 * Centralized animation management with priority queuing and load control
 */

import { useCallback, useRef, useState } from "react";
import { MinimalPriorityQueue } from "@/game/animations/core/priorityQueue";
import {
  type FrameBudgetSentinel,
  MinimalFrameBudgetSentinel,
} from "@/game/animations/sentinel/FrameBudgetSentinel";

export interface AnimationConfig {
  duration: number;
  easing: string;
  priority: number; // 1-10 (10 is highest)
  cancellable: boolean;
}

export interface AnimationOrchestrator {
  register(id: string, animation: AnimationConfig, priority: number): void;
  execute(id: string): Promise<void>;
  cancel(id: string): boolean;
  getCurrentLoad(): number; // 0-1 load indicator
}

interface RunningAnimation {
  id: string;
  config: AnimationConfig;
  startTime: number;
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Maximum concurrent animations for prototype testing
 */
const MAX_CONCURRENT_ANIMATIONS = 5;

/**
 * Animation Orchestrator Hook
 * Provides centralized animation management with priority queuing
 */
export const useAnimationOrchestrator = (
  frameBudgetSentinel?: FrameBudgetSentinel,
): AnimationOrchestrator => {
  const [animations] = useState<Map<string, AnimationConfig>>(new Map());
  const runningAnimationsRef = useRef<Map<string, RunningAnimation>>(new Map());
  const queueRef = useRef<MinimalPriorityQueue>(new MinimalPriorityQueue());
  const sentinelRef = useRef<FrameBudgetSentinel>(
    frameBudgetSentinel ?? new MinimalFrameBudgetSentinel(),
  );

  // Initialize Frame Budget Sentinel monitoring
  const initializeSentinel = useCallback(() => {
    if (!sentinelRef.current) return;
    sentinelRef.current.startMonitoring();
  }, []);

  // Initialize on first use
  if (sentinelRef.current && !runningAnimationsRef.current.has("__initialized__")) {
    runningAnimationsRef.current.set("__initialized__", {} as RunningAnimation);
    initializeSentinel();
  }

  const register = useCallback(
    (id: string, animation: AnimationConfig, priority: number): void => {
      const config = { ...animation, priority };
      animations.set(id, config);
      queueRef.current.enqueue(id, priority);
    },
    [animations],
  );

  const executeAnimation = useCallback((id: string, config: AnimationConfig): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      // Check frame budget before starting
      const requiredBudget = Math.min(config.duration * 0.1, 5); // Estimate 10% of duration, max 5ms
      if (!sentinelRef.current?.requestBudget(requiredBudget)) {
        reject(new Error(`Insufficient frame budget for animation ${id}`));
        return;
      }

      const runningAnimation: RunningAnimation = {
        id,
        config,
        startTime: Date.now(),
        promise: Promise.resolve(),
        resolve,
        reject,
      };

      runningAnimationsRef.current.set(id, runningAnimation);

      // Simulate animation execution
      const animationPromise = new Promise<void>((animResolve) => {
        setTimeout(() => {
          runningAnimationsRef.current.delete(id);
          animResolve();
          resolve();
        }, config.duration);
      });

      runningAnimation.promise = animationPromise;
    });
  }, []);

  const processQueue = useCallback(async (): Promise<void> => {
    const runningCount = runningAnimationsRef.current.size - 1; // Exclude __initialized__ marker

    if (runningCount >= MAX_CONCURRENT_ANIMATIONS || queueRef.current.isEmpty()) {
      return;
    }

    const nextId = queueRef.current.dequeue();
    if (!nextId) return;

    const config = animations.get(nextId);
    if (!config) return;

    try {
      await executeAnimation(nextId, config);
      animations.delete(nextId);

      // Process next animation after completion
      setTimeout(() => processQueue(), 0);
    } catch (error) {
      console.warn(`Animation ${nextId} failed:`, error);
      animations.delete(nextId);

      // Continue processing queue even after failure
      setTimeout(() => processQueue(), 0);
    }
  }, [animations, executeAnimation]);

  const execute = useCallback(
    async (id: string): Promise<void> => {
      const config = animations.get(id);
      if (!config) {
        throw new Error(`Animation ${id} not registered`);
      }

      // If animation is already running, wait for it
      const existingAnimation = runningAnimationsRef.current.get(id);
      if (existingAnimation) {
        return existingAnimation.promise;
      }

      // If under load limit, execute immediately
      const runningCount = runningAnimationsRef.current.size - 1; // Exclude __initialized__ marker
      if (runningCount < MAX_CONCURRENT_ANIMATIONS) {
        const result = executeAnimation(id, config);
        animations.delete(id);
        return result;
      }

      // Otherwise, wait for queue processing
      await processQueue();

      // Check if animation was processed
      if (!animations.has(id)) {
        return; // Animation was executed during queue processing
      }

      throw new Error(`Animation ${id} could not be executed due to load constraints`);
    },
    [animations, executeAnimation, processQueue],
  );

  const cancel = useCallback(
    (id: string): boolean => {
      // Remove from queue if queued
      const removedFromQueue = queueRef.current.remove(id);

      // Cancel running animation if exists
      const runningAnimation = runningAnimationsRef.current.get(id);
      if (runningAnimation?.config.cancellable) {
        runningAnimation.reject(new Error(`Animation ${id} cancelled`));
        runningAnimationsRef.current.delete(id);
        animations.delete(id);
        return true;
      }

      // Remove from registered animations
      if (animations.has(id)) {
        animations.delete(id);
        return true;
      }

      return removedFromQueue;
    },
    [animations],
  );

  const getCurrentLoad = useCallback((): number => {
    const runningCount = runningAnimationsRef.current.size - 1; // Exclude __initialized__ marker
    const queuedCount = queueRef.current.size();

    // Load calculation: running animations weigh more than queued ones
    const runningWeight = runningCount * 0.7;
    const queuedWeight = queuedCount * 0.3;
    const totalWeight = runningWeight + queuedWeight;

    // Normalize to 0-1 scale based on reasonable maximum
    const maxExpectedLoad = MAX_CONCURRENT_ANIMATIONS * 2; // Consider both running and queued
    return Math.min(1, totalWeight / maxExpectedLoad);
  }, []);

  return {
    register,
    execute,
    cancel,
    getCurrentLoad,
  };
};
