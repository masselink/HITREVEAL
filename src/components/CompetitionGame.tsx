import React, { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Language, SongList, Song, CompetitionSettings } from '../types';
import { translations } from '../data/translations';
import { CompetitionSettings as CompetitionSettingsComponent } from './competition/CompetitionSettings';
import { CompetitionDashboard } from './competition/CompetitionDashboard';
import { CompetitionGameSession } from './competition/CompetitionGameSession';
import { CompetitionWinnerPage } from './CompetitionWinnerPage';
import Papa from 'papaparse';

interface Player {
  id: number;
  name: string;
  score: number;
  artistPoints: number;
  titlePoints: number;
  yearPoints: number;
  bonusPoints: number;
  skipsUsed: number;
}

interface GameStats {
  totalRounds: number;
  totalSongs: number;
  gameDuration: number;
  wasSuddenDeath: boolean;
}

interface CompetitionGameProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
}

export const CompetitionGame: React.FC<CompetitionGameProps> = ({
  currentLanguage,
  songList,
  onBack
}) => {
  // Game state
  const [gamePhase, setGamePhase] = useState<'settings' | 'dashboard' | 'playing' | 'winner'>('settings');
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string>('');
  
  // Competition settings
  const [settings, setSettings] = useState<CompetitionSettings>({
    numberOfPlayers: 2,
    playerNames: ['', ''],
    gameMode: 'points',
    targetScore: 25,
    gameDuration: 15,
    maximumRounds: 10,
    artistPoints: 1,
    titlePoints: 2,
    yearPoints: 1,
    bonusPoints: 2,
    skipsPerPlayer: 2,
    skipCost: 0
  });
  
  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [usedSongs, setUsedSongs] = useState<Song[]>([]);
  const [totalSongsPlayed, setTotalSongsPlayed] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [songListViewCount, setSongListViewCount] = useState(0);
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Load songs from CSV
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const response = await fetch(songList.github_link);
        if (!response.ok) {
          throw new Error('Failed to fetch song list');
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const data = results.data as Song[];
            const validData = data.filter(row => 
              row.hitster_url && 
              row.youtube_url && 
              row.title && 
              row.artist
            );
            setSongs(validData);
            setSongsLoaded(true);
          },
          error: (error) => {
            setLoadingError('Failed to load songs');
          }
        });
      } catch (err) {
        setLoadingError('Failed to load songs');
      }
    };

    loadSongs();
  }, [songList]);

  const initializePlayers = () => {
    const newPlayers: Player[] = Array.from({ length: settings.numberOfPlayers }, (_, i) => ({
      id: i,
      name: settings.playerNames[i] || '',
      score: 0,
      artistPoints: 0,
      titlePoints: 0,
      yearPoints: 0,
      bonusPoints: 0,
      skipsUsed: 0
    }));
    setPlayers(newPlayers);
  };

  const startGame = () => {
    const allNamesProvided = settings.playerNames.slice(0, settings.numberOfPlayers).every(name => name.trim() !== '');
    
    if (!allNamesProvided) {
      setValidationError(translations.allPlayerNameRequired[currentLanguage]);
      return;
    }
    
    setValidationError('');
    initializePlayers();
    setGameStartTime(Date.now());
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setUsedSongs([]);
    setTotalSongsPlayed(0);
    setSongListViewCount(0);
    setGamePhase('dashboard');
  };

  const handlePlayerGo = () => {
    setGamePhase('playing');
  };

  const handleSongFound = (song: Song) => {
    // Song found logic handled in CompetitionGameSession
  };

  const handleNoMatch = (data: string) => {
    // No match logic handled in CompetitionGameSession
  };

  const handleTurnComplete = (scores: any) => {
    // Mark current song as used
    setUsedSongs(prev => [...prev, songs.find(s => s.hitster_url === scores.songUrl) || songs[0]]);
    
    // Increment total songs played
    setTotalSongsPlayed(prev => prev + 1);
    
    // Update current player's score
    setPlayers(prevPlayers => {
      const updatedPlayers = prevPlayers.map(player => {
        if (player.id === currentPlayerIndex) {
          return {
            ...player,
            score: player.score + scores.totalPoints,
            artistPoints: player.artistPoints + scores.artistPoints,
            titlePoints: player.titlePoints + scores.titlePoints,
            yearPoints: player.yearPoints + scores.yearPoints,
            bonusPoints: player.bonusPoints + scores.bonusPoints
          };
        }
        return player;
      });
      
      // Check for winner after updating scores
      setTimeout(() => checkForWinner(updatedPlayers), 100);
      
      return updatedPlayers;
    });
    
    // Move to next player
    handleNextPlayer();
    setGamePhase('dashboard');
  };

  const handleSkip = () => {
    // Update player's skip count and deduct points
    setPlayers(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.id === currentPlayerIndex) {
          return {
            ...player,
            skipsUsed: player.skipsUsed + 1,
            score: Math.max(0, player.score - settings.skipCost)
          };
        }
        return player;
      });
    });
    
    // Move to next player
    handleNextPlayer();
    setGamePhase('dashboard');
  };

  const handleNextPlayer = () => {
    const nextPlayerIndex = (currentPlayerIndex + 1) % settings.numberOfPlayers;
    
    if (nextPlayerIndex === 0) {
      setCurrentRound(prev => prev + 1);
    }
    
    setCurrentPlayerIndex(nextPlayerIndex);
  };

  const checkForWinner = (currentPlayers: Player[]) => {
    const maxScore = Math.max(...currentPlayers.map(p => p.score));
    const winners = currentPlayers.filter(p => p.score === maxScore);
    
    // Check winning conditions based on game mode
    if (settings.gameMode === 'points') {
      if (maxScore >= settings.targetScore) {
        showWinnerPage(winners, currentPlayers);
        return;
      }
    } else if (settings.gameMode === 'time-based') {
      const elapsedMinutes = Math.floor((Date.now() - gameStartTime) / 60000);
      if (elapsedMinutes >= settings.gameDuration) {
        showWinnerPage(winners, currentPlayers);
        return;
      }
    } else if (settings.gameMode === 'rounds') {
      if (currentRound > settings.maximumRounds) {
        showWinnerPage(winners, currentPlayers);
        return;
      }
    }
  };

  const showWinnerPage = (winners: Player[], allPlayers: Player[]) => {
    const gameStats: GameStats = {
      totalRounds: currentRound,
      totalSongs: totalSongsPlayed,
      gameDuration: Math.floor((Date.now() - gameStartTime) / 60000),
      wasSuddenDeath: false
    };
    
    setGamePhase('winner');
  };

  const handleSongListView = () => {
    setSongListViewCount(prev => prev + 1);
  };

  const handleQuitGame = () => {
    setShowQuitConfirmation(true);
  };

  const confirmQuit = () => {
    onBack();
  };

  const cancelQuit = () => {
    setShowQuitConfirmation(false);
  };

  const handlePlayAgain = () => {
    setGamePhase('settings');
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setUsedSongs([]);
    setTotalSongsPlayed(0);
    setSongListViewCount(0);
    setGameStartTime(0);
  };

  const handleBackFromGame = () => {
    setGamePhase('dashboard');
  };

  // Loading state
  if (!songsLoaded && !loadingError) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>{translations.back[currentLanguage]}</span>
            </button>
          </div>
          <div className="loading-message">
            {translations.loadingSongs[currentLanguage]}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadingError) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>{translations.back[currentLanguage]}</span>
            </button>
          </div>
          <div className="error-message">
            {loadingError}
          </div>
        </div>
      </div>
    );
  }

  // Winner page
  if (gamePhase === 'winner') {
    const maxScore = Math.max(...players.map(p => p.score));
    const winners = players.filter(p => p.score === maxScore);
    
    const gameStats: GameStats = {
      totalRounds: currentRound,
      totalSongs: totalSongsPlayed,
      gameDuration: Math.floor((Date.now() - gameStartTime) / 60000),
      wasSuddenDeath: false
    };

    return (
      <CompetitionWinnerPage
        currentLanguage={currentLanguage}
        winners={winners}
        allPlayers={players}
        gameSettings={settings}
        gameStats={gameStats}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={onBack}
      />
    );
  }

  // Game session (playing)
  if (gamePhase === 'playing') {
    return (
      <CompetitionGameSession
        currentLanguage={currentLanguage}
        settings={settings}
        allSongs={songs}
        usedSongs={usedSongs}
        currentPlayer={players[currentPlayerIndex]}
        onBack={handleBackFromGame}
        onSongFound={handleSongFound}
        onNoMatch={handleNoMatch}
        onTurnComplete={handleTurnComplete}
        onSkip={handleSkip}
        onSongListView={handleSongListView}
        songListViewCount={songListViewCount}
      />
    );
  }

  // Dashboard (between turns)
  if (gamePhase === 'dashboard') {
    return (
      <>
        <CompetitionDashboard
          currentLanguage={currentLanguage}
          settings={settings}
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          currentRound={currentRound}
          totalSongsPlayed={totalSongsPlayed}
          usedSongs={usedSongs}
          allSongs={songs}
          gameStartTime={gameStartTime}
          onQuitGame={handleQuitGame}
          onPlayerGo={handlePlayerGo}
        />

        {/* Quit Confirmation Modal */}
        {showQuitConfirmation && (
          <div className="preview-overlay">
            <div className="quit-confirmation-modal">
              <div className="quit-modal-header">
                <h3 className="quit-modal-title">
                  {translations.quitGameConfirmTitle[currentLanguage]}
                </h3>
              </div>
              
              <div className="quit-modal-content">
                <p className="quit-warning-text">
                  {translations.quitGameWarning[currentLanguage]}
                </p>
                
                <div className="quit-modal-buttons">
                  <button className="cancel-quit-button" onClick={cancelQuit}>
                    <span>{translations.cancel[currentLanguage]}</span>
                  </button>
                  <button className="confirm-quit-button" onClick={confirmQuit}>
                    <X size={16} />
                    <span>{translations.quitGame[currentLanguage]}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Settings page (default)
  return (
    <div className="game-session">
      <div className="game-session-container">
        <div className="game-session-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>{translations.back[currentLanguage]}</span>
          </button>
        </div>

        <CompetitionSettingsComponent
          currentLanguage={currentLanguage}
          songList={songList}
          settings={settings}
          onSettingsChange={setSettings}
          onStartGame={startGame}
          validationError={validationError}
        />
      </div>
    </div>
  );
};