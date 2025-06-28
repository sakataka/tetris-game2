import { useTranslation } from "react-i18next";
import { useGameStore } from "@/store/gameStore";
import { MODAL_STYLES } from "@/utils/styles";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function GameOverlay() {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);
  const resetGame = useGameStore((state) => state.resetGame);
  const togglePause = useGameStore((state) => state.togglePause);
  const { t } = useTranslation();

  return (
    <>
      {/* Live region for game state announcements */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {isGameOver && t("game.gameOver")}
        {isPaused && !isGameOver && t("game.paused")}
      </div>

      <Dialog open={isGameOver || isPaused}>
        <DialogContent
          className={`sm:max-w-md ${MODAL_STYLES.overlay}`}
          hideCloseButton={true}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-bold text-white mb-4 text-center">
              {isGameOver ? (
                <span className="text-red-400">{t("game.gameOver")}</span>
              ) : (
                t("game.paused")
              )}
            </DialogTitle>
          </DialogHeader>

          {isGameOver && (
            <div className="flex justify-center">
              <AnimatedButton
                onClick={resetGame}
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t("game.newGame")}
              </AnimatedButton>
            </div>
          )}

          {isPaused && (
            <div className="space-y-4">
              <p className="text-center text-gray-300">{t("game.resumeHint")}</p>
              <div className="flex justify-center">
                <AnimatedButton
                  onClick={togglePause}
                  variant="default"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t("game.resume")}
                </AnimatedButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
