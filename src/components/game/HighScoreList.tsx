import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HighScore } from "@/types/storage";
import { CARD_STYLES } from "@/utils/styles";
import { HighScoreItem } from "./HighScoreItem";

interface HighScoreListProps {
  scores: HighScore[];
  className?: string;
}

export function HighScoreList({ scores, className }: HighScoreListProps) {
  const { t } = useTranslation();

  return (
    <Card className={`${CARD_STYLES.base} ${className}`}>
      <CardHeader>
        <CardTitle
          as="h2"
          className="text-base font-bold text-white text-center flex items-center justify-center gap-2"
        >
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t("game.highScores.topScores")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scores.length === 0 ? (
          <div className="text-center text-gray-400">{t("game.highScores.noScores")}</div>
        ) : (
          <div className="space-y-2">
            {scores.map((score, index) => (
              <HighScoreItem key={`${score.date}-${score.score}`} score={score} rank={index + 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
