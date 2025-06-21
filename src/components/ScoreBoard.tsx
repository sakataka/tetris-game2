import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";

export function ScoreBoard() {
  const { score, lines, level } = useGameStore();
  const { t } = useTranslation();

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
        <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(34, 211, 238)" }}>
          {score.toLocaleString()}
        </p>
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
        <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(250, 204, 21)" }}>
          {lines}
        </p>
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
        <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(168, 85, 247)" }}>
          {level}
        </p>
      </div>
    </div>
  );
}
