import { Target, TrendingUp, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HighScore } from "@/types/storage";
import { CARD_STYLES, CONTROL_STYLES } from "@/utils/styles";

interface CurrentHighScoreProps {
  score: HighScore;
  className?: string;
}

export function CurrentHighScore({ score, className }: CurrentHighScoreProps) {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
        <CardTitle className="text-base font-bold text-gray-300 text-center flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t("game.highScore.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400 mb-1">{formatScore(score.score)}</div>
            <div className="text-sm text-gray-400">{formatDate(score.date)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className={`${CONTROL_STYLES.interactiveItem} rounded-md p-1.5`}>
              <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Target className="h-3 w-3" />
                {t("game.score.lines")}
              </div>
              <div className="text-sm font-semibold text-white">{score.lines}</div>
            </div>
            <div className={`${CONTROL_STYLES.interactiveItem} rounded-md p-1.5`}>
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
