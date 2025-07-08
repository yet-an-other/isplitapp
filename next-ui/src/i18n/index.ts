import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';

const resources = {
  en: {
    translation: en
  },
  de: {
    translation: de
  }
};

// Get saved language from localStorage or detect from browser
const savedLanguage = localStorage.getItem('i18nextLng');
const browserLanguage = navigator.language.split('-')[0];
const defaultLanguage = savedLanguage || browserLanguage || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: ['en', 'de'].includes(defaultLanguage) ? defaultLanguage : 'en',
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    react: {
      useSuspense: false
    }
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;