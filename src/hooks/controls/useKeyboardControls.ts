import { useCallback, useEffect, useRef, useState } from "react";
import { useGamePlayState } from "@/features/game-play";
import { type GameInputActions, useGameInputActions } from "./useGameInputActions";
import { useKeyboardInput } from "./useKeyboardInput";

/**
 * Key mapping configuration
 */
interface KeyMapping {
  readonly [key: string]: {
    readonly action: keyof GameInputActions;
    readonly repeat?: boolean;
    readonly cooldown?: number;
    readonly preventDefaultAction?: boolean;
  };
}

/**
 * Default key mapping for Tetris controls
 */
const DEFAULT_KEY_MAPPING: KeyMapping = {
  ArrowLeft: { action: "moveLeft", repeat: true, cooldown: 100 },
  ArrowRight: { action: "moveRight", repeat: true, cooldown: 100 },
  ArrowUp: { action: "rotateClockwise", repeat: false, cooldown: 100, preventDefaultAction: true },
  ArrowDown: { action: "softDrop", repeat: true, cooldown: 50 },
  Space: { action: "hardDrop", repeat: false, cooldown: 200, preventDefaultAction: true },
  ShiftLeft: { action: "hold", repeat: false, cooldown: 200, preventDefaultAction: true },
  ShiftRight: { action: "hold", repeat: false, cooldown: 200, preventDefaultAction: true },
  KeyA: { action: "rotate180", repeat: false, cooldown: 100, preventDefaultAction: true },
  KeyP: { action: "pause", repeat: false, cooldown: 200, preventDefaultAction: true },
  KeyR: { action: "reset", repeat: false, cooldown: 300, preventDefaultAction: true },
  Enter: { action: "reset", repeat: false, cooldown: 300, preventDefaultAction: true },
};

/**
 * Integrated keyboard controls hook following koba04 React best practices
 *
 * Composes small hooks for complex functionality:
 * - useKeyboardInput for pure input detection
 * - useGameInputActions for game-specific actions
 * - useActionCooldown for preventing rapid executions
 * - Inline debounce implementation for repeat key handling
 *
 * @param keyMapping - Custom key mapping (optional)
 */
export function useKeyboardControls(keyMapping: KeyMapping = DEFAULT_KEY_MAPPING) {
  // Compose small hooks
  const { pressedKeys, isKeyPressed } = useKeyboardInput();
  const gameActions = useGameInputActions();
  const { isPlaying, isPaused, isGameOver } = useGamePlayState();
  const isGameActive = isPlaying && !isPaused && !isGameOver;

  // Track processed keys to prevent duplicate executions
  const processedKeysRef = useRef<Set<string>>(new Set());

  // Get repeatable keys for debouncing
  const repeatableKeys = pressedKeys.filter((key) => keyMapping[key]?.repeat);

  // Inline debounce implementation (replaces useInputDebounce)
  const [debouncedKeys, setDebouncedKeys] = useState<string[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Track cooldowns for each key
  const [keyCooldowns, setKeyCooldowns] = useState<Record<string, number>>({});

  // Handle debouncing for repeatable keys
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for trailing edge (50ms delay)
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedKeys(repeatableKeys);
      debounceTimeoutRef.current = undefined;
    }, 50);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = undefined;
      }
    };
  }, [repeatableKeys]);

  // Handle key actions with cooldown
  const executeKeyAction = useCallback(
    (key: string) => {
      const mapping = keyMapping[key];
      if (!mapping) return;

      // Check if key is on cooldown
      const now = Date.now();
      const lastExecutionTime = keyCooldowns[key] || 0;
      const cooldownMs = mapping.cooldown || 0;

      if (now - lastExecutionTime < cooldownMs) {
        return; // Still on cooldown
      }

      // Update cooldown timestamp
      setKeyCooldowns((prev) => ({ ...prev, [key]: now }));

      // Execute the action
      const action = gameActions[mapping.action];
      if (typeof action === "function") {
        // Special handling for pause and reset
        if (mapping.action === "pause" && !isGameOver) {
          action();
        } else if (mapping.action === "reset" && isGameActive) {
          action(); // Reset only during active gameplay (not paused, not game over)
        } else if (isGameActive) {
          action();
        }
      }
    },
    [keyMapping, gameActions, isGameActive, isGameOver, keyCooldowns],
  );

  // Process all key actions (single-press and repeatable)
  useEffect(() => {
    // Handle single-press keys
    const singlePressKeys = pressedKeys.filter((key) => keyMapping[key] && !keyMapping[key].repeat);
    singlePressKeys.forEach((key) => {
      if (!processedKeysRef.current.has(key)) {
        executeKeyAction(key);
        processedKeysRef.current.add(key);
      }
    });

    // Handle repeatable keys with debounce
    debouncedKeys.forEach(executeKeyAction);

    // Clean up processed keys that are no longer pressed
    processedKeysRef.current.forEach((key) => {
      if (!pressedKeys.includes(key)) {
        processedKeysRef.current.delete(key);
      }
    });
  }, [pressedKeys, debouncedKeys, executeKeyAction, keyMapping]);

  // Handle preventDefault for specific keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mapping = keyMapping[event.code];
      if (mapping?.preventDefaultAction) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyMapping]);

  return {
    pressedKeys,
    isKeyPressed,
    executeKeyAction,
  };
}
