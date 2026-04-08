import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import es from "./locales/es.json";
import en from "./locales/en.json";

// Clear stale cached language so detector re-evaluates from browser
const cachedLng = localStorage.getItem("i18nextLng");
if (cachedLng && !["es", "en"].includes(cachedLng)) {
  localStorage.removeItem("i18nextLng");
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    detection: {
      order: ["navigator", "htmlTag"],
      caches: ["localStorage"],
      convertDetectedLanguage: (lng: string) => lng.split("-")[0],
    },
  });

export default i18n;
