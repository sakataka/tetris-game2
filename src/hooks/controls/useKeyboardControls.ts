import { useCallback, useEffect, useRef, useState } from "react";
import { useInputDebounce } from "@/hooks/common/useInputDebounce";
import { useGameStore } from "@/store/gameStore";
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
  KeyP: { action: "pause", repeat: false, cooldown: 200, preventDefaultAction: true },
  Enter: { action: "reset", repeat: false, cooldown: 300, preventDefaultAction: true },
};

/**
 * Integrated keyboard controls hook following koba04 React best practices
 *
 * Composes small hooks for complex functionality:
 * - useKeyboardInput for pure input detection
 * - useGameInputActions for game-specific actions
 * - useActionCooldown for preventing rapid executions
 * - useInputDebounce for repeat key handling
 *
 * @param keyMapping - Custom key mapping (optional)
 */
export function useKeyboardControls(keyMapping: KeyMapping = DEFAULT_KEY_MAPPING) {
  // Compose small hooks
  const { pressedKeys, isKeyPressed } = useKeyboardInput();
  const gameActions = useGameInputActions();
  const isGameActive = useGameStore((state) => !state.isGameOver && !state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);

  // Track processed keys to prevent duplicate executions
  const processedKeysRef = useRef<Set<string>>(new Set());

  // Get repeatable keys for debouncing
  const repeatableKeys = pressedKeys.filter((key) => keyMapping[key]?.repeat);
  const debouncedKeys = useInputDebounce(repeatableKeys, 50, { trailing: true });

  // Track cooldowns for each key
  const [keyCooldowns, setKeyCooldowns] = useState<Record<string, number>>({});

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
        } else if (mapping.action === "reset" && isGameOver) {
          action();
        } else if (isGameActive) {
          action();
        }
      }
    },
    [keyMapping, gameActions, isGameActive, isGameOver, keyCooldowns],
  );

  // Process single-press keys
  useEffect(() => {
    const singlePressKeys = pressedKeys.filter((key) => keyMapping[key] && !keyMapping[key].repeat);

    singlePressKeys.forEach((key) => {
      if (!processedKeysRef.current.has(key)) {
        executeKeyAction(key);
        processedKeysRef.current.add(key);
      }
    });

    // Clean up processed keys that are no longer pressed
    processedKeysRef.current.forEach((key) => {
      if (!pressedKeys.includes(key)) {
        processedKeysRef.current.delete(key);
      }
    });
  }, [pressedKeys, executeKeyAction, keyMapping]);

  // Process repeatable keys with debounce
  useEffect(() => {
    debouncedKeys.forEach(executeKeyAction);
  }, [debouncedKeys, executeKeyAction]);

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
