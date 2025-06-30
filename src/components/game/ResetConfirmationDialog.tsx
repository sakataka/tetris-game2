import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGameStore } from "@/store/gameStore";
import { useHighScoreStore } from "@/store/highScoreStore";
import { MODAL_STYLES } from "@/utils/styles";

export function ResetConfirmationDialog() {
  const { t } = useTranslation();
  const { showResetConfirmation, hideResetDialog, confirmReset, score, lines, level } =
    useGameStore();
  const { addNewHighScore } = useHighScoreStore();

  const handleConfirm = () => {
    // Save score before reset (same logic as game over)
    addNewHighScore(score, lines, level);
    confirmReset();
  };

  const handleCancel = () => {
    hideResetDialog();
  };

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
            <div className="text-lg text-gray-300">{t("game.resetConfirmation.message")}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-800"
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
