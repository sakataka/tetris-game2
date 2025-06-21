import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

export function useKeyboardControls() {
  const { moveLeft, moveRight, moveDown, rotate, drop, togglePause, isPaused, isGameOver } =
    useGameStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isGameOver) return;

      // Prevent default scrolling behavior for game keys
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowLeft":
          if (!isPaused) moveLeft();
          break;
        case "ArrowRight":
          if (!isPaused) moveRight();
          break;
        case "ArrowDown":
          if (!isPaused) moveDown();
          break;
        case "ArrowUp":
          if (!isPaused) rotate();
          break;
        case " ":
          if (!isPaused) drop();
          break;
        case "p":
        case "P":
          togglePause();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [moveLeft, moveRight, moveDown, rotate, drop, togglePause, isPaused, isGameOver]);
}
