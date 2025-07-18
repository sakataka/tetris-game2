import { AnimatedButton } from "@shared/ui/AnimatedButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/ui/dialog";
import { useTranslation } from "react-i18next";
import { useGamePlay } from "@/features/game-play";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useHighScoreData } from "@/features/scoring/lib/useHighScore";
import { MODAL_STYLES } from "@/utils/styles";

export function GameOverlay() {
  const { isGameOver, isPaused, resetGame, pauseGame } = useGamePlay();
  // Use direct store access with individual primitive selector for best performance
  const score = useGamePlayStore((state) => state.score);
  const { currentHighScore } = useHighScoreData();
  const { t } = useTranslation();

  // Check if current score is a new high score
  const isNewHighScore =
    isGameOver && score > 0 && (!currentHighScore || score > currentHighScore.score);

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
                <span className="text-red-400" data-testid="game-over">
                  {t("game.gameOver")}
                </span>
              ) : (
                t("game.paused")
              )}
            </DialogTitle>
          </DialogHeader>

          {isGameOver && (
            <div className="space-y-4">
              {isNewHighScore && (
                <div className="text-center">
                  <p className="text-xl text-yellow-400 font-bold mb-2">
                    {t("game.newHighScore")}!
                  </p>
                  <p className="text-lg text-white">
                    {t("game.score.title")}: {score.toLocaleString()}
                  </p>
                </div>
              )}
              {!isNewHighScore && currentHighScore && (
                <div className="text-center text-white">
                  <p className="text-sm">
                    {t("game.highScore.title")}: {currentHighScore.score.toLocaleString()}
                  </p>
                </div>
              )}
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
              <p className="text-center text-sm text-gray-300">{t("game.shortcuts")}: R / Enter</p>
            </div>
          )}

          {isPaused && (
            <div className="space-y-4">
              <p className="text-center text-white">{t("game.resumeHint")}</p>
              <div className="flex justify-center">
                <AnimatedButton
                  onClick={pauseGame}
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
