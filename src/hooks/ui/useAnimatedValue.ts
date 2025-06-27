import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for managing animated value changes with animation keys
 * Tracks when a value changes and provides an incrementing key for animation triggers
 */
export function useAnimatedValue<T>(value: T) {
  const [animationKey, setAnimationKey] = useState(0);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setAnimationKey((k) => k + 1);
    }
  }, [value]);

  return animationKey;
}
