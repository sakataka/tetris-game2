import { useHotkeys } from "react-hotkeys-hook";
import { useGameStore } from "../store/gameStore";

export function useKeyboardControls() {
  const { moveLeft, moveRight, moveDown, rotate, drop, togglePause, isPaused, isGameOver } =
    useGameStore();

  // Left/right movement and soft drop - enable key repeat (default keydown: true)
  useHotkeys(
    "arrowleft",
    () => {
      if (!isGameOver && !isPaused) moveLeft();
    },
    { keydown: true },
  );

  useHotkeys(
    "arrowright",
    () => {
      if (!isGameOver && !isPaused) moveRight();
    },
    { keydown: true },
  );

  useHotkeys(
    "arrowdown",
    () => {
      if (!isGameOver && !isPaused) moveDown();
    },
    { keydown: true },
  );

  // Rotation and hard drop - single actions with preventDefault
  useHotkeys(
    "arrowup",
    (e) => {
      if (!isGameOver && !isPaused) {
        e.preventDefault();
        rotate();
      }
    },
    { keydown: true },
  );

  useHotkeys(
    "space",
    (e) => {
      if (!isGameOver && !isPaused) {
        e.preventDefault();
        drop();
      }
    },
    { keydown: true },
  );

  // Pause toggle - works even when paused, but not when game over
  useHotkeys(["p", "P"], () => {
    if (!isGameOver) togglePause();
  });
}
