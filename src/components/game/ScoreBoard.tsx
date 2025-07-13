import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScoreAnimationState, useScoreState } from "@/hooks/selectors/useScoreSelectors";
import { useAnimatedValue } from "@/hooks/ui/useAnimatedValue";
import { useGameStore } from "@/store/gameStore";
import { CARD_STYLES } from "@/utils/styles";
import { AnimatedScoreItem } from "./AnimatedScoreItem";
import { ComboIndicator } from "./ComboIndicator";
import { FloatingScoreManager } from "./FloatingScoreText";
import { ScoreCounter } from "./ScoreCounter";
import { TetrisFlashEffect } from "./TetrisFlashEffect";

export function ScoreBoard() {
  const { score, lines, level } = useScoreState();
  const { scoreAnimationState, comboState, floatingScoreEvents } = useScoreAnimationState();
  const { t } = useTranslation();

  const linesKey = useAnimatedValue(lines);
  const levelKey = useAnimatedValue(level);

  // FloatingScoreText cleanup handler
  const handleFloatingScoreComplete = (_id: string) => {
    useGameStore.getState().clearAnimationData?.(); // Cleanup if available
  };

  return (
    <>
      <Card className={`${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive}`}>
        <CardHeader>
          <CardTitle as="h2" className="text-base font-bold text-white text-center">
            {t("game.score.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <div className="flex items-center justify-center py-2">
              <ComboIndicator
                comboCount={comboState.count}
                isActive={comboState.isActive}
                lastClearType={comboState.lastClearType}
              />
            </div>
          )}

          <AnimatedScoreItem
            label={t("game.score.lines")}
            value={lines}
            animationKey={`lines-${linesKey}`}
            className="text-xl font-bold text-tetris-yellow"
            animation="lines"
          />

          <AnimatedScoreItem
            label={t("game.score.level")}
            value={level}
            animationKey={`level-${levelKey}`}
            className="text-xl font-bold text-tetris-purple"
            animation="level"
          />
        </CardContent>
      </Card>

      {/* Tetris Flash Effect (200ms screen flash) */}
      <TetrisFlashEffect isTriggered={scoreAnimationState.isTetris} />

      {/* Floating Score Text Manager */}
      <FloatingScoreManager
        events={floatingScoreEvents}
        onEventComplete={handleFloatingScoreComplete}
      />
    </>
  );
}
