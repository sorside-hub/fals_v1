export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const ENHARMONIC_EQUIVALENTS: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

export const CIRCLE_OF_FIFTHS = [
  { major: 'C', minor: 'Am', accidentals: '0 flats/sharps' },
  { major: 'G', minor: 'Em', accidentals: '1 sharp (#)' },
  { major: 'D', minor: 'Bm', accidentals: '2 sharps (##)' },
  { major: 'A', minor: 'F#m', accidentals: '3 sharps (###)' },
  { major: 'E', minor: 'C#m', accidentals: '4 sharps' },
  { major: 'B', minor: 'G#m', accidentals: '5 sharps' },
  { major: 'F#', minor: 'D#m', accidentals: '6 sharps / flats' },
  { major: 'Db', minor: 'Bbm', accidentals: '5 flats' },
  { major: 'Ab', minor: 'Fm', accidentals: '4 flats' },
  { major: 'Eb', minor: 'Cm', accidentals: '3 flats' },
  { major: 'Bb', minor: 'Gm', accidentals: '2 flats' },
  { major: 'F', minor: 'Dm', accidentals: '1 flat (b)' },
];

export const GUITAR_STRINGS = [
  { stringNumber: 1, openNote: 'E', openOctave: 4 },
  { stringNumber: 2, openNote: 'B', openOctave: 3 },
  { stringNumber: 3, openNote: 'G', openOctave: 3 },
  { stringNumber: 4, openNote: 'D', openOctave: 3 },
  { stringNumber: 5, openNote: 'A', openOctave: 2 },
  { stringNumber: 6, openNote: 'E', openOctave: 2 }
];
