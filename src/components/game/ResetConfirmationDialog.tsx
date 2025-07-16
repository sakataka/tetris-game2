import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useScoringStore } from "@/features/scoring";
import { MODAL_STYLES } from "@/utils/styles";

export function ResetConfirmationDialog() {
  const { t } = useTranslation();

  // Get reset confirmation state from gamePlay store
  const showResetConfirmation = useGamePlayStore((state) => state.showResetConfirmation);
  const hideResetDialog = useGamePlayStore((state) => state.hideResetDialog);
  const confirmReset = useGamePlayStore((state) => state.confirmReset);

  // Get score data from appropriate stores with useShallow to prevent infinite re-renders
  const scoreData = useScoringStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
    })),
  );
  const { addNewHighScore, setScore, setLines, setLevel } = useScoringStore(
    useShallow((state) => ({
      addNewHighScore: state.addNewHighScore,
      setScore: state.setScore,
      setLines: state.setLines,
      setLevel: state.setLevel,
    })),
  );

  const handleConfirm = useCallback(() => {
    // Save score before reset (same logic as game over)
    // Update scoring store with current game data before saving
    setScore(scoreData.score);
    setLines(scoreData.lines);
    setLevel(scoreData.level);
    addNewHighScore();
    confirmReset();
  }, [
    scoreData.score,
    scoreData.lines,
    scoreData.level,
    setScore,
    setLines,
    setLevel,
    addNewHighScore,
    confirmReset,
  ]);

  const handleCancel = useCallback(() => {
    hideResetDialog();
  }, [hideResetDialog]);

  return (
    <Dialog open={showResetConfirmation} onOpenChange={handleCancel}>
      <DialogContent
        hideCloseButton
        className={`sm:max-w-md ${MODAL_STYLES.overlay}`}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-white mb-4">
            {t("game.resetConfirmation.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            <div className="text-lg text-white">{t("game.resetConfirmation.message")}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 text-white border-gray-600 hover:bg-gray-800"
            autoFocus
          >
            {t("game.resetConfirmation.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {t("game.resetConfirmation.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
