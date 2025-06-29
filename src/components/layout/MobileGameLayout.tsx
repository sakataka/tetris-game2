import { Board, GameOverlay, TouchControls } from "@/components/game";
import { useTouchGestures } from "@/hooks/controls/useTouchGestures";
import { MobileHeader } from "./MobileHeader";

export function MobileGameLayout() {
  const { handleTouchStart, handleTouchEnd } = useTouchGestures();

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
        </section>
      </div>

      {/* Fixed bottom controls */}
      <div className="pb-4 px-4 bg-gradient-to-t from-slate-900/80 to-transparent">
        <TouchControls className="mx-auto max-w-xs" />
      </div>
    </div>
  );
}
