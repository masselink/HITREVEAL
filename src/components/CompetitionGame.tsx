import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { Language, SongList, Song } from '../types';
import { translations } from '../data/translations';
import Papa from 'papaparse';

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
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string>('');
  const [hasYearData, setHasYearData] = useState(true);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [settings, setSettings] = useState<CompetitionSettings>({
    numberOfPlayers: 2,
    gameMode: 'points',
    targetScore: 100,
    gameDuration: 30,
    maximumRounds: 10,
    artistPoints: 1,
    titlePoints: 2,
    yearPoints: 1,
    bonusPoints: 2,
    skipsPerPlayer: 3,
    skipCost: 5
  });

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
    return playerNames.every(name => name.trim() !== '');
  };

  const handleStartGame = () => {
    if (canStartGame()) {
      // TODO: Start the actual competition game
      console.log('Starting competition with settings:', settings, 'players:', playerNames);
    }
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

        {/* Game Rules */}
        <div className="rules-section">
          <h3 className="rules-title">
            {translations.gameRules?.[currentLanguage] || 'Game Rules'}
          </h3>
          <p className="rules-description">
            {translations.rulesDescription?.[currentLanguage] || 'Players take turns guessing artist, title, and year. Points are awarded based on correct answers. The first player to reach the target score wins. In case of a tie, Sudden Death rounds determine the winner.'}
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
                  {[50, 75, 100, 125, 150, 200, 250, 300].map(score => (
                    <option key={score} value={score}>{score} {translations.points?.[currentLanguage] || 'points'}</option>
                  ))}
                </select>
                <p className="mode-rules">
                  {translations.pointsModeRules?.[currentLanguage] || 'First player to reach the target score wins.'}
                </p>
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
                <p className="mode-rules">
                  {translations.timeBasedRules?.[currentLanguage] || 'Game plays for the set duration and completes the current round when time expires.'}
                </p>
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
                  {[5, 10, 15, 20, 25, 30].map(rounds => (
                    <option key={rounds} value={rounds}>{rounds} {translations.rounds?.[currentLanguage] || 'rounds'}</option>
                  ))}
                </select>
                <p className="mode-rules">
                  {translations.roundsModeRules?.[currentLanguage] || 'Game ends after the specified number of rounds. Winner determined by draw type.'}
                </p>
              </div>
            )}
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
          
          {!canStartGame() && (
            <div className="validation-warning">
              {translations.allPlayerNameRequired?.[currentLanguage] || 'All player names are required'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};