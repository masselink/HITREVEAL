import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Square, List, X } from 'lucide-react';
import { Language, Song } from '../types';
import { translations } from '../data/translations';
import jsQR from 'jsqr';

interface QRScannerProps {
  currentLanguage: Language;
  songs: Song[];
  onSongFound: (song: Song) => void;
  onNoMatch: (scannedData: string) => void;
  onSongListView: () => void;
  songListViewCount: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  currentLanguage,
  songs,
  onSongFound,
  onNoMatch,
  onSongListView,
  songListViewCount
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [showSongList, setShowSongList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Handle camera initialization when scanning starts
  useEffect(() => {
    const initializeVideo = async () => {
      if (isScanning && stream && videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before starting scan
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting playback...');
          if (videoRef.current) {
            console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            videoRef.current.play().then(() => {
              console.log('Video playing successfully, starting QR scan...');
              scanForQRCode();
            }).catch(err => {
              console.error('Error playing video:', err);
              setScannerError('Failed to start video playback');
            });
          }
        };
        
        // Add error handler for video element
        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
          setScannerError('Video display error');
        };
        
        // Force play attempt after a short delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 1) {
            console.log('Forcing video play...');
            videoRef.current.play().catch(err => {
              console.error('Force play failed:', err);
            });
          }
        }, 100);
      }
    };

    initializeVideo();
  }, [isScanning, stream]);

  // Cleanup when scanning stops
  useEffect(() => {
    if (!isScanning && stream) {
      console.log('Cleaning up stream...');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (!isScanning && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isScanning, stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 QRScanner unmounting, cleaning up...');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  const startScanning = async () => {
    try {
      console.log('🎥 Starting camera...');
      setScannerError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('✅ Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setIsScanning(true);
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      setScannerError(`Unable to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopScanning = () => {
    console.log('🛑 Stopping scanner...');
    setIsScanning(false);
    setScannerError(null);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      console.log('Scan conditions not met:', {
        hasVideo: !!videoRef.current,
        hasCanvas: !!canvasRef.current,
        isScanning
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState >= video.HAVE_CURRENT_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (canvas.width > 0 && canvas.height > 0) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          console.log('📱 QR Code detected:', code.data);
          // Stop scanning when QR code is found
          stopScanning();
          handleQRCodeDetected(code.data);
          return;
        }
      }
    } else {
      console.log('Video not ready, readyState:', video.readyState);
    }

    // Continue scanning
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scanForQRCode);
    }
  };

  const handleQRCodeDetected = (qrData: string) => {
    console.log('🎵 Processing QR code:', qrData);
    
    // Look for a match in the song list
    const foundSong = songs.find(song => 
      song.hitster_url === qrData || 
      song.hitster_url.includes(qrData) ||
      qrData.includes(song.hitster_url)
    );
    
    if (foundSong) {
      console.log('✅ Match found:', foundSong);
      onSongFound(foundSong);
    } else {
      console.log('❌ No match found for:', qrData);
      onNoMatch(qrData);
    }
  };

  const handleShowSongList = () => {
    onSongListView();
    setShowSongList(true);
  };

  const closeSongList = () => {
    setShowSongList(false);
    setSearchTerm('');
  };

  const extractIdFromUrl = (url: string) => {
    const match = url.match(/(\d+)$/);
    if (match) {
      return parseInt(match[1], 10).toString();
    }
    return '';
  };

  const filteredSongs = songs.filter(song => {
    const searchLower = searchTerm.toLowerCase();
    const id = song.hitster_url ? extractIdFromUrl(song.hitster_url) : '';
    return (
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.year.toString().includes(searchLower) ||
      (id && id.includes(searchLower))
    );
  });

  return (
    <>
      <div className="scanner-header">
        <h3 className="scanner-title">
          <QrCode size={24} />
          {isScanning 
            ? translations.scanQrCode?.[currentLanguage] || 'Scan QR Code'
            : translations.readyToScan?.[currentLanguage] || 'Ready to Scan'
          }
        </h3>
        <p className="scanner-subtitle">
          {isScanning 
            ? translations.scanInstruction?.[currentLanguage] || 'Point your camera at a HITSTER QR code'
            : translations.clickToStartScanning?.[currentLanguage] || 'Click the button below to start scanning HITSTER QR codes'
          }
        </p>
      </div>

      {scannerError && (
        <div className="scanner-error">
          <p><strong>Error:</strong> {scannerError}</p>
          <button className="primary-button" onClick={() => {
            setScannerError(null);
            startScanning();
          }}>
            {translations.retry?.[currentLanguage] || 'Retry'}
          </button>
        </div>
      )}

      {/* Video Container */}
      <div className="scanner-container">
        {isScanning ? (
          <>
            <video
              ref={videoRef}
              className="scanner-video"
              playsInline
              muted
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: '#000',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <div className="scanner-overlay">
              <div className="scanner-frame" />
              <p className="scanner-hint">
                {translations.scanHint?.[currentLanguage] || 'Position QR code within the frame'}
              </p>
            </div>
          </>
        ) : (
          <div className="scanner-placeholder">
            <div className="scanner-placeholder-content">
              <QrCode size={64} />
              <p>{translations.readyToScan?.[currentLanguage] || 'Ready to Scan'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        <div className="scanner-button-row">
          {isScanning ? (
            <button className="secondary-button" onClick={stopScanning}>
              <Square size={16} />
              <span>{translations.stopScanning?.[currentLanguage] || 'Stop Scanning'}</span>
            </button>
          ) : (
            <>
              <button className="primary-button" onClick={startScanning}>
                <QrCode size={16} />
                <span>{translations.startScanning?.[currentLanguage] || 'Start Scanning'}</span>
              </button>
              
              <button className="scan-another-button" onClick={handleShowSongList}>
                <List size={16} />
                <span>
                  {translations.songList?.[currentLanguage] || 'Song List'}
                  {songListViewCount > 0 && (
                    <span className="view-counter"> ({songListViewCount})</span>
                  )}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
      
      {songListViewCount > 0 && (
        <div className="counter-explanation">
          <p className="counter-explanation-text">
            {translations.songListCounterExplanation?.[currentLanguage] || 'The number in parentheses shows how many times you\'ve viewed the song list during this game session.'}
          </p>
        </div>
      )}

      {showSongList && (
        <div className="preview-overlay">
          <div className="preview-popup">
            <div className="preview-header">
              <h3 className="preview-title">
                {translations.songList?.[currentLanguage] || 'Song List'}
              </h3>
              <button
                className="preview-close"
                onClick={closeSongList}
                aria-label={translations.close?.[currentLanguage] || 'Close'}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="preview-content">
              <div className="search-section">
                <input
                  type="text"
                  placeholder={translations.searchPlaceholder?.[currentLanguage] || 'Search songs, artists, years, or IDs...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <div className="search-results-count">
                  {filteredSongs.length} {translations.songsCount?.[currentLanguage] || 'of'} {songs.length} {translations.songsTotal?.[currentLanguage] || 'songs'}
                </div>
              </div>
              
              <div className="songs-list">
                <div className="list-header">
                  <div className="header-id">{translations.id?.[currentLanguage] || 'ID'}</div>
                  <div className="header-title">{translations.title?.[currentLanguage] || 'Title'}</div>
                  <div className="header-artist">{translations.artist?.[currentLanguage] || 'Artist'}</div>
                  <div className="header-year">{translations.year?.[currentLanguage] || 'Year'}</div>
                </div>
                
              <button className="scan-another-button" onClick={handleShowSongList}>
                <List size={16} />
                <span>
                  {translations.songList?.[currentLanguage] || 'Song List'}
                  {songListViewCount > 0 && (
                    <span className="view-counter"> ({songListViewCount})</span>
                  )}
                </span>
              </button>
            </>
          ) : (
            <>
              <button className="primary-button" onClick={startScanning}>
                <QrCode size={16} />
                <span>{translations.startScanning?.[currentLanguage] || 'Start Scanning'}</span>
              </button>
              
                <div className="list-body">
                  {filteredSongs.map((song, index) => {
                    const songId = extractIdFromUrl(song.hitster_url);
                    
                    return (
                      <div key={index} className="song-row">
                        <div className="row-id">
                          #{songId}
                        </div>
                        <div className="row-title">{song.title}</div>
                        <div className="row-artist">{song.artist}</div>
                        <div className="row-year">{song.year}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {filteredSongs.length === 0 && searchTerm && (
                <div className="no-results">
                  {translations.noSongsFound?.[currentLanguage] || 'No songs found matching'} "{searchTerm}"
                </div>
              )}
              
              {filteredSongs.length === 0 && !searchTerm && (
                <div className="no-songs">
                  {translations.noValidSongs?.[currentLanguage] || 'No valid songs found in this list.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};