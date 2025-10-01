import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Users, Clock, Target, Trophy, Crown, Music, Play } from 'lucide-react';
import { Language, SongList, Song } from '../types';
import { getTranslation } from '../data/translations';
import { CompetitionYouTubePlayer } from './CompetitionYouTubePlayer';
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

interface CompetitionSettings {
  numberOfPlayers: number;
  gameMode: 'points' | 'time-based' | 'rounds';
  targetScore: number;
  gameDuration: number;
  maximumRounds: number;
  artistPoints: number;
  titlePoints: number;
  yearPoints: number;
  bonusPoints: number;
  skipsPerPlayer: number;
  skipCost: number;
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
  const [gamePhase, setGamePhase] = useState<'settings' | 'playing' | 'winner'>('settings');
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [usedSongs, setUsedSongs] = useState<Set<string>>(new Set());
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string>('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [playerSkips, setPlayerSkips] = useState<{ [playerId: number]: number }>({});
  const [showPlayerInterface, setShowPlayerInterface] = useState(false);
  const [gameHasStarted, setGameHasStarted] = useState(false);

  const [settings, setSettings] = useState<CompetitionSettings>({
    numberOfPlayers: 2,
    gameMode: 'points',
    targetScore: 25,
    gameDuration: 30,
    maximumRounds: 10,
    artistPoints: 1,
    titlePoints: 2,
    yearPoints: 1,
    bonusPoints: 2,
    skipsPerPlayer: 2,
    skipCost: 3
  });

  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: '', score: 0, artistPoints: 0, titlePoints: 0, yearPoints: 0, bonusPoints: 0, skipsUsed: 0 },
    { id: 1, name: '', score: 0, artistPoints: 0, titlePoints: 0, yearPoints: 0, bonusPoints: 0, skipsUsed: 0 }
  ]);

  // Initialize player skips when settings change
  useEffect(() => {
    const newPlayerSkips: { [playerId: number]: number } = {};
    players.forEach(player => {
      newPlayerSkips[player.id] = settings.skipsPerPlayer;
    });
    setPlayerSkips(newPlayerSkips);
  }, [settings.skipsPerPlayer, players.length]);

  // Load songs from CSV
  useEffect(() => {
    const loadSongs = async () => {
      try {
        // Ensure the URL has a protocol
        let url = songList.github_link;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        console.log('Loading songs from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch song list: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('CSV loaded, parsing...');
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const data = results.data as Song[];
            const validData = data.filter(row => 
              row.youtube_url && 
              row.title && 
              row.artist
            );
            console.log(`Parsed ${data.length} total songs, ${validData.length} valid songs`);
            setSongs(validData);
            setSongsLoaded(true);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoadingError(`Failed to parse CSV: ${error.message}`);
          }
        });
      } catch (err) {
        console.error('Error loading songs:', err);
        setLoadingError(`Failed to load songs: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    loadSongs();
  }, [songList]);

  // Update players array when number of players changes
  useEffect(() => {
    const newPlayers = Array.from({ length: settings.numberOfPlayers }, (_, index) => {
      const existingPlayer = players[index];
      return existingPlayer || {
        id: index,
        name: '',
        score: 0,
        artistPoints: 0,
        titlePoints: 0,
        yearPoints: 0,
        bonusPoints: 0,
        skipsUsed: 0
      };
    });
    setPlayers(newPlayers);
  }, [settings.numberOfPlayers]);

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayers(prev => prev.map((player, i) => 
      i === index ? { ...player, name } : player
    ));
  };

  const validateSettings = (): string[] => {
    const errors: string[] = [];
    
    // Check if all player names are filled
    const emptyNames = players.filter(player => !player.name.trim());
    if (emptyNames.length > 0) {
      errors.push(getTranslation('allPlayerNameRequired', currentLanguage));
    }
    
    return errors;
  };

  const startGame = () => {
    const errors = validateSettings();
    if (errors.length > 0) {
      return; // Don't start if there are validation errors
    }
    
    window.scrollTo(0, 0);
    setGamePhase('playing');
    setGameStartTime(new Date());
    setGameHasStarted(true);
    selectRandomSong();
  };

  const selectRandomSong = () => {
    const availableSongs = songs.filter(song => !usedSongs.has(song.youtube_url));
    if (availableSongs.length === 0) {
      // No more songs available - end game
      endGame();
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const selectedSong = availableSongs[randomIndex];
    setCurrentSong(selectedSong);
    setUsedSongs(prev => new Set([...prev, selectedSong.youtube_url]));
  };

  const handleTurnComplete = (scores: any) => {
    console.log('🎯 TURN COMPLETE RECEIVED IN COMPETITION GAME!');
    console.log('📊 Scores received:', scores);
    
    if (!currentSong) {
      console.error('❌ No current song available');
      return;
    }

    // Update current player's score
    const currentPlayer = players[currentPlayerIndex];
    
    setPlayers(prev => prev.map(player => {
      if (player.id === currentPlayer.id) {
        const updatedPlayer = {
          ...player,
          artistPoints: player.artistPoints + (scores.artistPoints || 0),
          titlePoints: player.titlePoints + (scores.titlePoints || 0),
          yearPoints: player.yearPoints + (scores.yearPoints || 0),
          bonusPoints: player.bonusPoints + (scores.bonusPoints || 0),
          score: player.score + (scores.totalPoints || 0)
        };
        return updatedPlayer;
      }
      return player;
    }));

    // Move to next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    
    if (nextPlayerIndex === 0) {
      // Completed a full round
      setCurrentRound(prev => prev + 1);
    }
    
    setCurrentPlayerIndex(nextPlayerIndex);
    selectRandomSong();
  };

  const handleSkip = () => {
    const currentPlayer = players[currentPlayerIndex];
    
    // Mark current song as used (skipped)
    if (currentSong) {
      setUsedSongs(prev => new Set([...prev, currentSong.youtube_url]));
    }
    
    // Deduct skip cost from player's score
    if (settings.skipCost > 0) {
      setPlayers(prev => prev.map(player => 
        player.id === currentPlayer.id 
          ? { ...player, score: player.score - settings.skipCost }
          : player
      ));
    }

    // Decrease skip count
    setPlayerSkips(prev => ({
      ...prev,
      [currentPlayer.id]: Math.max(0, prev[currentPlayer.id] - 1)
    }));

    // Increment skips used
    setPlayers(prev => prev.map(player => 
      player.id === currentPlayer.id 
        ? { ...player, skipsUsed: player.skipsUsed + 1 }
        : player
    ));

    // Select a new song for the same player (don't advance to next player)
    selectRandomSong();
  };

  const handleFreeSkip = () => {
    // Mark current song as used (free skip)
    if (currentSong) {
      setUsedSongs(prev => new Set([...prev, currentSong.youtube_url]));
    }

    // Select a new song for the same player without any penalties and show player interface
    selectRandomSong();
    setShowPlayerInterface(true);
  };

  const nextTurn = () => {
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    
    if (nextPlayerIndex === 0) {
      // Completed a full round
      setCurrentRound(prev => prev + 1);
    }
    
    setCurrentPlayerIndex(nextPlayerIndex);
    selectRandomSong();
  };

  // Check win conditions after each turn
  useEffect(() => {
    if (gamePhase === 'playing' && !showPlayerInterface && gameHasStarted && usedSongs.size > 0) {
      checkWinConditions();
    }
  }, [gamePhase, showPlayerInterface, currentRound, players, gameHasStarted, usedSongs.size]);

  const checkWinConditions = () => {
    // Only check when we're in dashboard mode
    if (showPlayerInterface || gamePhase !== 'playing') {
      return;
    }
    
    console.log('🏁 Checking win conditions...');
    console.log('🎮 Game mode:', settings.gameMode);
    console.log('🔄 Current round:', currentRound);
    console.log('👤 Current player index:', currentPlayerIndex);
    
    const maxScore = Math.max(...players.map(p => p.score));
    
    // Check if we're at the start of a new round (currentPlayerIndex === 0)
    // This means all players have completed their turn in the previous round
    const isRoundComplete = currentPlayerIndex === 0;
    
    if (isRoundComplete) {
      console.log('✅ Round completed, checking win conditions...');
      
      if (settings.gameMode === 'points' && maxScore >= settings.targetScore) {
        console.log('🏆 Points win condition met!');
        endGame();
        return;
      }
      
      if (settings.gameMode === 'rounds' && currentRound > settings.maximumRounds) {
        console.log('🏆 Rounds win condition met!');
        endGame();
        return;
      }
      
      // Check if we're out of songs
      const availableSongs = songs.filter(song => !usedSongs.has(song.youtube_url));
      if (availableSongs.length === 0) {
        console.log('🏆 No more songs available!');
        endGame();
        return;
      }
    } else {
      console.log('⏳ Round not complete yet, continuing...');
    }
  };

  const endGame = () => {
    setGamePhase('winner');
  };

  const handlePlayAgain = () => {
    window.scrollTo(0, 0);
    // Reset game state
    setGamePhase('settings');
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setCurrentSong(null);
    setUsedSongs(new Set());
    setGameStartTime(null);
    
    // Reset player scores
    setPlayers(prev => prev.map(player => ({
      ...player,
      score: 0,
      artistPoints: 0,
      titlePoints: 0,
      yearPoints: 0,
      bonusPoints: 0,
      skipsUsed: 0
    })));

    // Reset skip counts
    const newPlayerSkips: { [playerId: number]: number } = {};
    players.forEach(player => {
      newPlayerSkips[player.id] = settings.skipsPerPlayer;
    });
    setPlayerSkips(newPlayerSkips);
  };

  const handleBackToMenu = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  const handleQuitGame = () => {
    setShowQuitConfirmation(true);
  };

  const confirmQuit = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  const cancelQuit = () => {
    setShowQuitConfirmation(false);
  };

  const handleBackToDashboard = () => {
    window.scrollTo(0, 0);
    setShowPlayerInterface(false);
  };

  // Loading state
  if (!songsLoaded && !loadingError) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>{getTranslation('back', currentLanguage)}</span>
            </button>
          </div>
          <div className="loading-message">
            {getTranslation('loadingSongs', currentLanguage)}
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
              <span>{getTranslation('back', currentLanguage)}</span>
            </button>
          </div>
          <div className="error-message">
            {loadingError}
          </div>
        </div>
      </div>
    );
  }

  // Winner Page
  if (gamePhase === 'winner') {
    const maxScore = Math.max(...players.map(p => p.score));
    const winners = players.filter(p => p.score === maxScore);
    
    const gameStats = {
      totalRounds: currentRound - 1,
      totalSongs: usedSongs.size,
      gameDuration: gameStartTime ? Math.floor((Date.now() - gameStartTime.getTime()) / 60000) : 0
    };

    return (
      <CompetitionWinnerPage
        currentLanguage={currentLanguage}
        winners={winners}
        allPlayers={players}
        gameSettings={settings}
        gameStats={gameStats}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Player Interface
  if (gamePhase === 'playing' && showPlayerInterface && currentSong) {
    const currentPlayer = players[currentPlayerIndex];
    
    return (
      <div className="game-session">
        <div className="game-session-container">
          {/* Header */}
          <div className="game-session-header">
          </div>

          {/* YouTube Player */}
          <CompetitionYouTubePlayer
            currentLanguage={currentLanguage}
            currentSong={currentSong}
            allSongs={songs}
            onScanAnother={handleFreeSkip}
            onSongListView={() => {}}
            songListViewCount={0}
            onTurnComplete={(scores) => {
              handleTurnComplete(scores);
              setShowPlayerInterface(false);
            }}
            onSkip={handleSkip}
            artistPoints={settings.artistPoints}
            titlePoints={settings.titlePoints}
            yearPoints={settings.yearPoints}
            bonusPoints={settings.bonusPoints}
            skipCost={settings.skipCost}
            skipsPerPlayer={settings.skipsPerPlayer}
            currentPlayerSkipsRemaining={playerSkips[currentPlayer.id] || 0}
            songListName={songList.name}
          />
        </div>
      </div>
    );
  }

  // Playing Phase
  if (gamePhase === 'playing' && currentSong) {
    const currentPlayer = players[currentPlayerIndex];
    
    return (
      <div className="game-session">
        <div className="game-session-container">
          {/* Header */}
          <div className="game-session-header">
            <button className="primary-button quit-game-button" onClick={handleQuitGame}>
              <X size={20} />
              <span>{getTranslation('quitGame', currentLanguage)}</span>
            </button>
          </div>

          {/* Game Indicators */}
          <div className="game-indicators-section">
            <div className="game-indicator-card">
              <div className="indicator-item">
                <span className="indicator-label">{getTranslation('gameMode', currentLanguage)}:</span>
                <span className="indicator-value">
                  {settings.gameMode === 'points' && `${getTranslation('pointsMode', currentLanguage)} (${settings.targetScore})`}
                  {settings.gameMode === 'time-based' && `${getTranslation('timeBasedMode', currentLanguage)} (${settings.gameDuration}m)`}
                  {settings.gameMode === 'rounds' && `${getTranslation('roundsMode', currentLanguage)} (${settings.maximumRounds})`}
                </span>
              </div>
              <div className="indicator-item">
                <span className="indicator-label">{getTranslation('songsPlayed', currentLanguage)}:</span>
                <span className="indicator-value">{usedSongs.size} / {songs.length}</span>
              </div>
            </div>
          </div>

          {/* Competition Player Section */}
          <div className="simple-player-section">
            {/* Current Player Header */}
            <div className="reveal-section-header">
              <h3 className="reveal-section-title">
                <Users size={24} />
                {currentPlayer.name || `${getTranslation('playerName', currentLanguage)} ${currentPlayer.id + 1}`} - {getTranslation('yourTurn', currentLanguage)}
              </h3>
            </div>

            {/* Game Info */}
            <div className="revealed-song-info">
              <div className="competition-game-info">
                <div className="game-info-row">
                  <span className="info-label">{getTranslation('round', currentLanguage)}:</span>
                  <span className="info-value">{currentRound}</span>
                </div>
                <div className="game-info-row">
                  <span className="info-label">{getTranslation('score', currentLanguage)}:</span>
                  <span className="info-value">{currentPlayer.score} {getTranslation('points', currentLanguage)}</span>
                </div>
                <div className="game-info-row">
                  <span className="info-label">{getTranslation('pointBreakdown', currentLanguage)}:</span>
                  <span className="info-value">
                    <span className="score-part artist">{getTranslation('artistPoints', currentLanguage)}: {currentPlayer.artistPoints}</span>
                    <span className="score-part title">{getTranslation('titlePoints', currentLanguage)}: {currentPlayer.titlePoints}</span>
                    <span className="score-part year">{getTranslation('yearPoints', currentLanguage)}: {currentPlayer.yearPoints}</span>
                    <span className="score-part bonus">{getTranslation('bonusPoints', currentLanguage)}: {currentPlayer.bonusPoints}</span>
                  </span>
                </div>
                <div className="game-info-row">
                  <span className="info-label">{getTranslation('skips', currentLanguage)}:</span>
                  <span className="info-value">{playerSkips[currentPlayer.id] || 0} {getTranslation('left', currentLanguage)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="primary-button"
                onClick={() => setShowPlayerInterface(true)}
              >
                <Play size={16} />
                <span>{getTranslation('go', currentLanguage)}!</span>
              </button>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="simple-player-section">
            <div className="reveal-section-header">
              <h3 className="reveal-section-title">
                <Trophy size={24} />
                {getTranslation('leaderboard', currentLanguage)}
              </h3>
            </div>

            <div className="revealed-song-info">
              <div className="leaderboard">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => {
                    const isCurrentPlayer = player.id === currentPlayer.id;
                    const isWinning = index === 0 && player.score > 0;
                    
                    return (
                      <div 
                        key={player.id} 
                        className={`leaderboard-row ${isCurrentPlayer ? 'current-player' : ''}`}
                      >
                        <div className="player-rank">
                          {isWinning ? (
                            <Crown size={20} className="crown-icon" />
                          ) : (
                            <span className="rank-number">#{index + 1}</span>
                          )}
                        </div>
                        <div className="player-details">
                          <div className="player-name">
                            {player.name || `${getTranslation('playerName', currentLanguage)} ${player.id + 1}`}
                          </div>
                          <div className="score-breakdown">
                            {player.artistPoints > 0 && (
                              <span className="score-part artist">{getTranslation('artistPoints', currentLanguage)}: {player.artistPoints}</span>
                            )}
                            {player.titlePoints > 0 && (
                              <span className="score-part title">{getTranslation('titlePoints', currentLanguage)}: {player.titlePoints}</span>
                            )}
                            {player.yearPoints > 0 && (
                              <span className="score-part year">{getTranslation('yearPoints', currentLanguage)}: {player.yearPoints}</span>
                            )}
                            {player.bonusPoints > 0 && (
                              <span className="score-part bonus">{getTranslation('bonusPoints', currentLanguage)}: {player.bonusPoints}</span>
                            )}
                            {player.artistPoints === 0 && player.titlePoints === 0 && player.yearPoints === 0 && player.bonusPoints === 0 && (
                              <span className="score-part no-points">{getTranslation('noPointsYet', currentLanguage)}</span>
                            )}
                          </div>
                        </div>
                        <div className="player-total-score">
                          {player.score}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Quit Confirmation Modal */}
        {showQuitConfirmation && (
          <div className="preview-overlay">
            <div className="quit-confirmation-modal">
              <div className="quit-modal-header">
                <h3 className="quit-modal-title">
                  {getTranslation('quitGameConfirmTitle', currentLanguage)}
                </h3>
              </div>
              
              <div className="quit-modal-content">
                <p className="quit-warning-text">
                  {getTranslation('quitGameWarning', currentLanguage)}
                </p>
                
                <div className="quit-modal-buttons">
                  <button className="cancel-quit-button" onClick={cancelQuit}>
                    <span>{getTranslation('cancel', currentLanguage)}</span>
                  </button>
                  <button className="confirm-quit-button" onClick={confirmQuit}>
                    <X size={16} />
                    <span>{getTranslation('quitGame', currentLanguage)}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Settings View
  return (
    <div className="game-session">
      <div className="competition-settings">
        {/* Header */}
        <div className="game-selection-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>{getTranslation('back', currentLanguage)}</span>
          </button>
          <h2 className="game-selection-title">
            {getTranslation('gameSettings', currentLanguage)}
          </h2>
        </div>

        {/* Game Mode Selection */}
        <div className="settings-section">
          <h3 className="section-title">{getTranslation('gameMode', currentLanguage)}</h3>
          <div className="game-mode-selection">
            <button
              className={`mode-button ${settings.gameMode === 'points' ? 'active' : ''}`}
              onClick={() => setSettings(prev => ({ ...prev, gameMode: 'points' }))}
            >
              {getTranslation('pointsMode', currentLanguage)}
            </button>
            <button
              className={`mode-button ${settings.gameMode === 'time-based' ? 'active' : ''}`}
              onClick={() => setSettings(prev => ({ ...prev, gameMode: 'time-based' }))}
            >
              {getTranslation('timeBasedMode', currentLanguage)}
            </button>
            <button
              className={`mode-button ${settings.gameMode === 'rounds' ? 'active' : ''}`}
              onClick={() => setSettings(prev => ({ ...prev, gameMode: 'rounds' }))}
            >
              {getTranslation('roundsMode', currentLanguage)}
            </button>
          </div>
          
          {/* Mode-specific settings */}
          <div className="mode-specific-settings">
            {settings.gameMode === 'points' && (
              <div className="setting-group">
                <label className="setting-label">{getTranslation('targetScorePoints', currentLanguage)}</label>
                <select
                  value={settings.targetScore}
                  onChange={(e) => setSettings(prev => ({ ...prev, targetScore: parseInt(e.target.value) }))}
                  className="points-dropdown"
                >
                  {[10, 15, 20, 25, 30, 40, 50].map(score => (
                    <option key={score} value={score}>
                      {score} {score === 1 ? getTranslation('point', currentLanguage) : getTranslation('points', currentLanguage)}
                    </option>
                  ))}
                </select>
                <p className="mode-rules">{getTranslation('pointsModeRules', currentLanguage)}</p>
              </div>
            )}
            
            {settings.gameMode === 'time-based' && (
              <div className="setting-group">
                <label className="setting-label">{getTranslation('gameDuration', currentLanguage)}</label>
                <select
                  value={settings.gameDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, gameDuration: parseInt(e.target.value) }))}
                  className="points-dropdown"
                >
                  {[15, 20, 30, 45, 60].map(duration => (
                    <option key={duration} value={duration}>
                      {duration} {duration === 1 ? getTranslation('minute', currentLanguage) : getTranslation('minutes', currentLanguage)}
                    </option>
                  ))}
                </select>
                <p className="mode-rules">{getTranslation('timeBasedRules', currentLanguage)}</p>
              </div>
            )}
            
            {settings.gameMode === 'rounds' && (
              <div className="setting-group">
                <label className="setting-label">{getTranslation('maximumRounds', currentLanguage)}</label>
                <select
                  value={settings.maximumRounds}
                  onChange={(e) => setSettings(prev => ({ ...prev, maximumRounds: parseInt(e.target.value) }))}
                  className="points-dropdown"
                >
                  {[5, 10, 15, 20, 25].map(rounds => (
                    <option key={rounds} value={rounds}>
                      {rounds} {rounds === 1 ? getTranslation('round', currentLanguage) : getTranslation('rounds', currentLanguage)}
                    </option>
                  ))}
                </select>
                <p className="mode-rules">{getTranslation('roundsModeRules', currentLanguage)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Game Rules Section */}
        <div className="rules-section">
          <h3 className="rules-title">{getTranslation('gameRules', currentLanguage)}</h3>
          <div className="rules-description">
            <p><strong>{getTranslation('gameplay', currentLanguage)}:</strong> {getTranslation('gameplayDescription', currentLanguage)}</p>
            
            <p><strong>{getTranslation('selectedMode', currentLanguage)}:</strong> 
              {settings.gameMode === 'points' && (
                <span> {getTranslation('pointsModeDescription', currentLanguage)} {settings.targetScore} {getTranslation('points', currentLanguage)} {getTranslation('wins', currentLanguage)}.</span>
              )}
              {settings.gameMode === 'time-based' && (
                <span> {getTranslation('timeBasedDescription', currentLanguage)} {settings.gameDuration} {getTranslation('minutes', currentLanguage)} {getTranslation('andCompletesRound', currentLanguage)}.</span>
              )}
              {settings.gameMode === 'rounds' && (
                <span> {getTranslation('roundsModeDescription', currentLanguage)} {settings.maximumRounds} {getTranslation('rounds', currentLanguage)}.</span>
              )}
            </p>
            
            <p><strong>{getTranslation('winningTies', currentLanguage)}:</strong> {getTranslation('winningDescription', currentLanguage)}</p>
            
            <p><strong>{getTranslation('skipSystem', currentLanguage)}:</strong> {getTranslation('skipDescription', currentLanguage)} {getTranslation('eachPlayerHas', currentLanguage)} {settings.skipsPerPlayer} {getTranslation('skips', currentLanguage)}{settings.skipCost > 0 && <span>, {getTranslation('costing', currentLanguage)} {settings.skipCost} {getTranslation('points', currentLanguage)} {getTranslation('each', currentLanguage)}</span>}.</p>
          </div>
        </div>

        {/* Number of Players */}
        <div className="settings-section">
          <h3 className="section-title">{getTranslation('numberOfPlayers', currentLanguage)}</h3>
          <div className="player-number-selection">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <button
                key={num}
                className={`player-number-button ${settings.numberOfPlayers === num ? 'active' : ''}`}
                onClick={() => setSettings(prev => ({ ...prev, numberOfPlayers: num }))}
              >
                {num}
              </button>
            ))}
          </div>
          <p className="setting-note">{getTranslation('minimum2Players', currentLanguage)}</p>
        </div>

        {/* Player Names */}
        <div className="settings-section">
          <h3 className="section-title">{getTranslation('playerNames', currentLanguage)}</h3>
          <div className="player-names-grid">
            {players.map((player, index) => (
              <div key={player.id} className="player-name-input">
                <label className="player-label">
                  {getTranslation('playerName', currentLanguage)} {index + 1}
                </label>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={getTranslation('enterPlayerName', currentLanguage)}
                  className="player-name-field"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Points System */}
        <div className="settings-section">
          <h3 className="section-title">{getTranslation('pointsSystem', currentLanguage)}</h3>
          <div className="points-grid">
            <div className="setting-group">
              <label className="setting-label">{getTranslation('artistCorrect', currentLanguage)}</label>
              <select
                value={settings.artistPoints}
                onChange={(e) => setSettings(prev => ({ ...prev, artistPoints: parseInt(e.target.value) }))}
                className="points-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {points === 1 ? getTranslation('point', currentLanguage) : getTranslation('points', currentLanguage)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="setting-group">
              <label className="setting-label">{getTranslation('titleCorrect', currentLanguage)}</label>
              <select
                value={settings.titlePoints}
                onChange={(e) => setSettings(prev => ({ ...prev, titlePoints: parseInt(e.target.value) }))}
                className="points-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {points === 1 ? getTranslation('point', currentLanguage) : getTranslation('points', currentLanguage)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="setting-group">
              <label className="setting-label">{getTranslation('yearCorrect', currentLanguage)}</label>
              <select
                value={settings.yearPoints}
                onChange={(e) => setSettings(prev => ({ ...prev, yearPoints: parseInt(e.target.value) }))}
                className="points-dropdown"
                disabled={!songs.some(song => song.year)}
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {points === 1 ? getTranslation('point', currentLanguage) : getTranslation('points', currentLanguage)}
                  </option>
                ))}
              </select>
              {!songs.some(song => song.year) && (
                <p className="setting-warning">{getTranslation('yearScoringDisabled', currentLanguage)}</p>
              )}
            </div>
            
            <div className="setting-group">
              <label className="setting-label">{getTranslation('bonusAllCorrect', currentLanguage)}</label>
              <select
                value={settings.bonusPoints}
                onChange={(e) => setSettings(prev => ({ ...prev, bonusPoints: parseInt(e.target.value) }))}
                className="points-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {points === 1 ? getTranslation('point', currentLanguage) : getTranslation('points', currentLanguage)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Skip Settings */}
        <div className="settings-section">
          <h3 className="section-title">{getTranslation('skipsSettings', currentLanguage)}</h3>
          <div className="skip-settings-grid">
            <div className="setting-group">
              <label className="setting-label">{getTranslation('skipsPerPlayer', currentLanguage)}</label>
              <select
                value={settings.skipsPerPlayer}
                onChange={(e) => setSettings(prev => ({ ...prev, skipsPerPlayer: parseInt(e.target.value) }))}
                className="skip-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(skips => (
                  <option key={skips} value={skips}>
                    {skips} {skips === 1 ? getTranslation('skipOption', currentLanguage) : getTranslation('skips', currentLanguage)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="setting-group">
              <label className="setting-label">{getTranslation('skipCost', currentLanguage)}</label>
              <select
                value={settings.skipCost}
                onChange={(e) => setSettings(prev => ({ ...prev, skipCost: parseInt(e.target.value) }))}
                className="skip-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(cost => (
                  <option key={cost} value={cost}>
                    {cost} {cost === 1 ? getTranslation('point', currentLanguage) : getTranslation('points', currentLanguage)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Start Game Section */}
        <div className="start-game-section">
          <button
            className="start-competition-button"
            onClick={startGame}
            disabled={validateSettings().length > 0}
          >
            <Trophy size={20} />
            <span>{getTranslation('startCompetition', currentLanguage)}</span>
          </button>
          
          {validateSettings().length > 0 && (
            <div className="validation-warning">
              <strong>{getTranslation('validationWarning', currentLanguage)}:</strong>
              <ul>
                {validateSettings().map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};