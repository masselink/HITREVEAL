import React from 'react';
import { Language } from '../types';

interface GlobalHeaderProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onLogoClick: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  onLogoClick
}) => {
  const languages: { code: Language; label: string; flagSrc: string }[] = [
    { code: 'en', label: 'EN', flagSrc: '/flags/en.svg' },
    { code: 'nl', label: 'NL', flagSrc: '/flags/nl.svg' },
    { code: 'de', label: 'DE', flagSrc: '/flags/de.svg' },
    { code: 'fr', label: 'FR', flagSrc: '/flags/fr.svg' }
  ];

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <button className="logo" onClick={onLogoClick}>
          <img 
            src="/Hitreveal icon.svg" 
            alt="HitReveal Logo" 
            className="logo-image"
          />
          <span className="logo-text">HITREVEAL</span>
        </button>

        {/* Controls */}
        <div className="header-controls">
          {/* Language Switcher */}
          <div className="language-switcher">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-button ${
                  currentLanguage === lang.code ? 'active' : ''
                }`}
                onClick={() => onLanguageChange(lang.code)}
                aria-label={`Switch to ${lang.label}`}
              >
                <img 
                  src={lang.flagSrc} 
                  alt={`${lang.label} flag`}
                  className="language-flag"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};