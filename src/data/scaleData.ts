export interface ScaleType {
  id: string;
  name: string;
  category: 'popular' | 'modes' | 'exotic';
  intervals: number[]; // semitones relative to root
  formulaNames: string;
  description: string;
  characteristicSemitones?: number[]; // semitones for special color highlight (e.g. blue note = 6)
}

export const SCALE_TYPES: ScaleType[] = [
  // Populer
  {
    id: 'diatonic-major',
    name: 'Mayor (Ionian)',
    category: 'popular',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    formulaNames: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    description: 'Skala dasar 7 nada utama, bernuansa cerah, stabil dan bahagia.',
  },
  {
    id: 'diatonic-minor',
    name: 'Minor (Aeolian)',
    category: 'popular',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    formulaNames: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    description: 'Skala minor alami 7 nada, syahdu, sedih, dan melankolis.',
  },
  {
    id: 'pentatonic-major',
    name: 'Pentatonik Mayor',
    category: 'popular',
    intervals: [0, 2, 4, 7, 9],
    formulaNames: '1 - 2 - 3 - 5 - 6',
    description: 'Nada manis dan lapang, khas musik akustik, country, & pop manis.',
  },
  {
    id: 'pentatonic-minor',
    name: 'Pentatonik Minor',
    category: 'popular',
    intervals: [0, 3, 5, 7, 10],
    formulaNames: '1 - b3 - 4 - 5 - b7',
    description: 'Skala paling populer untuk solo gitar rock, pop, blues & indie.',
  },
  {
    id: 'blues',
    name: 'Blues Scale',
    category: 'popular',
    intervals: [0, 3, 5, 6, 7, 10],
    formulaNames: '1 - b3 - 4 - b5 - 5 - b7',
    description: 'Pentatonik Minor dengan sentuhan Blue Note (b5) yang gahar dan emosional.',
    characteristicSemitones: [6], // b5 Blue note
  },

  // Modus Modal
  {
    id: 'dorian',
    name: 'Dorian Mode',
    category: 'modes',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    formulaNames: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    description: 'Minor dengan interval 6 mayor yang hangat, khas Santana, R&B & Funk.',
    characteristicSemitones: [9],
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian Mode',
    category: 'modes',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    formulaNames: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    description: 'Mayor dengan b7 bluesy, favorit musik Blues, Rock n Roll & Funk.',
    characteristicSemitones: [10],
  },
  {
    id: 'phrygian',
    name: 'Phrygian Mode',
    category: 'modes',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    formulaNames: '1 - b2 - b3 - 4 - 5 - b6 - b7',
    description: 'Minor eksotis dengan nada b2 tegang, khas musik Flamenco & Metal.',
    characteristicSemitones: [1],
  },
  {
    id: 'lydian',
    name: 'Lydian Mode',
    category: 'modes',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    formulaNames: '1 - 2 - 3 - #4 - 5 - 6 - 7',
    description: 'Mayor melayang dengan interval #4, khas musik sci-fi, film score & Dream Pop.',
    characteristicSemitones: [6],
  },
  {
    id: 'locrian',
    name: 'Locrian Mode',
    category: 'modes',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    formulaNames: '1 - b2 - b3 - 4 - b5 - b6 - b7',
    description: 'Modus sangat tegang dengan b5, khas musik Jazz eksperimental & Heavy Metal.',
    characteristicSemitones: [6],
  },

  // Eksotis
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    category: 'exotic',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    formulaNames: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    description: 'Minor klasik dramatis dengan interval 7 mayor, khas Neo-Classical & Timur Tengah.',
    characteristicSemitones: [11],
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    category: 'exotic',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    formulaNames: '1 - 2 - b3 - 4 - 5 - 6 - 7',
    description: 'Minor modern dengan 6 & 7 mayor, dasar improvisasi Jazz kontemporer.',
  },
];
