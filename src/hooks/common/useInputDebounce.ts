import { useEffect, useRef, useState } from "react";

/**
 * Options for debounce behavior
 */
interface DebounceOptions {
  /** Execute on the leading edge of the timeout */
  readonly leading?: boolean;
  /** Execute on the trailing edge of the timeout */
  readonly trailing?: boolean;
}

/**
 * Generic debounce hook following koba04 React best practices
 *
 * Separates domain logic from generic logic:
 * - No game-specific code
 * - Reusable across different contexts
 * - Type-safe with generics
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 * @param options - Configuration for leading/trailing edge execution
 * @returns The debounced value
 */
export function useInputDebounce<T>(value: T, delay: number, options: DebounceOptions = {}): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    // Handle leading edge execution
    if (options.leading && isFirstRunRef.current) {
      setDebouncedValue(value);
      isFirstRunRef.current = false;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      // Handle trailing edge execution
      if (options.trailing !== false) {
        setDebouncedValue(value);
      }
      timeoutRef.current = undefined;
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, options.leading, options.trailing]);

  // Reset first run flag when value changes
  useEffect(() => {
    isFirstRunRef.current = true;
  });

  return debouncedValue;
}
