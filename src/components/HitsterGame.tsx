import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, QrCode, Play, Pause, RotateCcw, Square, Eye } from 'lucide-react';
import { Language, SongList, Song } from '../types';
import { translations } from '../data/translations';
import Papa from 'papaparse';
import jsQR from 'jsqr';

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
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);

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

  // Initialize YouTube Player
  useEffect(() => {
    const initYouTubePlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
          },
          events: {
            onReady: () => {
              console.log('YouTube player ready');
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
              }
            }
          }
        });
      }
    };

    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = initYouTubePlayer;
    } else {
      initYouTubePlayer();
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        startQRScanning();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    setCameraError('');
  };

  const startQRScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            handleQRCodeDetected(code.data);
          }
        }
      }
    }, 100);
  };

  const handleQRCodeDetected = (data: string) => {
    setScannedData(data);
    stopCamera();
    
    // Find matching song
    const matchedSong = songs.find(song => {
      const hitsterUrl = song.hitster_url.toLowerCase();
      const scannedUrl = data.toLowerCase();
      return hitsterUrl === scannedUrl || hitsterUrl.includes(scannedUrl) || scannedUrl.includes(hitsterUrl);
    });

    if (matchedSong) {
      setCurrentSong(matchedSong);
      setShowReveal(false);
    } else {
      setCurrentSong(null);
    }
  };

  const extractVideoId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  };

  const playMusic = () => {
    if (currentSong && playerRef.current) {
      const videoId = extractVideoId(currentSong.youtube_url);
      if (videoId) {
        playerRef.current.loadVideoById(videoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const pauseMusic = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  };

  const restartMusic = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const stopMusic = () => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
      setIsPlaying(false);
    }
  };

  const handleReveal = () => {
    setShowReveal(true);
  };

  const handleScanAnother = () => {
    setCurrentSong(null);
    setScannedData('');
    setShowReveal(false);
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
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
        {!currentSong && (
          <div className="qr-scanner-section">
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

            {cameraError && (
              <div className="scanner-error">
                <p>{cameraError}</p>
                <button className="primary-button" onClick={() => setCameraError('')}>
                  {translations.retry?.[currentLanguage] || 'Retry'}
                </button>
              </div>
            )}

            <div className="scanner-controls">
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
            </div>
          </div>
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

        {/* Song Found Section */}
        {currentSong && (
          <div className="music-player-section">
            <div className="song-found-title">
              <Eye size={24} />
              <span>{translations.songFoundReveal?.[currentLanguage] || 'Song Found! Do you need a reveal?'}</span>
            </div>

            {/* Song Info (only show when revealed) */}
            {showReveal && (
              <div className="revealed-song-info">
                <h2 className="song-title">{currentSong.title}</h2>
                <p className="song-artist">{currentSong.artist}</p>
                {currentSong.year && <p className="song-year">{currentSong.year}</p>}
              </div>
            )}

            {/* Music Controls */}
            <div className="background-player-status">
              <div className="status-info">
                <p className="status-text">
                  <strong>{translations.status?.[currentLanguage] || 'Status'}:</strong>{' '}
                  {isPlaying 
                    ? translations.playingInBackground?.[currentLanguage] || 'Playing in background'
                    : translations.stopped?.[currentLanguage] || 'Stopped'
                  }
                </p>
              </div>

              <div className="player-controls">
                <button 
                  className="control-button start-button" 
                  onClick={playMusic}
                  disabled={isPlaying}
                >
                  <Play size={16} />
                  <span>{translations.start?.[currentLanguage] || 'Start'}</span>
                </button>
                
                <button 
                  className="control-button pause-button" 
                  onClick={pauseMusic}
                  disabled={!isPlaying}
                >
                  <Pause size={16} />
                  <span>{translations.pause?.[currentLanguage] || 'Pause'}</span>
                </button>
                
                <button 
                  className="control-button restart-button" 
                  onClick={restartMusic}
                >
                  <RotateCcw size={16} />
                  <span>{translations.restart?.[currentLanguage] || 'Restart'}</span>
                </button>
                
                <button 
                  className="control-button stop-button" 
                  onClick={stopMusic}
                >
                  <Square size={16} />
                  <span>{translations.stop?.[currentLanguage] || 'Stop'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="scan-another-section">
              <div className="button-row">
                {!showReveal && (
                  <button className="primary-button" onClick={handleReveal}>
                    <Eye size={16} />
                    <span>Reveal Song</span>
                  </button>
                )}
                <button className="scan-another-button" onClick={handleScanAnother}>
                  <QrCode size={16} />
                  <span>{translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden YouTube Player */}
        <div className="background-video-container">
          <div id="youtube-player"></div>
        </div>
      </div>
    </div>
  );
};