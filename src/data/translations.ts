import { Translations } from '../types';

export const translations: Translations = {
  // Header
  gameTitle: {
    en: 'HitReveal',
    nl: 'HitReveal',
    de: 'HitReveal',
    fr: 'HitReveal'
  },
  
  // Main Game Area
  welcomeTitle: {
    en: 'Welcome to HITREVEAL',
    nl: 'Welkom bij HITREVEAL',
    de: 'Willkommen bei HITREVEAL',
    fr: 'Bienvenue sur HITREVEAL'
  },
  welcomeSubtitle: {
    en: 'The ultimate music guessing experience',
    nl: 'De ultieme muziek raad ervaring',
    de: 'Das ultimative Musik-Ratespiel',
    fr: 'L\'expérience ultime de devinette musicale'
  },
  gameDescription: {
    en: 'An interactive music game app that lets you play the popular HITSTER game through YouTube Music.\n\nHITREVEAL is an independent application and is in no way connected to, or supported by, HITSTER or its publishers.\n\nThis app was developed with the goal of making the fun of music games like HITSTER accessible to a broader community, including YouTube Music users.',
    nl: 'Een interactieve muziekspel-app waarmee je het populaire spel HITSTER kunt spelen maar dan via YouTube Music.\n\nHITREVEAL is een onafhankelijke applicatie en staat op geen enkele manier in verbinding met, of wordt ondersteund door, HITSTER of haar uitgevers.\n\nDeze app is ontwikkeld met als doel het plezier van muziekspellen zoals HITSTER toegankelijk te maken voor een bredere community, waaronder gebruikers YouTube Music.',
    de: 'Eine interaktive Musikspiel-App, mit der du das beliebte HITSTER-Spiel über YouTube Music spielen kannst.\n\nHITREVEAL ist eine unabhängige Anwendung und steht in keiner Weise in Verbindung mit HITSTER oder dessen Verlegern oder wird von diesen unterstützt.\n\nDiese App wurde mit dem Ziel entwickelt, den Spaß an Musikspielen wie HITSTER einer breiteren Community zugänglich zu machen, einschließlich YouTube Music-Nutzern.',
    fr: 'Une application de jeu musical interactif qui vous permet de jouer au populaire jeu HITSTER via YouTube Music.\n\nHITREVEAL est une application indépendante et n\'est en aucun cas connectée à, ou soutenue par, HITSTER ou ses éditeurs.\n\nCette application a été développée dans le but de rendre le plaisir des jeux musicaux comme HITSTER accessible à une communauté plus large, y compris les utilisateurs de YouTube Music.'
  },
}
// This file is deprecated - translations are now in separate language files
// Import from src/data/translations/index.ts instead
export * from './translations/index';