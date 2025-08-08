import React from 'react';
import { Language, SongList } from '../types';
import { HitsterGameSession } from './HitsterGameSession';
import { CompetitionGame } from './CompetitionGame';

interface GlobalGameSessionProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
  gameType?: string;
}

export const GlobalGameSession: React.FC<GlobalGameSessionProps> = ({
  currentLanguage,
  songList,
  onBack,
  gameType
}) => {
  if (gameType === 'hitster-youtube') {
    return (
      <HitsterGameSession
        currentLanguage={currentLanguage}
        songList={songList}
        onBack={onBack}
      />
    );
  }

  if (gameType === 'game-type-2') {
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