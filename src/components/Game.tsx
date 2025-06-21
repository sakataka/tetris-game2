import { useGameLoop } from "../hooks/useGameLoop";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { GameOverlay } from "./GameOverlay";
import { LanguageSelector } from "./LanguageSelector";
import { NextPiece } from "./NextPiece";
import { ScoreBoard } from "./ScoreBoard";

export function Game() {
  useGameLoop();
  useKeyboardControls();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 relative">
      <LanguageSelector />

      {/* Desktop Layout - Grid */}
      <div className="hidden md:grid md:grid-cols-[240px_1fr] md:gap-8 md:place-items-center md:min-h-[calc(100vh-2rem)]">
        <div className="flex flex-col gap-4 w-full">
          <ScoreBoard />
          <NextPiece />
          <Controls />
        </div>
        <div className="relative">
          <Board />
          <GameOverlay />
        </div>
      </div>

      {/* Mobile Layout - Vertical Stack */}
      <div className="md:hidden flex flex-col items-center gap-6 pt-12">
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <ScoreBoard />
          <NextPiece />
        </div>
        <div className="relative">
          <Board />
          <GameOverlay />
        </div>
        <div className="w-full max-w-sm">
          <Controls />
        </div>
      </div>
    </div>
  );
}
