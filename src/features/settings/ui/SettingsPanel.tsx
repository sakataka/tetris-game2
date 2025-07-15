import { Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CONTROL_STYLES, MODAL_STYLES } from "@/utils/styles";

export interface GameSettings {
  // Visual settings
  showGhostPiece: boolean;
  showGrid: boolean;
  enableAnimations: boolean;

  // Gameplay settings
  enableTSpinDetection: boolean;
  enableAIFeatures: boolean;
  autoRepeatDelay: number;
  autoRepeatRate: number;

  // Theme settings
  theme: "compact" | "normal" | "gaming";
  colorScheme: "dark" | "light" | "auto";

  // Audio settings
  enableSound: boolean;
  soundVolume: number;
  enableHaptics: boolean;

  // Language settings
  language: string;

  // Performance settings
  targetFPS: number;
  enablePerformanceMode: boolean;
}

export interface SettingsPanelProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  className?: string;
  compact?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  className,
  compact = false,
  isOpen: controlledOpen,
  onToggle,
}: SettingsPanelProps) {
  const { i18n, t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        const settingsPanel = document.querySelector("[data-settings-panel]");
        if (!settingsPanel || !settingsPanel.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  const languages = useMemo(
    () => [
      { value: "en", label: "English", flag: "🇺🇸" },
      { value: "ja", label: "Japanese", flag: "🇯🇵" },
    ],
    [],
  );

  const updateSettings = (updates: Partial<GameSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const handleLanguageChange = async (value: string) => {
    updateSettings({ language: value });
    await i18n.changeLanguage(value);
  };

  const settingsPanel = (
    <Card
      className={`${MODAL_STYLES.overlay} bg-gray-900/95 backdrop-blur-md border-gray-700 ${compact ? "p-3" : "p-6"} space-y-4`}
      data-settings-panel
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`font-bold text-white ${compact ? "text-base" : "text-lg"}`}>
          {t("game.settings.title")}
        </h2>
        <AnimatedButton
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          aria-label={t("game.settings.close")}
        >
          ✕
        </AnimatedButton>
      </div>

      {/* Visual Settings */}
      <div className="space-y-3">
        <h3 className={`font-medium text-gray-300 ${compact ? "text-sm" : "text-base"}`}>
          {t("game.settings.visual")}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="ghost-piece-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.ghostPiece")}
            </label>
            <Switch
              id="ghost-piece-toggle"
              checked={settings.showGhostPiece}
              onCheckedChange={(checked) => updateSettings({ showGhostPiece: checked })}
              data-testid="ghost-piece-toggle"
            />
          </div>

          <div className="flex items-center justify-between">
            <label
              htmlFor="show-grid-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.showGrid")}
            </label>
            <Switch
              id="show-grid-toggle"
              checked={settings.showGrid}
              onCheckedChange={(checked) => updateSettings({ showGrid: checked })}
              data-testid="show-grid-toggle"
            />
          </div>

          <div className="flex items-center justify-between">
            <label
              htmlFor="animations-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.animations")}
            </label>
            <Switch
              id="animations-toggle"
              checked={settings.enableAnimations}
              onCheckedChange={(checked) => updateSettings({ enableAnimations: checked })}
              data-testid="animations-toggle"
            />
          </div>
        </div>
      </div>

      {/* Gameplay Settings */}
      <div className="space-y-3">
        <h3 className={`font-medium text-gray-300 ${compact ? "text-sm" : "text-base"}`}>
          {t("game.settings.gameplay")}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="t-spin-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.tSpinDetection")}
            </label>
            <Switch
              id="t-spin-toggle"
              checked={settings.enableTSpinDetection}
              onCheckedChange={(checked) => updateSettings({ enableTSpinDetection: checked })}
              data-testid="t-spin-toggle"
            />
          </div>

          <div className="flex items-center justify-between">
            <label
              htmlFor="ai-features-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.aiFeatures")}
            </label>
            <Switch
              id="ai-features-toggle"
              checked={settings.enableAIFeatures}
              onCheckedChange={(checked) => updateSettings({ enableAIFeatures: checked })}
              data-testid="ai-features-toggle"
            />
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="space-y-3">
        <h3 className={`font-medium text-gray-300 ${compact ? "text-sm" : "text-base"}`}>
          {t("game.settings.theme")}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="theme-select"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.themeMode")}
            </label>
            <Select
              value={settings.theme}
              onValueChange={(value: "compact" | "normal" | "gaming") =>
                updateSettings({ theme: value })
              }
            >
              <SelectTrigger id="theme-select" className="w-32" data-testid="theme-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">{t("game.settings.compact")}</SelectItem>
                <SelectItem value="normal">{t("game.settings.normal")}</SelectItem>
                <SelectItem value="gaming">{t("game.settings.gaming")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label
              htmlFor="color-scheme-select"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.colorScheme")}
            </label>
            <Select
              value={settings.colorScheme}
              onValueChange={(value: "dark" | "light" | "auto") =>
                updateSettings({ colorScheme: value })
              }
            >
              <SelectTrigger
                id="color-scheme-select"
                className="w-32"
                data-testid="color-scheme-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{t("game.settings.dark")}</SelectItem>
                <SelectItem value="light">{t("game.settings.light")}</SelectItem>
                <SelectItem value="auto">{t("game.settings.auto")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="space-y-3">
        <h3 className={`font-medium text-gray-300 ${compact ? "text-sm" : "text-base"}`}>
          {t("game.settings.audio")}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="sound-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.sound")}
            </label>
            <Switch
              id="sound-toggle"
              checked={settings.enableSound}
              onCheckedChange={(checked) => updateSettings({ enableSound: checked })}
              data-testid="sound-toggle"
            />
          </div>

          {settings.enableSound && (
            <div className="space-y-1">
              <label
                htmlFor="volume-slider"
                className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
              >
                {t("game.settings.volume")}: {Math.round(settings.soundVolume * 100)}%
              </label>
              <Slider
                id="volume-slider"
                value={[settings.soundVolume]}
                onValueChange={([value]) => updateSettings({ soundVolume: value })}
                min={0}
                max={1}
                step={0.1}
                data-testid="volume-slider"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label
              htmlFor="haptics-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.haptics")}
            </label>
            <Switch
              id="haptics-toggle"
              checked={settings.enableHaptics}
              onCheckedChange={(checked) => updateSettings({ enableHaptics: checked })}
              data-testid="haptics-toggle"
            />
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="space-y-3">
        <h3 className={`font-medium text-gray-300 ${compact ? "text-sm" : "text-base"}`}>
          {t("game.settings.language")}
        </h3>

        <Select value={settings.language} onValueChange={handleLanguageChange}>
          <SelectTrigger id="language-select" data-testid="language-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.flag} {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Performance Settings */}
      <div className="space-y-3">
        <h3 className={`font-medium text-gray-300 ${compact ? "text-sm" : "text-base"}`}>
          {t("game.settings.performance")}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="performance-mode-toggle"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.performanceMode")}
            </label>
            <Switch
              id="performance-mode-toggle"
              checked={settings.enablePerformanceMode}
              onCheckedChange={(checked) => updateSettings({ enablePerformanceMode: checked })}
              data-testid="performance-mode-toggle"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="fps-slider"
              className={`text-gray-300 ${compact ? "text-xs" : "text-sm"}`}
            >
              {t("game.settings.targetFPS")}: {settings.targetFPS}
            </label>
            <Slider
              id="fps-slider"
              value={[settings.targetFPS]}
              onValueChange={([value]) => updateSettings({ targetFPS: value })}
              min={30}
              max={120}
              step={10}
              data-testid="fps-slider"
            />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div ref={dropdownRef} className={className}>
      <AnimatedButton
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size={compact ? "sm" : "default"}
        className={`${CONTROL_STYLES.button} ${compact ? "p-2" : "p-3"}`}
        aria-label={t("game.settings.open")}
        data-testid="settings-button"
      >
        <Settings size={compact ? 16 : 20} />
        {!compact && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {t("game.settings.badge")}
          </Badge>
        )}
      </AnimatedButton>

      {isOpen && typeof window !== "undefined" && createPortal(settingsPanel, document.body)}
    </div>
  );
}
