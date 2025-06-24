import { useGameLoop } from "../../hooks/useGameLoop";
import { useKeyboardControls } from "../../hooks/useKeyboardControls";
import { useTouchGestures } from "../../hooks/useTouchGestures";
import {
  Board,
  Controls,
  GameOverlay,
  HighScore,
  NextPiece,
  ScoreBoard,
  TouchControls,
} from "../game";
import { GameSettings } from "./GameSettings";

export function Game() {
  useGameLoop();
  useKeyboardControls();
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 relative">
      <GameSettings />

      <main
        className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-6 md:gap-8 md:items-start md:justify-center md:min-h-[calc(100vh-2rem)] pt-12 md:pt-4"
        aria-label="Tetris Game"
      >
        {/* Sidebar - Top on mobile, left side on desktop */}
        <aside
          className="flex flex-col gap-3 w-full max-w-sm md:max-w-none mx-auto md:mx-0 order-1 md:order-none md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto md:pr-2"
          aria-label="Game Information"
        >
          <ScoreBoard />
          <HighScore />
          <NextPiece />
          <div className="hidden md:block">
            <Controls />
          </div>
        </aside>

        {/* Game board area */}
        <div className="order-2 md:order-none flex flex-col items-center md:justify-center">
          <section
            className="relative"
            aria-label="Game Board Area"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Board />
            <GameOverlay />
          </section>

          {/* Mobile controls */}
          <section className="w-full max-w-sm mt-6 md:hidden" aria-label="Game Controls">
            <TouchControls className="mb-4" />
            <Controls />
          </section>
        </div>
      </main>
    </div>
  );
}
