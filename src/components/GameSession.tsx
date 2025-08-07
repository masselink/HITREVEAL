import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, QrCode, Square, Play, Pause, RotateCcw, Square as StopIcon, ExternalLink, Volume2, Music } from 'lucide-react';
import { Language, SongList, Song, GameSession as GameSessionType } from '../types';
import { translations } from '../data/translations';
import Papa from 'papaparse';
import jsQR from 'jsqr';

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Player state type
type PlayerState = 'stopped' | 'playing' | 'paused';

interface GameSessionProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
  gameType?: string;
}

export const GameSession: React.FC<GameSessionProps> = ({
  currentLanguage,
  songList,
  onBack,
  gameType = 'hitster-youtube'
}) => {
  const [gameSession, setGameSession] = useState<GameSessionType>({
    songList,
    songs: [],
    isPlaying: false
  });
  
  // Competition game settings state
  const [competitionSettings, setCompetitionSettings] = useState({
    numberOfPlayers: 2,
    gameMode: 'target-score',
    targetScore: 100,
    gameDuration: 15,
    artistPoints: 10,
    titlePoints: 15,
    yearPoints: 5,
    bonusPoints: 10,
    skipsPerPlayer: 3,
    skipCost: 5
  });
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songsLoaded, setSongsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [allSongsHaveYear, setAllSongsHaveYear] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameRef = React.useRef<number>();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [matchedSong, setMatchedSong] = useState<Song | null>(null);
  const [noMatchFound, setNoMatchFound] = useState<string | null>(null);

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>('stopped');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [showPlayer, setShowPlayer] = useState(false);
  const [showSongDetails, setShowSongDetails] = useState(false);
  const [detailsRevealed, setDetailsRevealed] = useState(false);

  // YouTube player refs
  const visiblePlayerRef = React.useRef<HTMLIFrameElement>(null);
  const hiddenPlayerRef = React.useRef<any>(null);
  const hiddenPlayerReadyRef = React.useRef(false);
  const [apiLoaded, setApiLoaded] = useState(false);

  // Auto-play when song is matched
  useEffect(() => {
    if (matchedSong && currentVideoId) {
      setPlayerState('playing');
    }
  }, [matchedSong, currentVideoId]);

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      // Check if API is already loaded
      if (window.YT && window.YT.Player) {
        console.log('YouTube API already loaded');
        setApiLoaded(true);
        return;
      }
      
      // Check if script is already being loaded
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        console.log('YouTube API script already exists, waiting...');
        return;
      }
      
      console.log('Loading YouTube IFrame API...');
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onload = () => {
        console.log('YouTube API script loaded');
      };
      script.onerror = () => {
        console.error('Failed to load YouTube API script');
      };
      document.head.appendChild(script);
    };
    
    // Set up the global callback
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API ready!');
      setApiLoaded(true);
    };

    loadYouTubeAPI();
    
    // Cleanup
    return () => {
      // Don't remove the global callback as other components might need it
    };
  }, []);

  // Create hidden player when video ID is available
  useEffect(() => {
    if (currentVideoId && !detailsRevealed && apiLoaded && window.YT && window.YT.Player) {
      console.log('Creating hidden YouTube player for:', currentVideoId);
      
      // Create a hidden div for the player
      let hiddenDiv = document.getElementById('hidden-youtube-player');
      if (!hiddenDiv) {
        hiddenDiv = document.createElement('div');
        hiddenDiv.id = 'hidden-youtube-player';
        hiddenDiv.style.position = 'fixed';
        hiddenDiv.style.left = '-9999px';
        hiddenDiv.style.top = '-9999px';
        hiddenDiv.style.width = '1px';
        hiddenDiv.style.height = '1px';
        hiddenDiv.style.opacity = '0';
        hiddenDiv.style.pointerEvents = 'none';
        document.body.appendChild(hiddenDiv);
      }
      
      // Destroy existing player
      if (hiddenPlayerRef.current) {
        try {
          hiddenPlayerRef.current.destroy();
        } catch (e) {
          console.log('Error destroying previous player:', e);
        }
      }
      
      // Create new player
      hiddenPlayerRef.current = new window.YT.Player('hidden-youtube-player', {
        height: '1',
        width: '1',
        videoId: currentVideoId,
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
          onReady: (event: any) => {
            console.log('Hidden player ready, starting playback...');
            hiddenPlayerReadyRef.current = true;
            
            // Start playing if we should be playing
            if (playerState === 'playing' && !detailsRevealed) {
              setTimeout(() => {
                try {
                  event.target.playVideo();
                  console.log('Started hidden playback');
                } catch (e) {
                  console.error('Error starting playback:', e);
                }
              }, 100);
            }
          },
          onStateChange: (event: any) => {
            console.log('Hidden player state changed:', event.data);
          },
          onError: (event: any) => {
            console.error('Hidden player error:', event.data);
          }
        }
      });
    } else {
      console.log('Waiting for conditions:', {
        currentVideoId: !!currentVideoId,
        detailsRevealed,
        apiLoaded,
        hasYT: !!(window.YT && window.YT.Player)
      });
    }
    
    // Cleanup function
    return () => {
      if (hiddenPlayerRef.current && typeof hiddenPlayerRef.current.destroy === 'function') {
        try {
          hiddenPlayerRef.current.destroy();
          hiddenPlayerRef.current = null;
        } catch (e) {
          console.log('Error cleaning up player:', e);
        }
      }
    };
  }, [currentVideoId, detailsRevealed, playerState, apiLoaded]);

  // Debug logging
  useEffect(() => {
    console.log('GameSession mounted, isScanning:', isScanning);
  }, []);

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

  // Load songs from CSV
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if song list exists and has a valid GitHub link
        if (!songList.github_link || songList.github_link.trim() === '') {
          throw new Error('Song list does not have a valid GitHub link');
        }
        
        console.log('Fetching songs from:', songList.github_link);
        const response = await fetch(songList.github_link);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch song list: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim() === '') {
          throw new Error('Song list is empty or could not be loaded');
        }
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            try {
              const data = results.data as Song[];
              const validData = data.filter(row => 
                row.hitster_url && 
                row.youtube_url && 
                row.title && 
                row.artist
              );
              
              if (validData.length === 0) {
                throw new Error('No valid songs found in the song list');
              }
              
              console.log(`Successfully loaded ${validData.length} songs from ${songList.name}`);
              setGameSession(prev => ({
                ...prev,
                songs: validData
              }));
              setSongsLoaded(true);
              setLoading(false);
            } catch (parseError) {
              console.error('Error processing song data:', parseError);
              setError('Failed to process song data');
              setLoading(false);
            }
          },
          error: (error) => {
            console.error('Error parsing songs CSV:', error);
            setError(`Failed to parse song list: ${error.message || 'Unknown parsing error'}`);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error fetching songs CSV:', err);
        setError(err instanceof Error ? err.message : 'Failed to load song list');
        setLoading(false);
      }
    };

    fetchSongs();
  }, [songList.github_link]);

  const extractIdFromUrl = (url: string) => {
    // Extract ID from hitster_url and remove leading zeros
    const match = url.match(/(\d+)$/);
    if (match) {
      return parseInt(match[1], 10).toString();
    }
    return '';
  };

  // Extract video ID from various YouTube URL formats
  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Get video title from YouTube API (oEmbed)
  const getVideoTitle = async (videoId: string) => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      const data = await response.json();
      return data.title || "YouTube Video";
    } catch (error) {
      console.error('Error fetching video title:', error);
      return "YouTube Video";
    }
  };

  const startScanning = async () => {
    try {
      console.log('Starting camera...');
      setScannerError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setIsScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScannerError(`Unable to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopScanning = () => {
    console.log('Stopping scanner...');
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
          console.log('QR Code detected:', code.data);
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

  const handleQRCodeDetected = async (qrData: string) => {
    console.log('Processing QR code:', qrData);
    setScannedData(qrData);
    setNoMatchFound(null);
    setMatchedSong(null);
    setDetailsRevealed(false);
    setShowSongDetails(false);
    setPlayerState('stopped');
    
    // Look for a match in the song list
    const foundSong = gameSession.songs.find(song => 
      song.hitster_url === qrData || 
      song.hitster_url.includes(qrData) ||
      qrData.includes(song.hitster_url)
    );
    
    if (foundSong) {
      console.log('Match found:', foundSong);
      setMatchedSong(foundSong);
      setCurrentUrl(foundSong.youtube_url);
      hiddenPlayerReadyRef.current = false;
      
      // Extract video ID and get title
      const videoId = extractVideoId(foundSong.youtube_url);
      if (videoId) {
        setCurrentVideoId(videoId);
        const title = await getVideoTitle(videoId);
        setVideoTitle(title);
        console.log('Video loaded:', { title, videoId });
        
        // Set player state to playing - actual playback will start when iframe is ready
        setPlayerState('playing');
        console.log('Player state set to playing, waiting for iframe ready...');
      }
      
      setShowPlayer(true);
    } else {
      console.log('No match found for:', qrData);
      setNoMatchFound(qrData);
    }
  };

  const handleRescan = () => {
    setScannedData(null);
    setMatchedSong(null);
    setNoMatchFound(null);
    setDetailsRevealed(false);
    setShowSongDetails(false);
    setCurrentUrl('');
    setCurrentVideoId('');
    setVideoTitle('');
    setPlayerState('stopped');
    setShowPlayer(false);
    startScanning();
  };
  
  const handleToggleDetails = () => {
    if (!detailsRevealed) {
      // Stop the hidden player first
      if (hiddenPlayerRef.current && typeof hiddenPlayerRef.current.stopVideo === 'function') {
        try {
          hiddenPlayerRef.current.stopVideo();
        } catch (e) {
          console.error('Error stopping hidden player:', e);
        }
      }
      
      setShowSongDetails(true);
      setDetailsRevealed(true);
      setPlayerState('stopped');
      
      // Start the visible player after a short delay
      setTimeout(() => {
        setPlayerState('playing');
        if (visiblePlayerRef.current) {
          visiblePlayerRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
      }, 500);
    }
  };

  // Competition game settings handlers
  const handleSettingChange = (setting: string, value: number) => {
    const newCount = Math.max(1, Math.min(10, competitionSettings.numberOfPlayers + value));
    setCompetitionSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Update player names array to match the new count
    setPlayerNames(prev => {
      const newNames = [...prev];
      if (newCount > prev.length) {
        // Add empty names for new players
        for (let i = prev.length; i < newCount; i++) {
          newNames.push('');
        }
      } else if (newCount < prev.length) {
        // Remove excess names
        newNames.splice(newCount);
      }
      return newNames;
    });
  };

  const updateGameMode = (mode: 'target-score' | 'time-based') => {
    setCompetitionSettings(prev => ({ ...prev, gameMode: mode }));
  };

  const updateNumberOfPlayers = (change: number) => {
    const newCount = Math.max(2, Math.min(10, competitionSettings.numberOfPlayers + change));
    setCompetitionSettings(prev => ({
      ...prev,
      numberOfPlayers: newCount
    }));
    
    // Update player names array to match the new count
    setPlayerNames(prev => {
      const newNames = [...prev];
      if (newCount > prev.length) {
        // Add empty names for new players
        for (let i = prev.length; i < newCount; i++) {
          newNames.push('');
        }
      } else if (newCount < prev.length) {
        // Remove excess names
        newNames.splice(newCount);
      }
      return newNames;
    });
  };

  const updatePlayerName = (index: number, name: string) => {
    setPlayerNames(prev => {
      const newNames = [...prev];
      newNames[index] = name;
      return newNames;
    });
  };

  const handleStartCompetitionGame = () => {
    // TODO: Implement competition game start logic
    console.log('Starting competition game with settings:', competitionSettings);
    // This will be implemented in the next phase
  };

  // Player control functions
  const handlePlayStop = () => {
    if (currentVideoId) {
      if (playerState === 'playing') {
        setPlayerState('stopped');
        
        // Stop the appropriate player
        if (showSongDetails && visiblePlayerRef.current) {
          visiblePlayerRef.current.contentWindow?.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
        } else if (!showSongDetails && hiddenPlayerRef.current && typeof hiddenPlayerRef.current.stopVideo === 'function') {
          try {
            hiddenPlayerRef.current.stopVideo();
          } catch (e) {
            console.error('Error stopping hidden player:', e);
          }
        }
        console.log('Stopping video playback');
      } else {
        setPlayerState('playing');
        
        // Start the appropriate player
        if (showSongDetails && visiblePlayerRef.current) {
          setTimeout(() => {
            visiblePlayerRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          }, 100);
        } else if (!showSongDetails && hiddenPlayerRef.current && typeof hiddenPlayerRef.current.playVideo === 'function') {
          try {
            hiddenPlayerRef.current.playVideo();
          } catch (e) {
            console.error('Error playing hidden player:', e);
          }
        }
        console.log('Playing video playback');
      }
    }
  };

  const handleRestart = () => {
    if (currentVideoId) {
      setPlayerState('stopped');
      
      // Restart the appropriate player
      if (showSongDetails && visiblePlayerRef.current) {
        visiblePlayerRef.current.contentWindow?.postMessage('{"event":"command","func":"seekTo","args":[0, true]}', '*');
      } else if (!showSongDetails && hiddenPlayerRef.current && typeof hiddenPlayerRef.current.seekTo === 'function') {
        try {
          hiddenPlayerRef.current.seekTo(0, true);
        } catch (e) {
          console.error('Error seeking hidden player:', e);
        }
      }
      
      // Small delay to ensure iframe is recreated
      setTimeout(() => {
        setPlayerState('playing');
        if (showSongDetails && visiblePlayerRef.current) {
          visiblePlayerRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } else if (!showSongDetails && hiddenPlayerRef.current && typeof hiddenPlayerRef.current.playVideo === 'function') {
          try {
            hiddenPlayerRef.current.playVideo();
          } catch (e) {
            console.error('Error playing hidden player:', e);
          }
        }
        console.log('Restarting video playback');
      }, 100);
    }
  };

  // Filter songs based on search term
  const filteredSongs = gameSession.songs.filter(song => {
    const searchLower = searchTerm.toLowerCase();
    const id = extractIdFromUrl(song.hitster_url);
    return (
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.year.toString().includes(searchLower) ||
      id.includes(searchLower)
    );
  });

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>{translations.back?.[currentLanguage] || 'Back'}</span>
            </button>
            <button className="game-session-title-button" onClick={onBack}>
              {songList.name}
            </button>
          </div>
          <div className="loading-message">
            Loading songs from {songList.name}...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  // Competition Game Settings Page
  if (gameType === 'game-type-2') {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>{translations.back?.[currentLanguage] || 'Back'}</span>
            </button>
            <button className="game-session-title-button" onClick={handleShowPreview}>
              {songList.name} | {translations.songs?.[currentLanguage] || 'Songs'}: {gameSession.songs.length}
            </button>
          </div>
          
          {/* Competition Game Settings */}
          <div className="competition-settings">
            <h2 className="settings-title">
              {translations.gameSettings?.[currentLanguage] || 'Game Settings'}
            </h2>

            {/* Game Mode Selection */}
            <div className="settings-section">
              <h3 className="section-title">{translations.gameMode?.[currentLanguage] || 'Game Mode'}</h3>
              
              <div className="game-mode-selection">
                <button
                  className={`mode-button ${competitionSettings.gameMode === 'target-score' ? 'active' : ''}`}
                  onClick={() => updateGameMode('target-score')}
                  type="button"
                >
                  {translations.targetScoreMode?.[currentLanguage] || 'Target Score'}
                </button>
                <button
                  className={`mode-button ${competitionSettings.gameMode === 'time-based' ? 'active' : ''}`}
                  onClick={() => updateGameMode('time-based')}
                  type="button"
                >
                  {translations.timeBasedMode?.[currentLanguage] || 'Time Based'}
                </button>
              </div>
              {/* Target Score (moved here) */}
              {competitionSettings.gameMode === 'target-score' && (
                <div className="setting-group">
                  <label className="setting-label">{translations.targetScorePoints?.[currentLanguage] || 'Target Score'}</label>
                  <div className="number-input-container">
                    <button
                      className="number-button"
                      onClick={() => handleSettingChange('targetScore', Math.max(10, competitionSettings.targetScore - 10))}
                      type="button"
                    >
                      -10
                    </button>
                    <div className="number-display">{competitionSettings.targetScore}</div>
                    <button
                      className="number-button"
                      onClick={() => handleSettingChange('targetScore', Math.min(500, competitionSettings.targetScore + 10))}
                      type="button"
                    >
                      +10
                    </button>
                  </div>
                </div>
              )}
               {/* Game Duration (for time-based mode) */}
              {competitionSettings.gameMode === 'time-based' && (
                <div className="setting-group">
                  <label className="setting-label">{translations.gameDuration?.[currentLanguage] || 'Game Duration'}</label>
                  <div className="number-input-container">
                    <button
                      className="number-button"
                      onClick={() => handleSettingChange('gameDuration', Math.max(5, competitionSettings.gameDuration - 5))}
                      type="button"
                    >
                      -5
                    </button>
                    <div className="number-display">{competitionSettings.gameDuration} {translations.minutes?.[currentLanguage] || 'minutes'}</div>
                    <button
                      className="number-button"
                      onClick={() => handleSettingChange('gameDuration', Math.min(120, competitionSettings.gameDuration + 5))}
                      type="button"
                    >
                      +5
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            
              
              
            
            {/* Game Rules Description */}
            <div className="rules-section">
              <h3 className="rules-title">
                {translations.gameRules?.[currentLanguage] || 'Game Rules'}
              </h3>
              <p className="rules-description">
                {competitionSettings.gameMode === 'time-based' 
                  ? translations.timeBasedRules?.[currentLanguage] || 'Players take turns guessing artist, title, and year. Points are awarded based on correct answers. The player with the most points when time runs out wins.'
                  : translations.targetScoreRules?.[currentLanguage] || 'Players take turns guessing artist, title, and year. Points are awarded based on correct answers. The first player to reach the target score wins. In case of a tie, Sudden Death rounds determine the winner.'
                }
              </p>
            </div>
            
            {/* Basic Settings */}
            <div className="settings-section">
              <div className="setting-group">
                 <h3 className="section-title">
                   {translations.numberOfPlayers?.[currentLanguage] || 'Number of Players'}
                </h3>
                <div className="number-input-container">
                  <button 
                    className="number-button"
                    onClick={() => updateNumberOfPlayers(-1)}
                    disabled={competitionSettings.numberOfPlayers <= 2}
                  >
                    -
                  </button>
                  <span className="number-display">{competitionSettings.numberOfPlayers}</span>
                  <button 
                    className="number-button"
                    onClick={() => updateNumberOfPlayers(1)} 
                    disabled={competitionSettings.numberOfPlayers >= 10}
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Player Names Section */}
              <div className="setting-group">
                <label className="setting-label">
                  {translations.playerNames?.[currentLanguage] || 'Player Names'}
                </label>
                <div className="player-names-grid">
                  {playerNames.map((name, index) => (
                    <div key={index} className="player-name-input">
                      <label className="player-label">
                        {translations.playerName?.[currentLanguage] || 'Player'} {index + 1}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => updatePlayerName(index, e.target.value)}
                        placeholder={`${translations.enterPlayerName?.[currentLanguage] || 'Enter player name'}`}
                        className="player-name-field"
                        maxLength={20}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Points System */}
            <div className="settings-section">
              <h3 className="section-title">
                {translations.pointsSystem?.[currentLanguage] || 'Points System'}
              </h3>
              
              <div className="points-grid">
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.artistCorrect?.[currentLanguage] || 'Artist Correct'}
                  </label>
                  <div className="number-input-container">
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('artistPoints', Math.max(1, competitionSettings.artistPoints - 1))}
                      disabled={competitionSettings.artistPoints <= 1}
                    >
                      -
                    </button>
                    <span className="number-display">{competitionSettings.artistPoints}</span>
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('artistPoints', Math.min(50, competitionSettings.artistPoints + 1))}
                      disabled={competitionSettings.artistPoints >= 50}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.titleCorrect?.[currentLanguage] || 'Title Correct'}
                  </label>
                  <div className="number-input-container">
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('titlePoints', Math.max(1, competitionSettings.titlePoints - 1))}
                      disabled={competitionSettings.titlePoints <= 1}
                    >
                      -
                    </button>
                    <span className="number-display">{competitionSettings.titlePoints}</span>
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('titlePoints', Math.min(50, competitionSettings.titlePoints + 1))}
                      disabled={competitionSettings.titlePoints >= 50}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.yearCorrect?.[currentLanguage] || 'Year Correct'}
                  </label>
                  <div className="number-input-container">
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('yearPoints', Math.max(1, competitionSettings.yearPoints - 1))}
                      disabled={competitionSettings.yearPoints <= 1}
                    >
                      -
                    </button>
                    <span className="number-display">{competitionSettings.yearPoints}</span>
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('yearPoints', Math.min(50, competitionSettings.yearPoints + 1))}
                      disabled={competitionSettings.yearPoints >= 50}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.bonusAllCorrect?.[currentLanguage] || 'Bonus (All Correct)'}
                  </label>
                  <div className="number-input-container">
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('bonusPoints', Math.max(0, competitionSettings.bonusPoints - 1))}
                      disabled={competitionSettings.bonusPoints <= 0}
                    >
                      -
                    </button>
                    <span className="number-display">{competitionSettings.bonusPoints}</span>
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('bonusPoints', Math.min(50, competitionSettings.bonusPoints + 1))}
                      disabled={!allSongsHaveYear}
                    >
                      +
                    </button>
                  </div>
                  {!allSongsHaveYear && (
                    <p className="setting-note" style={{ color: '#dc2626', fontWeight: '600' }}>
                      {currentLanguage === 'en' && 'Bonus scoring disabled - requires all songs to have year data'}
                      {currentLanguage === 'nl' && 'Bonus scoring uitgeschakeld - vereist dat alle nummers jaar gegevens hebben'}
                      {currentLanguage === 'de' && 'Bonus-Bewertung deaktiviert - erfordert Jahresangaben für alle Songs'}
                      {currentLanguage === 'fr' && 'Score bonus désactivé - nécessite que toutes les chansons aient des données d\'année'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Skip Settings */}
            <div className="settings-section">
              <h3 className="section-title">
                {translations.skipsSettings?.[currentLanguage] || 'Skip Settings'}
              </h3>
              
              <div className="skip-settings-grid">
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.skipsPerPlayer?.[currentLanguage] || 'Skips per Player'}
                  </label>
                  <div className="number-input-container">
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('skipsPerPlayer', Math.max(0, competitionSettings.skipsPerPlayer - 1))}
                      disabled={competitionSettings.skipsPerPlayer <= 0}
                    >
                      -
                    </button>
                    <span className="number-display">{competitionSettings.skipsPerPlayer}</span>
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('skipsPerPlayer', Math.min(10, competitionSettings.skipsPerPlayer + 1))}
                      disabled={competitionSettings.skipsPerPlayer >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="setting-group">
                  <label className="setting-label">
                    {translations.skipCost?.[currentLanguage] || 'Skip Cost (Points)'}
                  </label>
                  <div className="number-input-container">
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('skipCost', Math.max(0, competitionSettings.skipCost - 1))}
                      disabled={competitionSettings.skipCost <= 0}
                    >
                      -
                    </button>
                    <span className="number-display">{competitionSettings.skipCost}</span>
                    <button 
                      className="number-button"
                      onClick={() => handleSettingChange('skipCost', Math.min(20, competitionSettings.skipCost + 1))}
                      disabled={competitionSettings.skipCost >= 20}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Start Game Button */}
            <div className="start-game-section">
              <button 
                className="start-competition-button"
                onClick={handleStartCompetitionGame}
              >
                <Play size={20} />
                <span>{translations.startCompetition?.[currentLanguage] || 'Start Competition'}</span>
              </button>
            </div>
          </div>
          
          {/* Song Preview Modal - Same as hitster */}
          {showPreview && (
            <div className="preview-overlay">
              <div className="preview-popup">
                <div className="preview-header">
                  <h3 className="preview-title">
                    {songList.name} - {translations.songList?.[currentLanguage] || 'Song List'}
                  </h3>
                  <button
                    className="preview-close"
                    onClick={closePreview}
                    aria-label={translations.close?.[currentLanguage] || 'Close'}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="preview-content">
                  {gameSession.songs.length > 0 && (
                    <>
                      <div className="search-section">
                        <input
                          type="text"
                          placeholder={translations.searchPlaceholder?.[currentLanguage] || 'Search songs, artists, years, or IDs...'}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                        <div className="search-results-count">
                          {filteredSongs.length} {translations.songsCount?.[currentLanguage] || 'of'} {gameSession.songs.length} {translations.songsTotal?.[currentLanguage] || 'songs'}
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
                    </>
                  )}
                  
                  {gameSession.songs.length > 0 && filteredSongs.length === 0 && searchTerm && (
                    <div className="no-results">
                      {translations.noSongsFound?.[currentLanguage] || 'No songs found matching'} "{searchTerm}"
                    </div>
                  )}
                  
                  {gameSession.songs.length === 0 && (
                    <div className="no-songs">
                      {translations.noSongsAvailable?.[currentLanguage] || 'No songs available'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show dedicated player page when a song is matched
  if (showPlayer && matchedSong) {
    return (
      <div className="game-session">
        <div className="game-session-container">
          <div className="game-session-header">
            <button className="back-button" onClick={() => setShowPlayer(false)}>
              <ArrowLeft size={20} />
              <span>Back to Scanner</span>
            </button>
            <button className="game-session-title-button" disabled>
              {songList.name} | {translations.songs?.[currentLanguage] || 'Songs'}: {gameSession.songs.length}
            </button>
          </div>
          
          {/* Music Player Section */}
          <div className="music-player-section">
            <div className="song-info" style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
              {!detailsRevealed ? (
                <h3 className="song-found-title">
                  <Music size={24} />
                  {translations.songFoundReveal?.[currentLanguage]}
                </h3>
              ) : (
                <div className="revealed-song-info">
                  <h2 className="song-title">{matchedSong.title}</h2>
                  <p className="song-artist">{matchedSong.artist}</p>
                  <p className="song-year">{matchedSong.year}</p>
                </div>
              )}
            </div>
            
            {showSongDetails && (
              <div className="song-info">
                {/* YouTube Player */}
                <div className="youtube-player" style={{ marginTop: 'var(--spacing-8)', marginBottom: 'var(--spacing-8)' }}>
                  {showSongDetails ? (
                    <iframe
                      ref={visiblePlayerRef}
                      width="560"
                      height="315"
                      src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
                      title={videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      key={currentVideoId}
                    />
                  ) : (
                    <div className="video-placeholder">
                      <div className="placeholder-content">
                        <p>Video will appear here when playing</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Player Status */}
            <div className="background-player-status">
              <div className="status-info">
                <p className="status-text">
                  <strong>{translations.status?.[currentLanguage] || 'Status'}:</strong>{' '}
                  {playerState === 'playing' 
                    ? translations.playingInBackground?.[currentLanguage] || 'Playing'
                    : translations.stopped?.[currentLanguage] || 'Stopped'
                  }
                </p>
              </div>
            </div>
            
            {/* Player Controls */}
            <div className="player-controls">
              <button 
                className="control-button"
                onClick={handlePlayStop}
                disabled={!currentVideoId}
              >
                {playerState === 'playing' ? <StopIcon size={16} /> : <Play size={16} />}
                <span>{playerState === 'playing' ? (translations.stop?.[currentLanguage] || 'Stop') : (translations.play?.[currentLanguage] || 'Play')}</span>
              </button>
              <button 
                className="control-button"
                onClick={handleRestart}
                disabled={!currentVideoId}
              >
                <RotateCcw size={16} />
                <span>{translations.restart?.[currentLanguage] || 'Restart'}</span>
              </button>
            </div>
            
            {/* Scan Another Section */}
            <div className="scan-another-section" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-8)' }}>
              <div className="button-row">
                <button 
                  className="primary-button" 
                  onClick={handleToggleDetails}
                  disabled={detailsRevealed}
                  style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                >
                  <img 
                    src="/Hitreveal icon.svg" 
                    alt="HitReveal Logo" 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>{detailsRevealed ? 'REVEALED' : 'HITREVEAL'}</span>
                </button>
                <button className="primary-button" onClick={handleRescan}>
                  <QrCode size={20} />
                  <span>{translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}</span>
                </button>
              </div>
            </div>
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
            <ArrowLeft size={20} />
            <span>{translations.back?.[currentLanguage] || 'Back'}</span>
          </button>
          <button className="game-session-title-button" onClick={handleShowPreview}>
            {songList.name} | {translations.songs?.[currentLanguage] || 'Songs'}: {gameSession.songs.length}
          </button>
        </div>
        
        {/* Game Area */}
        <div className="game-area">
          {noMatchFound ? (
            <div className="no-match-message">
              <h4>{translations.noMatch?.[currentLanguage] || 'Song Not Found'}</h4>
              <p>
                {translations.qrCodeNotRecognized?.[currentLanguage] || 'We don\'t recognize this QR code. It might not be a HITSTER card or it\'s not in our database yet.'}
              </p>
              <p>
                <strong>Scanned content:</strong> {noMatchFound}
              </p>
              <p>
                {translations.helpBySharing?.[currentLanguage] || 'Help us by sharing the information on your cards! You can contribute by visiting:'}
              </p>
              <a 
                href="https://github.com/masselink/HITREVEAL" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-link"
              >
                <ExternalLink size={16} />
                https://github.com/masselink/HITREVEAL
              </a>
              
              <div style={{ marginTop: 'var(--spacing-6)', display: 'flex', justifyContent: 'center' }}>
                <button className="primary-button" onClick={handleRescan}>
                  <QrCode size={20} />
                  <span>{translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}</span>
                </button>
              </div>
            </div>
          ) : !isScanning ? (
            <div className="game-placeholder">
              <div className="placeholder-content">
                <QrCode className="placeholder-icon" size={64} />
                <h3 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: '600', 
                  color: 'var(--color-accent)', 
                  marginBottom: 'var(--spacing-4)',
                  textAlign: 'center'
                }}>
                  {translations.readyToScan?.[currentLanguage] || 'Ready to Scan'}
                </h3>
                <p style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-text-light)',
                  textAlign: 'center',
                  marginBottom: 'var(--spacing-6)',
                  lineHeight: '1.5'
                }}>
                  {translations.clickToStartScanning?.[currentLanguage] || 'Click the button below to start scanning HITSTER QR codes'}
                </p>
                <button className="primary-button" onClick={startScanning}>
                  <QrCode size={20} />
                  <span>{translations.startScanning?.[currentLanguage] || 'Start Scanning'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="qr-scanner-section">
              <div className="scanner-header">
                <h3 className="scanner-title">
                  <QrCode size={24} />
                  {translations.scanQrCode?.[currentLanguage] || 'Scan QR Code'}
                </h3>
                <p className="scanner-subtitle">
                  {translations.pointCameraAtQr?.[currentLanguage] || 'Point your camera at a HITSTER QR code'}
                </p>
              </div>
              
              <div className="scanner-container">
                <video
                  ref={videoRef}
                  className="scanner-video"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="scanner-canvas"
                  style={{ display: 'none' }}
                />
                
                <div className="scanner-overlay">
                  <div className="scanner-frame"></div>
                </div>
              </div>
              
              {scannerError && (
                <div className="scanner-error">
                  {scannerError}
                </div>
              )}
              
              <div className="scanner-controls">
                <button className="secondary-button" onClick={stopScanning}>
                  <X size={20} />
                  <span>{translations.cancel?.[currentLanguage] || 'Cancel'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Song Preview Modal */}
        {showPreview && (
          <div className="preview-overlay">
            <div className="preview-popup">
              <div className="preview-header">
                <h3 className="preview-title">
                  {songList.name} - {translations.songList?.[currentLanguage] || 'Song List'}
                </h3>
                <button
                  className="preview-close"
                  onClick={closePreview}
                  aria-label={translations.close?.[currentLanguage] || 'Close'}
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Mode-specific controls */}
              {gameMode === 'points' && (
                <div className="setting-group points-style">
                  <label className="setting-label">
                    {translations.targetScorePoints?.[currentLanguage] || 'Target Score'}
                  </label>
                  <div className="number-input-container">
                    <button
                      className="number-button"
                      onClick={() => setTargetScore(Math.max(10, targetScore - 10))}
                      type="button"
                    >
                      -10
                    </button>
                    <div className="number-display">
                      {targetScore} {translations.points?.[currentLanguage] || 'points'}
                    </div>
                    <button
                      className="number-button"
                      onClick={() => setTargetScore(Math.min(500, targetScore + 10))}
                      type="button"
                    >
                      +10
                    </button>
                  </div>
                </div>
              )}
              
              {gameMode === 'time-based' && (
                <div className="setting-group points-style">
                  <label className="setting-label">
                    {translations.gameDuration?.[currentLanguage] || 'Game Duration (Minutes)'}
                  </label>
                  <div className="number-input-container">
                    <button
                      className="number-button"
                      onClick={() => setGameDuration(Math.max(5, gameDuration - 5))}
                      type="button"
                    >
                      -5
                    </button>
                    <div className="number-display">
                      {gameDuration} {translations.minutes?.[currentLanguage] || 'minutes'}
                    </div>
                    <button
                      className="number-button"
                      onClick={() => setGameDuration(Math.min(120, gameDuration + 5))}
                      type="button"
                    >
                      +5
                    </button>
                  </div>
                </div>
              )}
              
              {gameMode === 'rounds' && (
                <div className="setting-group points-style">
                  <label className="setting-label">
                    {translations.maximumRounds?.[currentLanguage] || 'Maximum Rounds'}
                  </label>
                  <div className="number-input-container">
                    <button
                      className="number-button"
                      onClick={() => setMaximumRounds(Math.max(1, maximumRounds - 1))}
                      type="button"
                    >
                      -1
                    </button>
                    <div className="number-display">
                      {maximumRounds} {translations.rounds?.[currentLanguage] || 'rounds'}
                    </div>
                    <button
                      className="number-button"
                      onClick={() => setMaximumRounds(Math.min(50, maximumRounds + 1))}
                      type="button"
                    >
                      +1
                    </button>
                  </div>
                </div>
              )}
              
              <div className="preview-content">
                {gameSession.songs.length > 0 && (
                  <>
                    <div className="search-section">
                      <input
                        type="text"
                        placeholder={translations.searchPlaceholder?.[currentLanguage] || 'Search songs, artists, years, or IDs...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      <div className="search-results-count">
                        {filteredSongs.length} {translations.songsCount?.[currentLanguage] || 'of'} {gameSession.songs.length} {translations.songsTotal?.[currentLanguage] || 'songs'}
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
                  </>
                )}
                
                {gameSession.songs.length > 0 && filteredSongs.length === 0 && searchTerm && (
                  <div className="no-results">
                    {translations.noSongsFound?.[currentLanguage] || 'No songs found matching'} "{searchTerm}"
                  </div>
                )}
                
                {gameSession.songs.length === 0 && (
                  <div className="no-songs">
                    {translations.noSongsAvailable?.[currentLanguage] || 'No songs available'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};