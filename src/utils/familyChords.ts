// Music Theory: Family Chord & Harmonic Palette Generator with Advanced Scale Types (Major, Minor, Modes, Blues)
export interface FamilyChordItem {
  degree: string;     // e.g. "I", "ii", "iii", "i", "ii°", etc.
  name: string;       // e.g. "Cm", "Ddim", "Eb+"
  rootNote: string;   // e.g. "C"
  role: string;       // e.g. "Tonik Minor", "Dominan", "Median"
  intervals: number[];// for audio playback: [0, 3, 7] etc.
}

export interface FamilyChordGroup {
  key: string;
  isMinor: boolean;
  scaleType: string;
  tonicName: string;
  familyChords: FamilyChordItem[];
  extensions: FamilyChordItem[];
  borrowedChords: FamilyChordItem[];
}

const MAJOR_FAMILY_PRESETS: Record<string, { chords: [string, string, string, string, string, string, string], roots: [string, string, string, string, string, string, string] }> = {
  'C':  { chords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'], roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  'G':  { chords: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'], roots: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
  'D':  { chords: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'], roots: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] },
  'A':  { chords: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'], roots: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] },
  'E':  { chords: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'], roots: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] },
  'B':  { chords: ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'], roots: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'] },
  'F#': { chords: ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim'], roots: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'] },
  'Gb': { chords: ['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'Fdim'], roots: ['Gb', 'Ab', 'Bb', 'B', 'Db', 'Eb', 'F'] },
  'Db': { chords: ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim'], roots: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'] },
  'C#': { chords: ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim'], roots: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'] },
  'Ab': { chords: ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'], roots: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'] },
  'Eb': { chords: ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'], roots: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'] },
  'Bb': { chords: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'], roots: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'] },
  'F':  { chords: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'], roots: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'] },
};

const NATURAL_MINOR_FAMILY_PRESETS: Record<string, { chords: [string, string, string, string, string, string, string], roots: [string, string, string, string, string, string, string] }> = {
  'Am':  { chords: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'], roots: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  'Abm': { chords: ['Abm', 'Bbdim', 'Cb', 'Dbm', 'Ebm', 'Fb', 'Gb'], roots: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'] },
  'Em':  { chords: ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'], roots: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'] },
  'Bm':  { chords: ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A'], roots: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'] },
  'F#m': { chords: ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E'], roots: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'] },
  'C#m': { chords: ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B'], roots: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'] },
  'G#m': { chords: ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#'], roots: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'] },
  'D#m': { chords: ['D#m', 'E#dim', 'F#', 'G#m', 'A#m', 'B', 'C#'], roots: ['D#', 'F', 'F#', 'G#', 'A#', 'B', 'C#'] },
  'Ebm': { chords: ['Ebm', 'Fdim', 'Gb', 'Abm', 'Bbm', 'B', 'Db'], roots: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'B', 'Db'] },
  'Bbm': { chords: ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab'], roots: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'] },
  'Fm':  { chords: ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb'], roots: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'] },
  'Cm':  { chords: ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'], roots: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'] },
  'Gm':  { chords: ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'Eb', 'F'], roots: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'] },
  'Dm':  { chords: ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'], roots: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'] },
};

