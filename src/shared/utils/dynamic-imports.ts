/**
 * Dynamic import utilities for code splitting
 * Enables lazy loading of non-critical features
 */

// Removed createLazyComponent as it's not used anywhere in the codebase

/**
 * Preload critical features for better UX
 */
export function preloadCriticalFeatures(): Promise<unknown[]> {
  const preloadPromises = [
    // Preload game-play feature (always needed)
    import("../../features/game-play").catch(() => {}),

    // Preload scoring (usually needed)
    import("../../features/scoring").catch(() => {}),
  ];

  return Promise.all(preloadPromises);
}
