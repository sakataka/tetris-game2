import { Board, GameOverlay, TouchControls } from "@/features/game-play";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { TSpinIndicator } from "@/features/scoring/ui/TSpinIndicator";
import { useSettingsData } from "@/features/settings";
import { useTouchGestures } from "@/hooks/controls/useTouchGestures";
import { MobileHeader } from "./MobileHeader";

export function MobileGameLayout() {
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

  // T-Spin indicator state
  const tSpinState = useGamePlayStore((state) => state.tSpinState);
  const { enableTSpinDetection } = useSettingsData();
  const hideTSpinIndicator = useGamePlayStore((state) => state.hideTSpinIndicator);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Top info bar */}
      <MobileHeader />

      {/* Game board - centered in available space */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
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
              type={tSpinState.type}
              linesCleared={tSpinState.linesCleared}
              show={tSpinState.show}
              onComplete={hideTSpinIndicator}
            />
          )}
        </section>
      </div>

      {/* Fixed bottom controls */}
      <div className="pb-4 px-4 bg-gradient-to-t from-slate-900/80 to-transparent">
        <TouchControls className="mx-auto max-w-xs" />
      </div>
    </div>
  );
}
