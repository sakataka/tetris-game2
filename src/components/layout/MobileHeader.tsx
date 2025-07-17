import { AnimatedButton } from "@shared/ui/AnimatedButton";
import { Pause, Play, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { GameSettingsComponent as GameSettings } from "@/features/settings";
import { useHapticFeedback } from "@/hooks/common/useHapticFeedback";

export function MobileHeader() {
  const { t } = useTranslation();

  // Optimize selectors with useShallow for better performance
  const { score, lines, level, isPaused, isGameOver, canHold } = useGamePlayStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
      isPaused: state.isPaused,
      isGameOver: state.isGameOver,
      canHold: state.canHold,
    })),
  );

  const { nextPieces, heldPiece } = useGamePlayStore(
    useShallow((state) => ({
      nextPieces: state.nextPieces,
      heldPiece: state.heldPiece,
    })),
  );

  const { pauseGame, showResetDialog, holdPiece } = useGamePlayStore(
    useShallow((state) => ({
      pauseGame: state.pauseGame,
      showResetDialog: state.showResetDialog,
      holdPiece: state.holdPiece,
    })),
  );

  // Get next piece for compatibility
  const nextPiece = nextPieces[0] || null;

  const { lightImpact, heavyImpact } = useHapticFeedback();

  const handleReset = () => {
    heavyImpact();
    showResetDialog();
  };

  const handleTogglePause = () => {
    lightImpact();
    pauseGame();
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
          <div className="text-xs text-slate-400">{t("game.score.title")}</div>
          <div className="font-bold text-cyan-400" data-testid="score">
            {score}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">{t("game.score.lines")}</div>
          <div className="font-bold text-yellow-400">{lines}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">{t("game.score.level")}</div>
          <div className="font-bold text-purple-400">{level}</div>
        </div>

        {/* Hold/Next pieces moved to left side */}
        <div className="flex gap-3 ml-2">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">{t("game.hold")}</div>
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={handleHoldPiece}
              disabled={!canHold || isPaused || isGameOver}
              className={`w-8 h-8 bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center ${
                !canHold ? "opacity-50" : ""
              }`}
              aria-label={t("accessibility.holdPiece")}
            >
              {heldPiece && <span className="text-xs font-bold text-slate-300">{heldPiece}</span>}
            </AnimatedButton>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">{t("game.next")}</div>
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
            aria-label={t("accessibility.resetGame")}
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
            aria-label={isPaused ? t("accessibility.resumeGame") : t("accessibility.pauseGame")}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </AnimatedButton>
        )}
        <GameSettings />
      </div>
    </div>
  );
}
