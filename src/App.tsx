import React from 'react';
import { Header } from './components/Header';
import { MainGame } from './components/MainGame';
import { GameSession } from './components/GameSession';
import { Footer } from './components/Footer';
import { useLanguage } from './hooks/useLanguage';
import { SongList, CompetitionSettings } from './types';

function App() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [showGameSelection, setShowGameSelection] = React.useState(false);
  const [gameSession, setGameSession] = React.useState<SongList | null>(null);
  const [showCompetitionSettings, setShowCompetitionSettings] = React.useState(false);
  const [competitionSettings, setCompetitionSettings] = React.useState<CompetitionSettings | null>(null);
  const [playerNames, setPlayerNames] = React.useState<string[]>([]);

  const handleLogoClick = () => {
    setShowGameSelection(false);
    setGameSession(null);
    setShowCompetitionSettings(false);
    setCompetitionSettings(null);
    setPlayerNames([]);
  };

  const handleStartGame = (gameType: string, songList?: SongList) => {
    if (songList) {
      if (gameType === 'game-type-2') {
        // For competition game, show settings first
        setGameSession(songList);
        setShowCompetitionSettings(true);
        setGameSession(prev => prev ? { ...prev, gameType } : null);
      } else {
        // For other games, start directly
        setGameSession(songList);
        setGameSession(prev => prev ? { ...prev, gameType } : null);
      }
    }
  };

  const handleStartCompetition = (settings: CompetitionSettings, names: string[]) => {
    setCompetitionSettings(settings);
    setPlayerNames(names);
    setShowCompetitionSettings(false);
  };

  const handleBackFromGame = () => {
    setGameSession(null);
    setShowCompetitionSettings(false);
    setCompetitionSettings(null);
    setPlayerNames([]);
  };

  return (
    <div className="app">
      <Header 
        currentLanguage={currentLanguage}
        onLanguageChange={changeLanguage}
        onLogoClick={handleLogoClick}
      />
      
      {gameSession ? (
        <GameSession
          currentLanguage={currentLanguage}
          songList={gameSession}
          onBack={handleBackFromGame}
          gameType={(gameSession as any).gameType}
          showSettings={showCompetitionSettings}
          onStartCompetition={handleStartCompetition}
        />
      ) : (
        <MainGame 
          currentLanguage={currentLanguage}
          showGameSelection={showGameSelection}
          onShowGameSelection={setShowGameSelection}
          onStartGame={handleStartGame}
        />
      )}
      
      <Footer currentLanguage={currentLanguage} />
    </div>
  );
}

export default App;