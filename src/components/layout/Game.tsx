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
import { LanguageSelector } from "./LanguageSelector";

export function Game() {
  useGameLoop();
  useKeyboardControls();
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 relative">
      <LanguageSelector />

      {/* Desktop Layout - Grid */}
      <main
        className="hidden md:grid md:grid-cols-[240px_1fr] md:gap-8 md:place-items-center md:min-h-[calc(100vh-2rem)]"
        aria-label="Tetris Game"
      >
        <aside className="flex flex-col gap-4 w-full" aria-label="Game Information">
          <ScoreBoard />
          <HighScore />
          <NextPiece />
          <Controls />
        </aside>
        <section
          className="relative"
          aria-label="Game Board Area"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Board />
          <GameOverlay />
        </section>
      </main>

      {/* Mobile Layout - Vertical Stack */}
      <main className="md:hidden flex flex-col items-center gap-6 pt-12" aria-label="Tetris Game">
        <aside className="flex flex-col gap-4 w-full max-w-sm" aria-label="Game Information">
          <ScoreBoard />
          <HighScore />
          <NextPiece />
        </aside>
        <section
          className="relative"
          aria-label="Game Board Area"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Board />
          <GameOverlay />
        </section>
        <section className="w-full max-w-sm" aria-label="Game Controls">
          <TouchControls className="mb-4" />
          <Controls />
        </section>
      </main>
    </div>
  );
}
