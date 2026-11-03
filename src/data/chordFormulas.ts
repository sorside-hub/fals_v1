import { ChordFormula } from '../types';

export const CHORD_FORMULAS: Record<string, ChordFormula> = {
  major: {
    name: 'Mayor (Major)',
    symbol: '',
    intervals: [0, 4, 7],
    formulaNames: '1 - 3 - 5',
    feeling: 'Terang, optimis, bahagia, stabil',
    example: 'C = C - E - G'
  },
  minor: {
    name: 'Minor',
    symbol: 'm',
    intervals: [0, 3, 7],
    formulaNames: '1 - b3 - 5',
    feeling: 'Melankolis, syahdu, sedih, misterius',
    example: 'Am = A - C - E'
  },
  sus2: {
    name: 'Suspended 2',
    symbol: 'sus2',
    intervals: [0, 2, 7],
    formulaNames: '1 - 2 - 5',
    feeling: 'Mengambang, airy, dreamy, modern pop',
    example: 'Csus2 = C - D - G'
  },
  sus4: {
    name: 'Suspended 4',
    symbol: 'sus4',
    intervals: [0, 5, 7],
    formulaNames: '1 - 4 - 5',
    feeling: 'Tegang yang ingin segera balik ke Mayor (resolusi)',
    example: 'Csus4 = C - F - G'
  },
  dom7: {
    name: 'Dominant 7',
    symbol: '7',
    intervals: [0, 4, 7, 10],
    formulaNames: '1 - 3 - 5 - b7',
    feeling: 'Bluesy, funk, tegang menuju chord berikutnya (V7 -> I)',
    example: 'G7 = G - B - D - F'
  },
  maj7: {
    name: 'Major 7',
    symbol: 'maj7',
    intervals: [0, 4, 7, 11],
    formulaNames: '1 - 3 - 5 - 7',
    feeling: 'Indie, jazzy, mewah, santai sore, city pop',
    example: 'Cmaj7 = C - E - G - B'
  },
  m7: {
    name: 'Minor 7',
    symbol: 'm7',
    intervals: [0, 3, 7, 10],
    formulaNames: '1 - b3 - 5 - b7',
    feeling: 'RnB, mellow hangat, santai tapi elegan',
    example: 'Dm7 = D - F - A - C'
  },
  m9: {
    name: 'Minor 9',
    symbol: 'm9',
    intervals: [0, 3, 7, 10, 14],
    formulaNames: '1 - b3 - 5 - b7 - 9',
    feeling: 'Jazzy, sophisticated, modern soul',
    example: 'Am9 = A - C - E - G - B'
  },
  maj9: {
    name: 'Major 9',
    symbol: 'maj9',
    intervals: [0, 4, 7, 11, 14],
    formulaNames: '1 - 3 - 5 - 7 - 9',
    feeling: 'Mewah, lapang, R&B modern, dreamy',
    example: 'Cmaj9 = C - E - G - B - D'
  },
  add9: {
    name: 'Add 9',
    symbol: 'add9',
    intervals: [0, 4, 7, 14],
    formulaNames: '1 - 3 - 5 - 9',
    feeling: 'Akor khas akustik pop mahal (Ed Sheeran/John Mayer tone)',
    example: 'Cadd9 = C - E - G - D'
  },
  maj6: {
    name: 'Major 6',
    symbol: '6',
    intervals: [0, 4, 7, 9],
    formulaNames: '1 - 3 - 5 - 6',
    feeling: 'Hangat, retro pop, 50s jazz vibe',
    example: 'C6 = C - E - G - A'
  },
  m6: {
    name: 'Minor 6',
    symbol: 'm6',
    intervals: [0, 3, 7, 9],
    formulaNames: '1 - b3 - 5 - 6',
    feeling: 'Bossa nova, jazz klasik, misterius manis',
    example: 'Am6 = A - C - E - F#'
  },
  diminished: {
    name: 'Diminished',
    symbol: 'dim',
    intervals: [0, 3, 6],
    formulaNames: '1 - b3 - b5',
    feeling: 'Horor, dramatis, passing chord jembatan',
    example: 'Bdim = B - D - F'
  },
  aug: {
    name: 'Augmented',
    symbol: 'aug',
    intervals: [0, 4, 8],
    formulaNames: '1 - 3 - #5',
    feeling: 'Tegang, melayang, suspenseful transition',
    example: 'Caug = C - E - G#'
  },
  power5: {
    name: 'Power Chord',
    symbol: '5',
    intervals: [0, 7],
    formulaNames: '1 - 5',
    feeling: 'Gahar, distorsi rock, netral',
    example: 'C5 = C - G'
  }
};
