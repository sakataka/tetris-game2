import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { scoreStorage } from "../api/scoreStorage";
import { useHighScoreStore } from "../model/highScoreSlice";

/**
 * Custom hook for managing high score data with real-time updates
 * This hook uses the dedicated high score store
 */
export function useHighScore() {
  const highScoreData = useHighScoreStore(
    useShallow((state) => ({
      currentHighScore: state.currentHighScore,
      highScoresList: state.highScoresList,
      scoreStatistics: state.scoreStatistics,
      isNewHighScore: state.isNewHighScore,
      gameMode: state.gameMode,
    })),
  );

  const highScoreActions = useHighScoreStore(
    useShallow((state) => ({
      loadHighScores: state.loadHighScores,
      clearHighScores: state.clearHighScores,
      deleteHighScore: state.deleteHighScore,
      isHighScore: state.isHighScore,
      getScoreRank: state.getScoreRank,
      setGameMode: state.setGameMode,
      setGameStartTime: state.setGameStartTime,
      exportHighScores: state.exportHighScores,
      importHighScores: state.importHighScores,
      setIsNewHighScore: state.setIsNewHighScore,
    })),
  );

  // Enhanced addNewHighScore that gets score data from gamePlay store
  const addNewHighScore = useCallback(
    async (playerName?: string) => {
      const gamePlayState = useGamePlayStore.getState();
      const highScoreState = useHighScoreStore.getState();

      const { score, lines, level } = gamePlayState;
      const { gameStartTime, gameMode } = highScoreState;

      const duration = gameStartTime ? Date.now() - gameStartTime : undefined;

      try {
        const entry = await scoreStorage.saveHighScore(
          { score, lines, level },
          playerName,
          duration,
          gameMode,
        );

        // Update current high score if this is better
        const currentBest = highScoreState.currentHighScore;
        const isNewBest = !currentBest || entry.score > currentBest.score;

        if (isNewBest) {
          highScoreActions.setIsNewHighScore(true);
        }

        // Reload the full list
        await highScoreActions.loadHighScores();
      } catch (error) {
        console.error("Failed to save high score:", error);
      }
    },
    [highScoreActions],
  );

  return {
    ...highScoreData,
    ...highScoreActions,
    addNewHighScore,
  };
}

/**
 * Hook for high score data only (read-only)
 */
export const useHighScoreData = () => {
  return useHighScoreStore(
    useShallow((state) => ({
      currentHighScore: state.currentHighScore,
      highScoresList: state.highScoresList,
      scoreStatistics: state.scoreStatistics,
      isNewHighScore: state.isNewHighScore,
    })),
  );
};

/**
 * Hook for high score actions only
 */
export const useHighScoreActions = () => {
  return useHighScoreStore(
    useShallow((state) => ({
      loadHighScores: state.loadHighScores,
      clearHighScores: state.clearHighScores,
      deleteHighScore: state.deleteHighScore,
      isHighScore: state.isHighScore,
      getScoreRank: state.getScoreRank,
      setGameMode: state.setGameMode,
      setGameStartTime: state.setGameStartTime,
      exportHighScores: state.exportHighScores,
      importHighScores: state.importHighScores,
      setIsNewHighScore: state.setIsNewHighScore,
    })),
  );
};
