import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Clock, Eye, X, Square } from 'lucide-react';
import { Language, SongList } from '../types';
import { getTranslation } from '../data/translations';
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
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('none');
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
      id: 'game-type-2',
      name: {
        en: 'Competition Game',
        nl: 'Competitie Spel',
        de: 'Wettbewerbsspiel',
        fr: 'Jeu de Compétition'
      },
      subtitle: {
        en: 'Challenge your friends or play solo...',
        nl: 'Daag je vrienden uit of speel solo...',
        de: 'Fordere deine Freunde heraus oder spiele solo...',
        fr: 'Défiez vos amis ou jouez en solo...'
      },
      status: 'available' as const
    },
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
        delimiter: ';',
        complete: (results) => {
          const data = results.data as SongList[];
          // Filter out empty rows and rows without hitstercode
          const validData = data.filter(row => 
            row.name && 
            row.name.trim() !== '' && 
            row.hitstercode && 
            row.hitstercode.trim() !== '' &&
            (row.hitster === 'true' || row.hitster === '1' || row.hitster === true)
          );
          
          // Ensure github_link is a complete URL
          const processedData = validData.map(row => ({
            ...row,
            github_link: row.github_link && !row.github_link.startsWith('http') 
              ? `https://raw.githubusercontent.com/masselink/HITREVEAL-Songs/refs/heads/main/${row.github_link}`
              : row.github_link
          }));
          
          setSongLists(processedData);
          setFilteredSongLists(processedData);
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
        delimiter: ';',
        complete: (results) => {
          const data = results.data as SongList[];
          // Filter out empty rows and rows without hitstercode
          const validData = data.filter(row => 
            row.name && 
            row.name.trim() !== '' && 
            (row.competition === 'true' || row.competition === '1' || row.competition === true || row.competition === 1)
          );
          
          // Ensure github_link is a complete URL
          const processedData = validData.map(row => ({
            ...row,
            github_link: row.github_link && !row.github_link.startsWith('http') 
              ? `https://raw.githubusercontent.com/masselink/HITREVEAL-Songs/refs/heads/main/${row.github_link}`
              : row.github_link
          }));
          
          console.log('Competition song lists loaded:', validData.length, 'lists');
          console.log('Competition lists:', validData.map(list => ({ name: list.name, competition: list.competition })));
          setSongLists(processedData);
          setFilteredSongLists(processedData);
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
    
    if (country === 'none') {
      setFilteredSongLists(songLists);
    } else if (country === 'all') {
      // Show only songlists where country is empty or undefined
      const filtered = songLists.filter(list => !list.country || list.country.trim() === '');
      setFilteredSongLists(filtered);
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
    
    window.scrollTo(0, 0);
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
    
    window.scrollTo(0, 0);
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
        delimiter: ';',
        complete: (results) => {
          const data = results.data as any[];
          const validData = data.filter(row => 
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
      // Ensure the URL has a protocol
      let url = selectedList.github_link;
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      console.log('Loading preview from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch song list: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log('Preview CSV loaded, parsing...');
      
      Papa.parse(csvText, {
        header: true,
        delimiter: ';',
        complete: (results) => {
          const data = results.data as any[];
          const validData = data.filter(row => 
            row.youtube_url && 
            row.title && 
            row.artist
          );
          console.log(`Preview parsed ${data.length} total songs, ${validData.length} valid songs`);
          setCompetitionPreviewSongs(validData);
          setCompetitionPreviewLoading(false);
        },
        error: (error) => {
          console.error('Error parsing preview CSV:', error);
          setCompetitionPreviewError(`Failed to parse preview CSV: ${error.message}`);
          setCompetitionPreviewLoading(false);
        }
      });
    } catch (err) {
      console.error('Error fetching preview:', err);
      setCompetitionPreviewError(`Failed to load preview: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    // Check if url is valid before calling match
    if (!url || typeof url !== 'string') {
      return '';
    }
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
            aria-label={getTranslation('back', currentLanguage)}
          >
            <ArrowLeft size={20} />
            <span>{getTranslation('back', currentLanguage)}</span>
          </button>
          <h2 className="game-selection-title">
            {getTranslation('selectGameType', currentLanguage)}
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
                    <span>{getTranslation('comingSoon', currentLanguage)}</span>
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
            {getTranslation('selectSongList', currentLanguage)}
          </h3>
          
          {/* Country Filter */}
          {!loading && !error && songLists.length > 0 && (selectedGameType === 'hitster-youtube' || selectedGameType === 'game-type-2') && (
            <div className="country-filter">
              <div className="filter-buttons">
                <button
                  className={`filter-button ${selectedCountryFilter === 'none' ? 'active' : ''}`}
                  onClick={() => handleCountryFilter('none')}
                  type="button"
                >
                  <svg width="20" height="20" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="filter-flag-svg" role="img" aria-hidden="true">
                    <path fill="currentColor" d="M34,6.4C34,5.6,33.3,5,32.5,5H10.3l2,2H32v0.6l-9.6,9.6l1.4,1.4L33.4,9C33.8,8.6,34,8.1,34,7.6V6.5C34,6.5,34,6.4,34,6.4z" className="clr-i-outline clr-i-outline-path-1"></path>
                    <path fill="currentColor" d="M2.7,3l2,2h-1C2.9,4.9,2.1,5.5,2,6.3v1.1c0,0.5,0.2,1,0.6,1.4L14,20.2v10.3l1.9,0.8V19.4L4,7.5V7h2.7L20,20.3v12.9l2,0.8
		c0,0,0,0,0-0.1V22.3l10.1,10.1l1.4-1.4L4.1,1.6L2.7,3z" className="clr-i-outline clr-i-outline-path-2"></path>
                    <rect x="0" y="0" width="36" height="36" fillOpacity="0"/>
                  </svg>
                </button>
                <button
                  className={`filter-button ${selectedCountryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleCountryFilter('all')}
                  type="button"
                >
                  <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="filter-flag-svg" role="img" aria-hidden="true">
                    <g>
                      <path fill="currentColor" d="m9.989,0a10,10 0 0 0 -9.989,10a10,10 0 0 0 10,10a10,10 0 0 0 3.701,-0.71a335.965,335.965 0 0 1 -0.999,-1.724c-0.542,0.692 -1.146,1.166 -1.777,1.388c-0.141,0.014 -0.283,0.025 -0.425,0.032l0,-4.16l0.599,0a5.051,5.051 0 0 1 -0.443,-1l-0.156,0l0,-0.622a5.468,5.468 0 0 1 0,-2.03l0,-0.674l0.174,0a5.078,5.078 0 0 1 0.295,-0.713c0.048,-0.098 0.1,-0.193 0.155,-0.287l-0.623,0l0,-3.326l3.839,0c0.066,0.254 0.126,0.515 0.179,0.781a5.086,5.086 0 0 1 0.99,-0.145a15.303,15.303 0 0 0 -0.138,-0.637l2.778,0a8.955,8.955 0 0 1 0.537,1.47a5.551,5.551 0 0 1 1.232,1.074a10,10 0 0 0 -9.917,-8.717a10,10 0 0 0 -0.011,0zm0.511,1.136c1.054,0.179 2.06,1.047 2.854,2.487c0.256,0.464 0.484,0.985 0.682,1.55l-3.535,0l0,-4.037zm-1,0.039l0,3.998l-3.35,0c0.198,-0.565 0.426,-1.086 0.682,-1.55c0.746,-1.356 1.683,-2.203 2.668,-2.448l0,0zm-2.304,0.271c-0.465,0.47 -0.882,1.044 -1.241,1.695c-0.336,0.61 -0.625,1.293 -0.862,2.032l-2.691,0c1.107,-1.741 2.795,-3.074 4.794,-3.727zm5.882,0.093c1.88,0.683 3.464,1.974 4.52,3.635l-2.507,0c-0.237,-0.739 -0.525,-1.422 -0.861,-2.032c-0.335,-0.609 -0.723,-1.15 -1.151,-1.602l0,0zm-11.227,4.635l2.962,0c-0.249,1.032 -0.402,2.152 -0.441,3.326l-3.358,0a8.958,8.958 0 0 1 0.837,-3.326l0,0zm3.995,0l3.654,0l0,3.326l-4.127,0c0.042,-1.187 0.209,-2.311 0.473,-3.326l0,0zm-4.832,4.326l3.352,0c0.026,1.171 0.164,2.291 0.399,3.326l-2.914,0a8.958,8.958 0 0 1 -0.837,-3.326zm4.352,0l4.133,0l0,3.326l-3.704,0c-0.249,-1.02 -0.401,-2.143 -0.429,-3.326zm-2.965,4.326l2.627,0c0.248,0.817 0.56,1.568 0.926,2.233c0.288,0.522 0.614,0.994 0.971,1.404c-1.881,-0.682 -3.467,-1.974 -4.524,-3.636l0,0zm3.679,0l3.419,0l0,4.16c-0.062,-0.003 -0.122,-0.01 -0.184,-0.014c-0.918,-0.3 -1.785,-1.124 -2.485,-2.395c-0.286,-0.519 -0.538,-1.107 -0.751,-1.75l0,0z"/>
                      <path fill="#f25c84" d="m15.4,7c-2.308,0 -4.2,1.886 -4.2,4.188c0,0.892 0.285,1.721 0.767,2.402l2.921,5.049c0.409,0.534 0.681,0.433 1.021,-0.028l3.221,-5.482c0.065,-0.118 0.116,-0.243 0.161,-0.371a4.133,4.133 0 0 0 0.309,-1.57c0,-2.302 -1.891,-4.188 -4.2,-4.188zm0,1.962c1.243,0 2.232,0.986 2.232,2.226c0,1.24 -0.989,2.225 -2.232,2.225c-1.243,0 -2.232,-0.986 -2.232,-2.225c0,-1.24 0.989,-2.226 2.232,-2.226z"/>
                    </g>
                  </svg>
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
              {getTranslation('loadingSongLists', currentLanguage)}
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
                             <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="dropdown-flag-svg" role="img" aria-hidden="true">
                               <g>
                                 <path fill="currentColor" d="m9.989,0a10,10 0 0 0 -9.989,10a10,10 0 0 0 10,10a10,10 0 0 0 3.701,-0.71a335.965,335.965 0 0 1 -0.999,-1.724c-0.542,0.692 -1.146,1.166 -1.777,1.388c-0.141,0.014 -0.283,0.025 -0.425,0.032l0,-4.16l0.599,0a5.051,5.051 0 0 1 -0.443,-1l-0.156,0l0,-0.622a5.468,5.468 0 0 1 0,-2.03l0,-0.674l0.174,0a5.078,5.078 0 0 1 0.295,-0.713c0.048,-0.098 0.1,-0.193 0.155,-0.287l-0.623,0l0,-3.326l3.839,0c0.066,0.254 0.126,0.515 0.179,0.781a5.086,5.086 0 0 1 0.99,-0.145a15.303,15.303 0 0 0 -0.138,-0.637l2.778,0a8.955,8.955 0 0 1 0.537,1.47a5.551,5.551 0 0 1 1.232,1.074a10,10 0 0 0 -9.917,-8.717a10,10 0 0 0 -0.011,0zm0.511,1.136c1.054,0.179 2.06,1.047 2.854,2.487c0.256,0.464 0.484,0.985 0.682,1.55l-3.535,0l0,-4.037zm-1,0.039l0,3.998l-3.35,0c0.198,-0.565 0.426,-1.086 0.682,-1.55c0.746,-1.356 1.683,-2.203 2.668,-2.448l0,0zm-2.304,0.271c-0.465,0.47 -0.882,1.044 -1.241,1.695c-0.336,0.61 -0.625,1.293 -0.862,2.032l-2.691,0c1.107,-1.741 2.795,-3.074 4.794,-3.727zm5.882,0.093c1.88,0.683 3.464,1.974 4.52,3.635l-2.507,0c-0.237,-0.739 -0.525,-1.422 -0.861,-2.032c-0.335,-0.609 -0.723,-1.15 -1.151,-1.602l0,0zm-11.227,4.635l2.962,0c-0.249,1.032 -0.402,2.152 -0.441,3.326l-3.358,0a8.958,8.958 0 0 1 0.837,-3.326l0,0zm3.995,0l3.654,0l0,3.326l-4.127,0c0.042,-1.187 0.209,-2.311 0.473,-3.326l0,0zm-4.832,4.326l3.352,0c0.026,1.171 0.164,2.291 0.399,3.326l-2.914,0a8.958,8.958 0 0 1 -0.837,-3.326zm4.352,0l4.133,0l0,3.326l-3.704,0c-0.249,-1.02 -0.401,-2.143 -0.429,-3.326zm-2.965,4.326l2.627,0c0.248,0.817 0.56,1.568 0.926,2.233c0.288,0.522 0.614,0.994 0.971,1.404c-1.881,-0.682 -3.467,-1.974 -4.524,-3.636l0,0zm3.679,0l3.419,0l0,4.16c-0.062,-0.003 -0.122,-0.01 -0.184,-0.014c-0.918,-0.3 -1.785,-1.124 -2.485,-2.395c-0.286,-0.519 -0.538,-1.107 -0.751,-1.75l0,0z"/>
                                 <path fill="#f25c84" d="m15.4,7c-2.308,0 -4.2,1.886 -4.2,4.188c0,0.892 0.285,1.721 0.767,2.402l2.921,5.049c0.409,0.534 0.681,0.433 1.021,-0.028l3.221,-5.482c0.065,-0.118 0.116,-0.243 0.161,-0.371a4.133,4.133 0 0 0 0.309,-1.57c0,-2.302 -1.891,-4.188 -4.2,-4.188zm0,1.962c1.243,0 2.232,0.986 2.232,2.226c0,1.24 -0.989,2.225 -2.232,2.225c-1.243,0 -2.232,-0.986 -2.232,-2.225c0,-1.24 0.989,-2.226 2.232,-2.226z"/>
                               </g>
                             </svg>
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
                           <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="dropdown-flag-svg" role="img" aria-hidden="true">
                             <g>
                               <path fill="currentColor" d="m9.989,0a10,10 0 0 0 -9.989,10a10,10 0 0 0 10,10a10,10 0 0 0 3.701,-0.71a335.965,335.965 0 0 1 -0.999,-1.724c-0.542,0.692 -1.146,1.166 -1.777,1.388c-0.141,0.014 -0.283,0.025 -0.425,0.032l0,-4.16l0.599,0a5.051,5.051 0 0 1 -0.443,-1l-0.156,0l0,-0.622a5.468,5.468 0 0 1 0,-2.03l0,-0.674l0.174,0a5.078,5.078 0 0 1 0.295,-0.713c0.048,-0.098 0.1,-0.193 0.155,-0.287l-0.623,0l0,-3.326l3.839,0c0.066,0.254 0.126,0.515 0.179,0.781a5.086,5.086 0 0 1 0.99,-0.145a15.303,15.303 0 0 0 -0.138,-0.637l2.778,0a8.955,8.955 0 0 1 0.537,1.47a5.551,5.551 0 0 1 1.232,1.074a10,10 0 0 0 -9.917,-8.717a10,10 0 0 0 -0.011,0zm0.511,1.136c1.054,0.179 2.06,1.047 2.854,2.487c0.256,0.464 0.484,0.985 0.682,1.55l-3.535,0l0,-4.037zm-1,0.039l0,3.998l-3.35,0c0.198,-0.565 0.426,-1.086 0.682,-1.55c0.746,-1.356 1.683,-2.203 2.668,-2.448l0,0zm-2.304,0.271c-0.465,0.47 -0.882,1.044 -1.241,1.695c-0.336,0.61 -0.625,1.293 -0.862,2.032l-2.691,0c1.107,-1.741 2.795,-3.074 4.794,-3.727zm5.882,0.093c1.88,0.683 3.464,1.974 4.52,3.635l-2.507,0c-0.237,-0.739 -0.525,-1.422 -0.861,-2.032c-0.335,-0.609 -0.723,-1.15 -1.151,-1.602l0,0zm-11.227,4.635l2.962,0c-0.249,1.032 -0.402,2.152 -0.441,3.326l-3.358,0a8.958,8.958 0 0 1 0.837,-3.326l0,0zm3.995,0l3.654,0l0,3.326l-4.127,0c0.042,-1.187 0.209,-2.311 0.473,-3.326l0,0zm-4.832,4.326l3.352,0c0.026,1.171 0.164,2.291 0.399,3.326l-2.914,0a8.958,8.958 0 0 1 -0.837,-3.326zm4.352,0l4.133,0l0,3.326l-3.704,0c-0.249,-1.02 -0.401,-2.143 -0.429,-3.326zm-2.965,4.326l2.627,0c0.248,0.817 0.56,1.568 0.926,2.233c0.288,0.522 0.614,0.994 0.971,1.404c-1.881,-0.682 -3.467,-1.974 -4.524,-3.636l0,0zm3.679,0l3.419,0l0,4.16c-0.062,-0.003 -0.122,-0.01 -0.184,-0.014c-0.918,-0.3 -1.785,-1.124 -2.485,-2.395c-0.286,-0.519 -0.538,-1.107 -0.751,-1.75l0,0z"/>
                               <path fill="#f25c84" d="m15.4,7c-2.308,0 -4.2,1.886 -4.2,4.188c0,0.892 0.285,1.721 0.767,2.402l2.921,5.049c0.409,0.534 0.681,0.433 1.021,-0.028l3.221,-5.482c0.065,-0.118 0.116,-0.243 0.161,-0.371a4.133,4.133 0 0 0 0.309,-1.57c0,-2.302 -1.891,-4.188 -4.2,-4.188zm0,1.962c1.243,0 2.232,0.986 2.232,2.226c0,1.24 -0.989,2.225 -2.232,2.225c-1.243,0 -2.232,-0.986 -2.232,-2.225c0,-1.24 0.989,-2.226 2.232,-2.226z"/>
                             </g>
                           </svg>
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
                    ? getTranslation('selectHitsterGame', currentLanguage)
                    : filteredSongLists.find(list => list.name === selectedSongList)?.description || getTranslation('noDescriptionAvailable', currentLanguage)
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
                    <span>{getTranslation('previewSongs', currentLanguage)}</span>
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
                    <span>{getTranslation('previewSongs', currentLanguage)}</span>
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
                    {getTranslation('startHitster', currentLanguage)}
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
                    {getTranslation('competitionGame', currentLanguage)}
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
                {selectedList?.name} - {getTranslation('songList', currentLanguage)}
              </h3>
              <button
                className="preview-close"
                onClick={closePreview}
                aria-label={getTranslation('close', currentLanguage)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="preview-content">
              {previewLoading && (
                <div className="preview-loading">
                  {getTranslation('loadingSongs', currentLanguage)}
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
                      placeholder={getTranslation('searchPlaceholder', currentLanguage)}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <div className="search-results-count">
                      {filteredSongs.length} {getTranslation('songsCount', currentLanguage)} {previewSongs.length} {getTranslation('songsTotal', currentLanguage)}
                    </div>
                  </div>
                  
                  <div className="songs-list">
                    <div className="list-header">
                      <div className="header-id">{getTranslation('id', currentLanguage)}</div>
                      <div className="header-title">{getTranslation('title', currentLanguage)}</div>
                      <div className="header-artist">{getTranslation('artist', currentLanguage)}</div>
                      <div className="header-year">{getTranslation('year', currentLanguage)}</div>
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
                  {getTranslation('noSongsFound', currentLanguage)} "{searchTerm}"
                </div>
              )}
              
              {!previewLoading && !previewError && previewSongs.length === 0 && (
                <div className="no-songs">
                  {getTranslation('noValidSongs', currentLanguage)}
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
                {selectedList?.name} - {getTranslation('songList', currentLanguage)}
              </h3>
              <button
                className="preview-close"
                onClick={closeCompetitionPreview}
                aria-label={getTranslation('close', currentLanguage)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="preview-content">
              {competitionPreviewLoading && (
                <div className="preview-loading">
                  {getTranslation('loadingSongs', currentLanguage)}
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
                      placeholder={getTranslation('searchPlaceholder', currentLanguage)}
                      value={competitionSearchTerm}
                      onChange={(e) => setCompetitionSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <div className="search-results-count">
                      {filteredCompetitionSongs.length} {getTranslation('songsCount', currentLanguage)} {competitionPreviewSongs.length} {getTranslation('songsTotal', currentLanguage)}
                    </div>
                  </div>
                  
                  <div className="songs-list">
                    <div className="list-header">
                      <div className="header-id">{getTranslation('id', currentLanguage)}</div>
                      <div className="header-title">{getTranslation('title', currentLanguage)}</div>
                      <div className="header-artist">{getTranslation('artist', currentLanguage)}</div>
                      <div className="header-year">{getTranslation('year', currentLanguage)}</div>
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
                  {getTranslation('noSongsFound', currentLanguage)} "{competitionSearchTerm}"
                </div>
              )}
              
              {!competitionPreviewLoading && !competitionPreviewError && competitionPreviewSongs.length === 0 && (
                <div className="no-songs">
                  {getTranslation('noValidSongs', currentLanguage)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};