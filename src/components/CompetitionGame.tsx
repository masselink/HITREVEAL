import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown, Users, Target, Clock, RotateCcw } from 'lucide-react';
import { Language, SongList } from '../types';
import { translations } from '../data/translations';

interface Player {
  id: number;
  name: string;
  score: number;
  skipsUsed: number;
}

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  gameMode: 'points' | 'time-based' | 'rounds';
  targetScore: number;
  gameDuration: number; // in minutes
  maximumRounds: number;
  timeRemaining: number; // in seconds
  isGameActive: boolean;
  isSuddenDeath: boolean;
  suddenDeathPlayers: Player[];
  winners: Player[];
  gameStartTime: number;
  songsUsed: number;
  totalSongs: number;
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
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: 1, name: 'Player 1', score: 15, skipsUsed: 0 },
      { id: 2, name: 'Player 2', score: 15, skipsUsed: 1 },
      { id: 3, name: 'Player 3', score: 12, skipsUsed: 0 }
    ],
    currentPlayerIndex: 0,
    currentRound: 5,
    gameMode: 'points',
    targetScore: 15,
    gameDuration: 30,
    maximumRounds: 10,
    timeRemaining: 1800, // 30 minutes in seconds
    isGameActive: true,
    isSuddenDeath: false,
    suddenDeathPlayers: [],
    winners: [],
    gameStartTime: Date.now(),
    songsUsed: 45,
    totalSongs: 50
  });

  const [showNoMoreTurnsWarning, setShowNoMoreTurnsWarning] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);

  // Check for winners and game end conditions
  useEffect(() => {
    checkForWinners();
  }, [gameState.players, gameState.currentRound, gameState.timeRemaining]);

  // Timer for time-based mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState.gameMode === 'time-based' && gameState.isGameActive && gameState.timeRemaining > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.gameMode, gameState.isGameActive, gameState.timeRemaining]);

  // Check if there are enough songs for another full round
  const canPlayAnotherRound = () => {
    const songsLeft = gameState.totalSongs - gameState.songsUsed;
    const playersCount = gameState.isSuddenDeath ? gameState.suddenDeathPlayers.length : gameState.players.length;
    return songsLeft >= playersCount;
  };

  const checkForWinners = () => {
    if (!gameState.isGameActive) return;

    const { players, gameMode, targetScore, maximumRounds, currentRound, timeRemaining } = gameState;
    
    // Points mode: Check if anyone reached target score
    if (gameMode === 'points') {
      const playersAtTarget = players.filter(p => p.score >= targetScore);
      if (playersAtTarget.length > 0) {
        handleGameEnd();
        return;
      }
    }
    
    // Time-based mode: Check if time is up
    if (gameMode === 'time-based' && timeRemaining <= 0) {
      handleGameEnd();
      return;
    }
    
    // Rounds mode: Check if maximum rounds reached
    if (gameMode === 'rounds' && currentRound >= maximumRounds) {
      handleGameEnd();
      return;
    }
  };

  const handleGameEnd = () => {
    const activePlayers = gameState.isSuddenDeath ? gameState.suddenDeathPlayers : gameState.players;
    const highestScore = Math.max(...activePlayers.map(p => p.score));
    const topPlayers = activePlayers.filter(p => p.score === highestScore);
    
    // If there's a tie and we can play another round, start sudden death
    if (topPlayers.length > 1 && canPlayAnotherRound() && !gameState.isSuddenDeath) {
      setGameState(prev => ({
        ...prev,
        isSuddenDeath: true,
        suddenDeathPlayers: topPlayers,
        isGameActive: true
      }));
      return;
    }
    
    // If in sudden death and still tied, but can't play another round
    if (gameState.isSuddenDeath && topPlayers.length > 1 && !canPlayAnotherRound()) {
      // Declare all tied players as winners
      setGameState(prev => ({
        ...prev,
        winners: topPlayers,
        isGameActive: false
      }));
      setShowWinnerScreen(true);
      return;
    }
    
    // If in sudden death and there's a clear winner
    if (gameState.isSuddenDeath && topPlayers.length === 1) {
      setGameState(prev => ({
        ...prev,
        winners: topPlayers,
        isGameActive: false
      }));
      setShowWinnerScreen(true);
      return;
    }
    
    // Regular game end - declare winners
    setGameState(prev => ({
      ...prev,
      winners: topPlayers,
      isGameActive: false
    }));
    setShowWinnerScreen(true);
  };

  const handleNoMoreTurnsOkay = () => {
    setShowNoMoreTurnsWarning(false);
  };

  const handlePlayAgain = () => {
    // Reset game state for new game
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => ({ ...p, score: 0, skipsUsed: 0 })),
      currentPlayerIndex: 0,
      currentRound: 1,
      timeRemaining: prev.gameDuration * 60,
      isGameActive: true,
      isSuddenDeath: false,
      suddenDeathPlayers: [],
      winners: [],
      gameStartTime: Date.now(),
      songsUsed: 0
    }));
    setShowWinnerScreen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Winner Screen
  if (showWinnerScreen) {
    const isMultipleWinners = gameState.winners.length > 1;
    const isTie = isMultipleWinners;
    
    return (
      <div className="competition-game">
        <div className="winner-screen">
          <div className="winner-container">
            <div className="winner-header">
              <div className="winner-icon">
                {isTie ? <Users size={64} /> : <Trophy size={64} />}
              </div>
              <h1 className="winner-title">
                {isTie 
                  ? (translations.tie?.[currentLanguage] || 'It\'s a Tie!')
                  : (gameState.winners.length === 1 
                    ? (translations.winner?.[currentLanguage] || 'Winner!')
                    : (translations.winners?.[currentLanguage] || 'Winners!')
                  )
                }
              </h1>
            </div>
            
            <div className="winner-players">
              {gameState.winners.map((winner, index) => (
                <div key={winner.id} className="winner-player">
                  <div className="winner-player-icon">
                    {!isTie && <Crown size={32} />}
                  </div>
                  <div className="winner-player-info">
                    <h2 className="winner-player-name">{winner.name}</h2>
                    <p className="winner-player-score">{winner.score} {translations.points?.[currentLanguage] || 'points'}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="winner-stats">
              <div className="winner-stat">
                <Target size={20} />
                <span>{translations.round?.[currentLanguage] || 'Round'} {gameState.currentRound}</span>
              </div>
              {gameState.gameMode === 'time-based' && (
                <div className="winner-stat">
                  <Clock size={20} />
                  <span>{formatTime(gameState.gameDuration * 60 - gameState.timeRemaining)}</span>
                </div>
              )}
            </div>
            
            <div className="winner-actions">
              <button className="play-again-button" onClick={handlePlayAgain}>
                <RotateCcw size={20} />
                <span>{translations.playAgain?.[currentLanguage] || 'Play Again'}</span>
              </button>
              <button className="back-to-menu-button" onClick={onBack}>
                <ArrowLeft size={20} />
                <span>{translations.backToMenu?.[currentLanguage] || 'Back to Menu'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="competition-game">
      <div className="competition-game-container">
        <div className="competition-header">
          <button onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
            <span>{translations.back[currentLanguage]}</span>
          </button>
          <h1 className="competition-title">
            {translations.competitionGame[currentLanguage]}
            {gameState.isSuddenDeath && (
              <span className="sudden-death-indicator">
                - {translations.suddenDeath?.[currentLanguage] || 'SUDDEN DEATH'}
              </span>
            )}
          </h1>
        </div>

        <div className="competition-content">
          {gameState.isSuddenDeath && (
            <div className="sudden-death-banner">
              <div className="sudden-death-content">
                <Trophy size={24} />
                <div>
                  <h3>{translations.suddenDeath?.[currentLanguage] || 'SUDDEN DEATH'}</h3>
                  <p>{translations.suddenDeathDesc?.[currentLanguage] || 'Players with highest score play additional rounds until there is a single winner.'}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="game-status">
            <div className="status-item">
              <span>{translations.round?.[currentLanguage] || 'Round'}: {gameState.currentRound}</span>
            </div>
            {gameState.gameMode === 'time-based' && (
              <div className="status-item">
                <Clock size={16} />
                <span>{formatTime(gameState.timeRemaining)}</span>
              </div>
            )}
            <div className="status-item">
              <span>{translations.songsUsed?.[currentLanguage] || 'Songs'}: {gameState.songsUsed}/{gameState.totalSongs}</span>
            </div>
          </div>
          
          <div className="players-list">
            {(gameState.isSuddenDeath ? gameState.suddenDeathPlayers : gameState.players).map((player, index) => (
              <div key={player.id} className={`player-card ${index === gameState.currentPlayerIndex ? 'active' : ''}`}>
                <div className="player-info">
                  <h3>{player.name}</h3>
                  <p>{player.score} {translations.points?.[currentLanguage] || 'points'}</p>
                </div>
                {index === gameState.currentPlayerIndex && (
                  <div className="current-turn">
                    {translations.yourTurn?.[currentLanguage] || 'Your Turn'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* No More Turns Warning Modal */}
        {showNoMoreTurnsWarning && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{translations.noMoreTurns?.[currentLanguage] || 'No More Turns'}</h3>
              <p>
                {translations.noMoreTurnsMessage?.[currentLanguage] || 
                'There are not enough songs left in the list for all players to have another turn. The winner will be decided based on the last completed full round.'}
              </p>
              <div className="modal-actions">
                <button 
                  onClick={handleNoMoreTurnsOkay}
                  className="primary-button"
                >
                  {translations.okay?.[currentLanguage] || 'Okay'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};