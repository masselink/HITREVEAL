import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Square, List, X } from 'lucide-react';
import { Language, Song } from '../types';
import { getTranslation } from '../data/translations';
import jsQR from 'jsqr';

interface QRScannerProps {
  currentLanguage: Language;
  songs: Song[];
  onSongFound: (song: Song) => void;
  onNoMatch: (scannedData: string) => void;
  onSongListView: () => void;
  songListViewCount: number;
  autoStart?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  currentLanguage,
  songs,
  onSongFound,
  onNoMatch,
  onSongListView,
  songListViewCount,
  autoStart = false
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [showSongList, setShowSongList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Auto-start scanning when autoStart prop is true
  useEffect(() => {
    if (autoStart && !isScanning && !scannerError) {
      startScanning();
    }
  }, [autoStart]);

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
            ? getTranslation('scanQrCode', currentLanguage)
            : getTranslation('readyToScan', currentLanguage)
          }
        </h3>
        <p className="scanner-subtitle">
          {isScanning 
            ? getTranslation('scanInstruction', currentLanguage)
            : getTranslation('clickToStartScanning', currentLanguage)
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
            {getTranslation('retry', currentLanguage)}
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
                {getTranslation('scanHint', currentLanguage)}
              </p>
            </div>
          </>
        ) : (
          <div className="scanner-placeholder">
            <div className="scanner-placeholder-content">
              <QrCode size={64} />
              <p>{getTranslation('readyToScan', currentLanguage)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        <div className="scanner-button-row">
          {isScanning ? (
            <button className="secondary-button" onClick={stopScanning}>
              <Square size={16} />
              <span>{getTranslation('stopScanning', currentLanguage)}</span>
            </button>
          ) : (
            <>
              <button className="primary-button" onClick={startScanning}>
                <QrCode size={16} />
                <span>{getTranslation('startScanning', currentLanguage)}</span>
              </button>
              
              <button className="scan-another-button" onClick={handleShowSongList}>
                <List size={16} />
                <span>
                  {getTranslation('songList', currentLanguage)}
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
            {getTranslation('songListCounterExplanation', currentLanguage)}
          </p>
        </div>
      )}

      {showSongList && (
        <div className="preview-overlay">
          <div className="preview-popup">
            <div className="preview-header">
              <h3 className="preview-title">
                {getTranslation('songList', currentLanguage)}
              </h3>
              <button
                className="preview-close"
                onClick={closeSongList}
                aria-label={getTranslation('close', currentLanguage)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="preview-content">
              <div className="search-section">
                <input
                  type="text"
                  placeholder={getTranslation('searchPlaceholder', currentLanguage)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <div className="search-results-count">
                  {filteredSongs.length} {getTranslation('songsCount', currentLanguage)} {songs.length} {getTranslation('songsTotal', currentLanguage)}
                </div>
              </div>
              
              <div className="songs-list">
                <div className="list-header">
                  <div className="header-id">{getTranslation('id', currentLanguage)}</div>
                  <div className="header-title">{getTranslation('title', currentLanguage)}</div>
                  <div className="header-artist">{getTranslation('artist', currentLanguage)}</div>
                  <div className="header-year">{getTranslation('year', currentLanguage)}</div>
                </div>
                
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
                  {getTranslation('noSongsFound', currentLanguage)} "{searchTerm}"
                </div>
              )}
              
              {filteredSongs.length === 0 && !searchTerm && (
                <div className="no-songs">
                  {getTranslation('noValidSongs', currentLanguage)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};