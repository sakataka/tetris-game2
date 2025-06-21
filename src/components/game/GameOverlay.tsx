import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../../store/gameStore";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export function GameOverlay() {
  const { isGameOver, isPaused, resetGame, togglePause } = useGameStore();
  const { t } = useTranslation();

  return (
    <Dialog open={isGameOver || isPaused}>
      <DialogContent
        className="sm:max-w-md bg-gray-900/95 border-gray-700 backdrop-blur-sm"
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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={resetGame}
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t("game.newGame")}
              </Button>
            </motion.div>
          </div>
        )}

        {isPaused && (
          <div className="space-y-4">
            <p className="text-center text-gray-300">{t("game.resumeHint")}</p>
            <div className="flex justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={togglePause}
                  variant="default"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t("game.resume")}
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
