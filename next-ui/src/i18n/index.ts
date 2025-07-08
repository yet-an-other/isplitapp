import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

const resources = {
  en: {
    translation: en
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    react: {
      useSuspense: false
    }
  });

export default i18n;