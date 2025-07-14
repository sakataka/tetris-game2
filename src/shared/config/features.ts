/**
 * Feature flags configuration
 * Controls gradual rollout of new features
 */

export interface FeatureFlags {
  // Core engine features
  newEngine: boolean;
  functionalAI: boolean;
  optimizedRenderer: boolean;

  // UI features
  newScoring: boolean;
  enhancedAnimations: boolean;
  advancedAI: boolean;

  // Performance features
  webWorkerAI: boolean;
  ringBufferOptimization: boolean;

  // Debug features
  performanceMonitoring: boolean;
  eventLogging: boolean;
}

/**
 * Get feature flag value with environment variable override
 */
function getFeatureFlag(name: string, defaultValue = false): boolean {
  const envVar = `FEATURE_${name.toUpperCase()}`;
  const envValue = process.env[envVar];

  if (envValue !== undefined) {
    return envValue === "true" || envValue === "1";
  }

  return defaultValue;
}

/**
 * Feature flags configuration
 * Environment variables can override these defaults
 */
export const features: FeatureFlags = {
  // Core engine features
  newEngine: getFeatureFlag("NEW_ENGINE", false),
  functionalAI: getFeatureFlag("FUNCTIONAL_AI", false),
  optimizedRenderer: getFeatureFlag("OPTIMIZED_RENDERER", false),

  // UI features
  newScoring: getFeatureFlag("NEW_SCORING", false),
  enhancedAnimations: getFeatureFlag("ENHANCED_ANIMATIONS", false),
  advancedAI: getFeatureFlag("ADVANCED_AI", false),

  // Performance features
  webWorkerAI: getFeatureFlag("WEB_WORKER_AI", false),
  ringBufferOptimization: getFeatureFlag("RING_BUFFER_OPTIMIZATION", false),

  // Debug features
  performanceMonitoring: getFeatureFlag("PERFORMANCE_MONITORING", true),
  eventLogging: getFeatureFlag("EVENT_LOGGING", false),
};

/**
 * Enable feature for current session (for testing)
 */
export function enableFeature(name: keyof FeatureFlags): void {
  features[name] = true;
  console.log(`✅ Feature '${name}' enabled for current session`);
}

/**
 * Disable feature for current session (for testing)
 */
export function disableFeature(name: keyof FeatureFlags): void {
  features[name] = false;
  console.log(`❌ Feature '${name}' disabled for current session`);
}

/**
 * Get all currently enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

/**
 * Log current feature flag status (for debugging)
 */
export function logFeatureStatus(): void {
  console.group("🚩 Feature Flags Status");
  Object.entries(features).forEach(([name, enabled]) => {
    console.log(`${enabled ? "✅" : "❌"} ${name}: ${enabled}`);
  });
  console.groupEnd();
}
