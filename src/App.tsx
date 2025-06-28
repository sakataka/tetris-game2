import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "./components/layout/Game";
import { useSettingsStore } from "./store/settingsStore";

function App() {
  const { i18n } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const hasInitialized = useRef(false);

  // Initialize language from persisted settings only once
  useEffect(() => {
    if (!hasInitialized.current && language && language !== i18n.language) {
      hasInitialized.current = true;
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return <Game />;
}

export default App;
