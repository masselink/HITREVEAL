import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Language, SongList } from '../types';
import { translations } from '../data/translations';

interface CompetitionGameProps {
  currentLanguage: Language;
  songList: SongList;
  onBack: () => void;
}

export const CompetitionGame: React.FC<CompetitionGameProps> = ({
  currentLanguage,
  songList,
  onBack
}) => {
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [showNoMoreTurnsWarning, setShowNoMoreTurnsWarning] = useState(false);

  useEffect(() => {
    // Load songs from the song list
    const loadSongs = async () => {
      if (!songList.github_link) {
        setIsLoadingSongs(false);
        return;
      }

      try {
        const response = await fetch(songList.github_link);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const validSongs = results.data.filter((song: any) => 
              song.artist && song.title && song.hitster_url
            );
            setSongs(validSongs);
            setIsLoadingSongs(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setIsLoadingSongs(false);
          }
        });
      } catch (error) {
        console.error('Error loading songs:', error);
        setIsLoadingSongs(false);
      }
    };

    loadSongs();
  }, [songList]);

  useEffect(() => {
    // Check if there are no more turns possible when entering the dashboard
    if (isLoadingSongs) return;
    
    const playersCount = 2; // Default minimum players
    const songsLeft = songs.length;
    
    if (songsLeft < playersCount) {
      setShowNoMoreTurnsWarning(true);
    }
  }, [songs, isLoadingSongs]);

  const handleNoMoreTurnsOkay = () => {
    setShowNoMoreTurnsWarning(false);
  };

  return (
    <div className="competition-game">
      <div className="competition-game-container">
        <div className="competition-header">
          <button onClick={onBack} className="back-button">
            {translations.back[currentLanguage]}
          </button>
          <h1>{translations.competitionGame[currentLanguage]}</h1>
        </div>

        <div className="competition-content">
          <p>{translations.comingSoon[currentLanguage]}</p>
        </div>

        {/* No More Turns Warning Modal */}
        {showNoMoreTurnsWarning && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{translations.noMoreTurns[currentLanguage]}</h3>
              <p>
                There are not enough songs left in the list for all players to have another turn. 
                The winner will be decided based on the last completed full round.
              </p>
              <div className="modal-actions">
                <button 
                  onClick={handleNoMoreTurnsOkay}
                  className="primary-button"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};