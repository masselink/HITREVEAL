import React, { useRef, useEffect, useState } from 'react';
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
  const [cameraError, setCameraError] = useState<string>('');
  const [showSongList, setShowSongList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      setCameraError('');
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsScanning(true);
              startQRDetection();
            }).catch((error) => {
              console.error('Error playing video:', error);
              setCameraError('Failed to start camera playback');
            });
          }
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check permissions and try again.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    // Stop QR detection
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }

    setIsScanning(false);
    setCameraError('');
  };

  const startQRDetection = () => {
    const detectQR = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for QR detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Try to detect QR code
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (qrCode && qrCode.data) {
          handleQRCodeDetected(qrCode.data);
          return; // Stop scanning after successful detection
        }
      }

      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(detectQR);
    };

    // Start the detection loop
    animationFrameRef.current = requestAnimationFrame(detectQR);
  };

  const handleQRCodeDetected = (data: string) => {
    console.log('QR Code detected:', data);
    
    // Stop camera and scanning
    stopCamera();
    
    // Find matching song
    const matchedSong = songs.find(song => {
      if (!song.hitster_url) return false;
      
      const hitsterUrl = song.hitster_url.toLowerCase().trim();
      const scannedData = data.toLowerCase().trim();
      
      // Direct match
      if (hitsterUrl === scannedData) return true;
      
      // Check if URLs contain each other
      if (hitsterUrl.includes(scannedData) || scannedData.includes(hitsterUrl)) return true;
      
      // Extract ID from URLs and compare
      const extractId = (url: string) => {
        const match = url.match(/(\d+)$/);
        return match ? match[1] : '';
      };
      
      const hitsterUrlId = extractId(hitsterUrl);
      const scannedDataId = extractId(scannedData);
      
      return hitsterUrlId && scannedDataId && hitsterUrlId === scannedDataId;
    });

    if (matchedSong) {
      onSongFound(matchedSong);
    } else {
      onNoMatch(data);
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

  // Filter songs based on search term
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

      {cameraError && (
        <div className="scanner-error">
          <p>{cameraError}</p>
          <button className="primary-button" onClick={() => {
            setCameraError('');
            startCamera();
          }}>
            {translations.retry?.[currentLanguage] || 'Retry'}
          </button>
        </div>
      )}

      {isScanning ? (
        <div className="scanner-container">
          <video
            ref={videoRef}
            className="scanner-video"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="scanner-overlay">
            <div className="scanner-frame" />
            <p className="scanner-hint">
              {translations.scanHint?.[currentLanguage] || 'Position QR code within the frame'}
            </p>
          </div>
        </div>
      ) : (
        <div className="scanner-placeholder">
          <div className="scanner-placeholder-content">
            <QrCode size={64} />
            <p>{translations.readyToScan?.[currentLanguage] || 'Ready to Scan'}</p>
          </div>
        </div>
      )}

      <div className="scanner-controls">
        <div className="scanner-button-row">
          {isScanning ? (
            <button className="secondary-button" onClick={stopCamera}>
              <Square size={16} />
              <span>{translations.stopScanning?.[currentLanguage] || 'Stop Scanning'}</span>
            </button>
          ) : (
            <button className="primary-button" onClick={startCamera}>
              <QrCode size={16} />
              <span>{translations.startScanning?.[currentLanguage] || 'Start Scanning'}</span>
            </button>
          )}
          
          <button className="scan-another-button" onClick={handleShowSongList}>
            <List size={16} />
            <span>
              {translations.songList?.[currentLanguage] || 'Song List'}
              {songListViewCount > 0 && (
                <span className="view-counter"> ({songListViewCount})</span>
              )}
            </span>
          </button>
        </div>
      </div>
      
      {/* Counter Explanation */}
      {songListViewCount > 0 && (
        <div className="counter-explanation">
          <p className="counter-explanation-text">
            {translations.songListCounterExplanation?.[currentLanguage] || 'The number in parentheses shows how many times you\'ve viewed the song list during this game session.'}
          </p>
        </div>
      )}

      {/* Song List Overlay */}
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