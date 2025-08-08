import React from 'react';
import { Language, SongList } from '../types';
import { HitsterGame } from './HitsterGame';
import { CompetitionGame } from './CompetitionGame';
import { CompetitionSettings } from './CompetitionSettings';

interface GameSessionProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
  gameType?: string;
  showSettings?: boolean;
  onStartCompetition?: (settings: any, playerNames: string[]) => void;
}

export const GameSession: React.FC<GameSessionProps> = ({
  currentLanguage,
  songList,
  onBack,
  gameType,
  showSettings = false,
  onStartCompetition
}) => {
  if (gameType === 'hitster-youtube') {
    return (
      <HitsterGame
        currentLanguage={currentLanguage}
        songList={songList}
        onBack={onBack}
      />
    );
  }

  if (gameType === 'game-type-2') {
    if (showSettings) {
      return (
        <CompetitionSettings
          currentLanguage={currentLanguage}
          songList={songList}
          onBack={onBack}
          onStartCompetition={onStartCompetition || (() => {})}
        />
      );
    }
    
    return (
      <CompetitionGame
        currentLanguage={currentLanguage}
        songList={songList}
        onBack={onBack}
      />
    );
  }

  // Fallback - shouldn't happen
  return (
    <div className="game-session">
      <div className="game-session-container">
        <div className="error-message">
          Unknown game type: {gameType}
        </div>
      </div>
    </div>
  );
};