import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Square, Eye, QrCode, List, X, Music } from 'lucide-react';
import { Language, Song } from '../types';
import { getTranslation } from '../data/translations';

interface YouTubePlayerProps {
  currentLanguage: Language;
  currentSong: Song;
  allSongs: Song[];
  onScanAnother: () => void;
  onSongListView: () => void;
  songListViewCount: number;
  songListName?: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  currentLanguage,
  currentSong,
  allSongs,
  onScanAnother,
  onSongListView,
  songListViewCount,
  songListName = 'Unknown Songlist',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isVisiblePlayerReady, setIsVisiblePlayerReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const hiddenPlayerRef = useRef<any>(null);
  const visiblePlayerRef = useRef<any>(null);

  // Initialize YouTube Player
  useEffect(() => {
    const initYouTubePlayer = () => {
      if (window.YT && window.YT.Player) {
        hiddenPlayerRef.current = new window.YT.Player('youtube-player', {
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
              setIsPlayerReady(true);
              // Load the video but don't autoplay on mobile to avoid issues
              if (currentSong) {
                const videoId = extractVideoId(currentSong.youtube_url);
                if (videoId) {
                  hiddenPlayerRef.current.loadVideoById(videoId);
                  // Don't autoplay in onReady to avoid mobile issues
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
        // On mobile, autoplay might be blocked, so we don't set isPlaying to true immediately
        // Let the user manually start playback
        try {
          hiddenPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch (error) {
          console.log('Autoplay blocked on mobile, user interaction required');
          setIsPlaying(false);
        }
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
        visiblePlayerRef.current = new window.YT.Player('visible-youtube-player', {
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

  return (
    <>
      <div className="simple-player-section">
        {/* Reveal Section Header */}
        <div className="reveal-section-header">
          <h3 className="reveal-section-title">
            <Music size={24} />
            {getTranslation('songFoundReveal', currentLanguage)}
          </h3>
        </div>

        {/* Song Info (only show when revealed) */}
        {showReveal && (
          <div className="revealed-song-info">
            <h2 className="song-title">{currentSong.title}</h2>
            <p className="song-artist">{currentSong.artist}</p>
            {currentSong.year && <p className="song-year">{currentSong.year}</p>}
          </div>
        )}

        {/* YouTube Video Player (visible when revealed) */}
        {showVideo && (
          <div className="youtube-video-container">
            <div id="visible-youtube-player"></div>
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
            <span>{isPlaying ? getTranslation('stop', currentLanguage) : getTranslation('start', currentLanguage)}</span>
          </button>
          
          <button 
            className="control-button restart-button secondary-blue" 
            onClick={restartMusic}
            disabled={showVideo ? !isVisiblePlayerReady : !isPlayerReady}
          >
            <RotateCcw size={16} />
            <span>{getTranslation('restart', currentLanguage)}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {!showReveal && (
            <button className="primary-button" onClick={handleReveal}>
              <Eye size={16} />
              <span>HITREVEAL</span>
            </button>
          )}
          <button className="scan-another-button" onClick={onScanAnother}>
            <QrCode size={16} />
            <span>{getTranslation('scanAnother', currentLanguage)}</span>
          </button>
        </div>
        
        {/* Error Reporting Link */}
        {showReveal && (
          <div className="error-reporting-section">
            <p className="error-reporting-text">
              <a 
                href={`mailto:hitreveal-song-error@collectingvibes.com?subject=Song%20Error%20Report%20-%20${encodeURIComponent(currentSong.title)}%20by%20${encodeURIComponent(currentSong.artist)}${currentSong.year ? `%20(${encodeURIComponent(currentSong.year)})` : ''}%20from%20${encodeURIComponent(songListName)}`}
                className="error-reporting-link"
              >
                {getTranslation('reportPlaylistProblems', currentLanguage)}
              </a>
            </p>
          </div>
        )}


        {/* Hidden YouTube Player */}
        <div className="background-video-container">
          <div id="youtube-player"></div>
        </div>
      </div>
    </>
  );
};