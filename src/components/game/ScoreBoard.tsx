import { useTranslation } from "react-i18next";
import { useAnimatedValue } from "../../hooks/useAnimatedValue";
import { useScoreState } from "../../hooks/useGameSelectors";
import { CARD_STYLES } from "../../utils/styles";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AnimatedScoreItem } from "./AnimatedScoreItem";

export function ScoreBoard() {
  const { score, lines, level } = useScoreState();
  const { t } = useTranslation();

  const scoreKey = useAnimatedValue(score);
  const linesKey = useAnimatedValue(lines);
  const levelKey = useAnimatedValue(level);

  return (
    <Card className={`${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive}`}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center">
          {t("game.score.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Live region for important score updates (level changes) */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {t("game.score.level")} {level}
        </div>

        <AnimatedScoreItem
          label={t("game.score.title")}
          value={score}
          animationKey={`score-${scoreKey}`}
          className="text-xl font-bold text-tetris-cyan"
          animation="score"
        />

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
  );
}
