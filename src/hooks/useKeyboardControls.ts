import { useRef, useTransition } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useGameStore } from "../store/gameStore";
import { createExecuteGameAction } from "./executeGameAction";

export function useKeyboardControls() {
  const {
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    drop,
    togglePause,
    resetGame,
    isPaused,
    isGameOver,
  } = useGameStore();
  const lastPauseTime = useRef(0);
  const [, startTransition] = useTransition();
  const executeGameAction = createExecuteGameAction(isGameOver, isPaused, startTransition);

  // Movement controls (with key repeat)
  useHotkeys("arrowleft", () => executeGameAction(moveLeft), { keydown: true });
  useHotkeys("arrowright", () => executeGameAction(moveRight), { keydown: true });
  useHotkeys("arrowdown", () => executeGameAction(moveDown), { keydown: true });

  // Rotation (single action with preventDefault)
  useHotkeys(
    "arrowup",
    (e) => {
      e.preventDefault();
      executeGameAction(rotate);
    },
    { keydown: true },
  );

  // Hard drop (urgent, no transition)
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      executeGameAction(drop, false);
    },
    { keydown: true },
  );

  // Pause toggle (works when paused, debounced)
  useHotkeys(
    ["p", "P"],
    (e) => {
      const now = Date.now();
      if (now - lastPauseTime.current < 200 || isGameOver) return;
      lastPauseTime.current = now;
      e.preventDefault();
      togglePause();
    },
    { keydown: true },
  );

  // Reset game (only when game over)
  useHotkeys(
    "enter",
    (e) => {
      if (!isGameOver) return;
      e.preventDefault();
      startTransition(resetGame);
    },
    { keydown: true },
  );
}
