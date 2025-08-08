export type Language = 'en' | 'nl' | 'de' | 'fr';

export interface GameState {
  currentLanguage: Language;
  gameMode: 'waiting' | 'playing' | 'paused';
}

export interface Translations {
  [key: string]: {
    en: string;
    nl: string;
    de: string;
    fr: string;
  };
}

export interface GameMode {
  id: string;
  name: string;
  status: 'available' | 'coming-soon';
}

export interface SongList {
  name: string;
  country: string;
  competition: string | boolean;
  hitster: string | boolean;
  spotify: string;
  youtube: string;
  hitstercode: string;
  github_link: string;
  description?: string;
}

export interface Song {
  hitster_url: string;
  youtube_url: string;
  artist: string;
  title: string;
  year: string;
  [key: string]: string;
}

export interface GameSession {
  songList: SongList;
  songs: Song[];
  currentSong?: Song;
  isPlaying: boolean;
  gameType?: string;
}

export interface CompetitionSettings {
  numberOfPlayers: number;
  gameMode: 'points' | 'time-based' | 'rounds';
  targetScore: number;
  gameDuration: number;
  maximumRounds: number;
  artistPoints: number;
  titlePoints: number;
  yearPoints: number;
  bonusPoints: number;
  skipsPerPlayer: number;
  skipCost: number;
  drawType: 'highest-score' | 'multiple-winners' | 'sudden-death';
}