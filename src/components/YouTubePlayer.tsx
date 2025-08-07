import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Square, Eye, QrCode, List, X } from 'lucide-react';
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
  const [showSongList, setShowSongList] = useState(false);
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
  const filteredSongs = allSongs.filter(song => {
    const searchLower = searchTerm.toLowerCase();
    const id = song.hitster_url ? extractIdFromUrl(song.hitster_url) : '';
    return (
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.year.toString().includes(searchLower) ||
      (id && id.includes(searchLower))
    );
  });
  return (
    <>
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
            <button className="scan-another-button" onClick={handleShowSongList}>
              <List size={16} />
              <span>
                {translations.songList?.[currentLanguage] || 'Song List'}
                {songListViewCount > 0 && (
                  <span className="view-counter"> ({songListViewCount})</span>
                )}
              </span>
            </button>
            <button className="scan-another-button" onClick={onScanAnother}>
              <QrCode size={16} />
              <span>{translations.scanAnother?.[currentLanguage] || 'Scan Another Card'}</span>
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

        {/* Hidden YouTube Player */}
        <div className="background-video-container">
          <div id="youtube-player"></div>
        </div>
      </div>

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
                  {filteredSongs.length} {translations.songsCount?.[currentLanguage] || 'of'} {allSongs.length} {translations.songsTotal?.[currentLanguage] || 'songs'}
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
                    const isCurrentSong = song.hitster_url === currentSong.hitster_url;
                    
                    return (
                      <div key={index} className={`song-row ${isCurrentSong ? 'current-song' : ''}`}>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};