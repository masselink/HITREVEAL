import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Square, Eye, QrCode, List, X, Music, Check } from 'lucide-react';
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
  onTurnComplete?: (scores: { artist: boolean; title: boolean; year: boolean }) => void;
  onSkip?: () => void;
  artistPoints?: number;
  titlePoints?: number;
  yearPoints?: number;
  bonusPoints?: number;
}

export const CompetitionYouTubePlayer: React.FC<CompetitionYouTubePlayerProps> = ({
  currentLanguage,
  currentSong,
  allSongs,
  onScanAnother,
  onSongListView,
  songListViewCount,
  onGuess,
  onTurnComplete,
  onSkip,
  artistPoints = 1,
  titlePoints = 2,
  yearPoints = 1,
  bonusPoints = 2,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isVisiblePlayerReady, setIsVisiblePlayerReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [guessedArtist, setGuessedArtist] = useState(false);
  const [guessedTitle, setGuessedTitle] = useState(false);
  const [guessedYear, setGuessedYear] = useState(false);
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
    if (!showVideo && visiblePlayerRef.current) {
      visiblePlayerRef.current.destroy();
      visiblePlayerRef.current = null;
      setIsVisiblePlayerReady(false);
    }
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
              setIsVisiblePlayerReady(true);
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
    if (activePlayer && (showVideo ? isVisiblePlayerReady : isPlayerReady)) {
      activePlayer.playVideo();
      setIsPlaying(true);
    }
  };

  const pauseMusic = () => {
    const activePlayer = showVideo ? visiblePlayerRef.current : hiddenPlayerRef.current;
    if (activePlayer && (showVideo ? isVisiblePlayerReady : isPlayerReady)) {
      activePlayer.pauseVideo();
      setIsPlaying(false);
    }
  };

  const restartMusic = () => {
    const activePlayer = showVideo ? visiblePlayerRef.current : hiddenPlayerRef.current;
    if (activePlayer && (showVideo ? isVisiblePlayerReady : isPlayerReady)) {
      activePlayer.seekTo(0);
      activePlayer.playVideo();
      setIsPlaying(true);
    }
  };

  const stopMusic = () => {
    const activePlayer = showVideo ? visiblePlayerRef.current : hiddenPlayerRef.current;
    if (activePlayer && (showVideo ? isVisiblePlayerReady : isPlayerReady)) {
      activePlayer.stopVideo();
      setIsPlaying(false);
    }
  };

  const handleReveal = () => {
    setShowReveal(true);
    setShowVideo(true);
  };

  const handleToggleGuess = (guessType: 'artist' | 'title' | 'year') => {
    if (guessType === 'artist') {
      setGuessedArtist(!guessedArtist);
      onGuess?.(guessType, !guessedArtist);
    }
    if (guessType === 'title') {
      setGuessedTitle(!guessedTitle);
      onGuess?.(guessType, !guessedTitle);
    }
    if (guessType === 'year') {
      setGuessedYear(!guessedYear);
      onGuess?.(guessType, !guessedYear);
    }
  };

  const getTotalScore = () => {
    let total = 0;
    if (guessedArtist) total += artistPoints;
    if (guessedTitle) total += titlePoints;
    if (guessedYear) total += yearPoints;
    
    // Bonus if all are correct (only if year data exists)
    if (guessedArtist && guessedTitle && guessedYear && currentSong.year) {
      total += bonusPoints;
    }
    
    return total;
  };

  const handleSkip = () => {
    onSkip?.();
    onScanAnother();
  };

  const handleTurnComplete = () => {
    console.log('🎯 TURN COMPLETE BUTTON PRESSED!');
    console.log('🔍 Current guessed states:', { guessedArtist, guessedTitle, guessedYear });
    console.log('⚙️ Point settings:', { artistPoints, titlePoints, yearPoints, bonusPoints });
    console.log('🎵 Current song has year:', !!currentSong.year);
    
    // Calculate detailed score breakdown
    const scoreDetails = {
      artist: guessedArtist,
      title: guessedTitle,
      year: guessedYear,
      artistPoints: guessedArtist ? artistPoints : 0,
      titlePoints: guessedTitle ? titlePoints : 0,
      yearPoints: guessedYear && currentSong.year ? yearPoints : 0,
      bonusPoints: (guessedArtist && guessedTitle && guessedYear && currentSong.year) ? bonusPoints : 0,
      totalPoints: getTotalScore()
    };
    
    console.log('📊 SCORE DETAILS BEING PASSED:', scoreDetails);
    console.log('🔄 onTurnComplete callback exists:', !!onTurnComplete);
    console.log('🔄 onTurnComplete type:', typeof onTurnComplete);
    
    // Pass the detailed score breakdown to the parent component
    if (onTurnComplete) {
      console.log('✅ CALLING onTurnComplete WITH SCORES');
      onTurnComplete(scoreDetails);
    } else {
      console.error('❌ onTurnComplete callback not provided!');
      // Fallback to just going back
      onScanAnother();
    }
    console.log('🏁 TURN COMPLETE FUNCTION FINISHED');
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
            <Check size={16} />
            <div className="competition-scoring-section">
              <div 
                className={`scoring-item ${guessedTitle ? 'selected' : ''}`}
                onClick={() => handleToggleGuess('title')}
              >
                <div className="scoring-checkbox">
                  {guessedTitle && <Check size={16} />}
                </div>
                <div className="scoring-content">
                  <div className="scoring-label">Title</div>
                  <div className="scoring-value">{currentSong.title}</div>
                </div>
                <div className="scoring-points">+{titlePoints}</div>
              </div>
              
              <div 
                className={`scoring-item ${guessedArtist ? 'selected' : ''}`}
                onClick={() => handleToggleGuess('artist')}
              >
                <div className="scoring-checkbox">
                  {guessedArtist && <Check size={16} />}
                </div>
                <div className="scoring-content">
                  <div className="scoring-label">Artist</div>
                  <div className="scoring-value">{currentSong.artist}</div>
                </div>
                <div className="scoring-points">+{artistPoints}</div>
              </div>
              
              {currentSong.year && (
                <div 
                  className={`scoring-item ${guessedYear ? 'selected' : ''}`}
                  onClick={() => handleToggleGuess('year')}
                >
                  <div className="scoring-checkbox">
                    {guessedYear && <Check size={16} />}
                  </div>
                  <div className="scoring-content">
                    <div className="scoring-label">Year</div>
                    <div className="scoring-value">{currentSong.year}</div>
                  </div>
                  <div className="scoring-points">+{yearPoints}</div>
                </div>
              )}
              
              {bonusPoints > 0 && currentSong.year && (
                <div className={`bonus-item ${guessedArtist && guessedTitle && guessedYear ? 'active' : ''}`}>
                  <div className="bonus-content">
                    <div className="bonus-label">Bonus (All Correct)</div>
                    <div className="bonus-points">+{bonusPoints}</div>
                  </div>
                </div>
              )}
              
              <div className="total-score">
                <div className="total-label">Total Score</div>
                <div className="total-points">{getTotalScore()} points</div>
              </div>
            </div>
          </div>
        )}

        {/* Song Info (legacy - keeping for non-competition modes) */}
        {showReveal && false && (
          <div className="revealed-song-info">
            <div className="song-title">
              {currentSong.title}
            </div>
            <div className="song-artist">
              {currentSong.artist}
            </div>
            {currentSong.year && (
              <div className="song-year">
                {currentSong.year}
              </div>
            )}
          </div>
        )}

        {/* Legacy song info display - hidden for competition */}
        {false && showReveal && (
          <div className="revealed-song-info">
            <div className="song-title">
              {currentSong.title}
            </div>
            <div className="song-artist">
              {currentSong.artist}
            </div>
            {currentSong.year && (
              <div className="song-year">
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
            disabled={showVideo ? !isVisiblePlayerReady : !isPlayerReady}
          >
            {isPlaying ? <Square size={16} /> : <Play size={16} />}
            <span>{isPlaying ? translations.stop?.[currentLanguage] || 'Stop' : translations.start?.[currentLanguage] || 'Start'}</span>
          </button>
          
          <button 
            className="control-button restart-button secondary-blue" 
            onClick={restartMusic}
            disabled={showVideo ? !isVisiblePlayerReady : !isPlayerReady}
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
            <button className="turn-complete-button" onClick={handleTurnComplete}>
              <span>TURN COMPLETE</span>
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