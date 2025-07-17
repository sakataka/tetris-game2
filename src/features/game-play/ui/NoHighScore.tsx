import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CARD_STYLES } from "@/utils/styles";

interface NoHighScoreProps {
  className?: string;
}

export function NoHighScore({ className }: NoHighScoreProps) {
  const { t } = useTranslation();

  return (
    <Card className={`${CARD_STYLES.base} ${className}`}>
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
        <div className="text-center text-gray-400">{t("game.highScores.noScore")}</div>
      </CardContent>
    </Card>
  );
}
