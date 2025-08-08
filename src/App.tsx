import React from 'react';
import { Header } from './components/Header';
import { MainGame } from './components/MainGame';
import { GameSession } from './components/GameSession';
import { Footer } from './components/Footer';
import { useLanguage } from './hooks/useLanguage';
import { SongList } from './types';

function App() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [showGameSelection, setShowGameSelection] = React.useState(false);
  const [gameSession, setGameSession] = React.useState<SongList | null>(null);

  const handleLogoClick = () => {
    window.scrollTo(0, 0);
    setShowGameSelection(false);
    setGameSession(null);
  };

  const handleStartGame = (gameType: string, songList?: SongList) => {
    window.scrollTo(0, 0);
    if (songList) {
      setGameSession(songList);
      // Store the game type for the session
      setGameSession(prev => prev ? { ...prev, gameType } : null);
    }
  };

  const handleBackFromGame = () => {
    window.scrollTo(0, 0);
    setGameSession(null);
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