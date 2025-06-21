import { useTranslation } from "react-i18next";
import { getTetrominoShape } from "../game/tetrominos";
import { useGameStore } from "../store/gameStore";

export function NextPiece() {
  const { nextPiece } = useGameStore();
  const { t } = useTranslation();
  const shape = getTetrominoShape(nextPiece);
  const colorIndex = ["I", "O", "T", "S", "Z", "J", "L"].indexOf(nextPiece) + 1;

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.5)",
        backdropFilter: "blur(4px)",
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid rgb(55, 65, 81)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h3
        style={{
          fontSize: "0.875rem",
          fontWeight: "bold",
          marginBottom: "12px",
          color: "rgb(156, 163, 175)",
          textAlign: "center",
        }}
      >
        {t("game.next")}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 20px)",
          gridTemplateRows: "repeat(4, 20px)",
          gap: "1px",
          background: "rgb(55, 65, 81)",
          borderRadius: "8px",
          overflow: "hidden",
          margin: "0 auto",
          width: "fit-content",
        }}
      >
        {Array.from({ length: 4 }).map((_, y) =>
          Array.from({ length: 4 }).map((_, x) => {
            const isActive = shape[y]?.[x] === 1;
            return (
              <div
                key={`next-${y * 4 + x}`}
                style={{
                  width: "20px",
                  height: "20px",
                  background: isActive
                    ? colorIndex === 1
                      ? "rgb(34, 211, 238)"
                      : colorIndex === 2
                        ? "rgb(250, 204, 21)"
                        : colorIndex === 3
                          ? "rgb(168, 85, 247)"
                          : colorIndex === 4
                            ? "rgb(34, 197, 94)"
                            : colorIndex === 5
                              ? "rgb(239, 68, 68)"
                              : colorIndex === 6
                                ? "rgb(59, 130, 246)"
                                : "rgb(249, 115, 22)"
                    : "rgb(31, 41, 55)",
                  border: isActive ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
