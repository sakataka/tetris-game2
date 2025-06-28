import { useCallback, useRef } from "react";

/**
 * Hook for debouncing function calls to prevent multiple rapid executions
 *
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced function wrapper
 */
export function useDebounce(delay = 250) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debounce = useCallback(
    (fn: () => void) => {
      // Clear previous timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        fn();
        timeoutRef.current = null;
      }, delay);
    },
    [delay],
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debounce, cancel };
}
