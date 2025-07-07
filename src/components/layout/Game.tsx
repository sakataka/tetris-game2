import { useState } from "react";
import {
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
import { AdvancedAIControls } from "@/components/game/AdvancedAIControls";
import { AIReplay } from "@/components/game/AIReplay";
import { AIVisualization } from "@/components/game/AIVisualization";
import { useAdvancedAIController } from "@/hooks/ai/useAdvancedAIController";
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

  // Advanced AI controller
  const {
    aiState,
    aiSettings,
    lastDecision,
    replayData,
    onToggleAI,
    onPause,
    onStep,
    onSettingsChange,
  } = useAdvancedAIController();

  // Replay state
  const [showReplay, setShowReplay] = useState(false);

  // T-Spin indicator state
  const tSpinState = useGameStore((state) => state.tSpinState);
  const enableTSpinDetection = useSettingsStore((state) => state.enableTSpinDetection);
  const hideTSpinIndicator = useGameStore((state) => state.hideTSpinIndicator);

  // Game state for AI visualization
  const gameState = useGameStore((state) => state);

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
          className="grid grid-cols-[240px_1fr_300px] gap-6 items-start justify-center min-h-[calc(100vh-2rem)] pt-4"
          aria-label="Tetris Game"
        >
          {/* Left Sidebar - Game Info */}
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

          {/* Right Sidebar - AI Controls & Visualization */}
          <aside
            className="flex flex-col gap-3 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pl-2"
            aria-label="AI Controls and Visualization"
          >
            {/* Advanced AI Controls */}
            <AdvancedAIControls
              aiState={aiState}
              settings={aiSettings}
              onSettingsChange={onSettingsChange}
              onToggleAI={onToggleAI}
              onPause={onPause}
              onStep={onStep}
            />

            {/* AI Visualization */}
            {aiSettings.enableVisualization && lastDecision && (
              <AIVisualization
                decision={lastDecision}
                settings={aiSettings}
                gameState={gameState}
              />
            )}

            {/* Replay Controls */}
            {replayData && !aiState.isEnabled && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowReplay(true)}
                  className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded"
                  data-testid="start-replay"
                >
                  View Replay
                </button>
              </div>
            )}
          </aside>
        </main>
      </div>

      {/* Reset confirmation dialog */}
      <ResetConfirmationDialog />

      {/* Replay Modal */}
      {showReplay && replayData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <AIReplay replayData={replayData} onReplayEnd={() => setShowReplay(false)} />
          </div>
        </div>
      )}

      {/* Debug indicator */}
      <DebugIndicator />
    </>
  );
}
