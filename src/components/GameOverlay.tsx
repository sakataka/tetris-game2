import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function GameOverlay() {
  const { isGameOver, isPaused, resetGame, togglePause } = useGameStore();
  const { t } = useTranslation();

  return (
    <Dialog open={isGameOver || isPaused}>
      <DialogContent
        className="sm:max-w-md bg-gray-900/95 border-gray-700 backdrop-blur-sm"
        hideCloseButton={isPaused}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-bold text-white mb-4 text-center">
            {isGameOver ? (
              <div className="flex items-center justify-center gap-2">
                {t("game.gameOver")}
                <Badge variant="destructive" className="bg-red-600 text-white">
                  Game Over
                </Badge>
              </div>
            ) : (
              t("game.paused")
            )}
          </DialogTitle>

          {isGameOver && (
            <DialogDescription className="text-gray-300 mb-6">
              {t("game.gameOverMessage") || "Better luck next time! Try again?"}
            </DialogDescription>
          )}
        </DialogHeader>

        {isGameOver && (
          <div className="flex justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={resetGame}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 min-w-[120px]"
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
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 min-w-[120px]"
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
