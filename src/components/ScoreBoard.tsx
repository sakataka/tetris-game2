import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";

export function ScoreBoard() {
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
    <div
      style={{
        background: "rgba(17, 24, 39, 0.5)",
        backdropFilter: "blur(4px)",
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid rgb(55, 65, 81)",
        color: "white",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: "bold",
            marginBottom: "2px",
            color: "rgb(156, 163, 175)",
          }}
        >
          {t("game.score")}
        </h3>
        <motion.p
          key={`score-${scoreKey}`}
          initial={{ scale: 1.3, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(34, 211, 238)" }}
        >
          {score.toLocaleString()}
        </motion.p>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: "bold",
            marginBottom: "2px",
            color: "rgb(156, 163, 175)",
          }}
        >
          {t("game.lines")}
        </h3>
        <motion.p
          key={`lines-${linesKey}`}
          initial={{ scale: 1.2, opacity: 0.8, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(250, 204, 21)" }}
        >
          {lines}
        </motion.p>
      </div>
      <div>
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: "bold",
            marginBottom: "2px",
            color: "rgb(156, 163, 175)",
          }}
        >
          {t("game.level")}
        </h3>
        <motion.p
          key={`level-${levelKey}`}
          initial={{ scale: 1.5, opacity: 0.5, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 12 }}
          style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(168, 85, 247)" }}
        >
          {level}
        </motion.p>
      </div>
    </div>
  );
}