const HARMONIC_MINOR_FAMILY_PRESETS: Record<string, { chords: [string, string, string, string, string, string, string], roots: [string, string, string, string, string, string, string] }> = {
  'Am':  { chords: ['Am', 'Bdim', 'C+', 'Dm', 'E', 'F', 'G#dim'], roots: ['A', 'B', 'C', 'D', 'E', 'F', 'G#'] },
  'Em':  { chords: ['Em', 'F#dim', 'G+', 'Am', 'B', 'C', 'D#dim'], roots: ['E', 'F#', 'G', 'A', 'B', 'C', 'D#'] },
  'Bm':  { chords: ['Bm', 'C#dim', 'D+', 'Em', 'F#', 'G', 'A#dim'], roots: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A#'] },
  'F#m': { chords: ['F#m', 'G#dim', 'A+', 'Bm', 'C#', 'D', 'E#dim'], roots: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E#'] },
  'C#m': { chords: ['C#m', 'D#dim', 'E+', 'F#m', 'G#', 'A', 'B#dim'], roots: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B#'] },
  'G#m': { chords: ['G#m', 'A#dim', 'B+', 'C#m', 'D#', 'E', 'F##dim'], roots: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F##'] },
  'D#m': { chords: ['D#m', 'E#dim', 'F#+', 'G#m', 'A#', 'B', 'C##dim'], roots: ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C##'] },
  'Ebm': { chords: ['Ebm', 'Fdim', 'Gb+', 'Abm', 'Bb', 'B', 'Ddim'], roots: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'B', 'D'] },
  'Bbm': { chords: ['Bbm', 'Cdim', 'Db+', 'Ebm', 'F', 'Gb', 'Adim'], roots: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'A'] },
  'Fm':  { chords: ['Fm', 'Gdim', 'Ab+', 'Bbm', 'C', 'Db', 'Edim'], roots: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'E'] },
  'Cm':  { chords: ['Cm', 'Ddim', 'Eb+', 'Fm', 'G', 'Ab', 'Bdim'], roots: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'] },
  'Gm':  { chords: ['Gm', 'Adim', 'Bb+', 'Cm', 'D', 'Eb', 'F#dim'], roots: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F#'] },
  'Dm':  { chords: ['Dm', 'Edim', 'F+', 'Gm', 'A', 'Bb', 'C#dim'], roots: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C#'] },
  'Abm': { chords: ['Abm', 'Bbdim', 'Cb+', 'Dbm', 'Eb', 'Fb', 'Gdim'], roots: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'G'] },
};

const MELODIC_MINOR_FAMILY_PRESETS: Record<string, { chords: [string, string, string, string, string, string, string], roots: [string, string, string, string, string, string, string] }> = {
  'Am':  { chords: ['Am', 'Bm', 'C+', 'D', 'E', 'F#dim', 'G#dim'], roots: ['A', 'B', 'C', 'D', 'E', 'F#', 'G#'] },
  'Cm':  { chords: ['Cm', 'Dm', 'Eb+', 'F', 'G', 'Adim', 'Bdim'], roots: ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'] },
  'Em':  { chords: ['Em', 'F#m', 'G+', 'A', 'B', 'C#dim', 'D#dim'], roots: ['E', 'F#', 'G', 'A', 'B', 'C#', 'D#'] },
  'Bm':  { chords: ['Bm', 'C#m', 'D+', 'E', 'F#', 'G#dim', 'A#dim'], roots: ['B', 'C#', 'D', 'E', 'F#', 'G#', 'A#'] },
  'F#m': { chords: ['F#m', 'G#m', 'A+', 'B', 'C#', 'D#dim', 'E#dim'], roots: ['F#', 'G#', 'A', 'B', 'C#', 'D#', 'E#'] },
  'Gm':  { chords: ['Gm', 'Am', 'Bb+', 'C', 'D', 'Edim', 'F#dim'], roots: ['G', 'A', 'Bb', 'C', 'D', 'E', 'F#'] },
  'Dm':  { chords: ['Dm', 'Em', 'F+', 'G', 'A', 'Bdim', 'C#dim'], roots: ['D', 'E', 'F', 'G', 'A', 'B', 'C#'] },
  'Fm':  { chords: ['Fm', 'Gm', 'Ab+', 'Bb', 'C', 'Ddim', 'Edim'], roots: ['F', 'G', 'Ab', 'Bb', 'C', 'D', 'E'] },
  'Bbm': { chords: ['Bbm', 'Cm', 'Db+', 'Eb', 'F', 'Gdim', 'Adim'], roots: ['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'A'] },
  'Ebm': { chords: ['Ebm', 'Fm', 'Gb+', 'Ab', 'Bb', 'Cdim', 'Ddim'], roots: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'D'] },
  'Abm': { chords: ['Abm', 'Bbm', 'Cb+', 'Db', 'Eb', 'Fdim', 'Gdim'], roots: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F', 'G'] },
  'C#m': { chords: ['C#m', 'D#m', 'E+', 'F#', 'G#', 'A#dim', 'B#dim'], roots: ['C#', 'D#', 'E', 'F#', 'G#', 'A#', 'B#'] },
  'G#m': { chords: ['G#m', 'A#m', 'B+', 'C#', 'D#', 'E#dim', 'F##dim'], roots: ['G#', 'A#', 'B', 'C#', 'D#', 'E#', 'F##'] },
  'D#m': { chords: ['D#m', 'E#m', 'F#+', 'G#', 'A#', 'B#dim', 'C##dim'], roots: ['D#', 'E#', 'F#', 'G#', 'A#', 'B#', 'C##'] },
};

const DORIAN_CHORDS: Record<string, { chords: [string, string, string, string, string, string, string], roots: [string, string, string, string, string, string, string] }> = {
  'C': { chords: ['Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Adim', 'Bbmaj7'], roots: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'] },
  'G': { chords: ['Gm7', 'Am7', 'Bbmaj7', 'C7', 'Dm7', 'Edim', 'Fmaj7'], roots: ['G', 'A', 'Bb', 'C', 'D', 'E', 'F'] },
  'D': { chords: ['Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bdim', 'Cmaj7'], roots: ['D', 'E', 'F', 'G', 'A', 'B', 'C'] },
  'A': { chords: ['Am7', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'F#dim', 'Gmaj7'], roots: ['A', 'B', 'C', 'D', 'E', 'F#', 'G'] },
  'E': { chords: ['Em7', 'F#m7', 'Gmaj7', 'A7', 'Bm7', 'C#dim', 'Dmaj7'], roots: ['E', 'F#', 'G', 'A', 'B', 'C#', 'D'] },
  'B': { chords: ['Bm7', 'C#m7', 'Dmaj7', 'E7', 'F#m7', 'G#dim', 'Amaj7'], roots: ['B', 'C#', 'D', 'E', 'F#', 'G#', 'A'] },
  'F#': { chords: ['F#m7', 'G#m7', 'Amaj7', 'B7', 'C#m7', 'D#dim', 'Emaj7'], roots: ['F#', 'G#', 'A', 'B', 'C#', 'D#', 'E'] },
  'Bb': { chords: ['Bbm7', 'Cm7', 'Dbmaj7', 'Eb7', 'Fm7', 'Gdim', 'Abmaj7'], roots: ['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab'] },
  'Eb': { chords: ['Ebm7', 'Fm7', 'Gbmaj7', 'Ab7', 'Bbm7', 'Cdim', 'Dbmaj7'], roots: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'C', 'Db'] },
  'Ab': { chords: ['Abm7', 'Bbm7', 'Cbmaj7', 'Db7', 'Ebm7', 'Fdim', 'Gbmaj7'], roots: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F', 'Gb'] },
  'F': { chords: ['Fm7', 'Gm7', 'Abmaj7', 'Bb7', 'Cm7', 'Ddim', 'Ebmaj7'], roots: ['F', 'G', 'Ab', 'Bb', 'C', 'D', 'Eb'] },
};

const MIXOLYDIAN_CHORDS: Record<string, { chords: [string, string, string, string, string, string, string], roots: [string, string, string, string, string, string, string] }> = {
  'C': { chords: ['C', 'Dm', 'Edim', 'F', 'Gm', 'Am7', 'Bb'], roots: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'] },
  'G': { chords: ['G', 'Am', 'Bdim', 'C', 'Dm', 'Em7', 'F'], roots: ['G', 'A', 'B', 'C', 'D', 'E', 'F'] },
  'D': { chords: ['D', 'Em', 'F#dim', 'G', 'Am', 'Bm7', 'C'], roots: ['D', 'E', 'F#', 'G', 'A', 'B', 'C'] },
  'A': { chords: ['A', 'Bm', 'C#dim', 'D', 'E', 'F#m7', 'G'], roots: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G'] },
  'E': { chords: ['E', 'F#m', 'G#dim', 'A', 'B', 'C#m7', 'D'], roots: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D'] },
  'B': { chords: ['B', 'C#m', 'D#dim', 'E', 'F#', 'G#m7', 'A'], roots: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A'] },
  'F': { chords: ['F', 'Gm', 'Adim', 'Bb', 'C', 'Dm7', 'Eb'], roots: ['F', 'G', 'A', 'Bb', 'C', 'D', 'Eb'] },
  'Bb': { chords: ['Bb', 'Cm', 'Ddim', 'Eb', 'F', 'Gm7', 'Ab'], roots: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'Ab'] },
  'Eb': { chords: ['Eb', 'Fm', 'Gdim', 'Ab', 'Bb', 'Cm7', 'Db'], roots: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'Db'] },
  'Ab': { chords: ['Ab', 'Bbm', 'Cdim', 'Db', 'Eb', 'Fm7', 'Gb'], roots: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb'] },
};

const LYDIAN_FAMILY_PRESETS: Record<string, { chords: [string, string, string, string, string, string, string], roots: [string, string, string, string, string, string, string] }> = {
  'C': { chords: ['C', 'D', 'Em', 'F#dim', 'G', 'Am', 'Bm'], roots: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'] },
  'G': { chords: ['G', 'A', 'Bm', 'C#dim', 'D', 'Em', 'F#m'], roots: ['G', 'A', 'B', 'C#', 'D', 'E', 'F#'] },
  'D': { chords: ['D', 'E', 'F#m', 'G#dim', 'A', 'Bm', 'C#m'], roots: ['D', 'E', 'F#', 'G#', 'A', 'B', 'C#'] },
  'A': { chords: ['A', 'B', 'C#m', 'D#dim', 'E', 'F#m', 'G#m'], roots: ['A', 'B', 'C#', 'D#', 'E', 'F#', 'G#'] },
  'F': { chords: ['F', 'G', 'Am', 'Bdim', 'C', 'Dm', 'Em'], roots: ['F', 'G', 'A', 'B', 'C', 'D', 'E'] },
  'Bb': { chords: ['Bb', 'C', 'Dm', 'Edim', 'F', 'Gm', 'Am'], roots: ['Bb', 'C', 'D', 'E', 'F', 'G', 'A'] },
};

const BLUES_FAMILY_PRESETS: Record<string, { chords: [string, string, string, string, string, string], roots: [string, string, string, string, string, string] }> = {
  'C': { chords: ['C7', 'Eb', 'F7', 'F#dim', 'G7', 'Bb'], roots: ['C', 'Eb', 'F', 'F#', 'G', 'Bb'] },
  'G': { chords: ['G7', 'Bb', 'C7', 'C#dim', 'D7', 'F'], roots: ['G', 'Bb', 'C', 'C#', 'D', 'F'] },
  'D': { chords: ['D7', 'F', 'G7', 'G#dim', 'A7', 'C'], roots: ['D', 'F', 'G', 'G#', 'A', 'C'] },
  'A': { chords: ['A7', 'C', 'D7', 'D#dim', 'E7', 'G'], roots: ['A', 'C', 'D', 'D#', 'E', 'G'] },
  'E': { chords: ['E7', 'G', 'A7', 'A#dim', 'B7', 'D'], roots: ['E', 'G', 'A', 'A#', 'B', 'D'] },
  'F': { chords: ['F7', 'Ab', 'Bb7', 'Bdim', 'C7', 'Eb'], roots: ['F', 'Ab', 'Bb', 'B', 'C', 'Eb'] },
  'Bb': { chords: ['Bb7', 'Db', 'Eb7', 'Edim', 'F7', 'Ab'], roots: ['Bb', 'Db', 'Eb', 'E', 'F', 'Ab'] },
  'Eb': { chords: ['Eb7', 'Gb', 'Ab7', 'Adim', 'Bb7', 'Db'], roots: ['Eb', 'Gb', 'Ab', 'A', 'Bb', 'Db'] },
  'Ab': { chords: ['Ab7', 'B', 'Db7', 'Ddim', 'Eb7', 'Gb'], roots: ['Ab', 'B', 'Db', 'D', 'Eb', 'Gb'] },
};

function getChordIntervals(chordName: string): number[] {
  const clean = chordName.toLowerCase();
  if (clean.includes('dim')) return [0, 3, 6];
  if (clean.includes('aug') || clean.includes('+')) return [0, 4, 8];
  if (clean.includes('maj7')) return [0, 4, 7, 11];
  if (clean.includes('m7') || clean.includes('min7')) return [0, 3, 7, 10];
  if (clean.includes('7')) return [0, 4, 7, 10];
  if (clean.includes('m') && !clean.includes('maj')) return [0, 3, 7];
  return [0, 4, 7];
}

export function getFamilyChordGroups(keyInput: string = 'C'): FamilyChordGroup {
  const cleanKey = (keyInput || 'C').trim();
  
  let scaleType = 'major';
  let pureKey = cleanKey;

  if (cleanKey.includes('(Harm)') || cleanKey.toLowerCase().includes('harmonic')) {
    scaleType = 'harmonic-minor';
    pureKey = cleanKey.replace(/\(Harm\)/i, '').trim();
    if (!pureKey.endsWith('m')) pureKey += 'm';
  } else if (cleanKey.includes('(Mel)') || cleanKey.toLowerCase().includes('melodic')) {
    scaleType = 'melodic-minor';
    pureKey = cleanKey.replace(/\(Mel\)/i, '').trim();
    if (!pureKey.endsWith('m')) pureKey += 'm';
  } else if (cleanKey.includes('(Dorian)')) {
    scaleType = 'dorian';
    pureKey = cleanKey.replace(/\(Dorian\)/i, '').trim().replace(/m$/, '');
  } else if (cleanKey.includes('(Mixolydian)')) {
    scaleType = 'mixolydian';
    pureKey = cleanKey.replace(/\(Mixolydian\)/i, '').trim().replace(/m$/, '');
  } else if (cleanKey.includes('(Lydian)')) {
    scaleType = 'lydian';
    pureKey = cleanKey.replace(/\(Lydian\)/i, '').trim().replace(/m$/, '');
  } else if (cleanKey.includes('(Blues)')) {
    scaleType = 'blues';
    pureKey = cleanKey.replace(/\(Blues\)/i, '').trim().replace(/m$/, '');
  } else if (cleanKey.endsWith('m') && !cleanKey.endsWith('maj') && !cleanKey.endsWith('dim')) {
    scaleType = 'natural-minor';
    pureKey = cleanKey;
  } else {
    scaleType = 'major';
    pureKey = cleanKey.replace(/m$/, '');
  }

  const isMinor = scaleType.includes('minor') || scaleType === 'dorian';
  const baseRoot = isMinor ? pureKey.replace(/m$/, '') : pureKey;

  let familyChords: FamilyChordItem[] = [];
  let extensions: FamilyChordItem[] = [];
  let borrowedChords: FamilyChordItem[] = [];

  if (scaleType === 'dorian') {
    const preset = DORIAN_CHORDS[baseRoot as keyof typeof DORIAN_CHORDS] || DORIAN_CHORDS['C'];
    const degrees = ['i', 'ii', 'III', 'IV', 'v', 'vi°', 'VII'];
    const roles = ['Tonik Dorian', 'Supertonik', 'Modal III', 'Subdominan 7', 'Dominan Minor', 'Diminished', 'Subtonik'];
    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));
    extensions = [
      { degree: 'i', name: `${baseRoot}m9`, rootNote: baseRoot, role: 'Dorian Minor 9', intervals: [0, 3, 7, 10, 14] },
      { degree: 'IV', name: `${preset.roots[3]}9`, rootNote: preset.roots[3], role: 'Subdominan 9', intervals: [0, 4, 7, 10, 14] },
    ];
    borrowedChords = [
      { degree: 'V', name: `${preset.roots[4]}7`, rootNote: preset.roots[4], role: 'Dominan V7', intervals: [0, 4, 7, 10] },
    ];
  } else if (scaleType === 'mixolydian') {
    const preset = MIXOLYDIAN_CHORDS[baseRoot as keyof typeof MIXOLYDIAN_CHORDS] || MIXOLYDIAN_CHORDS['C'];
    const degrees = ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'];
    const roles = ['Tonik Mixolydian', 'Supertonik', 'Diminished', 'Subdominan', 'Minor v', 'Relatif vi', 'Subtonik bVII'];
    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));
    extensions = [
      { degree: 'I', name: `${baseRoot}7`, rootNote: baseRoot, role: 'Mixolydian Dominant 7', intervals: [0, 4, 7, 10] },
      { degree: 'I', name: `${baseRoot}sus4`, rootNote: baseRoot, role: 'Mixolydian Sus4', intervals: [0, 5, 7] },
    ];
    borrowedChords = [
      { degree: 'iv', name: `${preset.roots[1]}m`, rootNote: preset.roots[1], role: 'Pinjaman Minor (iv)', intervals: [0, 3, 7] },
    ];
  } else if (scaleType === 'lydian') {
    const preset = LYDIAN_FAMILY_PRESETS[baseRoot as keyof typeof LYDIAN_FAMILY_PRESETS] || LYDIAN_FAMILY_PRESETS['C'];
    const degrees = ['I', 'II', 'iii', '#iv°', 'V', 'vi', 'vii'];
    const roles = ['Tonik Lydian', 'Major II (#11)', 'Median', 'Lydian Subdominant', 'Dominan', 'Submedian', 'Leading Tone'];
    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));
    extensions = [
      { degree: 'I', name: `${baseRoot}maj7`, rootNote: baseRoot, role: 'Lydian Major 7', intervals: [0, 4, 7, 11] },
      { degree: 'I', name: `${baseRoot}#11`, rootNote: baseRoot, role: 'Lydian #11', intervals: [0, 4, 7, 11, 18] },
    ];
    borrowedChords = [
      { degree: 'IV', name: `F`, rootNote: 'F', role: 'Subdominan Natural', intervals: [0, 4, 7] },
    ];
  } else if (scaleType === 'blues') {
    const preset = BLUES_FAMILY_PRESETS[baseRoot as keyof typeof BLUES_FAMILY_PRESETS] || BLUES_FAMILY_PRESETS['C'];
    const degrees = ['bI', 'bIII', 'IV', '#iv°', 'V', 'bVII'];
    const roles = ['Tonik Blues', 'Submediant', 'Subdominan', 'Tritone', 'Dominan', 'Subtonik'];
    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));
    extensions = [
      { degree: 'bI', name: `${baseRoot}9`, rootNote: baseRoot, role: 'Blues 9th', intervals: [0, 4, 7, 10, 14] },
    ];
    borrowedChords = [
      { degree: 'I', name: `${baseRoot}`, rootNote: baseRoot, role: 'Major Root', intervals: [0, 4, 7] },
    ];
  } else if (scaleType === 'harmonic-minor') {
    const preset = HARMONIC_MINOR_FAMILY_PRESETS[pureKey] || HARMONIC_MINOR_FAMILY_PRESETS['Cm'];
    const degrees = ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'];
    const roles = ['Tonik Minor', 'Supertonik Dim', 'Median Aug', 'Subdominan Minor', 'Dominan Mayor (V)', 'Submedian', 'Leading Tone Dim'];

    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));

    extensions = [
      { degree: 'i', name: `${pureKey}7`, rootNote: baseRoot, role: 'Minor 7th', intervals: [0, 3, 7, 10] },
      { degree: 'i', name: `${pureKey}(maj7)`, rootNote: baseRoot, role: 'Minor Major 7', intervals: [0, 3, 7, 11] },
      { degree: 'V', name: `${preset.roots[4]}7`, rootNote: preset.roots[4], role: 'Dominan 7 (V7)', intervals: [0, 4, 7, 10] },
      { degree: 'VI', name: `${preset.roots[5]}maj7`, rootNote: preset.roots[5], role: 'Submedian maj7', intervals: [0, 4, 7, 11] },
    ];

    borrowedChords = [
      { degree: 'bVI', name: `${preset.roots[5]}`, rootNote: preset.roots[5], role: 'Pinjaman Natural Minor', intervals: [0, 4, 7] },
      { degree: 'I', name: `${baseRoot}`, rootNote: baseRoot, role: 'Picardy Third (Major I)', intervals: [0, 4, 7] },
    ];
  } else if (scaleType === 'melodic-minor') {
    const preset = MELODIC_MINOR_FAMILY_PRESETS[pureKey] || MELODIC_MINOR_FAMILY_PRESETS['Cm'];
    const degrees = ['i', 'ii', 'bIII+', 'IV', 'V', 'vi°', 'vii°'];
    const roles = ['Tonik Minor', 'Supertonik Minor', 'Median Aug', 'Subdominan 7', 'Dominan 7', 'Submedian Dim', 'Leading Tone Dim'];

    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));

    extensions = [
      { degree: 'i', name: `${pureKey}(maj7)`, rootNote: baseRoot, role: 'Tonik Minor Maj7', intervals: [0, 3, 7, 11] },
      { degree: 'V', name: `${preset.roots[4]}7`, rootNote: preset.roots[4], role: 'Dominan 7', intervals: [0, 4, 7, 10] },
    ];

    borrowedChords = [
      { degree: 'iv', name: `${preset.roots[3]}m`, rootNote: preset.roots[3], role: 'Pinjaman Natural Minor (iv)', intervals: [0, 3, 7] },
    ];
  } else if (scaleType === 'natural-minor') {
    const preset = NATURAL_MINOR_FAMILY_PRESETS[pureKey] || NATURAL_MINOR_FAMILY_PRESETS['Am'];
    const degrees = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
    const roles = ['Tonik Minor', 'Supertonik Dim', 'Median Mayor', 'Subdominan Minor', 'Dominan Minor', 'Submedian Mayor', 'Subtonik Mayor'];

    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));

    extensions = [
      { degree: 'i', name: `${pureKey}7`, rootNote: baseRoot, role: 'Minor 7th', intervals: [0, 3, 7, 10] },
      { degree: 'III', name: `${preset.roots[2]}maj7`, rootNote: preset.roots[2], role: 'Median Major 7', intervals: [0, 4, 7, 11] },
      { degree: 'iv', name: `${preset.roots[3]}m7`, rootNote: preset.roots[3], role: 'Subdominan m7', intervals: [0, 3, 7, 10] },
      { degree: 'VI', name: `${preset.roots[5]}maj7`, rootNote: preset.roots[5], role: 'Submedian maj7', intervals: [0, 4, 7, 11] },
    ];

    borrowedChords = [
      { degree: 'V', name: `${preset.roots[4].replace('m', '')}7`, rootNote: preset.roots[4].replace('m', ''), role: 'Pinjaman Harmonic Minor (V7)', intervals: [0, 4, 7, 10] },
      { degree: 'I', name: `${baseRoot}`, rootNote: baseRoot, role: 'Pinjaman Mayor Pararel (Picardy)', intervals: [0, 4, 7] },
    ];
  } else {
    // Major
    const preset = MAJOR_FAMILY_PRESETS[pureKey] || MAJOR_FAMILY_PRESETS['C'];
    const degrees = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    const roles = ['Tonik', 'Supertonik', 'Median', 'Subdominan', 'Dominan', 'Submedian', 'Leading Tone'];

    familyChords = preset.chords.map((chordName, i) => ({
      degree: degrees[i],
      name: chordName,
      rootNote: preset.roots[i],
      role: roles[i],
      intervals: getChordIntervals(chordName),
    }));

    extensions = [
      { degree: 'I', name: `${pureKey}maj7`, rootNote: pureKey, role: 'Major 7th', intervals: [0, 4, 7, 11] },
      { degree: 'I', name: `${pureKey}add9`, rootNote: pureKey, role: 'Add 9', intervals: [0, 4, 7, 14] },
      { degree: 'I', name: `${pureKey}sus2`, rootNote: pureKey, role: 'Suspended 2', intervals: [0, 2, 7] },
      { degree: 'I', name: `${pureKey}sus4`, rootNote: pureKey, role: 'Suspended 4', intervals: [0, 5, 7] },
      { degree: 'ii', name: `${preset.roots[1]}m7`, rootNote: preset.roots[1], role: 'Supertonik ii7', intervals: [0, 3, 7, 10] },
      { degree: 'IV', name: `${preset.roots[3]}maj7`, rootNote: preset.roots[3], role: 'Subdominan IVmaj7', intervals: [0, 4, 7, 11] },
      { degree: 'V', name: `${preset.roots[4]}7`, rootNote: preset.roots[4], role: 'Dominan V7', intervals: [0, 4, 7, 10] },
      { degree: 'vi', name: `${preset.roots[5]}m7`, rootNote: preset.roots[5], role: 'Relatif vi7', intervals: [0, 3, 7, 10] },
    ];

    borrowedChords = [
      { degree: 'iv', name: `${preset.roots[3]}m`, rootNote: preset.roots[3], role: 'Pinjaman Minor Pararel (iv)', intervals: [0, 3, 7] },
      { degree: 'bVII', name: `${preset.roots[6]}`, rootNote: preset.roots[6], role: 'Pinjaman Mixolydian (bVII)', intervals: [0, 4, 7, 10] },
    ];
  }

  return {
    key: cleanKey,
    isMinor,
    scaleType,
    tonicName: pureKey,
    familyChords,
    extensions,
    borrowedChords,
  };
}
