import { motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../../store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const ScoreBoard = memo(function ScoreBoard() {
  const { score, lines, level } = useGameStore();
  const { t } = useTranslation();

  const [prevScore, setPrevScore] = useState(score);
  const [prevLines, setPrevLines] = useState(lines);
  const [prevLevel, setPrevLevel] = useState(level);
  const [scoreKey, setScoreKey] = useState(0);
  const [linesKey, setLinesKey] = useState(0);
  const [levelKey, setLevelKey] = useState(0);

  useEffect(() => {
    if (score !== prevScore) {
      setPrevScore(score);
      setScoreKey((k) => k + 1);
    }
  }, [score, prevScore]);

  useEffect(() => {
    if (lines !== prevLines) {
      setPrevLines(lines);
      setLinesKey((k) => k + 1);
    }
  }, [lines, prevLines]);

  useEffect(() => {
    if (level !== prevLevel) {
      setPrevLevel(level);
      setLevelKey((k) => k + 1);
    }
  }, [level, prevLevel]);

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl hover:bg-gray-900/60 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-300 text-center">
          {t("game.score")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">{t("game.score")}</p>
          <motion.p
            key={`score-${scoreKey}`}
            initial={{ scale: 1.3, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="text-2xl font-bold text-tetris-cyan"
          >
            {score.toLocaleString()}
          </motion.p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">{t("game.lines")}</p>
          <motion.p
            key={`lines-${linesKey}`}
            initial={{ scale: 1.2, opacity: 0.8, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="text-2xl font-bold text-tetris-yellow"
          >
            {lines}
          </motion.p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">{t("game.level")}</p>
          <motion.p
            key={`level-${levelKey}`}
            initial={{ scale: 1.5, opacity: 0.5, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 12 }}
            className="text-2xl font-bold text-tetris-purple"
          >
            {level}
          </motion.p>
        </div>
      </CardContent>
    </Card>
  );
});
