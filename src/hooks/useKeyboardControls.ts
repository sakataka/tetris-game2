import { useRef, useTransition } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useGameStore } from "../store/gameStore";
import { useGameActionHandler } from "./useGameActionHandler";

export function useKeyboardControls() {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);
  const holdPiece = useGameStore((state) => state.holdPiece);
  const togglePause = useGameStore((state) => state.togglePause);
  const resetGame = useGameStore((state) => state.resetGame);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const lastPauseTime = useRef(0);
  const [, startTransition] = useTransition();
  const executeAction = useGameActionHandler();

  // Movement controls (with key repeat)
  useHotkeys("arrowleft", () => executeAction(moveLeft), { keydown: true });
  useHotkeys("arrowright", () => executeAction(moveRight), { keydown: true });
  useHotkeys("arrowdown", () => executeAction(moveDown), { keydown: true });

  // Rotation (single action with preventDefault)
  useHotkeys(
    "arrowup",
    (e) => {
      e.preventDefault();
      executeAction(rotate);
    },
    { keydown: true },
  );

  // Hard drop (urgent, no transition)
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      executeAction(drop, true);
    },
    { keydown: true },
  );

  // Hold piece
  useHotkeys(
    "shift",
    (e) => {
      e.preventDefault();
      executeAction(holdPiece);
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
