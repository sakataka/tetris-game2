import { useKeyboardControls } from "../../hooks/controls/useKeyboardControls";
import { useTouchGestures } from "../../hooks/controls/useTouchGestures";
import { useGameLoop } from "../../hooks/core/useGameLoop";
import { useHighScoreSideEffect } from "../../hooks/effects/useHighScoreSideEffect";
import { Board, Controls, GameOverlay, HighScore, HoldPiece, NextPiece, ScoreBoard } from "../game";
import { GameSettings } from "./GameSettings";
import { MobileGameLayout } from "./MobileGameLayout";

export function Game() {
  useGameLoop();
  useKeyboardControls();
  useHighScoreSideEffect();
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden">
        <MobileGameLayout />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 relative">
        <GameSettings />

        <main
          className="grid grid-cols-[240px_1fr] gap-8 items-start justify-center min-h-[calc(100vh-2rem)] pt-4"
          aria-label="Tetris Game"
        >
          {/* Sidebar - left side on desktop */}
          <aside
            className="flex flex-col gap-3 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2"
            aria-label="Game Information"
          >
            <ScoreBoard />
            <HighScore />
            <HoldPiece />
            <NextPiece />
            <Controls />
          </aside>

          {/* Game board area */}
          <div className="flex flex-col items-center justify-center">
            <section
              className="relative"
              aria-label="Game Board Area"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Board />
              <GameOverlay />
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
