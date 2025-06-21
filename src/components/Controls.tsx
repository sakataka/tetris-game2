import { useTranslation } from "react-i18next";

export function Controls() {
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
      <h3
        style={{
          fontSize: "0.875rem",
          fontWeight: "bold",
          marginBottom: "12px",
          color: "rgb(156, 163, 175)",
          textAlign: "center",
        }}
      >
        {t("game.controls.title")}
      </h3>
      <div style={{ fontSize: "0.75rem", lineHeight: "1.4" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            padding: "4px 8px",
            background: "rgba(55, 65, 81, 0.3)",
            borderRadius: "4px",
          }}
        >
          <span style={{ color: "rgb(203, 213, 225)", fontFamily: "monospace" }}>← →</span>
          <span>{t("game.controls.move")}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            padding: "4px 8px",
            background: "rgba(55, 65, 81, 0.3)",
            borderRadius: "4px",
          }}
        >
          <span style={{ color: "rgb(203, 213, 225)", fontFamily: "monospace" }}>↓</span>
          <span>{t("game.controls.softDrop")}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            padding: "4px 8px",
            background: "rgba(55, 65, 81, 0.3)",
            borderRadius: "4px",
          }}
        >
          <span style={{ color: "rgb(203, 213, 225)", fontFamily: "monospace" }}>↑</span>
          <span>{t("game.controls.rotate")}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            padding: "4px 8px",
            background: "rgba(55, 65, 81, 0.3)",
            borderRadius: "4px",
          }}
        >
          <span style={{ color: "rgb(203, 213, 225)", fontFamily: "monospace" }}>Space</span>
          <span>{t("game.controls.hardDrop")}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "4px 8px",
            background: "rgba(55, 65, 81, 0.3)",
            borderRadius: "4px",
          }}
        >
          <span style={{ color: "rgb(203, 213, 225)", fontFamily: "monospace" }}>P</span>
          <span>{t("game.controls.pause")}</span>
        </div>
      </div>
    </div>
  );
}
