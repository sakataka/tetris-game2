import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { AnimatedScoreItem } from "@/features/scoring/ui/AnimatedScoreItem";
import { ComboIndicator } from "@/features/scoring/ui/ComboIndicator";
import { FloatingScoreText as FloatingScoreManager } from "@/features/scoring/ui/FloatingScoreText";
import { ScoreCounter } from "@/features/scoring/ui/ScoreCounter";
import { TetrisFlashEffect } from "@/features/scoring/ui/TetrisFlashEffect";
import { CARD_STYLES } from "@/utils/styles";

export function ScoreBoard() {
  // Optimize selectors with useShallow for better performance
  const { score, lines, level } = useGamePlayStore(
    useShallow((state) => ({
      score: state.score,
      lines: state.lines,
      level: state.level,
    })),
  );

  const { scoreAnimationState, comboState, floatingScoreEvents } = useGamePlayStore(
    useShallow((state) => ({
      scoreAnimationState: state.scoreAnimationState,
      comboState: state.comboState,
      floatingScoreEvents: state.floatingScoreEvents,
    })),
  );
  const { t } = useTranslation();

  // FloatingScoreText cleanup handler
  const handleFloatingScoreComplete = (_id: string) => {
    useGamePlayStore.getState().clearAnimationData?.(); // Cleanup if available
  };

  return (
    <>
      <Card className={`${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive}`}>
        <CardHeader>
          <CardTitle as="h2" className="text-base font-bold text-white text-center">
            {t("game.score.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {/* Live region for important score updates (level changes) */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {t("game.score.level")} {level}
          </div>

          {/* Enhanced Score Counter with 1-second count-up */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-300">{t("game.score.title")}</p>
            <ScoreCounter
              score={score}
              previousScore={scoreAnimationState.previousScore}
              className="text-xl font-bold text-tetris-cyan"
              data-testid="score"
            />
          </div>

          {/* Combo Indicator with 120ms response */}
          {comboState.isActive && comboState.count > 1 && (
            <div className="flex items-center justify-center py-1.5">
              <ComboIndicator
                comboCount={comboState.count}
                isActive={comboState.isActive}
                lastClearType={comboState.lastClearType}
              />
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-muted-foreground">
              {t("game.score.lines")}
            </span>
            <AnimatedScoreItem
              value={lines}
              className="text-xl font-bold text-tetris-yellow"
              animation="lines"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-muted-foreground">
              {t("game.score.level")}
            </span>
            <AnimatedScoreItem
              value={level}
              className="text-xl font-bold text-tetris-purple"
              animation="level"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tetris Flash Effect (200ms screen flash) */}
      <TetrisFlashEffect isActive={scoreAnimationState.isTetris} />

      {/* Floating Score Text Manager */}
      {floatingScoreEvents.map((event) => (
        <FloatingScoreManager
          key={event.id}
          event={{
            id: event.id,
            value: event.points,
            type: "line-clear",
            position: event.position,
            timestamp: event.startTime,
          }}
          onComplete={handleFloatingScoreComplete}
        />
      ))}
    </>
  );
}
