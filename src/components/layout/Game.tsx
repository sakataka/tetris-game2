import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
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
import { LayoutModeToggle } from "@/components/ui/LayoutModeToggle";
import { useGamePlay } from "@/features/game-play";
import { useFocusManagement } from "@/hooks/accessibility/useFocusManagement";
import { useScreenReaderAnnouncements } from "@/hooks/accessibility/useScreenReaderAnnouncements";
import { useAdvancedAIController } from "@/hooks/ai/useAdvancedAIController";
import { useKeyboardControls } from "@/hooks/controls/useKeyboardControls";
import { useTouchGestures } from "@/hooks/controls/useTouchGestures";
import { useDesignTokens } from "@/hooks/core/useDesignTokens";
import { useGameLoop } from "@/hooks/core/useGameLoop";
import { useHighScoreSideEffect } from "@/hooks/effects/useHighScoreSideEffect";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { GameLayout } from "./GameLayout";
import { GameSettings } from "./GameSettings";
import { MobileGameLayout } from "./MobileGameLayout";

export function Game() {
  useGameLoop();
  useKeyboardControls();
  useHighScoreSideEffect();

  // Auto-start the game on mount
  const { startGame, isPlaying } = useGamePlay();
  const resetOldGame = useGameStore((state) => state.resetGame);

  useEffect(() => {
    // Start the game automatically if it's not already playing
    if (!isPlaying) {
      // Reset the old game store to ensure it's initialized
      resetOldGame();
      startGame();
    }
  }, [isPlaying, startGame, resetOldGame]);
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

  // Initialize focus management for accessibility
  useFocusManagement({
    enableFocusTrap: true,
    enableFocusRestore: true,
    enableKeyboardNavigation: true,
  });

  // Initialize screen reader announcements
  useScreenReaderAnnouncements({
    enableGameStateAnnouncements: true,
    enableScoreAnnouncements: true,
    enableErrorAnnouncements: true,
    enableDetailedDescriptions: false, // Can be toggled in settings
    announcementDelay: 500,
  });

  // Design tokens and layout management
  const { layoutMode: designLayoutMode, setLayoutMode } = useDesignTokens();
  const layoutMode: "compact" | "normal" =
    designLayoutMode === "gaming" ? "normal" : designLayoutMode;

  // AI features setting
  const enableAIFeatures = useSettingsStore((state) => state.enableAIFeatures);

  // Advanced AI controller (always call hook, but conditionally use result)
  const aiControllerResult = useAdvancedAIController();
  const aiController = enableAIFeatures ? aiControllerResult : null;

  // Replay state
  const [showReplay, setShowReplay] = useState(false);

  // T-Spin indicator state
  const tSpinState = useGameStore((state) => state.tSpinState);
  const enableTSpinDetection = useSettingsStore((state) => state.enableTSpinDetection);
  const hideTSpinIndicator = useGameStore((state) => state.hideTSpinIndicator);

  // Game state for AI visualization
  const gameState = useGameStore(useShallow((state) => state));

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden">
        <MobileGameLayout />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block relative">
        <GameSettings />

        <GameLayout mode={layoutMode} enableAIFeatures={enableAIFeatures}>
          {/* Left Sidebar - Game Info */}
          <aside
            id="game-info"
            className="layout-sidebar gap-3 pr-2"
            aria-label="Game Information"
            tabIndex={-1}
          >
            {/* Layout Mode Toggle */}
            <div className="mb-3">
              <LayoutModeToggle currentMode={layoutMode} onModeChange={setLayoutMode} />
            </div>

            <ScoreBoard />
            <HighScore />
            <HoldPiece />
            <NextPiece />
            <div id="game-controls">
              <Controls />
            </div>
          </aside>

          {/* Game board area */}
          <div className="layout-main">
            <section
              id="game-board"
              className="relative"
              aria-label="Game Board Area"
              tabIndex={-1}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              data-testid="game-board"
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

          {/* Right Sidebar - AI Controls & Visualization (only when AI features enabled) */}
          {enableAIFeatures && (
            <aside className="layout-ai gap-3 pl-2" aria-label="AI Controls and Visualization">
              {/* Advanced AI Controls */}
              {aiController && (
                <ErrorBoundary>
                  <AdvancedAIControls
                    aiState={aiController.aiState}
                    settings={aiController.aiSettings}
                    onSettingsChange={aiController.onSettingsChange}
                    onToggleAI={aiController.onToggleAI}
                    onPause={aiController.onPause}
                    onStep={aiController.onStep}
                  />
                </ErrorBoundary>
              )}

              {/* AI Visualization */}
              {aiController?.aiState.isEnabled &&
                aiController.aiSettings.enableVisualization &&
                aiController.lastDecision && (
                  <ErrorBoundary>
                    <AIVisualization
                      decision={aiController.lastDecision}
                      settings={aiController.aiSettings}
                      gameState={gameState}
                    />
                  </ErrorBoundary>
                )}

              {/* Replay Controls */}
              {aiController?.replayData && !aiController.aiState.isEnabled && (
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
          )}
        </GameLayout>
      </div>

      {/* Reset confirmation dialog */}
      <ResetConfirmationDialog />

      {/* Replay Modal */}
      {showReplay && aiController?.replayData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <AIReplay
              replayData={aiController.replayData}
              onReplayEnd={() => setShowReplay(false)}
            />
          </div>
        </div>
      )}

      {/* Debug indicator */}
      <DebugIndicator />
    </>
  );
}
