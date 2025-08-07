import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Square, Eye, QrCode, List, X, Music } from 'lucide-react';
import { Language, Song } from '../types';
import { translations } from '../data/translations';

interface YouTubePlayerProps {
  currentLanguage: Language;
  currentSong: Song;
  allSongs: Song[];
  onScanAnother: () => void;
  onSongListView: () => void;
  songListViewCount: number;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
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
  const [searchTerm, setSearchTerm] = useState('');
  const playerRef = useRef<any>(null);

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
              setIsPlayerReady(true);
              // Autostart playing when player is ready
              if (currentSong) {
                const videoId = extractVideoId(currentSong.youtube_url);
                if (videoId) {
                  playerRef.current.loadVideoById(videoId);
                  playerRef.current.playVideo();
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
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Autostart when currentSong changes and player is ready
  useEffect(() => {
    if (currentSong && playerRef.current && playerRef.current.loadVideoById && isPlayerReady) {
      const videoId = extractVideoId(currentSong.youtube_url);
      if (videoId) {
        playerRef.current.loadVideoById(videoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  }, [currentSong, isPlayerReady]);

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
    if (playerRef.current && isPlayerReady) {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const pauseMusic = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  };

  const restartMusic = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const stopMusic = () => {
    if (playerRef.current && isPlayerReady) {
      playerRef.current.stopVideo();
      setIsPlaying(false);
    }
  };

  const handleReveal = () => {
    setShowReveal(true);
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

        {/* Simple Controls */}
        <div className="simple-controls">
          <button 
            className="control-button start-pause-button" 
            onClick={togglePlayPause}
            disabled={!isPlayerReady}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? translations.pause?.[currentLanguage] || 'Pause' : translations.start?.[currentLanguage] || 'Start'}</span>
          </button>
          
          <button 
            className="control-button restart-button secondary-blue" 
            onClick={restartMusic}
            disabled={!isPlayerReady}
          >
            <RotateCcw size={16} />
            <span>{translations.restart?.[currentLanguage] || 'Restart'}</span>
          </button>
          
          <button 
            className="control-button stop-button secondary-blue" 
            onClick={stopMusic}
            disabled={!isPlayerReady}
          >
            <Square size={16} />
            <span>{translations.stop?.[currentLanguage] || 'Stop'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {!showReveal && (
            <button className="primary-button" onClick={handleReveal}>
              <Eye size={16} />
              <span>Reveal Song</span>
            </button>
          )}
          <button className="scan-another-button" onClick={onScanAnother}>
            <QrCode size={16} />
            <span>{translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}</span>
          </button>
        </div>

        {/* Hidden YouTube Player */}
        <div className="background-video-container">
          <div id="youtube-player"></div>
        </div>
      </div>
    </>
  );
};