import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';
import tr from '../locales/tr.json';
import en from '../locales/en.json';

export const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const resources = {
  tr: { translation: tr },
  en: { translation: en }
};

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'tr');
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.init({
        resources,
        lng: language,
        fallbackLng: 'tr',
        interpolation: { escapeValue: false },
      }).then(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (i18n.isInitialized) {
      i18n.changeLanguage(language);
    }
    localStorage.setItem('language', language);
  }, [language]);

  const onLanguageChange = (lng) => {
    setLanguage(lng);
    // localStorage.setItem('language', lng); // Artık useEffect'te otomatik kaydediliyor
  };

  if (!ready) return null; // veya bir loading spinner

  return (
    <LanguageContext.Provider value={{ language, onLanguageChange }}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </LanguageContext.Provider>
  );
} 