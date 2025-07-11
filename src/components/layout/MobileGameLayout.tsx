import { Board, GameOverlay, TouchControls, TSpinIndicator } from "@/components/game";
import { useTouchGestures } from "@/hooks/controls/useTouchGestures";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { MobileHeader } from "./MobileHeader";

export function MobileGameLayout() {
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

  // T-Spin indicator state
  const tSpinState = useGameStore((state) => state.tSpinState);
  const enableTSpinDetection = useSettingsStore((state) => state.enableTSpinDetection);
  const hideTSpinIndicator = useGameStore((state) => state.hideTSpinIndicator);

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
              tSpinType={tSpinState.type}
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
