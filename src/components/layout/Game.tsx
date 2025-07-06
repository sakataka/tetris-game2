import {
  AIControls,
  Board,
  Controls,
  DebugIndicator,
  GameOverlay,
  HighScore,
  HoldPiece,
  NextPiece,
  ResetConfirmationDialog,
  ScoreBoard,
  TSpinIndicator,
} from "@/components/game";
import { useKeyboardControls } from "@/hooks/controls/useKeyboardControls";
import { useTouchGestures } from "@/hooks/controls/useTouchGestures";
import { useGameLoop } from "@/hooks/core/useGameLoop";
import { useHighScoreSideEffect } from "@/hooks/effects/useHighScoreSideEffect";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { GameSettings } from "./GameSettings";
import { MobileGameLayout } from "./MobileGameLayout";

export function Game() {
  useGameLoop();
  useKeyboardControls();
  useHighScoreSideEffect();
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

  // T-Spin indicator state
  const tSpinState = useGameStore((state) => state.tSpinState);
  const enableTSpinDetection = useSettingsStore((state) => state.enableTSpinDetection);
  const hideTSpinIndicator = useGameStore((state) => state.hideTSpinIndicator);

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
            <AIControls />
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

              {/* T-Spin Indicator */}
              {enableTSpinDetection && (
                <TSpinIndicator
                  tSpinType={tSpinState.type}
                  linesCleared={tSpinState.linesCleared}
                  show={tSpinState.show}
                  onComplete={hideTSpinIndicator}
                />
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Reset confirmation dialog */}
      <ResetConfirmationDialog />

      {/* Debug indicator */}
      <DebugIndicator />
    </>
  );
}
