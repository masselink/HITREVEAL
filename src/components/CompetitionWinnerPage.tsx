import React, { useEffect, useState } from 'react';
import { Trophy, Star, RotateCcw, Home, Crown, Clock, Music, Users } from 'lucide-react';
import { Language } from '../types';

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

interface GameSettings {
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

interface GameStats {
  totalRounds: number;
  totalSongs: number;
  gameDuration: number;
  wasSuddenDeath: boolean;
}

interface CompetitionWinnerPageProps {
  currentLanguage: Language;
  winners: Player[];
  allPlayers: Player[];
  gameSettings: GameSettings;
  gameStats: GameStats;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const CompetitionWinnerPage: React.FC<CompetitionWinnerPageProps> = ({
  currentLanguage,
  winners,
  allPlayers,
  gameSettings,
  gameStats,
  onPlayAgain,
  onBackToMenu
}) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const translations = {
    congratulations: { en: 'Congratulations!', es: '¡Felicitaciones!', fr: 'Félicitations!' },
    winner: { en: 'Winner', es: 'Ganador', fr: 'Gagnant' },
    winners: { en: 'Winners', es: 'Ganadores', fr: 'Gagnants' },
    gameStats: { en: 'Game Statistics', es: 'Estadísticas del Juego', fr: 'Statistiques du Jeu' },
    finalScores: { en: 'Final Scores', es: 'Puntuaciones Finales', fr: 'Scores Finaux' },
    totalRounds: { en: 'Total Rounds', es: 'Rondas Totales', fr: 'Manches Totales' },
    songsPlayed: { en: 'Songs Played', es: 'Canciones Jugadas', fr: 'Chansons Jouées' },
    gameDuration: { en: 'Game Duration', es: 'Duración del Juego', fr: 'Durée du Jeu' },
    suddenDeath: { en: 'Sudden Death Mode', es: 'Modo Muerte Súbita', fr: 'Mode Mort Subite' },
    minutes: { en: 'minutes', es: 'minutos', fr: 'minutes' },
    playAgain: { en: 'Play Again', es: 'Jugar de Nuevo', fr: 'Rejouer' },
    backToMenu: { en: 'Back to Menu', es: 'Volver al Menú', fr: 'Retour au Menu' },
    points: { en: 'points', es: 'puntos', fr: 'points' }
  };

  const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);

  return (
    <div className="winner-page">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#F25C7E', '#1E1E2F', '#f87ea0', '#2a2a3e'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </div>
      )}

      <div className="winner-content">
        {/* Winner Announcement */}
        <div className="winner-announcement">
          <div className="winner-trophy">
            <Trophy size={80} />
          </div>
          <h1 className="winner-title">
            {translations.congratulations[currentLanguage]}
          </h1>
          <h2 className="winner-subtitle">
            {winners.length === 1 
              ? translations.winner[currentLanguage]
              : translations.winners[currentLanguage]
            }
          </h2>
          
          <div className="winner-names">
            {winners.map((winner, index) => (
              <div key={winner.id} className="winner-card">
                <Crown size={24} />
                <span className="winner-name">{winner.name}</span>
                <span className="winner-score">{winner.score} {translations.points[currentLanguage]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Statistics */}
        <div className="game-statistics">
          <h3 className="stats-title">
            {translations.gameStats[currentLanguage]}
          </h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <Users size={24} />
              <div className="stat-content">
                <div className="stat-value">{gameStats.totalRounds}</div>
                <div className="stat-label">{translations.totalRounds[currentLanguage]}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <Music size={24} />
              <div className="stat-content">
                <div className="stat-value">{gameStats.totalSongs}</div>
                <div className="stat-label">{translations.songsPlayed[currentLanguage]}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <Clock size={24} />
              <div className="stat-content">
                <div className="stat-value">{gameStats.gameDuration}m</div>
                <div className="stat-label">{translations.gameDuration[currentLanguage]}</div>
              </div>
            </div>
            
            {gameStats.wasSuddenDeath && (
              <div className="stat-card sudden-death-stat">
                <Star size={24} />
                <div className="stat-content">
                  <div className="stat-value">!</div>
                  <div className="stat-label">{translations.suddenDeath[currentLanguage]}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Final Scores */}
        <div className="final-scores">
          <h3 className="scores-title">
            {translations.finalScores[currentLanguage]}
          </h3>
          
          <div className="scores-list">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`score-row ${winners.some(w => w.id === player.id) ? 'winner-row' : ''}`}
              >
                <div className="player-rank">
                  {index === 0 ? (
                    <Crown size={20} className="crown-icon" />
                  ) : (
                    <span className="rank-number">#{index + 1}</span>
                  )}
                </div>
                <div className="player-details">
                  <div className="player-name">{player.name}</div>
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
                  </div>
                </div>
                <div className="player-total-score">
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="winner-actions">
          <button className="play-again-button" onClick={onPlayAgain}>
            <RotateCcw size={20} />
            <span>{translations.playAgain[currentLanguage]}</span>
          </button>
          
          <button className="back-to-menu-button" onClick={onBackToMenu}>
            <Home size={20} />
            <span>{translations.backToMenu[currentLanguage]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};