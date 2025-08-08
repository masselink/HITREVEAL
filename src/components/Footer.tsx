import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../data/translations';

interface FooterProps {
  currentLanguage: Language;
}

export const Footer: React.FC<FooterProps> = ({ currentLanguage }) => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Left side - Warning */}
          <div className="footer-left">
            <p className="footer-disclaimer">{getTranslation('footerDisclaimer', currentLanguage)}</p>
          </div>
          
          {/* Right side - Donation */}
          <div className="footer-right">
            <p className="footer-disclaimer2">{getTranslation('footerDisclaimer2', currentLanguage)}</p>
            <p className="footer-donation-text">{getTranslation('footerDonationText', currentLanguage)}</p>
            <button
              onClick={() => window.open('https://www.paypal.com/donate/?hosted_button_id=X3K6KFPJHVHDN', '_blank')}
              className="donate-button"
            >
              {getTranslation('donateButton', currentLanguage)}
            </button>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="footer-copyright">
          <p>{getTranslation('footerCopyright', currentLanguage)}</p>
        </div>
      </div>
    </footer>
  );
};