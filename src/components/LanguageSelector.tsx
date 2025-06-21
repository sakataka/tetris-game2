import { useTranslation } from "react-i18next";

export function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <div style={{ position: "absolute", top: "16px", right: "16px" }}>
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        style={{
          background: "rgba(17, 24, 39, 0.5)",
          backdropFilter: "blur(4px)",
          color: "white",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid rgb(75, 85, 99)",
          outline: "none",
        }}
      >
        <option value="ja" style={{ background: "rgb(17, 24, 39)", color: "white" }}>
          日本語
        </option>
        <option value="en" style={{ background: "rgb(17, 24, 39)", color: "white" }}>
          English
        </option>
      </select>
    </div>
  );
}
