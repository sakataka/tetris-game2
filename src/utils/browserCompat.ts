import { useCallback, useEffect, useState } from "react";

/**
 * Supported CSS properties with fallbacks for older browsers
 * Ensures 95% browser support as required by O3 specifications
 */
interface SupportedCSSProps {
  transform: string;
  willChange: string | null;
  transition: string;
  backfaceVisibility: string | null;
  perspective: string | null;
}

/**
 * Browser capability detection results
 */
interface BrowserCapabilities {
  supportsTransform: boolean;
  supportsWillChange: boolean;
  supportsTransition: boolean;
  supportsVibrate: boolean;
  supportsRequestAnimationFrame: boolean;
  supportsCSSSupports: boolean;
  isWebKitBased: boolean;
  isMobile: boolean;
}

/**
 * Detect browser capabilities and provide appropriate CSS properties
 * Supports fallbacks for older browsers to maintain 95% compatibility
 */
export const getSupportedCSSProps = (): SupportedCSSProps => {
  const isWebKit = /webkit/i.test(navigator.userAgent);
  const supportsCSSSupports = "CSS" in window && "supports" in window.CSS;

  let supportsTransform = true;
  let supportsWillChange = true;
  let supportsTransition = true;

  // Feature detection with CSS.supports when available
  if (supportsCSSSupports) {
    try {
      supportsTransform = CSS.supports("transform", "scale(1)");
      supportsWillChange = CSS.supports("will-change", "transform");
      supportsTransition = CSS.supports("transition", "transform 100ms ease");
    } catch {
      // Fallback to basic detection
      supportsTransform = true;
      supportsWillChange = false;
      supportsTransition = true;
    }
  }

  return {
    // Transform with webkit fallback (React uses camelCase)
    transform: supportsTransform ? "transform" : isWebKit ? "WebkitTransform" : "transform",

    // Will-change optimization (not critical, can be null) - React uses camelCase
    willChange: supportsWillChange ? "willChange" : null,

    // Transition with webkit fallback (React uses camelCase)
    transition: supportsTransition ? "transition" : isWebKit ? "WebkitTransition" : "transition",

    // Backface visibility for smoother animations (React uses camelCase)
    backfaceVisibility: isWebKit ? "WebkitBackfaceVisibility" : "backfaceVisibility",

    // Perspective for 3D transforms (React uses camelCase)
    perspective: isWebKit ? "WebkitPerspective" : "perspective",
  };
};

/**
 * Comprehensive browser capability detection
 */
export const detectBrowserCapabilities = (): BrowserCapabilities => {
  const userAgent = navigator.userAgent.toLowerCase();

  return {
    supportsTransform:
      "CSS" in window && "supports" in window.CSS ? CSS.supports("transform", "scale(1)") : true, // Assume support for modern usage

    supportsWillChange:
      "CSS" in window && "supports" in window.CSS
        ? CSS.supports("will-change", "transform")
        : false,

    supportsTransition:
      "CSS" in window && "supports" in window.CSS
        ? CSS.supports("transition", "transform 100ms ease")
        : true,

    supportsVibrate: "vibrate" in navigator,

    supportsRequestAnimationFrame: "requestAnimationFrame" in window,

    supportsCSSSupports: "CSS" in window && "supports" in window.CSS,

    isWebKitBased: /webkit/i.test(userAgent),

    isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
  };
};

/**
 * Mobile haptic feedback hook with conditional support
 * Provides tactile feedback for button interactions on supported devices
 */
export const useHapticFeedback = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("vibrate" in navigator);
  }, []);

  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "heavy" = "light") => {
      if (!isSupported || !navigator.vibrate) return;

      const patterns = {
        light: 10,
        medium: 25,
        heavy: 50,
      };

      try {
        navigator.vibrate(patterns[type]);
      } catch (error) {
        // Silently fail for unsupported devices
        console.debug("[useHapticFeedback] Vibration not supported:", error);
      }
    },
    [isSupported],
  );

  return {
    triggerHaptic,
    isSupported,
  };
};

/**
 * Get optimized CSS properties for animations based on browser capabilities
 */
export const getOptimizedAnimationCSS = (
  transform: string,
  duration = 120,
  easing = "ease-out",
) => {
  const capabilities = detectBrowserCapabilities();
  const cssProps = getSupportedCSSProps();

  const baseStyles: Record<string, string | number> = {
    [cssProps.transform]: transform,
    [cssProps.transition]: `${cssProps.transform} ${duration}ms ${easing}`,
  };

  // Add performance optimizations for capable browsers
  if (capabilities.supportsWillChange && cssProps.willChange) {
    baseStyles[cssProps.willChange] = "transform";
  }

  // Add backface visibility for smoother animations
  if (cssProps.backfaceVisibility) {
    baseStyles[cssProps.backfaceVisibility] = "hidden";
  }

  return baseStyles;
};
