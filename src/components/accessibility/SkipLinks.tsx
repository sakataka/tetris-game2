import { useTranslation } from "react-i18next";

/**
 * Skip Links component for keyboard navigation accessibility
 * Provides quick navigation to main sections of the application
 */
export function SkipLinks() {
  const { t } = useTranslation();

  const skipToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus({ preventScroll: false });
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, targetId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      skipToSection(targetId);
    }
  };

  return (
    <div className="skip-links sr-only-focusable">
      <button
        type="button"
        className="skip-link"
        onClick={() => skipToSection("main-content")}
        onKeyDown={(e) => handleKeyDown(e, "main-content")}
      >
        {t("accessibility.skipToMain")}
      </button>
      <button
        type="button"
        className="skip-link"
        onClick={() => skipToSection("game-board")}
        onKeyDown={(e) => handleKeyDown(e, "game-board")}
      >
        {t("accessibility.skipToGameBoard")}
      </button>
      <button
        type="button"
        className="skip-link"
        onClick={() => skipToSection("game-info")}
        onKeyDown={(e) => handleKeyDown(e, "game-info")}
      >
        {t("accessibility.skipToGameInfo")}
      </button>
      <button
        type="button"
        className="skip-link"
        onClick={() => skipToSection("game-controls")}
        onKeyDown={(e) => handleKeyDown(e, "game-controls")}
      >
        {t("accessibility.skipToControls")}
      </button>
    </div>
  );
}
