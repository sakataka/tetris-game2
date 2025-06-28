import { useCallback, useEffect, useState } from "react";

/**
 * Pure keyboard input detection hook following koba04 React best practices
 *
 * This hook has a single responsibility: detecting keyboard input
 * - No game logic
 * - No debouncing
 * - No action handling
 *
 * @returns Object containing pressed keys and utility functions
 */
export function useKeyboardInput() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [keyEvents, setKeyEvents] = useState<KeyboardEvent[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys((prev) => new Set(prev).add(event.code));
      setKeyEvents((prev) => [...prev.slice(-9), event]); // Keep last 10 events
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(event.code);
        return newSet;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Clear all events
  const clearKeyEvents = useCallback(() => {
    setKeyEvents([]);
  }, []);

  // Check if a specific key is pressed
  const isKeyPressed = useCallback((key: string) => pressedKeys.has(key), [pressedKeys]);

  return {
    pressedKeys: Array.from(pressedKeys),
    keyEvents,
    isKeyPressed,
    clearKeyEvents,
  };
}
