import { Calendar, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HighScore } from "@/types/storage";
import { CONTROL_STYLES } from "@/utils/styles";

interface HighScoreItemProps {
  score: HighScore;
  rank: number;
}

export function HighScoreItem({ score, rank }: HighScoreItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatScore = (scoreValue: number) => {
    return scoreValue.toLocaleString();
  };

  const isTopScore = rank === 1;

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
        isTopScore ? "bg-yellow-500/10 border border-yellow-500/30" : CONTROL_STYLES.interactiveItem
      }`}
    >
      <div className="flex items-center gap-3">
        <Badge
          variant={isTopScore ? "default" : "outline"}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            isTopScore ? "bg-yellow-500 text-black" : "border-gray-600 text-gray-300"
          }`}
        >
          {rank}
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
  );
}
