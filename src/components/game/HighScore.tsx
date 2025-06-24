import { Calendar, Target, TrendingUp, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHighScore } from "../../hooks/useHighScore";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface HighScoreProps {
  className?: string;
  showFullList?: boolean;
}

export function HighScore({ className, showFullList = false }: HighScoreProps) {
  const { t } = useTranslation();
  const { currentHighScore, highScoresList } = useHighScore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  if (!showFullList && !currentHighScore) {
    return (
      <Card className={`bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl ${className}`}>
        <CardHeader>
          <CardTitle className="text-base font-bold text-gray-300 text-center flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t("game.highScore.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">{t("game.highScore.noScore")}</div>
        </CardContent>
      </Card>
    );
  }

  if (showFullList) {
    return (
      <Card className={`bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl ${className}`}>
        <CardHeader>
          <CardTitle className="text-base font-bold text-gray-300 text-center flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t("game.highScore.topScores")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {highScoresList.length === 0 ? (
            <div className="text-center text-gray-400">{t("game.highScore.noScores")}</div>
          ) : (
            <div className="space-y-2">
              {highScoresList.map((score, index) => (
                <div
                  key={`${score.date}-${score.score}`}
                  className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                    index === 0
                      ? "bg-yellow-500/10 border border-yellow-500/30"
                      : "bg-gray-800/30 hover:bg-gray-700/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={index === 0 ? "default" : "outline"}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        index === 0 ? "bg-yellow-500 text-black" : "border-gray-600 text-gray-300"
                      }`}
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="text-white font-semibold">{formatScore(score.score)}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {score.lines}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {score.level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(score.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show current high score only
  return (
    <Card
      className={`bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl hover:bg-gray-900/60 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl ${className}`}
    >
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t("game.highScore.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentHighScore && (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400 mb-1">
                {formatScore(currentHighScore.score)}
              </div>
              <div className="text-sm text-gray-400">{formatDate(currentHighScore.date)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-gray-800/30 rounded-md p-1.5">
                <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Target className="h-3 w-3" />
                  {t("game.score.lines")}
                </div>
                <div className="text-sm font-semibold text-white">{currentHighScore.lines}</div>
              </div>
              <div className="bg-gray-800/30 rounded-md p-1.5">
                <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t("game.score.level")}
                </div>
                <div className="text-sm font-semibold text-white">{currentHighScore.level}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
