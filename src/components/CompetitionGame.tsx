import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, X, List, Crown, Clock, Target, Music, Users } from 'lucide-react';
import { Language, SongList, Song } from '../types';
import { CompetitionYouTubePlayer } from './CompetitionYouTubePlayer';
import Papa from 'papaparse';

import { CompetitionWinnerPage } from './CompetitionWinnerPage';

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

interface GameState {
  currentRound: number;
  songsPlayed: number;
  currentPlayerIndex: number;
  usedSongs: Set<number>;
  gameStartTime: number;
  isGameActive: boolean;
  gameEnded: boolean;
  winners: Player[];
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
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string>('');
  const [hasYearData, setHasYearData] = useState(true);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [settings, setSettings] = useState<CompetitionSettings>({
    numberOfPlayers: 2,
    gameMode: 'points',
    targetScore: 50,
    gameDuration: 20,
    maximumRounds: 5,
    artistPoints: 1,
    titlePoints: 2,
    yearPoints: 1,
    bonusPoints: 2,
    skipsPerPlayer: 2,
    skipCost: 3
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    songsPlayed: 0,
    currentPlayerIndex: 0,
    usedSongs: new Set(),
    gameStartTime: 0,
    isGameActive: false,
    gameEnded: false,
    winners: []
  });
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showPlayerPage, setShowPlayerPage] = useState(false);
  const [showWinnerPage, setShowWinnerPage] = useState(false);
  const [showNoSongsModal, setShowNoSongsModal] = useState(false);

  // Load songs and check year data
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
              row.youtube_url && 
              row.title && 
              row.artist
            );
            
            // Check if all songs have year data
            const allHaveYear = validData.every(song => 
              song.year && song.year.toString().trim() !== ''
            );
            
            setSongs(validData);
            setHasYearData(allHaveYear);
            setSongsLoaded(true);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoadingError('Failed to load songs');
          }
        });
      } catch (err) {
        console.error('Error loading songs:', err);
        setLoadingError('Failed to load songs');
      }
    };

    loadSongs();
  }, [songList]);

  // Initialize player names when number changes
  useEffect(() => {
    const newNames = Array(settings.numberOfPlayers).fill('').map((_, index) => 
      playerNames[index] || ''
    );
    setPlayerNames(newNames);
  }, [settings.numberOfPlayers]);

  const handlePlayerNumberChange = (number: number) => {
    setSettings(prev => ({ ...prev, numberOfPlayers: number }));
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleGameModeChange = (mode: 'points' | 'time-based' | 'rounds') => {
    setSettings(prev => ({ ...prev, gameMode: mode }));
  };

  const handleSettingChange = (key: keyof CompetitionSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const canStartGame = () => {
    const validationErrors = getValidationMessage();
    return validationErrors.length === 0;
  };

  const getRequiredSongs = () => {
    if (settings.gameMode === 'rounds') {
      // For rounds mode, need enough songs for all rounds
      return settings.maximumRounds * settings.numberOfPlayers;
    } else {
      // For points and time-based modes, need at least one full round
      return settings.numberOfPlayers;
    }
  };

  const getValidationMessage = () => {
    const validationErrors: string[] = [];
    
    // Check player names
    if (!playerNames.every(name => name.trim() !== '')) {
      validationErrors.push(translations.allPlayerNameRequired?.[currentLanguage] || 'All player names are required');
    }
    
    // Check song requirements
    const requiredSongs = getRequiredSongs();
    if (songs.length < requiredSongs) {
      let songValidationMessage = '';
      if (settings.gameMode === 'rounds') {
        songValidationMessage = `Not enough songs available for ${settings.maximumRounds} rounds with ${settings.numberOfPlayers} players. Each player needs 1 song per round, so you need ${requiredSongs} songs total. Currently available: ${songs.length} songs.`;
      } else {
        songValidationMessage = `Not enough songs available for all ${settings.numberOfPlayers} players to have at least 1 turn. You need ${requiredSongs} songs minimum. Currently available: ${songs.length} songs.`;
      }
      validationErrors.push(songValidationMessage);
    }
    
    return validationErrors;
  };

  const handleStartGame = () => {
    if (canStartGame()) {
      // Randomly select starting player
      const randomStartingPlayer = Math.floor(Math.random() * settings.numberOfPlayers);
      
      // Initialize players
      const initialPlayers: Player[] = playerNames.map((name, index) => ({
        id: index,
        name: name.trim() || `Player ${index + 1}`,
        score: 0,
        artistPoints: 0,
        titlePoints: 0,
        yearPoints: 0,
        bonusPoints: 0,
        skipsUsed: 0
      }));
      
      setPlayers(initialPlayers);
      setGameState({
        currentRound: 1,
        songsPlayed: 0,
        currentPlayerIndex: randomStartingPlayer,
        usedSongs: new Set(),
        gameStartTime: Date.now(),
        isGameActive: true,
        isSuddenDeath: false,
        suddenDeathPlayers: [],
        gameEnded: false,
        winners: []
      });
      setGameStarted(true);
    }
  };

  const handlePlayerGo = () => {
    // Select a random song that hasn't been used
    let availableSongs = songs.filter((_, index) => !gameState.usedSongs.has(index));
    
    if (availableSongs.length === 0) {
      // No more songs available - check if we're in sudden death
      if (gameState.isSuddenDeath) {
        // Declare all tied players as winners
        const tiedPlayers = players.filter(p => gameState.suddenDeathPlayers.includes(p.id));
        setGameState(prev => ({
          ...prev,
          gameEnded: true,
          winners: tiedPlayers,
          isGameActive: false
        }));
        setShowNoSongsModal(true);
      }
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const selectedSong = availableSongs[randomIndex];
    
    // Find the original index to mark as used
    const originalIndex = songs.findIndex(song => song === selectedSong);
    
    setCurrentSong(selectedSong);
    setShowPlayerPage(true);
    
    // Mark song as used
    setGameState(prev => ({
      ...prev,
      usedSongs: new Set([...prev.usedSongs, originalIndex]),
    }));
  };

  const handleBackToDashboard = () => {
    setShowPlayerPage(false);
    setCurrentSong(null);
    
    // Check for winners before moving to next player
    checkForWinners();
  };

  const checkForWinners = () => {
    const totalTurnsPlayed = gameState.songsPlayed + 1;
    const shouldIncrementRound = totalTurnsPlayed % (gameState.isSuddenDeath ? gameState.suddenDeathPlayers.length : settings.numberOfPlayers) === 0;
    
    // Check win conditions based on game mode
    let hasWinner = false;
    let winners: Player[] = [];
    
    if (settings.gameMode === 'points') {
      // Check if any player reached target score
      const playersAtTarget = players.filter(p => p.score >= settings.targetScore);
      if (playersAtTarget.length > 0) {
        hasWinner = true;
        const maxScore = Math.max(...playersAtTarget.map(p => p.score));
        winners = playersAtTarget.filter(p => p.score === maxScore);
      }
    } else if (settings.gameMode === 'time-based') {
      // Check if time is up and round is complete
      const elapsed = Math.floor((Date.now() - gameState.gameStartTime) / 1000 / 60);
      if (elapsed >= settings.gameDuration && shouldIncrementRound) {
        hasWinner = true;
        const maxScore = Math.max(...players.map(p => p.score));
        const tiedPlayers = players.filter(p => p.score === maxScore);
        winners = tiedPlayers;
      }
    } else if (settings.gameMode === 'rounds') {
      // Check if maximum rounds reached and round is complete
      const nextRound = shouldIncrementRound ? gameState.currentRound + 1 : gameState.currentRound;
      if (nextRound > settings.maximumRounds) {
        hasWinner = true;
        const maxScore = Math.max(...players.map(p => p.score));
        const tiedPlayers = players.filter(p => p.score === maxScore);
        winners = tiedPlayers;
      }
    }
    
    if (hasWinner) {
      if (winners.length === 1) {
        // Single winner
        setGameState(prev => ({
          ...prev,
          gameEnded: true,
          winners: winners,
          isGameActive: false
        }));
        setShowWinnerPage(true);
      } else if (winners.length > 1) {
        // Multiple winners - check draw type
        if (settings.drawType === 'multiple-winners') {
          // Accept multiple winners
          setGameState(prev => ({
            ...prev,
            gameEnded: true,
            winners: winners,
            isGameActive: false
          }));
          setShowWinnerPage(true);
        } else if (settings.drawType === 'sudden-death') {
          // Start sudden death mode
          if (!gameState.isSuddenDeath) {
            setGameState(prev => ({
              ...prev,
              isSuddenDeath: true,
              suddenDeathPlayers: winners.map(p => p.id),
              currentPlayerIndex: winners[0].id
            }));
          }
          moveToNextPlayer();
        } else {
          // Highest score wins (default)
          setGameState(prev => ({
            ...prev,
            gameEnded: true,
            winners: settings.drawType === 'multiple-winners' ? winners : [winners[0]],
            isGameActive: false
          }));
          setShowWinnerPage(true);
        }
      } else {
        moveToNextPlayer();
      }
    } else {
      moveToNextPlayer();
    }
  };

  const moveToNextPlayer = () => {
    const totalTurnsPlayed = gameState.songsPlayed + 1;
    const playersInGame = gameState.isSuddenDeath ? gameState.suddenDeathPlayers : Array.from({length: settings.numberOfPlayers}, (_, i) => i);
    
    // Find current player index in the active players array
    const currentIndexInGame = playersInGame.indexOf(gameState.currentPlayerIndex);
    const nextIndexInGame = (currentIndexInGame + 1) % playersInGame.length;
    const nextPlayerIndex = playersInGame[nextIndexInGame];
    
    const shouldIncrementRound = totalTurnsPlayed % playersInGame.length === 0;
    
    setGameState(prev => ({
      ...prev,
      currentPlayerIndex: nextPlayerIndex,
      currentRound: shouldIncrementRound ? prev.currentRound + 1 : prev.currentRound,
      songsPlayed: totalTurnsPlayed
    }));
  };

  const handleTurnComplete = (scoreDetails: { 
    artist: boolean; 
    title: boolean; 
    year: boolean;
    artistPoints: number;
    titlePoints: number;
    yearPoints: number;
    bonusPoints: number;
    totalPoints: number;
  }) => {
    console.log('🎮 GAME DASHBOARD - TURN COMPLETE RECEIVED!');
    console.log('📊 SCORE DETAILS RECEIVED:', scoreDetails);
    
    const currentPlayerId = gameState.currentPlayerIndex;
    console.log('👤 CURRENT PLAYER INDEX:', currentPlayerId);
    console.log('👥 PLAYERS BEFORE UPDATE:', players);
    
    // Update the player's score
    setPlayers(prev => {
      const updatedPlayers = prev.map((player, index) => 
        index === currentPlayerId
          ? {
              ...player,
              score: player.score + (scoreDetails.totalPoints || 0),
              artistPoints: player.artistPoints + scoreDetails.artistPoints,
              titlePoints: player.titlePoints + scoreDetails.titlePoints,
              yearPoints: player.yearPoints + scoreDetails.yearPoints,
              bonusPoints: player.bonusPoints + scoreDetails.bonusPoints
            }
          : player
      );
      console.log('✅ UPDATED PLAYERS:', updatedPlayers);
      return updatedPlayers;
    });
    
    // Small delay to ensure state updates before going back
    setTimeout(() => {
      console.log('🔄 RETURNING TO DASHBOARD');
      handleBackToDashboard();
    }, 100);
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

  const getGameStatusText = () => {
    if (settings.gameMode === 'points') {
      return `${settings.targetScore} ${translations.points?.[currentLanguage] || 'points'}`;
    } else if (settings.gameMode === 'time-based') {
      return `${settings.gameDuration} ${translations.minutes?.[currentLanguage] || 'minutes'}`;
    } else {
      return `${settings.maximumRounds} ${translations.rounds?.[currentLanguage] || 'rounds'}`;
    }
  };

  const getRemainingTime = () => {
    if (settings.gameMode !== 'time-based' || !gameState.isGameActive) return null;
    
    const elapsed = Math.floor((Date.now() - gameState.gameStartTime) / 1000 / 60);
    const remaining = Math.max(0, settings.gameDuration - elapsed);
    return remaining;
  };

  const getCurrentPlayer = () => {
    return players.find(p => p.id === gameState.currentPlayerIndex);
  };

  const getLeaderboard = () => {
    return [...players].sort((a, b) => b.score - a.score);
  };

  const translations = {
    back: { en: 'Back', es: 'Atrás', fr: 'Retour' },
    loadingSongs: { en: 'Loading songs...', es: 'Cargando canciones...', fr: 'Chargement des chansons...' },
    quitGame: { en: 'Quit Game', es: 'Salir del juego', fr: 'Quitter le jeu' },
    suddenDeath: { en: 'Sudden death', es: 'MUERTE SÚBITA', fr: 'MORT SUBITE' },
    noMoreSongs: { en: 'No More Songs Available', es: 'No hay más canciones disponibles', fr: 'Plus de chansons disponibles' },
    noMoreSongsMessage: { en: 'There are no more songs left to continue the game. All tied players are declared winners!', es: 'No quedan más canciones para continuar el juego. ¡Todos los jugadores empatados son declarados ganadores!', fr: 'Il n\'y a plus de chansons pour continuer le jeu. Tous les joueurs à égalité sont déclarés gagnants!' },
    viewResults: { en: 'View Results', es: 'Ver Resultados', fr: 'Voir les Résultats' },
    minutes: { en: 'minutes', es: 'minutos', fr: 'minutes' },
    round: { en: 'Round', es: 'Ronda', fr: 'Manche' },
    songsTotal: { en: 'songs', es: 'canciones', fr: 'chansons' },
    played: { en: 'played', es: 'jugadas', fr: 'jouées' },
    targetScore: { en: 'Target Score', es: 'Puntuación objetivo', fr: 'Score cible' },
    gameDuration: { en: 'Game Duration', es: 'Duración del juego', fr: 'Durée du jeu' },
    maximumRounds: { en: 'Maximum Rounds', es: 'Rondas máximas', fr: 'Manches maximum' },
    left: { en: 'left', es: 'restantes', fr: 'restantes' },
    total: { en: 'total', es: 'total', fr: 'total' },
    yourTurn: { en: 'Your Turn', es: 'Tu turno', fr: 'Votre tour' },
    points: { en: 'points', es: 'puntos', fr: 'points' },
    leaderboard: { en: 'Leaderboard', es: 'Clasificación', fr: 'Classement' },
    quitGameConfirmTitle: { en: 'Quit Game?', es: '¿Salir del juego?', fr: 'Quitter le jeu?' },
    quitGameWarning: { en: 'Are you sure you want to quit this game? Your current progress will be lost.', es: '¿Estás seguro de que quieres salir de este juego? Se perderá tu progreso actual.', fr: 'Êtes-vous sûr de vouloir quitter ce jeu? Votre progression actuelle sera perdue.' },
    cancel: { en: 'Cancel', es: 'Cancelar', fr: 'Annuler' },
    gameSettings: { en: 'Game Settings', es: 'Configuración del juego', fr: 'Paramètres du jeu' },
    gameMode: { en: 'Game Mode', es: 'Modo de juego', fr: 'Mode de jeu' },
    pointsMode: { en: 'Points', es: 'Puntos', fr: 'Points' },
    timeBasedMode: { en: 'Time Based', es: 'Basado en tiempo', fr: 'Basé sur le temps' },
    roundsMode: { en: 'Rounds', es: 'Rondas', fr: 'Manches' },
    targetScorePoints: { en: 'Target Score', es: 'Puntuación objetivo', fr: 'Score cible' },
    pointsModeRules: { en: 'First player to reach the target score wins.', es: 'El primer jugador en alcanzar la puntuación objetivo gana.', fr: 'Le premier joueur à atteindre le score cible gagne.' },
    timeBasedRules: { en: 'Game plays for the set duration and completes the current round when time expires.', es: 'El juego se juega durante la duración establecida y completa la ronda actual cuando expira el tiempo.', fr: 'Le jeu se joue pendant la durée définie et termine le tour en cours lorsque le temps expire.' },
    rounds: { en: 'rounds', es: 'rondas', fr: 'manches' },
    roundsModeRules: { en: 'Game ends after the specified number of rounds. Winner determined by draw type.', es: 'El juego termina después del número especificado de rondas. El ganador se determina por tipo de empate.', fr: 'Le jeu se termine après le nombre spécifié de manches. Le gagnant est déterminé par le type d\'égalité.' },
    gameRules: { en: 'Game Rules', es: 'Reglas del juego', fr: 'Règles du jeu' },
    rulesDescription: { en: 'Players take turns guessing artist, title, and year. Points are awarded based on correct answers. The first player to reach the target score wins. In case of a tie, Sudden Death rounds determine the winner.', es: 'Los jugadores se turnan para adivinar artista, título y año. Se otorgan puntos basados en respuestas correctas. El primer jugador en alcanzar la puntuación objetivo gana. En caso de empate, las rondas de Muerte Súbita determinan el ganador.', fr: 'Les joueurs devinent à tour de rôle l\'artiste, le titre et l\'année. Les points sont attribués en fonction des bonnes réponses. Le premier joueur à atteindre le score cible gagne. En cas d\'égalité, les manches de Mort Subite déterminent le gagnant.' },
    numberOfPlayers: { en: 'Number of Players', es: 'Número de jugadores', fr: 'Nombre de joueurs' },
    playerNames: { en: 'Player Names', es: 'Nombres de jugadores', fr: 'Noms des joueurs' },
    playerName: { en: 'Player', es: 'Jugador', fr: 'Joueur' },
    enterPlayerName: { en: 'Enter player name', es: 'Ingresa el nombre del jugador', fr: 'Entrez le nom du joueur' },
    pointsSystem: { en: 'Points System', es: 'Sistema de puntos', fr: 'Système de points' },
    artistCorrect: { en: 'Artist Correct', es: 'Artista correcto', fr: 'Artiste correct' },
    titleCorrect: { en: 'Title Correct', es: 'Título correcto', fr: 'Titre correct' },
    yearCorrect: { en: 'Year Correct', es: 'Año correcto', fr: 'Année correcte' },
    bonusAllCorrect: { en: 'Bonus (All Correct)', es: 'Bonus (Todo correcto)', fr: 'Bonus (Tout correct)' },
    yearScoringDisabled: { en: 'Year scoring disabled - some songs missing year data', es: 'Puntuación de año deshabilitada - algunas canciones no tienen datos de año', fr: 'Score d\'année désactivé - certaines chansons manquent de données d\'année' },
    bonusRequiresYear: { en: 'Bonus requires year data', es: 'El bonus requiere datos de año', fr: 'Le bonus nécessite des données d\'année' },
    skipsSettings: { en: 'Skip Settings', es: 'Configuración de saltos', fr: 'Paramètres de saut' },
    skipsPerPlayer: { en: 'Skips per Player', es: 'Saltos por jugador', fr: 'Sauts par joueur' },
    skipCost: { en: 'Skip Cost (Points)', es: 'Costo de salto (Puntos)', fr: 'Coût de saut (Points)' },
    startCompetition: { en: 'Start Competition', es: 'Iniciar competencia', fr: 'Commencer la compétition' },
    allPlayerNameRequired: { en: 'All player names are required', es: 'Se requieren todos los nombres de jugadores', fr: 'Tous les noms de joueurs sont requis' }
  };

  if (!songsLoaded && !loadingError) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>{translations.back?.[currentLanguage] || 'Back'}</span>
            </button>
          </div>
          <div className="loading-message">
            {translations.loadingSongs?.[currentLanguage] || 'Loading songs...'}
          </div>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>{translations.back?.[currentLanguage] || 'Back'}</span>
            </button>
          </div>
          <div className="error-message">
            {loadingError}
          </div>
        </div>
      </div>
    );
  }

  // Show Winner Page
  if (showWinnerPage) {
    return (
      <CompetitionWinnerPage
        currentLanguage={currentLanguage}
        winners={gameState.winners}
        allPlayers={players}
        gameSettings={settings}
        gameStats={{
          totalRounds: gameState.currentRound,
          totalSongs: gameState.songsPlayed,
          gameDuration: Math.floor((Date.now() - gameState.gameStartTime) / 1000 / 60),
          wasSuddenDeath: gameState.isSuddenDeath
        }}
        onPlayAgain={() => {
          // Reset game state
          setGameStarted(false);
          setShowWinnerPage(false);
          setGameState({
            currentRound: 1,
            songsPlayed: 0,
            currentPlayerIndex: 0,
            usedSongs: new Set(),
            gameStartTime: 0,
            isGameActive: false,
            isSuddenDeath: false,
            suddenDeathPlayers: [],
            gameEnded: false,
            winners: []
          });
        }}
        onBackToMenu={onBack}
      />
    );
  }

  // Game Dashboard View
  if (gameStarted) {
    // Show Player Page
    if (showPlayerPage && currentSong) {
      return (
        <div className="game-session">
          <div className="game-session-container">
            {/* Header */}
            <div className="game-session-header">
              <button className="primary-button game-session-title-button" disabled>
                {getCurrentPlayer()?.name}'s Turn
              </button>
            </div>

            {/* Competition YouTube Player */}
            <div className="simple-player-section">
              <CompetitionYouTubePlayer
                currentLanguage={currentLanguage}
                currentSong={currentSong}
                allSongs={songs}
                onScanAnother={handleBackToDashboard}
                onSongListView={() => {}}
                songListViewCount={0}
                onTurnComplete={handleTurnComplete}
                artistPoints={settings.artistPoints}
                titlePoints={settings.titlePoints}
                yearPoints={settings.yearPoints}
                bonusPoints={settings.bonusPoints}
                skipCost={settings.skipCost}
                onGuess={(guessType, isCorrect) => {
                  console.log(`Player guessed ${guessType}: ${isCorrect ? 'correct' : 'incorrect'}`);
                }}
                onSkip={() => {
                  console.log('Player skipped the song');
                  handleBackToDashboard();
                }}
              />
            </div>
          </div>

          {/* Quit Confirmation Modal */}
          {showQuitConfirmation && (
            <div className="preview-overlay">
              <div className="quit-confirmation-modal">
                <div className="quit-modal-header">
                  <h3 className="quit-modal-title">
                    {translations.quitGameConfirmTitle?.[currentLanguage] || 'Quit Game?'}
                  </h3>
                </div>
                
                <div className="quit-modal-content">
                  <p className="quit-warning-text">
                    {translations.quitGameWarning?.[currentLanguage] || 'Are you sure you want to quit this game? Your current progress will be lost.'}
                  </p>
                  
                  <div className="quit-modal-buttons">
                    <button className="cancel-quit-button" onClick={cancelQuit}>
                      <span>{translations.cancel?.[currentLanguage] || 'Cancel'}</span>
                    </button>
                    <button className="confirm-quit-button" onClick={confirmQuit}>
                      <X size={16} />
                      <span>{translations.quitGame?.[currentLanguage] || 'Quit Game'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show Dashboard
    const currentPlayer = getCurrentPlayer();
    const leaderboard = getLeaderboard();
    const remainingTime = getRemainingTime();
    const availableSongs = songs.length - gameState.usedSongs.size;

    return (
      <div className="game-session">
        <div className="competition-dashboard">
          {/* Header */}
          <div className="game-session-header">
            {gameState.isSuddenDeath && (
              <button className="sudden-death-indicator">
                <span>{translations.suddenDeath?.[currentLanguage] || 'Sudden Death'}</span>
              </button>
            )}
            <button className="primary-button quit-game-button" onClick={handleQuitGame}>
              <X size={20} />
              <span>{translations.quitGame?.[currentLanguage] || 'Quit Game'}</span>
            </button>
          </div>

          {/* Game Status */}
          <div className="game-status-section">
            <div className="status-cards">
              <div className="status-card">
                <div className="status-icon">
                  <Users size={24} />
                </div>
                <div className="status-content">
                  <div className="status-title">
                    {translations.round?.[currentLanguage] || 'Round'} {gameState.currentRound}
                  </div>
                  <div className="status-subtitle">
                    {gameState.songsPlayed} {translations.songsTotal?.[currentLanguage] || 'songs'} {translations.played?.[currentLanguage] || 'played'}
                  </div>
                </div>
              </div>

              <div className="status-card">
                <div className="status-icon">
                  <Music size={24} />
                </div>
                <div className="status-content">
                  <div className="status-title">
                    {availableSongs} {translations.songsTotal?.[currentLanguage] || 'songs'} {translations.left?.[currentLanguage] || 'left'}
                  </div>
                  <div className="status-subtitle">
                    {songs.length} {translations.total?.[currentLanguage] || 'total'} {translations.songsTotal?.[currentLanguage] || 'songs'}
                  </div>
                </div>
              </div>

              <div className="status-card">
                <div className="status-icon">
                  <Clock size={24} />
                </div>
                <div className="status-content">
                  <div className="status-title">
                    {Math.floor((Date.now() - gameState.gameStartTime) / 1000 / 60)}m {Math.floor(((Date.now() - gameState.gameStartTime) / 1000) % 60)}s
                  </div>
                  <div className="status-subtitle">
                    Time Played
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
                  {currentPlayer?.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <h3 className="player-name">{currentPlayer?.name}</h3>
                  <p className="player-status">
                    {translations.yourTurn?.[currentLanguage] || 'Your Turn'}
                  </p>
                  <p className="player-skips">
                    {currentPlayer?.skipsUsed || 0} / {settings.skipsPerPlayer} skips
                  </p>
                </div>
              </div>
              <button className="player-go-button" onClick={handlePlayerGo}>
                GO
              </button>
              <div className="player-score">
                <span className="score-value">{currentPlayer?.score ?? 0}</span>
                <span className="score-label">{translations.points?.[currentLanguage] || 'points'}</span>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="leaderboard-section">
            <h3 className="leaderboard-title">
              {translations.leaderboard?.[currentLanguage] || 'Leaderboard'}
            </h3>
            <div className="leaderboard">
              {leaderboard.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`leaderboard-row ${player.id === currentPlayer?.id ? 'current-player' : ''}`}
                >
                  <div className="player-rank">
                    {player.score === leaderboard[0].score ? (
                      <Crown size={20} className="crown-icon" />
                    ) : (
                      <span className="rank-number">#{leaderboard.findIndex(p => p.score < player.score) + 1 || leaderboard.length}</span>
                    )}
                  </div>
                  <div className="player-details">
                    <div className="player-name">{player.name}</div>
                    <div className="score-breakdown">
                      {player.artistPoints > 0 && (
                        <span className="score-part artist">
                          A: {player.artistPoints}
                        </span>
                      )}
                      {player.titlePoints > 0 && (
                        <span className="score-part title">
                          T: {player.titlePoints}
                        </span>
                      )}
                      {player.yearPoints > 0 && (
                        <span className="score-part year">
                          Y: {player.yearPoints}
                        </span>
                      )}
                      {player.bonusPoints > 0 && (
                        <span className="score-part bonus">
                          B: {player.bonusPoints}
                        </span>
                      )}
                     {player.score === 0 && (
                       <span className="score-part no-points">
                         No points yet
                       </span>
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

        {/* Quit Confirmation Modal */}
        {showQuitConfirmation && (
          <div className="preview-overlay">
            <div className="quit-confirmation-modal">
              <div className="quit-modal-header">
                <h3 className="quit-modal-title">
                  {translations.quitGameConfirmTitle?.[currentLanguage] || 'Quit Game?'}
                </h3>
              </div>
              
              <div className="quit-modal-content">
                <p className="quit-warning-text">
                  {translations.quitGameWarning?.[currentLanguage] || 'Are you sure you want to quit this game? Your current progress will be lost.'}
                </p>
                
                <div className="quit-modal-buttons">
                  <button className="cancel-quit-button" onClick={cancelQuit}>
                    <span>{translations.cancel?.[currentLanguage] || 'Cancel'}</span>
                  </button>
                  <button className="confirm-quit-button" onClick={confirmQuit}>
                    <X size={16} />
                    <span>{translations.quitGame?.[currentLanguage] || 'Quit Game'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No More Songs Modal */}
        {showNoSongsModal && (
          <div className="preview-overlay">
            <div className="quit-confirmation-modal">
              <div className="quit-modal-header">
                <h3 className="quit-modal-title">
                  {translations.noMoreSongs?.[currentLanguage] || 'No More Songs Available'}
                </h3>
              </div>
              
              <div className="quit-modal-content">
                <p className="quit-warning-text">
                  {translations.noMoreSongsMessage?.[currentLanguage] || 'There are no more songs left to continue the game. All tied players are declared winners!'}
                </p>
                
                <div className="quit-modal-buttons">
                  <button className="confirm-quit-button" onClick={() => {
                    setShowNoSongsModal(false);
                    setShowWinnerPage(true);
                  }}>
                    <span>{translations.viewResults?.[currentLanguage] || 'View Results'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Settings View (existing code)
  return (
    <div className="game-session">
      <div className="competition-settings">
        {/* Header */}
        <div className="game-session-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>{translations.back?.[currentLanguage] || 'Back'}</span>
          </button>
        </div>

        <h2 className="settings-title">
          {translations.gameSettings?.[currentLanguage] || 'Game Settings'}
        </h2>

        {/* Game Mode */}
        <div className="settings-section">
          <h3 className="section-title">
            {translations.gameMode?.[currentLanguage] || 'Game Mode'}
          </h3>
          <div className="game-mode-selection">
            <button
              className={`mode-button ${settings.gameMode === 'points' ? 'active' : ''}`}
              onClick={() => handleGameModeChange('points')}
            >
              {translations.pointsMode?.[currentLanguage] || 'Points'}
            </button>
            <button
              className={`mode-button ${settings.gameMode === 'time-based' ? 'active' : ''}`}
              onClick={() => handleGameModeChange('time-based')}
            >
              {translations.timeBasedMode?.[currentLanguage] || 'Time Based'}
            </button>
            <button
              className={`mode-button ${settings.gameMode === 'rounds' ? 'active' : ''}`}
              onClick={() => handleGameModeChange('rounds')}
            >
              {translations.roundsMode?.[currentLanguage] || 'Rounds'}
            </button>
          </div>

          {/* Mode-specific settings */}
          <div className="mode-specific-settings">
            {settings.gameMode === 'points' && (
              <div className="setting-group">
                <label className="setting-label">
                  {translations.targetScorePoints?.[currentLanguage] || 'Target Score'}
                </label>
                <select
                  className="points-dropdown"
                  value={settings.targetScore}
                  onChange={(e) => handleSettingChange('targetScore', parseInt(e.target.value))}
                >
                  {[25, 50, 75, 100, 125, 150, 200, 250, 300].map(score => (
                    <option key={score} value={score}>{score} {translations.points?.[currentLanguage] || 'points'}</option>
                  ))}
                </select>
              </div>
            )}

            {settings.gameMode === 'time-based' && (
              <div className="setting-group">
                <label className="setting-label">
                  {translations.gameDuration?.[currentLanguage] || 'Game Duration (Minutes)'}
                </label>
                <select
                  className="points-dropdown"
                  value={settings.gameDuration}
                  onChange={(e) => handleSettingChange('gameDuration', parseInt(e.target.value))}
                >
                  {[15, 20, 30, 45, 60, 90].map(duration => (
                    <option key={duration} value={duration}>{duration} {translations.minutes?.[currentLanguage] || 'minutes'}</option>
                  ))}
                </select>
              </div>
            )}

            {settings.gameMode === 'rounds' && (
              <div className="setting-group">
                <label className="setting-label">
                  {translations.maximumRounds?.[currentLanguage] || 'Maximum Rounds'}
                </label>
                <select
                  className="points-dropdown"
                  value={settings.maximumRounds}
                  onChange={(e) => handleSettingChange('maximumRounds', parseInt(e.target.value))}
                >
                  {[2, 5, 10, 15, 20, 25, 30].map(rounds => (
                    <option key={rounds} value={rounds}>{rounds} {translations.rounds?.[currentLanguage] || 'rounds'}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

        </div>

        {/* Game Rules */}
        <div className="rules-section">
          <h3 className="rules-title">
            {translations.gameRules?.[currentLanguage] || 'Game Rules'}
          </h3>
          <p className="rules-description">
            <strong>{translations.gameplay?.[currentLanguage] || 'Gameplay'}:</strong> {translations.gameplayDescription?.[currentLanguage] || 'Players take turns listening to songs and guessing the artist, title, and year. Each player gets one song per turn, and points are awarded based on correct answers.'}
            <br /><br />
            <strong>{translations.selectedMode?.[currentLanguage] || 'Selected Mode'}:</strong> {' '}
            {settings.gameMode === 'points' && (
              <>
                <strong>{translations.pointsMode?.[currentLanguage] || 'Points'}</strong> - {translations.pointsModeDescription?.[currentLanguage] || 'First player to reach'} {settings.targetScore} {translations.points?.[currentLanguage] || 'points'} {translations.wins?.[currentLanguage] || 'wins'}.
              </>
            )}
            {settings.gameMode === 'time-based' && (
              <>
                <strong>{translations.timeBasedMode?.[currentLanguage] || 'Time Based'}</strong> - {translations.timeBasedDescription?.[currentLanguage] || 'Game plays for'} {settings.gameDuration} {translations.minutes?.[currentLanguage] || 'minutes'} {translations.andCompletesRound?.[currentLanguage] || 'and completes the current round when time expires'}.
              </>
            )}
            {settings.gameMode === 'rounds' && (
              <>
                <strong>{translations.roundsMode?.[currentLanguage] || 'Rounds'}</strong> - {translations.roundsModeDescription?.[currentLanguage] || 'Game ends after'} {settings.maximumRounds} {translations.rounds?.[currentLanguage] || 'rounds'}.
              </>
            )}
            <br /><br />
            <strong>{translations.winningTies?.[currentLanguage] || 'Winning & Ties'}:</strong> {translations.winningDescription?.[currentLanguage] || 'The player with the highest score wins. In case of ties, all tied players are declared winners.'}
            {settings.skipsPerPlayer > 0 && (
              <>
                <br /><br />
                <strong>{translations.skipSystem?.[currentLanguage] || 'Skip System'}:</strong> {translations.skipDescription?.[currentLanguage] || 'Players can skip songs they don\'t know, but this may cost points and is limited per player.'} {translations.eachPlayerHas?.[currentLanguage] || 'Each player has'} {settings.skipsPerPlayer} {translations.skips?.[currentLanguage] || 'skips'}{settings.skipCost > 0 && ` ${translations.costing?.[currentLanguage] || 'costing'} ${settings.skipCost} ${translations.points?.[currentLanguage] || 'points'} ${translations.each?.[currentLanguage] || 'each'}`}.
              </>
            )}
          </p>
        </div>

        {/* Number of Players */}
        <div className="settings-section">
          <h3 className="section-title">
            {translations.numberOfPlayers?.[currentLanguage] || 'Number of Players'}
          </h3>
          <div className="setting-group">
            <div className="player-number-selection">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(number => (
                <button
                  key={number}
                  className={`player-number-button ${settings.numberOfPlayers === number ? 'active' : ''}`}
                  onClick={() => handlePlayerNumberChange(number)}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>

          {/* Player Names */}
          <div className="setting-group">
            <div className="setting-label">
              {translations.playerNames?.[currentLanguage] || 'Player Names'}
            </div>
            <div className="player-names-grid">
              {Array(settings.numberOfPlayers).fill(0).map((_, index) => (
                <div key={index} className="player-name-input">
                  <label className="player-label">
                    {translations.playerName?.[currentLanguage] || 'Player'} {index + 1}
                  </label>
                  <input
                    type="text"
                    className="player-name-field"
                    placeholder={translations.enterPlayerName?.[currentLanguage] || 'Enter player name'}
                    value={playerNames[index] || ''}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Points System */}
        <div className="settings-section">
          <h3 className="section-title">
            {translations.pointsSystem?.[currentLanguage] || 'Points System'}
          </h3>
          <div className="points-grid">
            <div className="setting-group">
              <label className="setting-label">
                {translations.artistCorrect?.[currentLanguage] || 'Artist Correct'}
              </label>
              <select
                className="points-dropdown"
                value={settings.artistPoints}
                onChange={(e) => handleSettingChange('artistPoints', parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>{points} {translations.points?.[currentLanguage] || 'points'}</option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                {translations.titleCorrect?.[currentLanguage] || 'Title Correct'}
              </label>
              <select
                className="points-dropdown"
                value={settings.titlePoints}
                onChange={(e) => handleSettingChange('titlePoints', parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>{points} {translations.points?.[currentLanguage] || 'points'}</option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                {translations.yearCorrect?.[currentLanguage] || 'Year Correct'}
              </label>
              <select
                className="points-dropdown"
                value={settings.yearPoints}
                onChange={(e) => handleSettingChange('yearPoints', parseInt(e.target.value))}
                disabled={!hasYearData}
              >
                {[1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>{points} {translations.points?.[currentLanguage] || 'points'}</option>
                ))}
              </select>
              {!hasYearData && (
                <p className="setting-warning">
                  {translations.yearScoringDisabled?.[currentLanguage] || 'Year scoring disabled - some songs missing year data'}
                </p>
              )}
            </div>

            <div className="setting-group">
              <label className="setting-label">
                {translations.bonusAllCorrect?.[currentLanguage] || 'Bonus (All Correct)'}
              </label>
              <select
                className="points-dropdown"
                value={settings.bonusPoints}
                onChange={(e) => handleSettingChange('bonusPoints', parseInt(e.target.value))}
                disabled={!hasYearData}
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>{points} {translations.points?.[currentLanguage] || 'points'}</option>
                ))}
              </select>
              {!hasYearData && (
                <p className="setting-warning">
                  {translations.bonusRequiresYear?.[currentLanguage] || 'Bonus requires year data'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skip Settings */}
        <div className="settings-section">
          <h3 className="section-title">
            {translations.skipsSettings?.[currentLanguage] || 'Skip Settings'}
          </h3>
          <div className="skip-settings-grid">
            <div className="setting-group">
              <label className="setting-label">
                {translations.skipsPerPlayer?.[currentLanguage] || 'Skips per Player'}
              </label>
              <select
                className="skip-dropdown"
                value={settings.skipsPerPlayer}
                onChange={(e) => handleSettingChange('skipsPerPlayer', parseInt(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map(skips => (
                  <option key={skips} value={skips}>{skips}</option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                {translations.skipCost?.[currentLanguage] || 'Skip Cost (Points)'}
              </label>
              <select
                className="skip-dropdown"
                value={settings.skipCost}
                onChange={(e) => handleSettingChange('skipCost', parseInt(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5, 10].map(cost => (
                  <option key={cost} value={cost}>{cost} {translations.points?.[currentLanguage] || 'points'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Start Game */}
        <div className="start-game-section">
          <button
            className="start-competition-button"
            onClick={handleStartGame}
            disabled={!canStartGame()}
          >
            <Play size={20} />
            <span>{translations.startCompetition?.[currentLanguage] || 'Start Competition'}</span>
          </button>
          
          {!canStartGame() && getValidationMessage().length > 0 && (
            <div className="validation-warning">
              <div className="validation-title">Please fix the following issues:</div>
              {getValidationMessage().map((error, index) => (
                <div key={index} className="validation-item">
                  <span className="validation-bullet">•</span>
                  <span className="validation-text">{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};