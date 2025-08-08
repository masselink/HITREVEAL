import React from 'react';
import { X, Users, Clock, Trophy } from 'lucide-react';
import { Language, CompetitionSettings, Song } from '../../types';
import { translations } from '../../data/translations';

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

interface CompetitionDashboardProps {
  currentLanguage: Language;
  settings: CompetitionSettings;
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  totalSongsPlayed: number;
  usedSongs: Song[];
  allSongs: Song[];
  gameStartTime: number;
  onQuitGame: () => void;
  onPlayerGo: () => void;
}

export const CompetitionDashboard: React.FC<CompetitionDashboardProps> = ({
  currentLanguage,
  settings,
  players,
  currentPlayerIndex,
  currentRound,
  totalSongsPlayed,
  usedSongs,
  allSongs,
  gameStartTime,
  onQuitGame,
  onPlayerGo
}) => {
  const currentPlayer = players[currentPlayerIndex];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  const getElapsedTime = () => {
    return Math.floor((Date.now() - gameStartTime) / 60000);
  };

  const getGameStatusText = () => {
    if (settings.gameMode === 'points') {
      return `${translations.targetScore[currentLanguage]}: ${settings.targetScore}`;
    } else if (settings.gameMode === 'time-based') {
      const elapsed = getElapsedTime();
      const remaining = Math.max(0, settings.gameDuration - elapsed);
      return `${remaining}m ${translations.left[currentLanguage]}`;
    } else if (settings.gameMode === 'rounds') {
      const remaining = Math.max(0, settings.maximumRounds - currentRound);
      return `${remaining} ${translations.rounds[currentLanguage]} ${translations.left[currentLanguage]}`;
    }
    return '';
  };

  return (
    <div className="competition-dashboard">
      {/* Header */}
      <div className="game-session-header">
        <button className="primary-button quit-game-button" onClick={onQuitGame}>
          <X size={20} />
          <span>{translations.quitGame[currentLanguage]}</span>
        </button>
      </div>

      {/* Game Status */}
      <div className="game-status-section">
        <div className="status-cards">
          <div className="status-card">
            <Users className="status-icon" size={24} />
            <div className="status-content">
              <div className="status-title">
                {translations.round[currentLanguage]} {currentRound}
              </div>
              <div className="status-subtitle">
                {totalSongsPlayed} {translations.songs[currentLanguage]} {translations.played[currentLanguage]}
              </div>
            </div>
          </div>
          
          <div className="status-card">
            <Clock className="status-icon" size={24} />
            <div className="status-content">
              <div className="status-title">
                {getGameStatusText()}
              </div>
              <div className="status-subtitle">
                {getElapsedTime()}m {translations.played[currentLanguage]}
              </div>
            </div>
          </div>
          
          <div className="status-card">
            <Trophy className="status-icon" size={24} />
            <div className="status-content">
              <div className="status-title">
                {allSongs.length - usedSongs.length} {translations.songs[currentLanguage]}
              </div>
              <div className="status-subtitle">
                {translations.left[currentLanguage]} / {allSongs.length} {translations.total[currentLanguage]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Player */}
      <div className="current-player-section">
        <div className="current-player-card">
          <div className="player-indicator">
            <div className="player-avatar">
              {(currentPlayer.name || `P${currentPlayer.id + 1}`).charAt(0).toUpperCase()}
            </div>
            <div className="player-info">
              <h3 className="player-name">
                {currentPlayer.name || `${translations.playerName[currentLanguage]} ${currentPlayer.id + 1}`}
              </h3>
              <p className="player-status">
                {translations.yourTurn[currentLanguage]}
              </p>
              <p className="player-skips">
                {currentPlayer.skipsUsed}/{settings.skipsPerPlayer} skips used
              </p>
            </div>
          </div>
          
          <button className="player-go-button" onClick={onPlayerGo}>
            GO!
          </button>
          
          <div className="player-score">
            <span className="score-value">{currentPlayer.score}</span>
            <span className="score-label">{translations.points[currentLanguage]}</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-section">
        <h3 className="leaderboard-title">
          {translations.leaderboard[currentLanguage]}
        </h3>
        
        <div className="leaderboard">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id} 
              className={`leaderboard-row ${player.id === currentPlayer.id ? 'current-player' : ''}`}
            >
              <div className="player-rank">
                <span className="rank-number">#{index + 1}</span>
              </div>
              <div className="player-details">
                <div className="player-name">
                  {player.name || `${translations.playerName[currentLanguage]} ${player.id + 1}`}
                </div>
                <div className="score-breakdown">
                  {player.artistPoints > 0 && (
                    <span className="score-part artist">A: {player.artistPoints}</span>
                  )}
                  {player.titlePoints > 0 && (
                    <span className="score-part title">T: {player.titlePoints}</span>
                  )}
                  {player.yearPoints > 0 && (
                    <span className="score-part year">Y: {player.yearPoints}</span>
                  )}
                  {player.bonusPoints > 0 && (
                    <span className="score-part bonus">B: {player.bonusPoints}</span>
                  )}
                  {player.artistPoints === 0 && player.titlePoints === 0 && player.yearPoints === 0 && player.bonusPoints === 0 && (
                    <span className="score-part no-points">No points yet</span>
                  )}
                </div>
              </div>
              <div className="player-total-score">
                {player.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};