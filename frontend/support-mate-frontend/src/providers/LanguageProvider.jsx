import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';
import tr from '../locales/tr.json';
import en from '../locales/en.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    console.warn('useLanguage must be used within a LanguageProvider');
    return { language: 'tr', onLanguageChange: () => {} };
  }
  return context;
};

const resources = {
  tr: { translation: tr },
  en: { translation: en }
};

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'tr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      if (!i18n.isInitialized) {
        await i18n.init({
          resources,
          lng: language,
          fallbackLng: 'tr',
          interpolation: { escapeValue: false },
        });
      }
      setReady(true);
    };

    initializeI18n();
  }, []);

  useEffect(() => {
    if (i18n.isInitialized && ready) {
      i18n.changeLanguage(language);
    }
    localStorage.setItem('language', language);
  }, [language, ready]);

  const onLanguageChange = (lng) => {
    setLanguage(lng);
  };

  if (!ready) {
    return <div>Loading...</div>; // Basit bir loading göstergesi
  }

  return (
    <LanguageContext.Provider value={{ language, onLanguageChange }}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </LanguageContext.Provider>
  );
} 