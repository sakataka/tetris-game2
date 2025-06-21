import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";

export function GameOverlay() {
  const { isGameOver, isPaused, resetGame } = useGameStore();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {(isGameOver || isPaused) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.1,
            }}
            style={{
              background: "rgb(31, 41, 55)",
              padding: "32px",
              borderRadius: "8px",
              textAlign: "center",
              color: "white",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              {isGameOver ? t("game.gameOver") : t("game.paused")}
            </motion.h2>
            {isGameOver && (
              <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetGame}
                style={{
                  padding: "12px 24px",
                  background: "rgb(37, 99, 235)",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                }}
              >
                {t("game.newGame")}
              </motion.button>
            )}
            {isPaused && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: "1.25rem" }}
              >
                {t("game.resumeHint")}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
