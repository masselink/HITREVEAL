import React, { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Language, SongList, Song } from '../types';
import { translations } from '../data/translations';
import { GlobalQRScanner } from './GlobalQRScanner';
import { HitsterYouTubePlayer } from './HitsterYouTubePlayer';
import Papa from 'papaparse';

interface HitsterGameSessionProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
}

export const HitsterGameSession: React.FC<HitsterGameSessionProps> = ({
  currentLanguage,
  songList,
  onBack
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [scannedData, setScannedData] = useState<string>('');
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string>('');
  const [songListViewCount, setSongListViewCount] = useState(0);
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);
  const [shouldAutoStartScanning, setShouldAutoStartScanning] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Load songs from CSV
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
              row.hitster_url && 
              row.youtube_url && 
              row.title && 
              row.artist
            );
            setSongs(validData);
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

  const handleSongFound = (song: Song) => {
    setCurrentSong(song);
    setScannedData('');
    setShouldAutoStartScanning(false);
    setShowPlayer(true);
  };

  const handleNoMatch = (data: string) => {
    setScannedData(data);
    setCurrentSong(null);
    setShouldAutoStartScanning(false);
    setShowPlayer(false);
  };

  const handleScanAnother = () => {
    setCurrentSong(null);
    setScannedData('');
    setShouldAutoStartScanning(true);
    setShowPlayer(false);
  };

  const handleSongListView = () => {
    setSongListViewCount(prev => prev + 1);
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

  const handleBackToScanner = () => {
    setShowPlayer(false);
    setCurrentSong(null);
    setScannedData('');
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

  // Player Page
  if (showPlayer && currentSong) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          {/* Header */}
          <div className="game-session-header">
            <button className="back-button" onClick={handleBackToScanner}>
              <ArrowLeft size={20} />
              <span>{translations.back?.[currentLanguage] || 'Back'}</span>
            </button>
            <button className="primary-button game-session-title-button" disabled>
              {songList.name}
            </button>
          </div>

          {/* YouTube Player */}
          <HitsterYouTubePlayer
            currentLanguage={currentLanguage}
            currentSong={currentSong}
            allSongs={songs}
            onScanAnother={handleScanAnother}
            onSongListView={handleSongListView}
            songListViewCount={songListViewCount}
          />
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

  // Scanner Page (default)
  return (
    <div className="game-session">
      <div className="game-session-container">
        {/* Header */}
        <div className="game-session-header">
          <button className="primary-button quit-game-button" onClick={handleQuitGame}>
            <X size={20} />
            <span>{translations.quitGame?.[currentLanguage] || 'Quit Game'}</span>
          </button>
          <button className="primary-button game-session-title-button" disabled>
            {songList.name}
          </button>
        </div>

        {/* QR Scanner Section */}
        <div className="qr-scanner-section">
          <GlobalQRScanner
            currentLanguage={currentLanguage}
            songs={songs}
            onSongFound={handleSongFound}
            onNoMatch={handleNoMatch}
            onSongListView={handleSongListView}
            songListViewCount={songListViewCount}
            autoStart={shouldAutoStartScanning}
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

      {/* No Match Popover */}
      {scannedData && (
        <div className="preview-overlay">
          <div className="no-match-popover">
            <div className="no-match-header">
              <h3 className="no-match-title">
                {translations.noMatch?.[currentLanguage] || 'Song Not Found'}
              </h3>
              <button
                className="preview-close"
                onClick={() => setScannedData('')}
                aria-label={translations.close?.[currentLanguage] || 'Close'}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="no-match-content">
              <p className="no-match-description">
                {translations.qrCodeNotRecognized?.[currentLanguage] || 'We don\'t recognize this QR code. It might not be a HITSTER card or it\'s not in our database yet.'}
              </p>
              
              <p className="no-match-help">
                {translations.helpBySharing?.[currentLanguage] || 'Help us by sharing the information on your cards! You can contribute by visiting:'}
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
                  {translations.back?.[currentLanguage] || 'Back'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};