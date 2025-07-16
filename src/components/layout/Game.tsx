import { useEffect } from "react";
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
} from "@/components/game";
import { useSimpleAI } from "@/features/ai-control";
import { useGamePlay } from "@/features/game-play";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { TSpinIndicator } from "@/features/scoring/ui/TSpinIndicator";
import { useSettingsData } from "@/features/settings";
import { useFocusManagement } from "@/hooks/accessibility/useFocusManagement";
import { useScreenReaderAnnouncements } from "@/hooks/accessibility/useScreenReaderAnnouncements";
import { useKeyboardControls } from "@/hooks/controls/useKeyboardControls";
import { useTouchGestures } from "@/hooks/controls/useTouchGestures";
import { useDesignTokens } from "@/hooks/core/useDesignTokens";
import { useGameLoop } from "@/hooks/core/useGameLoop";
import { useHighScoreSideEffect } from "@/hooks/effects/useHighScoreSideEffect";
import { GameLayout } from "./GameLayout";
import { GameSettings } from "./GameSettings";
import { MobileGameLayout } from "./MobileGameLayout";

export function Game() {
  useGameLoop();
  useKeyboardControls();
  useHighScoreSideEffect();

  // Auto-start the game on mount
  const { startGame, isPlaying, isGameOver } = useGamePlay();

  useEffect(() => {
    // Start the game automatically if it's not already playing and not game over
    if (!isPlaying && !isGameOver) {
      startGame();
    }
  }, [isPlaying, isGameOver, startGame]);
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
  const { layoutMode: designLayoutMode } = useDesignTokens();
  const layoutMode: "compact" | "normal" =
    designLayoutMode === "gaming" ? "normal" : designLayoutMode;

  // T-Spin detection setting
  const { enableTSpinDetection } = useSettingsData();

  // Simple AI controller
  useSimpleAI();

  // T-Spin indicator state
  const tSpinState = useGamePlayStore((state) => state.tSpinState);
  const hideTSpinIndicator = useGamePlayStore((state) => state.hideTSpinIndicator);

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden">
        <MobileGameLayout />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block relative">
        <GameSettings />

        <GameLayout mode={layoutMode}>
          {/* Left Sidebar - Game Info */}
          <aside
            id="game-info"
            className="layout-sidebar gap-2.5 pr-2"
            aria-label="Game Information"
            tabIndex={-1}
          >
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
                  type={tSpinState.type}
                  linesCleared={tSpinState.linesCleared}
                  show={tSpinState.show}
                  onComplete={hideTSpinIndicator}
                />
              )}
            </section>
          </div>
        </GameLayout>
      </div>

      {/* Reset confirmation dialog */}
      <ResetConfirmationDialog />

      {/* Debug indicator */}
      <DebugIndicator />
    </>
  );
}
