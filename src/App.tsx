import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "./components/layout/Game";
import { useSettingsStore } from "./store/settingsStore";

function App() {
  const { i18n } = useTranslation();
  const language = useSettingsStore((state) => state.language);

  // Initialize language from persisted settings
  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return <Game />;
}

export default App;
