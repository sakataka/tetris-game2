import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";
import { CONTROL_STYLES, MODAL_STYLES } from "../../utils/styles";
import { AnimatedButton } from "../ui/AnimatedButton";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

export function GameSettings() {
  const { i18n, t } = useTranslation();
  const showGhostPiece = useSettingsStore((state) => state.showGhostPiece);
  const toggleShowGhostPiece = useSettingsStore((state) => state.toggleShowGhostPiece);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { value: "ja", label: "日本語", flag: "🇯🇵" },
    { value: "en", label: "English", flag: "🇺🇸" },
  ];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    setLanguage(value as "ja" | "en");
    setIsOpen(false);
  };

  const handleGhostPieceToggle = () => {
    toggleShowGhostPiece();
  };

  return (
    <div className="absolute top-4 right-4 z-[9999]" ref={dropdownRef}>
      <AnimatedButton onClick={() => setIsOpen(!isOpen)} className={CONTROL_STYLES.button}>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden md:block">{t("game.settings.title")}</span>
        </div>
      </AnimatedButton>

      {isOpen && (
        <Card className={`absolute top-full right-0 mt-2 ${MODAL_STYLES.panel} min-w-[240px] p-0`}>
          {/* Language Section */}
          <div className="px-3 py-2">
            <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
              {t("game.settings.language")}
            </div>
            {languages.map((lang) => (
              <button
                key={lang.value}
                type="button"
                className={`${CONTROL_STYLES.interactiveItem} flex items-center justify-between p-2 rounded cursor-pointer w-full text-left`}
                onClick={() => handleLanguageChange(lang.value)}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span className="text-white">{lang.label}</span>
                </div>
                {lang.value === i18n.language && (
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                    {t("game.settings.current")}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className={`${MODAL_STYLES.separator} mx-3 my-2`} />

          {/* Ghost Piece Section */}
          <div className="px-3 py-2">
            <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
              {t("game.settings.ghostPiece")}
            </div>
            <button
              type="button"
              className={`${CONTROL_STYLES.interactiveItem} flex items-center justify-between p-2 rounded cursor-pointer w-full text-left`}
              onClick={handleGhostPieceToggle}
            >
              <div className="flex flex-col">
                <span className="text-white text-sm">
                  {t("game.settings.ghostPieceDescription")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {showGhostPiece ? t("game.settings.enabled") : t("game.settings.disabled")}
                </span>
                <div
                  className={`w-10 h-5 rounded-full p-1 transition-colors ${
                    showGhostPiece ? CONTROL_STYLES.toggleOn : CONTROL_STYLES.toggleOff
                  }`}
                >
                  <div
                    className={`${CONTROL_STYLES.toggleThumb} ${
                      showGhostPiece ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
