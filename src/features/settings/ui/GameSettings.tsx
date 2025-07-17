import { AnimatedButton } from "@shared/ui/AnimatedButton";
import { Badge } from "@shared/ui/badge";
import { Card } from "@shared/ui/card";
import { Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useSimpleAIStore } from "@/features/ai-control";
import { useSettings } from "@/features/settings";
import { CONTROL_STYLES, MODAL_STYLES } from "@/utils/styles";

export function GameSettings() {
  const { i18n, t } = useTranslation();
  const {
    showGhostPiece,
    enableTSpinDetection,
    setShowGhostPiece,
    setEnableTSpinDetection,
    setLanguage,
  } = useSettings();
  const { isEnabled: isAIEnabled, toggleAI } = useSimpleAIStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside the dropdown trigger button
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Also check if click is not inside the settings panel
        const settingsPanel = document.querySelector("[data-settings-panel]");
        if (!settingsPanel || !settingsPanel.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = useMemo(
    () => [
      { value: "en", label: "English", flag: "🇺🇸" },
      { value: "ja", label: "Japanese", flag: "🇯🇵" },
    ],
    [],
  );

  const handleLanguageChange = async (value: string) => {
    await i18n.changeLanguage(value);
    await setLanguage(value);
    // Don't close the dropdown immediately - let user see the change
  };

  const handleGhostPieceToggle = () => {
    setShowGhostPiece(!showGhostPiece);
  };

  return (
    <div className="absolute top-4 right-4 z-[9999]" ref={dropdownRef}>
      <AnimatedButton onClick={() => setIsOpen(!isOpen)} className={CONTROL_STYLES.button}>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden md:block">{t("game.settings.title")}</span>
        </div>
      </AnimatedButton>

      {isOpen &&
        createPortal(
          <Card
            className={`fixed top-16 right-4 ${MODAL_STYLES.panel} min-w-[240px] p-0 z-[9999]`}
            data-settings-panel
          >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLanguageChange(lang.value);
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleGhostPieceToggle();
                }}
              >
                <div className="flex flex-col">
                  <span className="text-white text-sm">
                    {t("game.settings.ghostPieceDescription")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
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

            {/* Separator */}
            <div className={`${MODAL_STYLES.separator} mx-3 my-2`} />

            {/* T-Spin Detection Section */}
            <div className="px-3 py-2">
              <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
                {t("game.settings.tSpinDetection")}
              </div>
              <button
                type="button"
                className={`${CONTROL_STYLES.interactiveItem} flex items-center justify-between p-2 rounded cursor-pointer w-full text-left`}
                onClick={(e) => {
                  e.stopPropagation();
                  setEnableTSpinDetection(!enableTSpinDetection);
                }}
              >
                <div className="flex flex-col">
                  <span className="text-white text-sm">
                    {t("game.settings.tSpinDetectionDescription")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-5 rounded-full p-1 transition-colors ${
                      enableTSpinDetection ? CONTROL_STYLES.toggleOn : CONTROL_STYLES.toggleOff
                    }`}
                  >
                    <div
                      className={`${CONTROL_STYLES.toggleThumb} ${
                        enableTSpinDetection ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </button>
            </div>

            {/* Separator */}
            <div className={`${MODAL_STYLES.separator} mx-3 my-2`} />

            {/* AI Control Section */}
            <div className="px-3 py-2">
              <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
                {t("ai.title")}
              </div>
              <button
                type="button"
                className={`${CONTROL_STYLES.interactiveItem} flex items-center justify-between p-2 rounded cursor-pointer w-full text-left`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAI();
                }}
              >
                <div className="flex flex-col">
                  <span className="text-white text-sm">{t("ai.enable")}</span>
                  {isAIEnabled && (
                    <span className="text-xs text-gray-400">{t("ai.status.active")}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-5 rounded-full p-1 transition-colors ${
                      isAIEnabled ? CONTROL_STYLES.toggleOn : CONTROL_STYLES.toggleOff
                    }`}
                  >
                    <div
                      className={`${CONTROL_STYLES.toggleThumb} ${
                        isAIEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </button>
            </div>
          </Card>,
          document.body,
        )}
    </div>
  );
}
