import { Language } from '../../types';
import { en } from './en';
import { nl } from './nl';
import { de } from './de';
import { fr } from './fr';

const translations = {
  en,
  nl,
  de,
  fr
};

export const getTranslation = (key: string, language: Language): string => {
  const langTranslations = translations[language];
  if (langTranslations && key in langTranslations) {
    return (langTranslations as any)[key];
  }
  
  // Fallback to English if translation not found
  const englishTranslations = translations.en;
  if (key in englishTranslations) {
    return (englishTranslations as any)[key];
  }
  
  // Return key if no translation found
  return key;
};

export { translations };