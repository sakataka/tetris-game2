/**
 * Next Level Preview Component
 * Shows progress toward next level and hints for upcoming level up
 */

import type React from "react";
import { useTranslation } from "react-i18next";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

export interface NextLevelPreviewProps {
  currentLevel: number;
  currentLines: number;
  className?: string;
}

export const NextLevelPreview: React.FC<NextLevelPreviewProps> = ({
  currentLevel,
  currentLines,
  className = "",
}) => {
  const { t } = useTranslation();

  // Calculate progress to next level
  const linesInCurrentLevel = currentLines % GAME_CONSTANTS.SCORING.LINES_PER_LEVEL;
  const linesUntilNextLevel = GAME_CONSTANTS.SCORING.LINES_PER_LEVEL - linesInCurrentLevel;
  const progressPercentage = (linesInCurrentLevel / GAME_CONSTANTS.SCORING.LINES_PER_LEVEL) * 100;

  // Determine if close to next level (80% progress)
  const isNearLevelUp = progressPercentage >= 80;

  // Next level number
  const nextLevel = currentLevel + 1;

  return (
    <div className={`next-level-preview ${isNearLevelUp ? "near-level-up" : ""} ${className}`}>
      <div className="level-info">
        <span className="current-level">
          {t("game.level")} {currentLevel}
        </span>
        <span className="next-level-hint">
          {t("game.nextLabel")}: {linesUntilNextLevel}
        </span>
      </div>

      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={linesInCurrentLevel}
        aria-valuemin={0}
        aria-valuemax={GAME_CONSTANTS.SCORING.LINES_PER_LEVEL}
        aria-label={t("game.progressToNextLevel", {
          current: linesInCurrentLevel,
          total: GAME_CONSTANTS.SCORING.LINES_PER_LEVEL,
        })}
      >
        <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />

        {isNearLevelUp && (
          <output className="level-up-hint" aria-live="polite">
            {t("game.levelUpSoon", { nextLevel })}
          </output>
        )}
      </div>

      {/* Level milestone indicators */}
      <div className="level-milestones" aria-hidden="true">
        {Array.from({ length: GAME_CONSTANTS.SCORING.LINES_PER_LEVEL }, (_, i) => (
          <div
            key={`milestone-${i}`}
            className={`milestone ${i < linesInCurrentLevel ? "completed" : ""}`}
          />
        ))}
      </div>
    </div>
  );
};
