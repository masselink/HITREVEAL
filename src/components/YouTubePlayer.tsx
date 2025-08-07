import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Square, Eye, QrCode } from 'lucide-react';
import { Language, Song } from '../types';
import { translations } from '../data/translations';

interface YouTubePlayerProps {
  currentLanguage: Language;
  currentSong: Song;
  onScanAnother: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  currentLanguage,
  currentSong,
  onScanAnother
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
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

  return (
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
          <button className="scan-another-button" onClick={onScanAnother}>
            <QrCode size={16} />
            <span>{translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}</span>
          </button>
        </div>
      </div>

      {/* Hidden YouTube Player */}
      <div className="background-video-container">
        <div id="youtube-player"></div>
      </div>
    </div>
  );
};