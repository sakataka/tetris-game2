import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../locales/en.json";
import jaTranslations from "../locales/ja.json";

// Get saved language from localStorage or use default
const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem("tetris-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.state?.language || "en";
    }
  } catch (error) {
    console.error("Failed to load saved language:", error);
  }
  return "en";
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    ja: {
      translation: jaTranslations,
    },
  },
  lng: getSavedLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
