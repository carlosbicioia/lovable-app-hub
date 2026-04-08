import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
    },
    lng: "es",
    fallbackLng: "es",
    interpolation: { escapeValue: false },
  });

localStorage.removeItem("i18nextLng");

export default i18n;
