import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Language, SongList, Song } from '../types';
import { translations } from '../data/translations';
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
  };

  const handleNoMatch = (data: string) => {
    setScannedData(data);
    setCurrentSong(null);
  };

  const handleScanAnother = () => {
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

  return (
    <div className="game-session">
      <div className="game-session-container">
        {/* Header */}
        <div className="game-session-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>{translations.back?.[currentLanguage] || 'Back'}</span>
          </button>
          <button className="game-session-title-button" disabled>
            {songList.name}
          </button>
        </div>

        {/* QR Scanner Section */}
        {!currentSong && !scannedData && (
          <QRScanner
            currentLanguage={currentLanguage}
            songs={songs}
            onSongFound={handleSongFound}
            onNoMatch={handleNoMatch}
          />
        )}

        {/* No Match Message */}
        {scannedData && !currentSong && (
          <div className="no-match-message">
            <h4>{translations.noMatch?.[currentLanguage] || 'Song Not Found'}</h4>
            <p>{translations.qrCodeNotRecognized?.[currentLanguage] || 'We don\'t recognize this QR code. It might not be a HITSTER card or it\'s not in our database yet.'}</p>
            <p>{translations.helpBySharing?.[currentLanguage] || 'Help us by sharing the information on your cards! You can contribute by visiting:'}</p>
            <div>
              <a 
                href="https://github.com/masselink/HITREVEAL-Songs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-link"
              >
                GitHub Repository
              </a>
            </div>
            <button className="primary-button" onClick={handleScanAnother} style={{ marginTop: 'var(--spacing-4)' }}>
              {translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}
            </button>
          </div>
        )}

        {/* YouTube Player Section */}
        {currentSong && (
          <YouTubePlayer
            currentLanguage={currentLanguage}
            currentSong={currentSong}
            allSongs={songs}
            onScanAnother={handleScanAnother}
          />
        )}
      </div>
    </div>
  );
};