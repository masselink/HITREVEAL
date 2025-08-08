import React from 'react';
import { Play } from 'lucide-react';
import { Language, SongList } from '../types';
import { translations } from '../data/translations';
import { GameSelection } from './GameSelection';

interface MainGameProps {
  currentLanguage: Language;
  showGameSelection: boolean;
  onShowGameSelection: (show: boolean) => void;
  onStartGame: (gameType: string, songList?: SongList) => void;
}

export const MainGame: React.FC<MainGameProps> = ({ 
  currentLanguage, 
  showGameSelection, 
  onShowGameSelection,
  onStartGame
}) => {

  const handleStartGame = () => {
    onShowGameSelection(true);
  };

  const handleBackToMain = () => {
    onShowGameSelection(false);
  };

  if (showGameSelection) {
    return (
      <GameSelection
        currentLanguage={currentLanguage}
        onBack={handleBackToMain}
        onStartGame={onStartGame}
      />
    );
  }

  return (
    <main className="main-game">
      <div className="game-container">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h2 className="welcome-title">
            {translations.welcomeTitle[currentLanguage]}
          </h2>
          <p className="welcome-subtitle">
            {translations.welcomeSubtitle[currentLanguage]}
          </p>
          <p className="game-description">
            {translations.gameDescription[currentLanguage]}
          </p>
        </section>

        {/* Game Controls */}
        <section className="game-controls">
          <button 
            className="primary-button"
            onClick={handleStartGame}
            aria-label={translations.startGame[currentLanguage]}
          >
            <Play size={20} />
            <span>{translations.startGame[currentLanguage]}</span>
          </button>
        </section>
      </div>
    </main>
  );
};