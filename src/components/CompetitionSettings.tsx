import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Users, Target, Clock, Trophy, Zap } from 'lucide-react';
import { Language, SongList, CompetitionSettings as CompetitionSettingsType } from '../types';
import { translations } from '../data/translations';

interface CompetitionSettingsProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
  onStartCompetition: (settings: CompetitionSettingsType, playerNames: string[]) => void;
}

export const CompetitionSettings: React.FC<CompetitionSettingsProps> = ({
  currentLanguage,
  songList,
  onBack,
  onStartCompetition
}) => {
  const [numberOfPlayers, setNumberOfPlayers] = useState(2);
  const [gameMode, setGameMode] = useState<'points' | 'time-based' | 'rounds'>('points');
  const [targetScore, setTargetScore] = useState(15);
  const [gameDuration, setGameDuration] = useState(30);
  const [maximumRounds, setMaximumRounds] = useState(10);
  const [artistPoints, setArtistPoints] = useState(1);
  const [titlePoints, setTitlePoints] = useState(2);
  const [yearPoints, setYearPoints] = useState(1);
  const [bonusPoints, setBonusPoints] = useState(2);
  const [skipsPerPlayer, setSkipsPerPlayer] = useState(3);
  const [skipCost, setSkipCost] = useState(0);
  const [drawType, setDrawType] = useState<'highest-score' | 'multiple-winners' | 'sudden-death'>('sudden-death');
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [validationError, setValidationError] = useState<string>('');

  // Update player names array when number of players changes
  useEffect(() => {
    const newPlayerNames = Array(numberOfPlayers).fill('').map((_, index) => 
      playerNames[index] || `${translations.playerName?.[currentLanguage] || 'Player'} ${index + 1}`
    );
    setPlayerNames(newPlayerNames);
  }, [numberOfPlayers]);

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const validateSettings = (): boolean => {
    // Check if all player names are filled
    const emptyNames = playerNames.some(name => !name.trim());
    if (emptyNames) {
      setValidationError(translations.allPlayerNameRequired?.[currentLanguage] || 'All player names are required');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleStartCompetition = () => {
    if (!validateSettings()) {
      return;
    }

    const settings: CompetitionSettingsType = {
      numberOfPlayers,
      gameMode,
      targetScore,
      gameDuration,
      maximumRounds,
      artistPoints,
      titlePoints,
      yearPoints,
      bonusPoints,
      skipsPerPlayer,
      skipCost,
      drawType
    };

    onStartCompetition(settings, playerNames);
  };

  // Check if year scoring should be disabled (some songs missing year data)
  const hasIncompleteYearData = false; // This would need to be calculated from the song list

  return (
    <div className="competition-settings">
      <div className="competition-settings-container">
        {/* Header */}
        <div className="game-selection-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>{translations.back?.[currentLanguage] || 'Back'}</span>
          </button>
        </div>

        <h2 className="settings-title">
          {translations.gameSettings?.[currentLanguage] || 'Game Settings'}
        </h2>

        {/* Game Rules Section */}
        <div className="rules-section">
          <h3 className="rules-title">
            {translations.gameRules?.[currentLanguage] || 'Game Rules'}
          </h3>
          <p className="rules-description">
            {translations.rulesDescription?.[currentLanguage] || 'Players take turns guessing artist, title, and year. Points are awarded based on correct answers. The first player to reach the target score wins. In case of a tie, Sudden Death rounds determine the winner.'}
          </p>
        </div>

        {/* Player Settings */}
        <div className="settings-section">
          <h3 className="section-title">
            <Users size={20} />
            {translations.numberOfPlayers?.[currentLanguage] || 'Number of Players'}
          </h3>
          <div className="setting-group">
            <div className="player-number-selection">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  className={`player-number-button ${numberOfPlayers === num ? 'active' : ''}`}
                  onClick={() => setNumberOfPlayers(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            {numberOfPlayers === 1 && (
              <p className="setting-note">
                {translations.minimum2Players?.[currentLanguage] || 'Single player mode available'}
              </p>
            )}
          </div>
        </div>

        {/* Player Names */}
        <div className="settings-section">
          <h3 className="section-title">
            {translations.playerNames?.[currentLanguage] || 'Player Names'}
          </h3>
          <div className="player-names-grid">
            {playerNames.map((name, index) => (
              <div key={index} className="player-name-input">
                <label className="player-label">
                  {translations.playerName?.[currentLanguage] || 'Player'} {index + 1}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={translations.enterPlayerName?.[currentLanguage] || 'Enter player name'}
                  className="player-name-field"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Game Mode */}
        <div className="settings-section">
          <h3 className="section-title">
            <Target size={20} />
            {translations.gameMode?.[currentLanguage] || 'Game Mode'}
          </h3>
          <div className="game-mode-selection">
            <button
              className={`mode-button ${gameMode === 'points' ? 'active' : ''}`}
              onClick={() => setGameMode('points')}
            >
              {translations.pointsMode?.[currentLanguage] || 'Points'}
            </button>
            <button
              className={`mode-button ${gameMode === 'time-based' ? 'active' : ''}`}
              onClick={() => setGameMode('time-based')}
            >
              {translations.timeBasedMode?.[currentLanguage] || 'Time Based'}
            </button>
            <button
              className={`mode-button ${gameMode === 'rounds' ? 'active' : ''}`}
              onClick={() => setGameMode('rounds')}
            >
              {translations.roundsMode?.[currentLanguage] || 'Rounds'}
            </button>
          </div>

          <div className="mode-specific-settings">
            {gameMode === 'points' && (
              <>
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.targetScorePoints?.[currentLanguage] || 'Target Score'}
                  </label>
                  <select
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="points-dropdown"
                  >
                    {[10, 15, 20, 25, 30, 40, 50].map(score => (
                      <option key={score} value={score}>
                        {score} {translations.points?.[currentLanguage] || 'points'}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mode-rules">
                  {translations.pointsModeRules?.[currentLanguage] || 'First player to reach the target score wins.'}
                </p>
              </>
            )}

            {gameMode === 'time-based' && (
              <>
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.gameDuration?.[currentLanguage] || 'Game Duration (Minutes)'}
                  </label>
                  <select
                    value={gameDuration}
                    onChange={(e) => setGameDuration(Number(e.target.value))}
                    className="points-dropdown"
                  >
                    {[15, 20, 30, 45, 60].map(duration => (
                      <option key={duration} value={duration}>
                        {duration} {translations.minutes?.[currentLanguage] || 'minutes'}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mode-rules">
                  {translations.timeBasedRules?.[currentLanguage] || 'Game plays for the set duration and completes the current round when time expires.'}
                </p>
              </>
            )}

            {gameMode === 'rounds' && (
              <>
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.maximumRounds?.[currentLanguage] || 'Maximum Rounds'}
                  </label>
                  <select
                    value={maximumRounds}
                    onChange={(e) => setMaximumRounds(Number(e.target.value))}
                    className="points-dropdown"
                  >
                    {[5, 10, 15, 20, 25, 30].map(rounds => (
                      <option key={rounds} value={rounds}>
                        {rounds} {translations.rounds?.[currentLanguage] || 'rounds'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    {translations.drawType?.[currentLanguage] || 'Draw Type'}
                  </label>
                  <div className="game-mode-selection">
                    <button
                      className={`mode-button ${drawType === 'highest-score' ? 'active' : ''}`}
                      onClick={() => setDrawType('highest-score')}
                    >
                      {translations.highestScoreWins?.[currentLanguage] || 'Highest Score'}
                    </button>
                    <button
                      className={`mode-button ${drawType === 'multiple-winners' ? 'active' : ''}`}
                      onClick={() => setDrawType('multiple-winners')}
                    >
                      {translations.multipleWinners?.[currentLanguage] || 'Multiple Winners'}
                    </button>
                    <button
                      className={`mode-button ${drawType === 'sudden-death' ? 'active' : ''}`}
                      onClick={() => setDrawType('sudden-death')}
                    >
                      {translations.suddenDeath?.[currentLanguage] || 'Sudden Death'}
                    </button>
                  </div>
                </div>

                <p className="mode-rules">
                  {translations.roundsModeRules?.[currentLanguage] || 'Game ends after the specified number of rounds. Winner determined by draw type.'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Points System */}
        <div className="settings-section">
          <h3 className="section-title">
            <Trophy size={20} />
            {translations.pointsSystem?.[currentLanguage] || 'Points System'}
          </h3>
          <div className="points-grid">
            <div className="setting-group">
              <label className="setting-label">
                {translations.artistCorrect?.[currentLanguage] || 'Artist Correct'}
              </label>
              <select
                value={artistPoints}
                onChange={(e) => setArtistPoints(Number(e.target.value))}
                className="points-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {translations.points?.[currentLanguage] || 'points'}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                {translations.titleCorrect?.[currentLanguage] || 'Title Correct'}
              </label>
              <select
                value={titlePoints}
                onChange={(e) => setTitlePoints(Number(e.target.value))}
                className="points-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {translations.points?.[currentLanguage] || 'points'}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                {translations.yearCorrect?.[currentLanguage] || 'Year Correct'}
              </label>
              <select
                value={yearPoints}
                onChange={(e) => setYearPoints(Number(e.target.value))}
                className="points-dropdown"
                disabled={hasIncompleteYearData}
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {translations.points?.[currentLanguage] || 'points'}
                  </option>
                ))}
              </select>
              {hasIncompleteYearData && (
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
                value={bonusPoints}
                onChange={(e) => setBonusPoints(Number(e.target.value))}
                className="points-dropdown"
                disabled={hasIncompleteYearData}
              >
                {[0, 1, 2, 3, 4, 5].map(points => (
                  <option key={points} value={points}>
                    {points} {translations.points?.[currentLanguage] || 'points'}
                  </option>
                ))}
              </select>
              {hasIncompleteYearData && (
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
            <Zap size={20} />
            {translations.skipsSettings?.[currentLanguage] || 'Skip Settings'}
          </h3>
          <div className="skip-settings-grid">
            <div className="setting-group">
              <label className="setting-label">
                {translations.skipsPerPlayer?.[currentLanguage] || 'Skips per Player'}
              </label>
              <select
                value={skipsPerPlayer}
                onChange={(e) => setSkipsPerPlayer(Number(e.target.value))}
                className="skip-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(skips => (
                  <option key={skips} value={skips}>
                    {skips}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                {translations.skipCost?.[currentLanguage] || 'Skip Cost (Points)'}
              </label>
              <select
                value={skipCost}
                onChange={(e) => setSkipCost(Number(e.target.value))}
                className="skip-dropdown"
              >
                {[0, 1, 2, 3, 4, 5].map(cost => (
                  <option key={cost} value={cost}>
                    {cost} {translations.points?.[currentLanguage] || 'points'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="validation-warning">
            {validationError}
          </div>
        )}

        {/* Start Game */}
        <div className="start-game-section">
          <button
            className="start-competition-button"
            onClick={handleStartCompetition}
            disabled={!!validationError}
          >
            <Play size={24} />
            <span>{translations.startCompetition?.[currentLanguage] || 'Start Competition'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};