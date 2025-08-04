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
  hitstercode: string;
  github_link: string;
  description: string;
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
}