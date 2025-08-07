import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Square, Eye, QrCode, List, X, Music } from 'lucide-react';
import { Language, Song } from '../types';
import { translations } from '../data/translations';

interface CompetitionYouTubePlayerProps {
  currentLanguage: Language;
  currentSong: Song;
  allSongs: Song[];
  onScanAnother: () => void;
  onSongListView: () => void;
  songListViewCount: number;
  onGuess?: (guessType: 'artist' | 'title' | 'year', isCorrect: boolean) => void;
  onSkip?: () => void;
}

export const CompetitionYouTubePlayer: React.FC<CompetitionYouTubePlayerProps> = ({
  currentLanguage,
  currentSong,
  allSongs,
  onScanAnother,
  onSongListView,
  songListViewCount,
  onGuess,
  onSkip
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [guessedArtist, setGuessedArtist] = useState(false);
  const [guessedTitle, setGuessedTitle] = useState(false);
  const [guessedYear, setGuessedYear] = useState(false);
  const [showGuessing, setShowGuessing] = useState(false);
  const hiddenPlayerRef = useRef<any>(null);
  const visiblePlayerRef = useRef<any>(null);

  // Initialize YouTube Player
  useEffect(() => {
    const initYouTubePlayer = () => {
      if (window.YT && window.YT.Player) {
        hiddenPlayerRef.current = new window.YT.Player('competition-youtube-player', {
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
              console.log('Competition YouTube player ready');
              setIsPlayerReady(true);
              // Autostart playing when player is ready
              if (currentSong) {
                const videoId = extractVideoId(currentSong.youtube_url);
                if (videoId) {
                  hiddenPlayerRef.current.loadVideoById(videoId);
                  hiddenPlayerRef.current.playVideo();
                  setIsPlaying(true);
                }
              }
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
      if (hiddenPlayerRef.current && hiddenPlayerRef.current.destroy) {
        hiddenPlayerRef.current.destroy();
      }
      if (visiblePlayerRef.current && visiblePlayerRef.current.destroy) {
        visiblePlayerRef.current.destroy();
      }
    };
  }, []);

  // Autostart when currentSong changes and player is ready
  useEffect(() => {
    if (currentSong && hiddenPlayerRef.current && hiddenPlayerRef.current.loadVideoById && isPlayerReady) {
      const videoId = extractVideoId(currentSong.youtube_url);
      if (videoId) {
        hiddenPlayerRef.current.loadVideoById(videoId);
        hiddenPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  }, [currentSong, isPlayerReady]);

  // Initialize visible player when video is shown
  useEffect(() => {
    if (showVideo && window.YT && window.YT.Player && !visiblePlayerRef.current) {
      const videoId = extractVideoId(currentSong.youtube_url);
      if (videoId) {
        visiblePlayerRef.current = new window.YT.Player('competition-visible-youtube-player', {
          height: '315',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: () => {
              // Stop the hidden player when visible player is ready
              if (hiddenPlayerRef.current && hiddenPlayerRef.current.pauseVideo) {
                hiddenPlayerRef.current.pauseVideo();
              }
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
              }
            }
          }
        });
      }
    }
  }, [showVideo, currentSong]);

  const extractVideoId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  };

  const playMusic = () => {
    const activePlayer = showVideo ? visiblePlayerRef.current : hiddenPlayerRef.current;
    if (activePlayer && (showVideo || isPlayerReady)) {
      activePlayer.playVideo();
      setIsPlaying(true);
    }
  };

  const pauseMusic = () => {
    const activePlayer = showVideo ? visiblePlayerRef.current : hiddenPlayerRef.current;
    if (activePlayer && (showVideo || isPlayerReady)) {
      activePlayer.pauseVideo();
      setIsPlaying(false);
    }
  };

  const restartMusic = () => {
    const activePlayer = showVideo ? visiblePlayerRef.current : hiddenPlayerRef.current;
    if (activePlayer && (showVideo || isPlayerReady)) {
      activePlayer.seekTo(0);
      activePlayer.playVideo();
      setIsPlaying(true);
    }
  };

  const stopMusic = () => {
    const activePlayer = showVideo ? visiblePlayerRef.current : hiddenPlayerRef.current;
    if (activePlayer && (showVideo || isPlayerReady)) {
      activePlayer.stopVideo();
      setIsPlaying(false);
    }
  };

  const handleReveal = () => {
    setShowReveal(true);
    setShowVideo(true);
    setShowGuessing(true);
  };

  const handleGuess = (guessType: 'artist' | 'title' | 'year') => {
    if (guessType === 'artist') setGuessedArtist(true);
    if (guessType === 'title') setGuessedTitle(true);
    if (guessType === 'year') setGuessedYear(true);
    
    // For now, assume all guesses are correct - this can be enhanced later
    onGuess?.(guessType, true);
  };

  const handleSkip = () => {
    onSkip?.();
    onScanAnother();
  };

  return (
    <>
      <div className="simple-player-section">
        {/* Reveal Section Header */}
        <div className="reveal-section-header">
          <h3 className="reveal-section-title">
            <Music size={24} />
            {translations.songFoundReveal?.[currentLanguage] || 'Song Found! Do you need a reveal?'}
          </h3>
        </div>

        {/* Song Info (only show when revealed) */}
        {showReveal && (
          <div className="revealed-song-info">
            <div 
              className={`song-title ${showGuessing ? 'clickable' : ''} ${guessedTitle ? 'guessed' : ''}`}
              onClick={showGuessing ? () => handleGuess('title') : undefined}
            >
              {currentSong.title}
            </div>
            <div 
              className={`song-artist ${showGuessing ? 'clickable' : ''} ${guessedArtist ? 'guessed' : ''}`}
              onClick={showGuessing ? () => handleGuess('artist') : undefined}
            >
              {currentSong.artist}
            </div>
            {currentSong.year && (
              <div 
                className={`song-year ${showGuessing ? 'clickable' : ''} ${guessedYear ? 'guessed' : ''}`}
                onClick={showGuessing ? () => handleGuess('year') : undefined}
              >
                {currentSong.year}
              </div>
            )}
          </div>
        )}

        {/* YouTube Video Player (visible when revealed) */}
        {showVideo && (
          <div className="youtube-video-container">
            <div id="competition-visible-youtube-player"></div>
          </div>
        )}

        {/* Simple Controls */}
        <div className="simple-controls">
          <button 
            className="control-button start-pause-button" 
            onClick={togglePlayPause}
            disabled={!showVideo && !isPlayerReady}
          >
            {isPlaying ? <Square size={16} /> : <Play size={16} />}
            <span>{isPlaying ? translations.stop?.[currentLanguage] || 'Stop' : translations.start?.[currentLanguage] || 'Start'}</span>
          </button>
          
          <button 
            className="control-button restart-button secondary-blue" 
            onClick={restartMusic}
            disabled={!showVideo && !isPlayerReady}
          >
            <RotateCcw size={16} />
            <span>{translations.restart?.[currentLanguage] || 'Restart'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {!showReveal && (
            <>
              <button className="primary-button" onClick={handleReveal}>
                <Eye size={16} />
                <span>HITREVEAL</span>
              </button>
              <button className="scan-another-button" onClick={handleSkip}>
                <span>SKIP</span>
              </button>
            </>
          )}
          {showReveal && (
            <button className="scan-another-button" onClick={onScanAnother}>
              <span>NEXT SONG</span>
            </button>
          )}
        </div>

        {/* Hidden YouTube Player */}
        <div className="background-video-container">
          <div id="competition-youtube-player"></div>
        </div>
      </div>
    </>
  );
};