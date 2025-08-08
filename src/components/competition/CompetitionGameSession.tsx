import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Language, Song, CompetitionSettings } from '../../types';
import { translations } from '../../data/translations';
import { QRScanner } from '../QRScanner';
import { CompetitionYouTubePlayer } from '../CompetitionYouTubePlayer';

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

interface CompetitionGameSessionProps {
  currentLanguage: Language;
  settings: CompetitionSettings;
  allSongs: Song[];
  usedSongs: Song[];
  currentPlayer: Player;
  onBack: () => void;
  onSongFound: (song: Song) => void;
  onNoMatch: (data: string) => void;
  onTurnComplete: (scores: any) => void;
  onSkip: () => void;
  onSongListView: () => void;
  songListViewCount: number;
}

export const CompetitionGameSession: React.FC<CompetitionGameSessionProps> = ({
  currentLanguage,
  settings,
  allSongs,
  usedSongs,
  currentPlayer,
  onBack,
  onSongFound,
  onNoMatch,
  onTurnComplete,
  onSkip,
  onSongListView,
  songListViewCount
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [scannedData, setScannedData] = useState<string>('');
  const [shouldAutoStartScanning, setShouldAutoStartScanning] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  const handleSongFound = (song: Song) => {
    setCurrentSong(song);
    setScannedData('');
    setShouldAutoStartScanning(false);
    setShowPlayer(true);
    onSongFound(song);
  };

  const handleNoMatch = (data: string) => {
    setScannedData(data);
    setCurrentSong(null);
    setShouldAutoStartScanning(false);
    setShowPlayer(false);
    onNoMatch(data);
  };

  const handleTurnComplete = (scores: any) => {
    onTurnComplete(scores);
    setCurrentSong(null);
    setScannedData('');
    setShowPlayer(false);
  };

  const handleSkip = () => {
    onSkip();
    setCurrentSong(null);
    setScannedData('');
    setShowPlayer(false);
  };

  const handleBackToScanner = () => {
    setShowPlayer(false);
    setCurrentSong(null);
    setScannedData('');
    setShouldAutoStartScanning(true);
  };

  // Filter out used songs for scanner
  const availableSongs = allSongs.filter(song => 
    !usedSongs.some(usedSong => usedSong.hitster_url === song.hitster_url)
  );

  if (showPlayer && currentSong) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={handleBackToScanner}>
              <ArrowLeft size={20} />
              <span>{translations.back[currentLanguage]}</span>
            </button>
            <div className="current-player-indicator">
              {currentPlayer.name || `${translations.playerName[currentLanguage]} ${currentPlayer.id + 1}`}
            </div>
          </div>

          <div className="simple-player-section">
            <CompetitionYouTubePlayer
              currentLanguage={currentLanguage}
              currentSong={currentSong}
              allSongs={allSongs}
              onScanAnother={handleBackToScanner}
              onSongListView={onSongListView}
              songListViewCount={songListViewCount}
              onTurnComplete={handleTurnComplete}
              onSkip={handleSkip}
              artistPoints={settings.artistPoints}
              titlePoints={settings.titlePoints}
              yearPoints={settings.yearPoints}
              bonusPoints={settings.bonusPoints}
              skipCost={settings.skipCost}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-session">
      <div className="game-session-container">
        <div className="game-session-header">
          <button className="back-button" onClick={onBack}>
        </div>

        <div className="qr-scanner-section">
          <QRScanner
            currentLanguage={currentLanguage}
            songs={availableSongs}
            onSongFound={handleSongFound}
            onNoMatch={handleNoMatch}
            onSongListView={onSongListView}
            songListViewCount={songListViewCount}
            autoStart={shouldAutoStartScanning}
          />
        </div>
      </div>

      {/* No Match Popover */}
      {scannedData && (
        <div className="preview-overlay">
          <div className="no-match-popover">
            <div className="no-match-header">
              <h3 className="no-match-title">
                {translations.noMatch[currentLanguage]}
              </h3>
              <button
                className="preview-close"
                onClick={() => setScannedData('')}
                aria-label={translations.close[currentLanguage]}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="no-match-content">
              <p className="no-match-description">
                {translations.qrCodeNotRecognized[currentLanguage]}
              </p>
              
              <p className="no-match-help">
                {translations.helpBySharing[currentLanguage]}
              </p>
              
              <div className="no-match-link-container">
                <a 
                  href="https://github.com/masselink/HITREVEAL-Songs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="github-link"
                >
                  HITREVEAL GITHUB
                </a>
              </div>
              
              <div className="no-match-actions">
                <button className="primary-button" onClick={() => setScannedData('')}>
                  <ArrowLeft size={16} />
                  {translations.back[currentLanguage]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};