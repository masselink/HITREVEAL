import React from 'react';
import { GlobalHeader } from './components/GlobalHeader';
import { GlobalMainGame } from './components/GlobalMainGame';
import { GlobalGameSession } from './components/GlobalGameSession';
import { GlobalFooter } from './components/GlobalFooter';
import { useLanguage } from './hooks/useLanguage';
import { SongList } from './types';

function App() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [showGameSelection, setShowGameSelection] = React.useState(false);
  const [gameSession, setGameSession] = React.useState<SongList | null>(null);

  const handleLogoClick = () => {
    setShowGameSelection(false);
    setGameSession(null);
  };

  const handleStartGame = (gameType: string, songList?: SongList) => {
    if (songList) {
      setGameSession(songList);
      // Store the game type for the session
      setGameSession(prev => prev ? { ...prev, gameType } : null);
    }
  };

  const handleBackFromGame = () => {
    setGameSession(null);
  };

  return (
    <div className="app">
      <GlobalHeader 
        currentLanguage={currentLanguage}
        onLanguageChange={changeLanguage}
        onLogoClick={handleLogoClick}
      />
      
      {gameSession ? (
        <GlobalGameSession
          currentLanguage={currentLanguage}
          songList={gameSession}
          onBack={handleBackFromGame}
          gameType={(gameSession as any).gameType}
        />
      ) : (
        <GlobalMainGame 
          currentLanguage={currentLanguage}
          showGameSelection={showGameSelection}
          onShowGameSelection={setShowGameSelection}
          onStartGame={handleStartGame}
        />
      )}
      
      <GlobalFooter currentLanguage={currentLanguage} />
    </div>
  );
}

export default App;