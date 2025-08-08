import React, { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Language, SongList, Song } from '../types';
import { getTranslation } from '../data/translations';
import { QRScanner } from './QRScanner';
import { YouTubePlayer } from './YouTubePlayer';
import Papa from 'papaparse';

interface HitsterGameProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
}

export const HitsterGame: React.FC<HitsterGameProps> = ({
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
    window.scrollTo(0, 0);
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
    window.scrollTo(0, 0);
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
              <span>{getTranslation('back', currentLanguage)}</span>
            </button>
          </div>
          <div className="loading-message">
            {getTranslation('loadingSongs', currentLanguage)}
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
              <span>{getTranslation('back', currentLanguage)}</span>
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
              <span>{getTranslation('back', currentLanguage)}</span>
            </button>
          </div>

          {/* YouTube Player */}
          <YouTubePlayer
            currentLanguage={currentLanguage}
            currentSong={currentSong}
            allSongs={songs}
            onScanAnother={handleScanAnother}
            onSongListView={handleSongListView}
            songListViewCount={songListViewCount}
            songListName={songList.name}
          />
        </div>

        {/* Quit Confirmation Modal */}
        {showQuitConfirmation && (
          <div className="preview-overlay">
            <div className="quit-confirmation-modal">
              <div className="quit-modal-header">
                <h3 className="quit-modal-title">
                  {getTranslation('quitGameConfirmTitle', currentLanguage)}
                </h3>
              </div>
              
              <div className="quit-modal-content">
                <p className="quit-warning-text">
                  {getTranslation('quitGameWarning', currentLanguage)}
                </p>
                
                <div className="quit-modal-buttons">
                  <button className="cancel-quit-button" onClick={cancelQuit}>
                    <span>{getTranslation('cancel', currentLanguage)}</span>
                  </button>
                  <button className="confirm-quit-button" onClick={confirmQuit}>
                    <X size={16} />
                    <span>{getTranslation('quitGame', currentLanguage)}</span>
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
            <span>{getTranslation('quitGame', currentLanguage)}</span>
          </button>
        </div>

        {/* QR Scanner Section */}
        <div className="qr-scanner-section">
          <QRScanner
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
                {getTranslation('quitGameConfirmTitle', currentLanguage)}
              </h3>
            </div>
            
            <div className="quit-modal-content">
              <p className="quit-warning-text">
                {getTranslation('quitGameWarning', currentLanguage)}
              </p>
              
              <div className="quit-modal-buttons">
                <button className="cancel-quit-button" onClick={cancelQuit}>
                  <span>{getTranslation('cancel', currentLanguage)}</span>
                </button>
                <button className="confirm-quit-button" onClick={confirmQuit}>
                  <X size={16} />
                  <span>{getTranslation('quitGame', currentLanguage)}</span>
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
                {getTranslation('noMatch', currentLanguage)}
              </h3>
              <button
                className="preview-close"
                onClick={() => setScannedData('')}
                aria-label={getTranslation('close', currentLanguage)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="no-match-content">
              <p className="no-match-description">
                {getTranslation('qrCodeNotRecognized', currentLanguage)}
              </p>
              
              <p className="no-match-help">
                {getTranslation('helpBySharing', currentLanguage)}
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
                  {getTranslation('back', currentLanguage)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};