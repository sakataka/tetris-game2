import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "./components/layout/Game";
import { AnimationProvider } from "./contexts/AnimationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useThemeFeatureFlags } from "./hooks/core/useFeatureFlag";
import { useSettingsStore } from "./store/settingsStore";

// Import debug tools in development only
if (import.meta.env.DEV) {
  import("./utils/debugLanguage");
}

function App() {
  const { i18n } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const hasInitialized = useRef(false);
  const { themeSystemEnabled } = useThemeFeatureFlags();

  // Initialize language from persisted settings only once
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[App] Language sync check:", {
        hasInitialized: hasInitialized.current,
        settingsLanguage: language,
        i18nLanguage: i18n.language,
      });
    }

    if (!hasInitialized.current && language && language !== i18n.language) {
      hasInitialized.current = true;
      if (import.meta.env.DEV) {
        console.log("[App] Changing language to:", language);
      }
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return (
    <ThemeProvider defaultMode="normal" enableFeatureFlag={themeSystemEnabled}>
      <AnimationProvider>
        <Game />
      </AnimationProvider>
    </ThemeProvider>
  );
}

export default App;
