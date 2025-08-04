import { useState, useCallback } from 'react';
import { Language } from '../types';

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  const changeLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
    // Store preference in localStorage for persistence
    localStorage.setItem('hitreveal-language', language);
  }, []);

  // Load saved language preference on mount
  useState(() => {
    const savedLanguage = localStorage.getItem('hitreveal-language') as Language;
    if (savedLanguage && ['en', 'nl', 'de', 'fr'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  });

  return {
    currentLanguage,
    changeLanguage
  };
};