import { Pause, Play, RefreshCw } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useHapticFeedback } from "@/hooks/common/useHapticFeedback";
import { useGameStore } from "@/store/gameStore";
import { GameSettings } from "./GameSettings";

export function MobileHeader() {
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);
  const level = useGameStore((state) => state.level);
  const nextPiece = useGameStore((state) => state.nextPiece);
  const heldPiece = useGameStore((state) => state.heldPiece);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const togglePause = useGameStore((state) => state.togglePause);
  const showResetDialog = useGameStore((state) => state.showResetDialog);
  const holdPiece = useGameStore((state) => state.holdPiece);
  const canHold = useGameStore((state) => state.canHold);
  const { lightImpact, heavyImpact } = useHapticFeedback();

  const handleReset = () => {
    heavyImpact();
    showResetDialog();
  };

  const handleTogglePause = () => {
    lightImpact();
    togglePause();
  };

  const handleHoldPiece = () => {
    lightImpact();
    holdPiece();
  };

  return (
    <div className="flex items-center px-4 py-2 bg-slate-900/50 backdrop-blur-sm">
      {/* Left side - Score info and Hold/Next */}
      <div className="flex gap-4 text-sm flex-1">
        <div className="text-center">
          <div className="text-xs text-slate-400">Score</div>
          <div className="font-bold text-cyan-400" data-testid="score">
            {score}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Lines</div>
          <div className="font-bold text-yellow-400">{lines}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Level</div>
          <div className="font-bold text-purple-400">{level}</div>
        </div>

        {/* Hold/Next pieces moved to left side */}
        <div className="flex gap-3 ml-2">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Hold</div>
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={handleHoldPiece}
              disabled={!canHold || isPaused || isGameOver}
              className={`w-8 h-8 bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center ${
                !canHold ? "opacity-50" : ""
              }`}
              aria-label="Hold current piece"
            >
              {heldPiece && <span className="text-xs font-bold text-slate-300">{heldPiece}</span>}
            </AnimatedButton>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Next</div>
            <div className="w-8 h-8 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
              {nextPiece && <span className="text-xs font-bold text-slate-300">{nextPiece}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Pause, Reset and Settings */}
      <div className="flex gap-2">
        {!isGameOver && !isPaused && (
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 bg-orange-800/70 border-orange-600 hover:bg-orange-700/50"
            aria-label="Reset game"
          >
            <RefreshCw className="h-4 w-4" />
          </AnimatedButton>
        )}
        {!isGameOver && (
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={handleTogglePause}
            disabled={isGameOver}
            className="h-8 w-8 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50"
            aria-label={isPaused ? "Resume game" : "Pause game"}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </AnimatedButton>
        )}
        <GameSettings />
      </div>
    </div>
  );
}
