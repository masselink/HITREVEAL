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
}

export const CompetitionYouTubePlayer: React.FC<CompetitionYouTubePlayerProps> = ({
  currentLanguage,
  currentSong,
  allSongs,
  onScanAnother,
  onSongListView,
  songListViewCount
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
            <h2 className="song-title">{currentSong.title}</h2>
            <p className="song-artist">{currentSong.artist}</p>
            {currentSong.year && <p className="song-year">{currentSong.year}</p>}
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
            <button className="primary-button" onClick={handleReveal}>
              <Eye size={16} />
              <span>HITREVEAL</span>
            </button>
          )}
          <button className="scan-another-button" onClick={onScanAnother}>
            <QrCode size={16} />
            <span>{translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}</span>
          </button>
        </div>

        {/* Hidden YouTube Player */}
        <div className="background-video-container">
          <div id="competition-youtube-player"></div>
        </div>
      </div>
    </>
  );
};