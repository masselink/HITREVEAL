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
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);

  const startCamera = async () => {
    console.log('Starting camera...');
    setDebugInfo('Starting camera...');
    setCameraError('');
    
    try {
      // Stop any existing stream
      if (streamRef.current) {
        console.log('Stopping existing stream');
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Requesting camera access...');
      setDebugInfo('Requesting camera access...');

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted, stream:', stream);
      setDebugInfo('Camera access granted');
      
      streamRef.current = stream;

      if (videoRef.current) {
        console.log('Setting video source');
        setDebugInfo('Setting video source...');
        
        // Set the stream immediately
        videoRef.current.srcObject = stream;
        
        // Set scanning state immediately
        setIsScanning(true);
        scanningRef.current = true;
        
        // Wait for video to load metadata, then play
        videoRef.current.onloadedmetadata = async () => {
          try {
            console.log('Video metadata loaded, attempting to play...');
            setDebugInfo('Video metadata loaded, attempting to play...');
            
            if (videoRef.current) {
              await videoRef.current.play();
              console.log('Video playing successfully');
              setDebugInfo('Video playing, starting QR detection...');
              startQRDetection();
            }
          } catch (error: any) {
            console.error('Error playing video:', error);
            setDebugInfo('Error playing video: ' + error.message);
            setCameraError('Failed to start video playback: ' + error.message);
            setIsScanning(false);
            scanningRef.current = false;
          }
        };

        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setDebugInfo('Video error occurred');
          setCameraError('Video error occurred');
          setIsScanning(false);
          scanningRef.current = false;
        };
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      setDebugInfo('Camera error: ' + error.message);
      setCameraError(`Camera access failed: ${error.message}`);
      setIsScanning(false);
      scanningRef.current = false;
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    setDebugInfo('Stopping camera...');
    
    scanningRef.current = false;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
    }

    setIsScanning(false);
    setCameraError('');
    setDebugInfo('Camera stopped');
  };

  const startQRDetection = () => {
    console.log('Starting QR detection...');
    
    const detectQR = () => {
      if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
        console.log('Stopping QR detection - conditions not met');
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (qrCode && qrCode.data) {
            console.log('QR Code detected:', qrCode.data);
            handleQRCodeDetected(qrCode.data);
            return;
          }
        } catch (error) {
          console.error('QR detection error:', error);
        }
      }

      if (scanningRef.current) {
        requestAnimationFrame(detectQR);
      }
    };

    requestAnimationFrame(detectQR);
  };

  const handleQRCodeDetected = (data: string) => {
    console.log('Processing QR code:', data);
    stopCamera();
    
    const matchedSong = songs.find(song => {
      if (!song.hitster_url) return false;
      
      const hitsterUrl = song.hitster_url.toLowerCase().trim();
      const scannedData = data.toLowerCase().trim();
      
      if (hitsterUrl === scannedData) return true;
      if (hitsterUrl.includes(scannedData) || scannedData.includes(hitsterUrl)) return true;
      
      const extractId = (url: string) => {
        const match = url.match(/(\d+)$/);
        return match ? match[1] : '';
      };
      
      const hitsterUrlId = extractId(hitsterUrl);
      const scannedDataId = extractId(scannedData);
      
      return hitsterUrlId && scannedDataId && hitsterUrlId === scannedDataId;
    });

    if (matchedSong) {
      console.log('Song found:', matchedSong);
      onSongFound(matchedSong);
    } else {
      console.log('No matching song found');
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

  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up...');
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

      {/* Debug Info */}
      {debugInfo && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '5px',
          fontSize: '12px',
          color: '#666'
        }}>
          Debug: {debugInfo}
        </div>
      )}

      {cameraError && (
        <div className="scanner-error">
          <p>{cameraError}</p>
          <button className="primary-button" onClick={() => {
            setCameraError('');
            setDebugInfo('');
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
            style={{ 
              display: 'block',
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              backgroundColor: '#000'
            }}
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