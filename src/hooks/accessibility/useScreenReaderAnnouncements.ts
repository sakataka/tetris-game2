import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useGameStore } from "@/store/gameStore";

export interface AnnouncementConfig {
  enableGameStateAnnouncements: boolean;
  enableScoreAnnouncements: boolean;
  enableErrorAnnouncements: boolean;
  enableDetailedDescriptions: boolean;
  announcementDelay: number;
}

export interface ScreenReaderHelpers {
  announcePolitely: (message: string) => void;
  announceAssertively: (message: string) => void;
  announceGameState: () => void;
  announceScore: (score: number, lines: number, level: number) => void;
  announceError: (error: string) => void;
  describePiece: (pieceType: string) => void;
  describeBoard: () => void;
}

export const useScreenReaderAnnouncements = (
  config: Partial<AnnouncementConfig> = {},
): ScreenReaderHelpers => {
  const { t } = useTranslation();

  const politeRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);
  const lastAnnouncementTime = useRef<number>(0);

  const defaultConfig: AnnouncementConfig = {
    enableGameStateAnnouncements: true,
    enableScoreAnnouncements: true,
    enableErrorAnnouncements: true,
    enableDetailedDescriptions: false,
    announcementDelay: 500,
    ...config,
  };

  const gameData = useGameStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
      currentPiece: state.currentPiece,
      nextPiece: state.nextPiece,
      heldPiece: state.heldPiece,
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
      board: state.board,
    })),
  );

  // Create ARIA live regions
  useEffect(() => {
    // Polite region for non-urgent announcements
    if (!politeRegionRef.current) {
      const politeRegion = document.createElement("div");
      politeRegion.setAttribute("aria-live", "polite");
      politeRegion.setAttribute("aria-atomic", "true");
      politeRegion.setAttribute("aria-label", "Game status updates");
      politeRegion.style.position = "absolute";
      politeRegion.style.left = "-10000px";
      politeRegion.style.width = "1px";
      politeRegion.style.height = "1px";
      politeRegion.style.overflow = "hidden";

      document.body.appendChild(politeRegion);
      politeRegionRef.current = politeRegion;
    }

    // Assertive region for urgent announcements
    if (!assertiveRegionRef.current) {
      const assertiveRegion = document.createElement("div");
      assertiveRegion.setAttribute("aria-live", "assertive");
      assertiveRegion.setAttribute("aria-atomic", "true");
      assertiveRegion.setAttribute("aria-label", "Important game alerts");
      assertiveRegion.style.position = "absolute";
      assertiveRegion.style.left = "-10000px";
      assertiveRegion.style.width = "1px";
      assertiveRegion.style.height = "1px";
      assertiveRegion.style.overflow = "hidden";

      document.body.appendChild(assertiveRegion);
      assertiveRegionRef.current = assertiveRegion;
    }

    return () => {
      if (politeRegionRef.current) {
        document.body.removeChild(politeRegionRef.current);
        politeRegionRef.current = null;
      }
      if (assertiveRegionRef.current) {
        document.body.removeChild(assertiveRegionRef.current);
        assertiveRegionRef.current = null;
      }
    };
  }, []);

  // Throttled announcement function
  const throttledAnnounce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const now = Date.now();
      if (now - lastAnnouncementTime.current < defaultConfig.announcementDelay) {
        return;
      }
      lastAnnouncementTime.current = now;

      const targetRegion =
        priority === "assertive" ? assertiveRegionRef.current : politeRegionRef.current;

      if (targetRegion) {
        // Clear and set message with slight delay for screen readers
        targetRegion.textContent = "";
        setTimeout(() => {
          if (targetRegion) {
            targetRegion.textContent = message;
          }
        }, 100);
      }
    },
    [defaultConfig.announcementDelay],
  );

  // Public announcement functions
  const announcePolitely = useCallback(
    (message: string) => {
      throttledAnnounce(message, "polite");
    },
    [throttledAnnounce],
  );

  const announceAssertively = useCallback(
    (message: string) => {
      throttledAnnounce(message, "assertive");
    },
    [throttledAnnounce],
  );

  const announceGameState = useCallback(() => {
    if (!defaultConfig.enableGameStateAnnouncements) return;

    let message = "";
    if (gameData.isGameOver) {
      message = t("accessibility.gameOver", {
        score: gameData.score.toLocaleString(),
        lines: gameData.lines,
        level: gameData.level,
      });
    } else if (gameData.isPaused) {
      message = t("accessibility.gamePaused");
    } else if (!gameData.isGameOver && !gameData.isPaused && gameData.currentPiece !== null) {
      message = t("accessibility.gameResumed");
    } else if (!gameData.isGameOver && !gameData.isPaused && gameData.currentPiece === null) {
      message = t("accessibility.gameReady");
    }

    if (message) {
      announceAssertively(message);
    }
  }, [gameData, defaultConfig.enableGameStateAnnouncements, t, announceAssertively]);

  const announceScore = useCallback(
    (score: number, lines: number, level: number) => {
      if (!defaultConfig.enableScoreAnnouncements) return;

      const message = t("accessibility.scoreUpdate", {
        score: score.toLocaleString(),
        lines,
        level,
      });
      announcePolitely(message);
    },
    [defaultConfig.enableScoreAnnouncements, t, announcePolitely],
  );

  const announceError = useCallback(
    (error: string) => {
      if (!defaultConfig.enableErrorAnnouncements) return;

      const message = t("accessibility.error", { error });
      announceAssertively(message);
    },
    [defaultConfig.enableErrorAnnouncements, t, announceAssertively],
  );

  const describePiece = useCallback(
    (pieceType: string) => {
      if (!defaultConfig.enableDetailedDescriptions) return;

      const message = t("accessibility.currentPiece", {
        piece: t(`game.pieces.${pieceType.toLowerCase()}`),
      });
      announcePolitely(message);
    },
    [defaultConfig.enableDetailedDescriptions, t, announcePolitely],
  );

  const describeBoard = useCallback(() => {
    if (!defaultConfig.enableDetailedDescriptions || !gameData.board) return;

    const filledRows = gameData.board.filter((row) => row.some((cell) => cell !== null)).length;

    const message = t("accessibility.boardDescription", {
      filledRows,
      totalRows: gameData.board.length,
    });
    announcePolitely(message);
  }, [defaultConfig.enableDetailedDescriptions, gameData.board, t, announcePolitely]);

  // Auto-announce game state changes
  const prevIsPlaying = useRef(!gameData.isGameOver && !gameData.isPaused);
  const prevIsGameOver = useRef(gameData.isGameOver);
  const prevIsPaused = useRef(gameData.isPaused);

  useEffect(() => {
    const isPlaying = !gameData.isGameOver && !gameData.isPaused;
    if (
      isPlaying !== prevIsPlaying.current ||
      gameData.isGameOver !== prevIsGameOver.current ||
      gameData.isPaused !== prevIsPaused.current
    ) {
      announceGameState();

      prevIsPlaying.current = isPlaying;
      prevIsGameOver.current = gameData.isGameOver;
      prevIsPaused.current = gameData.isPaused;
    }
  }, [gameData.isGameOver, gameData.isPaused, announceGameState]);

  // Auto-announce significant score changes
  const prevLines = useRef(gameData.lines);
  const prevLevel = useRef(gameData.level);

  useEffect(() => {
    // Announce line clears
    if (gameData.lines > prevLines.current && !gameData.isGameOver && !gameData.isPaused) {
      const linesCleared = gameData.lines - prevLines.current;
      const message = t("accessibility.linesCleared", {
        count: linesCleared,
        total: gameData.lines,
      });
      announcePolitely(message);
    }

    // Announce level ups
    if (gameData.level > prevLevel.current) {
      const message = t("accessibility.levelUp", { level: gameData.level });
      announcePolitely(message);
    }

    prevLines.current = gameData.lines;
    prevLevel.current = gameData.level;
  }, [gameData.lines, gameData.level, gameData.isGameOver, gameData.isPaused, t, announcePolitely]);

  // Auto-announce piece changes
  const prevCurrentPiece = useRef(gameData.currentPiece?.type);

  useEffect(() => {
    if (
      gameData.currentPiece?.type &&
      gameData.currentPiece.type !== prevCurrentPiece.current &&
      !gameData.isGameOver &&
      !gameData.isPaused
    ) {
      describePiece(gameData.currentPiece.type);
      prevCurrentPiece.current = gameData.currentPiece.type;
    }
  }, [gameData.currentPiece?.type, gameData.isGameOver, gameData.isPaused, describePiece]);

  return {
    announcePolitely,
    announceAssertively,
    announceGameState,
    announceScore,
    announceError,
    describePiece,
    describeBoard,
  };
};
