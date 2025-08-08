import React from 'react';
import { Play } from 'lucide-react';
import { Language, SongList, CompetitionSettings as CompetitionSettingsType } from '../../types';
import { translations } from '../../data/translations';

interface CompetitionSettingsProps {
  currentLanguage: Language;
  songList: SongList;
  settings: CompetitionSettingsType;
  onSettingsChange: (settings: CompetitionSettingsType) => void;
  onStartGame: () => void;
  validationError: string;
}

export const CompetitionSettings: React.FC<CompetitionSettingsProps> = ({
  currentLanguage,
  songList,
  settings,
  onSettingsChange,
  onStartGame,
  validationError
}) => {
  const updateSettings = (updates: Partial<CompetitionSettingsType>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updatePlayerName = (index: number, name: string) => {
    const newPlayerNames = [...settings.playerNames];
    newPlayerNames[index] = name;
    updateSettings({ playerNames: newPlayerNames });
  };

  const isFormValid = () => {
    return settings.playerNames.slice(0, settings.numberOfPlayers).every(name => name.trim() !== '');
  };

  return (
    <div className="competition-settings">
      <h2 className="settings-title">
        {translations.gameSettings[currentLanguage]}
      </h2>

      {/* Game Mode Section */}
      <div className="settings-section">
        <h3 className="section-title">{translations.gameMode[currentLanguage]}</h3>
        
        <div className="game-mode-selection">
          <button
            className={`mode-button ${settings.gameMode === 'points' ? 'active' : ''}`}
            onClick={() => updateSettings({ gameMode: 'points' })}
          >
            {translations.pointsMode[currentLanguage]}
          </button>
          <button
            className={`mode-button ${settings.gameMode === 'time-based' ? 'active' : ''}`}
            onClick={() => updateSettings({ gameMode: 'time-based' })}
          >
            {translations.timeBasedMode[currentLanguage]}
          </button>
          <button
            className={`mode-button ${settings.gameMode === 'rounds' ? 'active' : ''}`}
            onClick={() => updateSettings({ gameMode: 'rounds' })}
          >
            {translations.roundsMode[currentLanguage]}
          </button>
        </div>

        {/* Mode-specific settings */}
        <div className="mode-specific-settings">
          {settings.gameMode === 'points' && (
            <div className="setting-group">
              <label className="setting-label">{translations.targetScorePoints[currentLanguage]}</label>
              <select
                className="points-dropdown"
                value={settings.targetScore}
                onChange={(e) => updateSettings({ targetScore: parseInt(e.target.value) })}
              >
                {[10, 15, 20, 25, 30, 40, 50].map(score => (
                  <option key={score} value={score}>{score} {translations.points[currentLanguage]}</option>
                ))}
              </select>
              <div className="mode-rules">
                {translations.pointsModeRules[currentLanguage]}
              </div>
            </div>
          )}

          {settings.gameMode === 'time-based' && (
            <div className="setting-group">
              <label className="setting-label">{translations.gameDuration[currentLanguage]}</label>
              <select
                className="points-dropdown"
                value={settings.gameDuration}
                onChange={(e) => updateSettings({ gameDuration: parseInt(e.target.value) })}
              >
                {[5, 10, 15, 20, 30, 45, 60].map(duration => (
                  <option key={duration} value={duration}>{duration} {translations.minutes[currentLanguage]}</option>
                ))}
              </select>
              <div className="mode-rules">
                {translations.timeBasedRules[currentLanguage]}
              </div>
            </div>
          )}

          {settings.gameMode === 'rounds' && (
            <div className="setting-group">
              <label className="setting-label">{translations.maximumRounds[currentLanguage]}</label>
              <select
                className="points-dropdown"
                value={settings.maximumRounds}
                onChange={(e) => updateSettings({ maximumRounds: parseInt(e.target.value) })}
              >
                {[5, 10, 15, 20, 25, 30].map(rounds => (
                  <option key={rounds} value={rounds}>{rounds} {translations.rounds[currentLanguage]}</option>
                ))}
              </select>
              <div className="mode-rules">
                {translations.roundsModeRules[currentLanguage]}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Number of Players */}
      <div className="settings-section">
        <h3 className="section-title">{translations.numberOfPlayers[currentLanguage]}</h3>
        <div className="player-number-selection">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button
              key={num}
              className={`player-number-button ${settings.numberOfPlayers === num ? 'active' : ''}`}
              onClick={() => updateSettings({ 
                numberOfPlayers: num,
                playerNames: Array(num).fill('').map((_, i) => settings.playerNames[i] || '')
              })}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="setting-note">
          {translations.minimum2Players[currentLanguage]}
        </div>
      </div>

      {/* Player Names */}
      <div className="settings-section">
        <h3 className="section-title">{translations.playerNames[currentLanguage]}</h3>
        <div className="player-names-grid">
          {Array.from({ length: settings.numberOfPlayers }, (_, i) => (
            <div key={i} className="player-name-input">
              <label className="player-label">
                {translations.playerName[currentLanguage]} {i + 1}
              </label>
              <input
                type="text"
                className="player-name-field"
                placeholder={translations.enterPlayerName[currentLanguage]}
                value={settings.playerNames[i] || ''}
                onChange={(e) => updatePlayerName(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Points System */}
      <div className="settings-section">
        <h3 className="section-title">{translations.pointsSystem[currentLanguage]}</h3>
        <div className="points-grid">
          <div className="setting-group">
            <label className="setting-label">{translations.titleCorrect[currentLanguage]}</label>
            <select
              className="points-dropdown"
              value={settings.titlePoints}
              onChange={(e) => updateSettings({ titlePoints: parseInt(e.target.value) })}
            >
              {[0, 1, 2, 3, 4, 5].map(points => (
                <option key={points} value={points}>{points} {translations.points[currentLanguage]}</option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label className="setting-label">{translations.artistCorrect[currentLanguage]}</label>
            <select
              className="points-dropdown"
              value={settings.artistPoints}
              onChange={(e) => updateSettings({ artistPoints: parseInt(e.target.value) })}
            >
              {[0, 1, 2, 3, 4, 5].map(points => (
                <option key={points} value={points}>{points} {translations.points[currentLanguage]}</option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label className="setting-label">{translations.yearCorrect[currentLanguage]}</label>
            <select
              className="points-dropdown"
              value={settings.yearPoints}
              onChange={(e) => updateSettings({ yearPoints: parseInt(e.target.value) })}
            >
              {[0, 1, 2, 3, 4, 5].map(points => (
                <option key={points} value={points}>{points} {translations.points[currentLanguage]}</option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label className="setting-label">{translations.bonusAllCorrect[currentLanguage]}</label>
            <select
              className="points-dropdown"
              value={settings.bonusPoints}
              onChange={(e) => updateSettings({ bonusPoints: parseInt(e.target.value) })}
            >
              {[0, 1, 2, 3, 4, 5].map(points => (
                <option key={points} value={points}>{points} {translations.points[currentLanguage]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Skip Settings */}
      <div className="settings-section">
        <h3 className="section-title">{translations.skipsSettings[currentLanguage]}</h3>
        <div className="skip-settings-grid">
          <div className="setting-group">
            <label className="setting-label">{translations.skipsPerPlayer[currentLanguage]}</label>
            <select
              className="skip-dropdown"
              value={settings.skipsPerPlayer}
              onChange={(e) => updateSettings({ skipsPerPlayer: parseInt(e.target.value) })}
            >
              {[0, 1, 2, 3, 4, 5].map(skips => (
                <option key={skips} value={skips}>{skips}</option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label className="setting-label">{translations.skipCost[currentLanguage]}</label>
            <select
              className="skip-dropdown"
              value={settings.skipCost}
              onChange={(e) => updateSettings({ skipCost: parseInt(e.target.value) })}
            >
              {[0, 1, 2, 3, 4, 5].map(cost => (
                <option key={cost} value={cost}>{cost} {translations.points[currentLanguage]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Start Game */}
      <div className="start-game-section">
        <button
          className="start-competition-button"
          onClick={onStartGame}
          disabled={!isFormValid()}
        >
          <Play size={20} />
          <span>{translations.startCompetition[currentLanguage]}</span>
        </button>
        
        {validationError && (
          <div className="validation-warning">
            {validationError}
          </div>
        )}
        
        {!isFormValid() && (
          <div className="validation-warning">
            {translations.allPlayerNameRequired[currentLanguage]}
          </div>
        )}
      </div>
    </div>
  );
};