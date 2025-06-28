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
  const isInitialMount = useRef(true);
  const { leading = false, trailing = true } = options;

  useEffect(() => {
    // Skip debouncing on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Handle leading edge execution - execute immediately on value change
    if (leading) {
      setDebouncedValue(value);
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't set timeout if trailing is disabled
    if (!trailing) {
      return;
    }

    // Set new timeout for trailing edge
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = undefined;
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [value, delay, leading, trailing]);

  return debouncedValue;
}
