import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Clock, Eye, X, Square } from 'lucide-react';
import { Language, SongList } from '../types';
import { translations } from '../data/translations';
import Papa from 'papaparse';

interface GameSelectionProps {
  currentLanguage: Language;
  onBack: () => void;
  onStartGame: (gameType: string, songList?: SongList) => void;
}

export const GameSelection: React.FC<GameSelectionProps> = ({
  currentLanguage,
  onBack,
  onStartGame
}) => {
  const [songLists, setSongLists] = useState<SongList[]>([]);
  const [filteredSongLists, setFilteredSongLists] = useState<SongList[]>([]);
  const [selectedSongList, setSelectedSongList] = useState<string>('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHitsterOptions, setShowHitsterOptions] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<string>('');
  const [songListsLoaded, setSongListsLoaded] = useState(false);
  const [competitionSongListsLoaded, setCompetitionSongListsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCompetitionPreview, setShowCompetitionPreview] = useState(false);
  const [previewSongs, setPreviewSongs] = useState<any[]>([]);
  const [competitionPreviewSongs, setCompetitionPreviewSongs] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [competitionPreviewLoading, setCompetitionPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [competitionPreviewError, setCompetitionPreviewError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [competitionSearchTerm, setCompetitionSearchTerm] = useState('');

  // Reset state when component mounts (when "Start Game" is pressed)
  useEffect(() => {
    setSongLists([]);
    setFilteredSongLists([]);
    setSelectedSongList('');
    setSelectedCountryFilter('all');
    setLoading(true);
    setError(null);
    setShowHitsterOptions(false);
    setSelectedGameType('');
    setSongListsLoaded(false);
    setCompetitionSongListsLoaded(false);
  }, []);

  const gameTypes = [
    {
      id: 'hitster-youtube',
      name: {
        en: 'Play Hitster',
        nl: 'Speel Hitster',
        de: 'Hitster spielen',
        fr: 'Jouer à Hitster'
      },
      subtitle: {
        en: 'with YouTube Music',
        nl: 'met YouTube Music',
        de: 'mit YouTube Music',
        fr: 'avec YouTube Music'
      },
      status: 'available' as const
    },
    {
      id: 'game-type-2',
      name: {
        en: 'Competition Game',
        nl: 'Competitie Spel',
        de: 'Wettbewerbsspiel',
        fr: 'Jeu de Compétition'
      },
      subtitle: {
        en: 'Challenge your friends',
        nl: 'Daag je vrienden uit',
        de: 'Fordere deine Freunde heraus',
        fr: 'Défiez vos amis'
      },
      status: 'available' as const
    }
  ];

  const getFlagEmoji = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'en': '🇬🇧',
      'nl': '🇳🇱', 
      'de': '🇩🇪',
      'us': '🇺🇸',
      'uk': '🇬🇧',
      'gb': '🇬🇧'
    };
    
    if (!country || country.trim() === '') {
      return '🌍';
    }
    
    const flag = flagMap[country.toLowerCase()];
    return flag || '🌍';
  };

  const getFlagImage = (country: string) => {
    const flagPaths: { [key: string]: string } = {
      'en': '/flags/en.svg',
      'nl': '/flags/nl.svg',
      'de': '/flags/de.svg',
      'us': '/flags/en.svg', // Use English flag for US
      'uk': '/flags/en.svg',
      'gb': '/flags/en.svg'
    };
    
    if (!country || country.trim() === '') {
      return null;
    }
    
    return flagPaths[country.toLowerCase()] || null;
  };

  const fetchSongLists = async () => {
    if (songListsLoaded) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('https://raw.githubusercontent.com/masselink/HITREVEAL-Songs/refs/heads/main/songlists/config.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const data = results.data as SongList[];
          // Filter out empty rows and rows without hitstercode
          const validData = data.filter(row => 
            row.name && 
            row.name.trim() !== '' && 
            row.hitstercode && 
            row.hitstercode.trim() !== ''
          );
          setSongLists(validData);
          setFilteredSongLists(validData);
          setSongListsLoaded(true);
          setLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setError('Failed to load song lists');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Error fetching song lists:', err);
      setError('Failed to load song lists');
      setLoading(false);
    }
  };

  const fetchCompetitionSongLists = async () => {
    if (competitionSongListsLoaded) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('https://raw.githubusercontent.com/masselink/HITREVEAL-Songs/refs/heads/main/songlists/config.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const data = results.data as SongList[];
          // Filter out empty rows and rows without hitstercode
          const validData = data.filter(row => 
            row.name && 
            row.name.trim() !== '' && 
            row.hitstercode && 
            row.hitstercode.trim() !== ''
          );
          setSongLists(validData);
          setFilteredSongLists(validData);
          setCompetitionSongListsLoaded(true);
          setLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setError('Failed to load song lists');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Error fetching song lists:', err);
      setError('Failed to load song lists');
      setLoading(false);
    }
  };

  // Get unique countries from song lists
  const getUniqueCountries = () => {
    const countries = songLists.map(list => list.country.toLowerCase()).filter(Boolean);
    return [...new Set(countries)];
  };

  // Filter song lists by country
  const handleCountryFilter = (country: string) => {
    setSelectedCountryFilter(country);
    setSelectedSongList(''); // Reset selection when filter changes
    setDropdownOpen(false); // Close dropdown
    
    if (country === 'all') {
      setFilteredSongLists(songLists);
    } else {
      const filtered = songLists.filter(list => list.country.toLowerCase() === country);
      setFilteredSongLists(filtered);
    }
  };

  const handleStartHitster = () => {
    // Only allow starting if game type 1 is selected
    if (selectedGameType !== 'hitster-youtube') {
      return;
    }
    
    const selectedList = filteredSongLists.find(list => list.name === selectedSongList);
    if (selectedList) {
      onStartGame('hitster-youtube', selectedList);
    }
  };

  const handleStartCompetition = () => {
    // Only allow starting if game type 2 is selected
    if (selectedGameType !== 'game-type-2') {
      return;
    }
    
    const selectedList = filteredSongLists.find(list => list.name === selectedSongList);
    if (selectedList) {
      onStartGame('game-type-2', selectedList);
    }
  };

  const handleDropdownSelect = (songListName: string) => {
    setSelectedSongList(songListName);
    setDropdownOpen(false);
  };

  const handleGameTypeClick = (gameType: typeof gameTypes[0]) => {
    if (gameType.status === 'coming-soon') {
      return; // Do nothing for coming soon games
    }
    
    setSelectedGameType(gameType.id);
    
    // Game type specific initialization
    if (gameType.id === 'hitster-youtube') {
      setShowHitsterOptions(true);
      if (!songListsLoaded) {
        fetchSongLists();
      }
    } else if (gameType.id === 'game-type-2') {
      setShowHitsterOptions(true);
      if (!competitionSongListsLoaded) {
        fetchCompetitionSongLists();
      }
    }
  };

  const selectedList = filteredSongLists.find(list => list.name === selectedSongList);

  const handleShowPreview = async () => {
    if (!selectedList) return;
    
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      const response = await fetch(selectedList.github_link);
      if (!response.ok) {
        throw new Error('Failed to fetch song list');
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const data = results.data as any[];
          const validData = data.filter(row => 
            row.hitster_url && 
            row.youtube_url && 
            row.title && 
            row.artist
          );
          setPreviewSongs(validData);
          setPreviewLoading(false);
        },
        error: (error) => {
          console.error('Error parsing preview CSV:', error);
          setPreviewError('Failed to load song list preview');
          setPreviewLoading(false);
        }
      });
    } catch (err) {
      console.error('Error fetching preview:', err);
      setPreviewError('Failed to load song list preview');
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewSongs([]);
    setPreviewError(null);
    setSearchTerm('');
  };

  const handleShowCompetitionPreview = async () => {
    if (!selectedList) return;
    
    setShowCompetitionPreview(true);
    setCompetitionPreviewLoading(true);
    setCompetitionPreviewError(null);
    
    try {
      const response = await fetch(selectedList.github_link);
      if (!response.ok) {
        throw new Error('Failed to fetch song list');
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const data = results.data as any[];
          const validData = data.filter(row => 
            row.hitster_url && 
            row.youtube_url && 
            row.title && 
            row.artist
          );
          setCompetitionPreviewSongs(validData);
          setCompetitionPreviewLoading(false);
        },
        error: (error) => {
          console.error('Error parsing preview CSV:', error);
          setCompetitionPreviewError('Failed to load song list preview');
          setCompetitionPreviewLoading(false);
        }
      });
    } catch (err) {
      console.error('Error fetching preview:', err);
      setCompetitionPreviewError('Failed to load song list preview');
      setCompetitionPreviewLoading(false);
    }
  };

  const closeCompetitionPreview = () => {
    setShowCompetitionPreview(false);
    setCompetitionPreviewSongs([]);
    setCompetitionPreviewError(null);
    setCompetitionSearchTerm('');
  };

  const extractIdFromUrl = (url: string) => {
    // Extract ID from hitster_url and remove leading zeros
    const match = url.match(/(\d+)$/);
    if (match) {
      return parseInt(match[1], 10).toString();
    }
    return '';
  };

  // Filter songs based on search term
  const filteredSongs = previewSongs.filter(song => {
    const searchLower = searchTerm.toLowerCase();
    const id = song.hitster_url ? extractIdFromUrl(song.hitster_url) : '';
    return (
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.year.toString().includes(searchLower) ||
      (id && id.includes(searchLower))
    );
  });

  // Filter competition songs based on search term
  const filteredCompetitionSongs = competitionPreviewSongs.filter(song => {
    const searchLower = competitionSearchTerm.toLowerCase();
    const id = song.hitster_url ? extractIdFromUrl(song.hitster_url) : '';
    return (
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.year.toString().includes(searchLower) ||
      (id && id.includes(searchLower))
    );
  });

  return (
    <div className="game-selection">
      <div className="game-selection-container">
        {/* Header */}
        <div className="game-selection-header">
          <button 
            className="back-button"
            onClick={onBack}
            aria-label={translations.back?.[currentLanguage] || 'Back'}
          >
            <ArrowLeft size={20} />
            <span>{translations.back?.[currentLanguage] || 'Back'}</span>
          </button>
          <h2 className="game-selection-title">
            {translations.selectGameType?.[currentLanguage] || 'Select Game Type'}
          </h2>
        </div>

        {/* Game Types */}
        <div className="game-types-grid">
          {gameTypes.map((gameType) => (
            <div
              key={gameType.id}
              className={`game-type-card ${gameType.status === 'coming-soon' ? 'coming-soon' : ''} ${selectedGameType === gameType.id ? 'selected' : ''}`}
              onClick={() => handleGameTypeClick(gameType)}
            >
              <div className="game-type-content">
                <h3 className="game-type-name">
                  {gameType.name[currentLanguage]}
                </h3>
                {gameType.subtitle && (
                  <p className="game-type-subtitle">
                    {gameType.subtitle[currentLanguage]}
                  </p>
                )}
                {gameType.status === 'coming-soon' && (
                  <div className="coming-soon-badge">
                    <Clock size={16} />
                    <span>{translations.comingSoon?.[currentLanguage] || 'Coming Soon'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* HITSTER Song List Selection */}
        {(selectedGameType === 'hitster-youtube' || selectedGameType === 'game-type-2') && showHitsterOptions && (
        <div className="hitster-options">
          <h3 className="options-title">
            {translations.selectSongList?.[currentLanguage] || 'Select Song List'}
          </h3>
          
          {/* Country Filter */}
          {!loading && !error && songLists.length > 0 && (selectedGameType === 'hitster-youtube' || selectedGameType === 'game-type-2') && (
            <div className="country-filter">
              <div className="filter-buttons">
                <button
                  className={`filter-button ${selectedCountryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleCountryFilter('all')}
                  type="button"
                >
                  <span className="filter-flag">🌍</span>
                  <span>All</span>
                </button>
                {getUniqueCountries().map((country) => {
                  const flagImage = getFlagImage(country);
                  return (
                    <button
                      key={country}
                      className={`filter-button ${selectedCountryFilter === country ? 'active' : ''}`}
                      onClick={() => handleCountryFilter(country)}
                      type="button"
                    >
                      {flagImage ? (
                        <img 
                          src={flagImage} 
                          alt={`${country} flag`}
                          className="filter-flag-image"
                        />
                      ) : (
                        <span className="filter-flag">🌍</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {loading && (
            <div className="loading-message">
              {translations.loadingSongLists?.[currentLanguage] || 'Loading song lists...'}
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {/* Song List Selection */}
          {!loading && !error && (selectedGameType === 'hitster-youtube' || selectedGameType === 'game-type-2') && (
            <>
              <div className="custom-dropdown">
                <button
                  className="dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  type="button"
                >
                  {selectedSongList ? (
                    <div className="selected-option">
                      {(() => {
                        const selectedListData = filteredSongLists.find(list => list.name === selectedSongList);
                        const flagImage = selectedListData ? getFlagImage(selectedListData.country) : null;
                        return (
                          <>
                            {flagImage ? (
                              <img 
                                src={flagImage} 
                                alt={`${selectedListData?.country} flag`}
                                className="dropdown-flag"
                              />
                            ) : (
                              <span className="flag-placeholder">🌍</span>
                            )}
                            <span>
                              {selectedListData?.country ? `${selectedListData.country.toUpperCase()} - ` : ''}{selectedSongList}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="placeholder-text"></span>
                  )}
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    {filteredSongLists.map((songList) => {
                      const flagImage = getFlagImage(songList.country);
                      return (
                        <button
                          key={songList.name}
                          className="dropdown-option"
                          onClick={() => handleDropdownSelect(songList.name)}
                          type="button"
                        >
                          {flagImage ? (
                            <img 
                              src={flagImage} 
                              alt={`${songList.country} flag`}
                              className="dropdown-flag"
                            />
                          ) : (
                            <span className="flag-placeholder">🌍</span>
                          )}
                          <span>
                            {songList.name}{songList.hitstercode ? ` | ${songList.hitstercode}` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="selected-description">
                <p className="description-text">
                  {!selectedSongList 
                    ? translations.selectHitsterGame?.[currentLanguage] || 'Please select the Hitster Game you would like to play'
                    : filteredSongLists.find(list => list.name === selectedSongList)?.description || translations.noDescriptionAvailable?.[currentLanguage] || 'No description available for this song list'
                  }
                </p>
              </div>
              
              {/* Preview Section */}
              {selectedSongList && selectedGameType === 'hitster-youtube' && (
                <div className="preview-section">
                  <button
                    className="preview-button"
                    onClick={handleShowPreview}
                    type="button"
                  >
                    <Eye size={16} />
                    <span>{translations.previewSongs?.[currentLanguage] || 'Preview Songs'}</span>
                  </button>
                </div>
              )}
              
              {/* Preview Section for Competition */}
              {selectedSongList && selectedGameType === 'game-type-2' && (
                <div className="preview-section">
                  <button
                    className="preview-button"
                    onClick={handleShowCompetitionPreview}
                    type="button"
                  >
                    <Eye size={16} />
                    <span>{translations.previewSongs?.[currentLanguage] || 'Preview Songs'}</span>
                  </button>
                </div>
              )}
              
              {/* Start Button for Hitster */}
              {selectedGameType === 'hitster-youtube' && (
                <button
                  className="start-hitster-button"
                  onClick={handleStartHitster}
                  disabled={!selectedSongList}
                >
                  <Play size={20} />
                  <span>
                    {translations.startHitster?.[currentLanguage] || 'Start HITSTER'}
                  </span>
                </button>
              )}
              
              {/* Start Button for Competition */}
              {selectedGameType === 'game-type-2' && (
                <button
                  className="start-hitster-button"
                  onClick={handleStartCompetition}
                  disabled={!selectedSongList}
                >
                  <Play size={20} />
                  <span>
                    {translations.competitionGame?.[currentLanguage] || 'Start Competition'}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
        )}
        
      </div>
      
      {/* Song List Preview Popup for Hitster */}
      {showPreview && selectedGameType === 'hitster-youtube' && (
        <div className="preview-overlay">
          <div className="preview-popup">
            <div className="preview-header">
              <h3 className="preview-title">
                {selectedList?.name} - {translations.songList?.[currentLanguage] || 'Song List'}
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
              {previewLoading && (
                <div className="preview-loading">
                  {translations.loadingSongs?.[currentLanguage] || 'Loading songs...'}
                </div>
              )}
              
              {previewError && (
                <div className="preview-error">
                  {previewError}
                </div>
              )}
              
              {!previewLoading && !previewError && previewSongs.length > 0 && (
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
                      {filteredSongs.length} {translations.songsCount?.[currentLanguage] || 'of'} {previewSongs.length} {translations.songsTotal?.[currentLanguage] || 'songs'}
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
              
              {!previewLoading && !previewError && previewSongs.length > 0 && filteredSongs.length === 0 && searchTerm && (
                <div className="no-results">
                  {translations.noSongsFound?.[currentLanguage] || 'No songs found matching'} "{searchTerm}"
                </div>
              )}
              
              {!previewLoading && !previewError && previewSongs.length === 0 && (
                <div className="no-songs">
                  {translations.noValidSongs?.[currentLanguage] || 'No valid songs found in this list.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Song List Preview Popup for Competition */}
      {showCompetitionPreview && selectedGameType === 'game-type-2' && (
        <div className="preview-overlay">
          <div className="preview-popup">
            <div className="preview-header">
              <h3 className="preview-title">
                {selectedList?.name} - {translations.songList?.[currentLanguage] || 'Song List'}
              </h3>
              <button
                className="preview-close"
                onClick={closeCompetitionPreview}
                aria-label={translations.close?.[currentLanguage] || 'Close'}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="preview-content">
              {competitionPreviewLoading && (
                <div className="preview-loading">
                  {translations.loadingSongs?.[currentLanguage] || 'Loading songs...'}
                </div>
              )}
              
              {competitionPreviewError && (
                <div className="preview-error">
                  {competitionPreviewError}
                </div>
              )}
              
              {!competitionPreviewLoading && !competitionPreviewError && competitionPreviewSongs.length > 0 && (
                <>
                  <div className="search-section">
                    <input
                      type="text"
                      placeholder={translations.searchPlaceholder?.[currentLanguage] || 'Search songs, artists, years, or IDs...'}
                      value={competitionSearchTerm}
                      onChange={(e) => setCompetitionSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <div className="search-results-count">
                      {filteredCompetitionSongs.length} {translations.songsCount?.[currentLanguage] || 'of'} {competitionPreviewSongs.length} {translations.songsTotal?.[currentLanguage] || 'songs'}
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
                      {filteredCompetitionSongs.map((song, index) => {
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
              
              {!competitionPreviewLoading && !competitionPreviewError && competitionPreviewSongs.length > 0 && filteredCompetitionSongs.length === 0 && competitionSearchTerm && (
                <div className="no-results">
                  {translations.noSongsFound?.[currentLanguage] || 'No songs found matching'} "{competitionSearchTerm}"
                </div>
              )}
              
              {!competitionPreviewLoading && !competitionPreviewError && competitionPreviewSongs.length === 0 && (
                <div className="no-songs">
                  {translations.noValidSongs?.[currentLanguage] || 'No valid songs found in this list.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};