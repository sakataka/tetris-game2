import { useHighScore } from "../../hooks/data/useHighScore";
import { CurrentHighScore } from "./CurrentHighScore";
import { HighScoreList } from "./HighScoreList";
import { NoHighScore } from "./NoHighScore";

interface HighScoreProps {
  className?: string;
  showFullList?: boolean;
}

export function HighScore({ className, showFullList = false }: HighScoreProps) {
  const { currentHighScore, highScoresList } = useHighScore();

  if (showFullList) {
    return <HighScoreList scores={highScoresList} className={className} />;
  }

  if (currentHighScore) {
    return <CurrentHighScore score={currentHighScore} className={className} />;
  }

  return <NoHighScore className={className} />;
}
