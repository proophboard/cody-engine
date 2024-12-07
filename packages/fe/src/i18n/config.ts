import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import deTranslations from './de.json';
import enTranslations from './en.json';

export const CURRENT_LANGUAGE = 'currentLanguage';

const resources = {
  en: {
    translation: enTranslations,
  },
  de: {
    translation: deTranslations,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: ['en', 'de'],
    lng: localStorage.getItem(CURRENT_LANGUAGE) || 'de',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
