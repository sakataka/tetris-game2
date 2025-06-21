import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";

export function GameOverlay() {
  const { isGameOver, isPaused, resetGame } = useGameStore();
  const { t } = useTranslation();

  if (!isGameOver && !isPaused) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "rgb(31, 41, 55)",
          padding: "32px",
          borderRadius: "8px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h2
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "16px",
          }}
        >
          {isGameOver ? t("game.gameOver") : t("game.paused")}
        </h2>
        {isGameOver && (
          <button
            type="button"
            onClick={resetGame}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgb(29, 78, 216)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "rgb(37, 99, 235)";
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgb(29, 78, 216)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgb(37, 99, 235)";
            }}
            style={{
              padding: "12px 24px",
              background: "rgb(37, 99, 235)",
              borderRadius: "8px",
              fontWeight: "bold",
              border: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            {t("game.newGame")}
          </button>
        )}
        {isPaused && <p style={{ fontSize: "1.25rem" }}>{t("game.resumeHint")}</p>}
      </div>
    </div>
  );
}
