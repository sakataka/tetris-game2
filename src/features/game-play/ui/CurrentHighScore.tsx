import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Target, TrendingUp, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HighScoreEntry } from "@/features/scoring";
import { CARD_STYLES, CONTROL_STYLES } from "@/utils/styles";

interface CurrentHighScoreProps {
  score: HighScoreEntry;
  className?: string;
}

export function CurrentHighScore({ score, className }: CurrentHighScoreProps) {
  const { t } = useTranslation();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatScore = (scoreValue: number) => {
    return scoreValue.toLocaleString();
  };

  return (
    <Card
      className={`${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive} ${className}`}
    >
      <CardHeader>
        <CardTitle
          as="h2"
          className="text-base font-bold text-white text-center flex items-center justify-center gap-2"
        >
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t("game.highScore.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400 mb-0.5">
              {formatScore(score.score)}
            </div>
            <div className="text-sm text-gray-400">{formatDate(score.timestamp)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className={`${CONTROL_STYLES.interactiveItem} rounded-md p-1`}>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Target className="h-3 w-3" />
                {t("game.score.lines")}
              </div>
              <div className="text-sm font-semibold text-white">{score.lines}</div>
            </div>
            <div className={`${CONTROL_STYLES.interactiveItem} rounded-md p-1`}>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {t("game.score.level")}
              </div>
              <div className="text-sm font-semibold text-white">{score.level}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
