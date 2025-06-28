import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../locales/en.json";
import jaTranslations from "../locales/ja.json";

// Supported languages
const SUPPORTED_LANGUAGES = ["en", "ja"] as const;

// Get saved language from localStorage or use default
const getSavedLanguage = (): string => {
  try {
    const saved = localStorage.getItem("tetris-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      const language = settings.language;

      // Only return saved language if it's supported, otherwise force English
      if (language && SUPPORTED_LANGUAGES.includes(language)) {
        return language;
      }
    }
  } catch (error) {
    console.error("Failed to load saved language:", error);
  }

  // Always default to English regardless of browser settings
  return "en";
};

const initialLanguage = getSavedLanguage();

// Log the initial language for debugging
console.log("[i18n] Initializing with language:", initialLanguage);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ja: {
        translation: jaTranslations,
      },
    },
    lng: initialLanguage,
    fallbackLng: "en",

    // Force the specific language and disable auto-detection
    load: "languageOnly",

    interpolation: {
      escapeValue: false,
    },

    // Disable React Suspense for predictable initialization
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    // Final check: if no saved language exists, ensure we're using English
    const currentLang = i18n.language;
    console.log("[i18n] Initialization complete. Current language:", currentLang);

    // If somehow a non-supported language was detected, force English
    if (!SUPPORTED_LANGUAGES.includes(currentLang as (typeof SUPPORTED_LANGUAGES)[number])) {
      console.log("[i18n] Unsupported language detected, forcing English");
      i18n.changeLanguage("en");
    }
  });

export default i18n;
