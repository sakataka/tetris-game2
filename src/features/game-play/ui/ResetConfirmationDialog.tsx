import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useHighScore } from "@/features/scoring/lib/useHighScore";
import { MODAL_STYLES } from "@/utils/styles";

export function ResetConfirmationDialog() {
  const { t } = useTranslation();

  // Optimize selectors with useShallow for better performance
  const { showResetConfirmation, hideResetDialog, confirmReset } = useGamePlayStore(
    useShallow((state) => ({
      showResetConfirmation: state.showResetConfirmation,
      hideResetDialog: state.hideResetDialog,
      confirmReset: state.confirmReset,
    })),
  );

  // Score data is already in gamePlayStore and will be accessed by addNewHighScore
  const { addNewHighScore } = useHighScore();

  const handleConfirm = useCallback(() => {
    // Save score before reset (same logic as game over)
    // Score data is already in gamePlayStore, so we can directly save it
    addNewHighScore();
    confirmReset();
  }, [addNewHighScore, confirmReset]);

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
