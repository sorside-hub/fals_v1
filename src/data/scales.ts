import { ScaleFormula } from '../types';

export const SCALES: Record<string, ScaleFormula> = {
  major: {
    name: 'Major Scale (Ionian)',
    symbol: 'Mayor',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    mood: 'Fondasi musik duniawi: cerah, tuntas, universal',
    usage: 'Pop, Rock, Ballad, Hymn'
  },
  minor: {
    name: 'Natural Minor (Aeolian)',
    symbol: 'Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    mood: 'Emosional, kelam, introspektif, sendu',
    usage: 'Akustik galau, Metal, EDM, Pop Melow'
  },
  pentatonic_major: {
    name: 'Pentatonic Major',
    symbol: 'Penta Major',
    intervals: [0, 2, 4, 7, 9],
    mood: 'Akrab, manis, tidak pernah ada nada salah (anti-fals)',
    usage: 'Solo gitar melodi, Country, Pop, R&B'
  },
  pentatonic_minor: {
    name: 'Pentatonic Minor',
    symbol: 'Penta Minor',
    intervals: [0, 3, 5, 7, 10],
    mood: 'Gahar, gritty, ikonik solo gitar rock',
    usage: 'Rock, Blues, Funk soloing'
  },
  blues: {
    name: 'Blues Scale',
    symbol: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    mood: 'Sentuhan "Blue Note" (b5) yang bikin bulu kuduk merinding',
    usage: 'Blues, Jazz, Classic Rock'
  },
  dorian: {
    name: 'Dorian Mode',
    symbol: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    mood: 'Minor tapi agak cool & misterius berkelas (ada natural 6th)',
    usage: 'Santana, Daft Punk (Get Lucky), Pink Floyd'
  },
  mixolydian: {
    name: 'Mixolydian Mode',
    symbol: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    mood: 'Mayor yang santai, gaya pantai, jam band retro',
    usage: 'The Beatles (Norwegian Wood), Sweet Home Alabama'
  },
  lydian: {
    name: 'Lydian Mode',
    symbol: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    mood: 'Ajaib, luar angkasa, melayang, sci-fi (ada #4)',
    usage: 'Soundtrack film luar angkasa, The Simpsons intro'
  }
};
