import { CHROMATIC_NOTES, GUITAR_STRINGS } from '../data/constants';
import { getGuitarFretNote } from './musicCalculations';

export interface ChordStringPosition {
  stringNum: number;
  fret: number | 'x';
  note: string | null;
  degree: string | null;
  octave: number | null;
}

export interface BarreInfo {
  fret: number;
  fromString: number; // e.g. 6 (bottom string)
  toString: number;   // e.g. 1 (top string)
}

export interface ChordShapeVoicing {
  id: string;
  name: string;
  category: 'full' | 'triad';
  stringSet?: string;
  frets: (number | 'x')[]; // string 6, 5, 4, 3, 2, 1
  fretRange: [number, number]; // [minFret, maxFret] to display in box
  baseFret: number; // starting fret to display (e.g. 1, 5, 8)
  barreInfo?: BarreInfo;
  positions: ChordStringPosition[]; // strings 6 to 1
  notesSequence: {
    stringNum: number;
    fret: number;
    note: string;
    degree: string;
    octave: number;
  }[];
}

const flatToSharp: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

function getChromaticIndex(note: string): number {
  if (!note) return 0;
  const clean = note.trim();
  const upper = clean.charAt(0).toUpperCase() + (clean.length > 1 ? clean.charAt(1).toLowerCase() : '');
  const normalized = flatToSharp[upper] || upper;
  return CHROMATIC_NOTES.indexOf(normalized);
}

// Helper to get note degree label relative to root
function getDegreeLabel(root: string, note: string, intervals: number[]): string {
  const rootIdx = getChromaticIndex(root);
  const noteIdx = getChromaticIndex(note);
  if (rootIdx === -1 || noteIdx === -1) return '';
  const semitones = (noteIdx - rootIdx + 12) % 12;

  if (semitones === 0) return 'R';
  if (semitones === 3) return 'b3';
  if (semitones === 4) return '3';
  if (semitones === 7) return '5';
  if (semitones === 6) return 'b5';
  if (semitones === 8) return '#5';
  if (semitones === 10) return 'b7';
  if (semitones === 11) return '7';
  if (semitones === 2) return '2';
  if (semitones === 5) return '4';
  if (semitones === 9) return '6';
  return `${semitones}`;
}

// Generate full chord grips using CAGED system (C, A, G, E, D Shapes)
export function getFullChordShapes(
  root: string,
  chordType: string,
  chordNotes: string[],
  intervals: number[],
  bassNote?: string
): ChordShapeVoicing[] {
  const rootPitch = getChromaticIndex(root);
  if (rootPitch === -1) return [];

  const isMinor = chordType.includes('minor') || (chordType.includes('m') && !chordType.includes('maj') && !chordType.includes('m9') && !chordType.includes('m6'));
  const is7 = chordType === 'dom7' || chordType === '7';
  const isM7 = chordType === 'maj7' || chordType === 'maj9';
  const isMin7 = chordType === 'm7' || chordType === 'min7' || chordType === 'm9';

  const shapes: ChordShapeVoicing[] = [];

  const buildVoicing = (
    id: string,
    name: string,
    fretList: (number | 'x')[]
  ): ChordShapeVoicing => {
    // fretList is in order string 6, 5, 4, 3, 2, 1
    const numericFrets = fretList.filter((f): f is number => typeof f === 'number' && f > 0);
    const minF = numericFrets.length > 0 ? Math.min(...numericFrets) : 0;
    const maxF = numericFrets.length > 0 ? Math.max(...numericFrets) : 3;

    // Base fret to display:
    // If any string is open (0), must start at fret 1 so the nut is visible at the top.
    // If no open strings: only start at 1 if minF <= 2 (e.g. fret 1 or 2 grips like F or B7).
    // If minF >= 3 and no open strings (e.g. C5 at fret 3, G5 at fret 3, C#5 at fret 4), start at minF!
    const hasOpenString = fretList.includes(0);
    const baseFret = hasOpenString ? 1 : (minF <= 2 ? 1 : minF);
    const endFret = Math.max(baseFret + 3, maxF);

    // Auto-detect Barre info (if any positive fret spans across 2+ strings)
    let barreInfo: BarreInfo | undefined = undefined;
    if (minF > 0) {
      const stringsOnMinF: number[] = [];
      [6, 5, 4, 3, 2, 1].forEach((strNum, idx) => {
        if (fretList[idx] === minF) {
          stringsOnMinF.push(strNum);
        }
      });
      if (stringsOnMinF.length >= 2) {
        const maxStr = Math.max(...stringsOnMinF);
        const minStr = Math.min(...stringsOnMinF);
        if (maxStr - minStr >= 1) {
          barreInfo = {
            fret: minF,
            fromString: maxStr,
            toString: minStr,
          };
        }
      }
    }

    const positions: ChordStringPosition[] = [];
    const notesSeq: ChordShapeVoicing['notesSequence'] = [];

    // String numbers: 6 down to 1
    [6, 5, 4, 3, 2, 1].forEach((strNum, idx) => {
      const fret = fretList[idx];
      const gString = GUITAR_STRINGS.find((s) => s.stringNumber === strNum)!;

      if (fret === 'x') {
        positions.push({
          stringNum: strNum,
          fret: 'x',
          note: null,
          degree: null,
          octave: null,
        });
      } else {
        const { note, octaveDiff } = getGuitarFretNote(gString.openNote, fret);
        const octave = gString.openOctave + octaveDiff;
        const degree = getDegreeLabel(root, note, intervals);

        positions.push({
          stringNum: strNum,
          fret,
          note,
          degree,
          octave,
        });

        notesSeq.push({
          stringNum: strNum,
          fret,
          note,
          degree,
          octave,
        });
      }
    });

    return {
      id,
      name,
      category: 'full',
      frets: fretList,
      fretRange: [baseFret, endFret],
      baseFret,
      barreInfo,
      positions,
      notesSequence: notesSeq,
    };
  };

  // Common Open / Barre Shapes override dictionary (supporting sharp & flat keys + Slash Chords)
  const OPEN_CHORDS: Record<string, (number | 'x')[]> = {
    'C': ['x', 3, 2, 0, 1, 0],
    'A': ['x', 0, 2, 2, 2, 0],
    'G': [3, 2, 0, 0, 0, 3],
    'E': [0, 2, 2, 1, 0, 0],
    'D': ['x', 'x', 0, 2, 3, 2],
    'Am': ['x', 0, 2, 2, 1, 0],
    'Em': [0, 2, 2, 0, 0, 0],
    'Dm': ['x', 'x', 0, 2, 3, 1],
    'F': [1, 3, 3, 2, 1, 1],
    'Bb': ['x', 1, 3, 3, 3, 1],
    'Eb': ['x', 6, 8, 8, 8, 6],
    'Ab': [4, 6, 6, 5, 4, 4],
    'Db': ['x', 4, 6, 6, 6, 4],
    'Gb': [2, 4, 4, 3, 2, 2],
    'Abm': [4, 6, 6, 4, 4, 4],
    'Bbm': ['x', 1, 3, 3, 2, 1],
    'Ebm': ['x', 6, 8, 8, 7, 6],
    'C7': ['x', 3, 2, 3, 1, 0],
    'A7': ['x', 0, 2, 0, 2, 0],
    'E7': [0, 2, 0, 1, 0, 0],
    'D7': ['x', 'x', 0, 2, 1, 2],
    'G7': [3, 2, 0, 0, 0, 1],
    'B7': ['x', 2, 1, 2, 0, 2],
    'Bb7': ['x', 1, 3, 1, 3, 1],
    'Eb7': ['x', 6, 8, 6, 8, 6],
    'Ab7': [4, 6, 4, 5, 4, 4],
    'Am7': ['x', 0, 2, 0, 1, 0],
    'Em7': [0, 2, 0, 0, 0, 0],
    'Dm7': ['x', 'x', 0, 2, 1, 1],
    'Cmaj7': ['x', 3, 2, 0, 0, 0],
    'Amaj7': ['x', 0, 2, 1, 2, 0],
    'Gmaj7': [3, 2, 0, 0, 0, 2],
    'Emaj7': [0, 2, 1, 1, 0, 0],
    'Dmaj7': ['x', 'x', 0, 2, 2, 2],
    'Fmaj7': ['x', 3, 3, 2, 1, 0],
    'Bbmaj7': ['x', 1, 3, 2, 3, 1],
    'Ebmaj7': ['x', 6, 8, 7, 8, 6],
    'Abmaj7': [4, 6, 5, 5, 4, 4],
    'Cadd9': ['x', 3, 2, 0, 3, 0],
    'C6': ['x', 3, 2, 2, 1, 0],
    'Am6': ['x', 0, 2, 2, 1, 2],
    'C5': ['x', 3, 5, 'x', 'x', 'x'],
    'E5': [0, 2, 'x', 'x', 'x', 'x'],
    'A5': ['x', 0, 2, 'x', 'x', 'x'],
    'D5': ['x', 'x', 0, 2, 'x', 'x'],
    'G5': [3, 5, 'x', 'x', 'x', 'x'],
    'F5': [1, 3, 'x', 'x', 'x', 'x'],
    'B5': ['x', 2, 4, 'x', 'x', 'x'],
    'C9': ['x', 3, 2, 3, 3, 'x'],
    'G9': [3, 'x', 3, 2, 0, 1],
    'A9': ['x', 0, 2, 4, 2, 3],
    'E9': [0, 2, 0, 1, 0, 2],
    'D9': ['x', 'x', 0, 2, 1, 0],
    'Csus2': ['x', 3, 0, 0, 1, 'x'],
    'Dsus2': ['x', 'x', 0, 2, 3, 0],
    'Asus2': ['x', 0, 2, 2, 0, 0],
    'Csus4': ['x', 3, 3, 0, 1, 1],
    'Dsus4': ['x', 'x', 0, 2, 3, 3],
    'Esus4': [0, 2, 2, 2, 0, 0],
    'Asus4': ['x', 0, 2, 2, 3, 0],
    'Gsus4': [3, 3, 0, 0, 1, 3],
    'C7sus4': ['x', 3, 3, 3, 1, 1],
    'D7sus4': ['x', 'x', 0, 2, 1, 3],
    'A7sus4': ['x', 0, 2, 0, 3, 0],
    'E7sus4': [0, 2, 0, 2, 0, 0],
    'Cdim': ['x', 3, 4, 'x', 4, 'x'],
    'Cdim7': ['x', 3, 4, 2, 4, 'x'],
    'Cm7b5': ['x', 3, 4, 3, 4, 'x'],
    'Am7b5': ['x', 0, 1, 0, 1, 'x'],
    'Em7b5': [0, 1, 0, 0, 3, 0],
    'Bm7b5': ['x', 2, 3, 2, 3, 'x'],
    'Caug': ['x', 3, 2, 1, 1, 'x'],
    'Eaug': [0, 3, 2, 1, 1, 0],
    'Aaug': ['x', 0, 3, 2, 2, 1],

    // Popular Slash Chords
    'C/G': [3, 3, 2, 0, 1, 0],
    'C/E': [0, 3, 2, 0, 1, 0],
    'C/Bb': ['x', 3, 2, 3, 1, 0],
    'D/F#': [2, 'x', 0, 2, 3, 2],
    'D/A': ['x', 0, 0, 2, 3, 2],
    'D/C': ['x', 3, 0, 2, 3, 2],
    'G/B': ['x', 2, 0, 0, 0, 3],
    'G/D': ['x', 'x', 0, 0, 0, 3],
    'G/F': [1, 2, 0, 0, 0, 3],
    'Am/G': [3, 0, 2, 2, 1, 0],
    'Am/F#': [2, 0, 2, 2, 1, 0],
    'Am/E': [0, 0, 2, 2, 1, 0],
    'Am/G#': [4, 0, 2, 2, 1, 0],
    'F/C': ['x', 3, 3, 2, 1, 1],
    'F/A': ['x', 0, 3, 2, 1, 1],
    'A/C#': ['x', 4, 2, 2, 2, 0],
    'A/E': [0, 0, 2, 2, 2, 0],
    'A/G': [3, 0, 2, 2, 2, 0],
    'E/G#': [4, 2, 2, 1, 0, 0],
    'Em/D': ['x', 'x', 0, 0, 0, 0],
    'Dm/C': ['x', 3, 0, 2, 3, 1],
    'Dm/A': ['x', 0, 0, 2, 3, 1],
    'C7/Bb': ['x', 1, 2, 0, 1, 0],
    'G7/F': [1, 2, 0, 0, 0, 1],
    'A7/G': [3, 0, 2, 0, 2, 0],
  };

  // Dedicated Power Chord Voicing Handler (5 / power5)
  // Power chord STRICTLY contains only Root (1) and Perfect 5th (5).
  // No 3rds allowed. Default is standard 2-string grip; optional 3-string with octave root.
  // All other strings are muted ('x').
  const isPower = chordType === 'power5' || chordType === '5';
  if (isPower) {
    const eFret = (rootPitch - getChromaticIndex('E') + 12) % 12;
    const aFret = (rootPitch - getChromaticIndex('A') + 12) % 12;
    const dFret = (rootPitch - getChromaticIndex('D') + 12) % 12;

    const powerShapes: ChordShapeVoicing[] = [];

    // 1. Root on String 5 (Senar 5 & 4: Root + 5th) - 2 Senar
    powerShapes.push(
      buildVoicing(
        'p5-s5-2s',
        aFret === 0 ? 'A5 Open (2-Senar)' : `Root Senar 5 (Fret ${aFret}) - 2 Senar`,
        ['x', aFret, aFret + 2, 'x', 'x', 'x']
      )
    );

    // 2. Root on String 5 (Senar 5, 4, 3: Root + 5th + Octave Root) - 3 Senar
    powerShapes.push(
      buildVoicing(
        'p5-s5-3s',
        aFret === 0 ? 'A5 Open (3-Senar)' : `Root Senar 5 (Fret ${aFret}) - 3 Senar`,
        ['x', aFret, aFret + 2, aFret + 2, 'x', 'x']
      )
    );

    // 3. Root on String 6 (Senar 6 & 5: Root + 5th) - 2 Senar
    powerShapes.push(
      buildVoicing(
        'p5-s6-2s',
        eFret === 0 ? 'E5 Open (2-Senar)' : `Root Senar 6 (Fret ${eFret}) - 2 Senar`,
        [eFret, eFret + 2, 'x', 'x', 'x', 'x']
      )
    );

    // 4. Root on String 6 (Senar 6, 5, 4: Root + 5th + Octave Root) - 3 Senar
    powerShapes.push(
      buildVoicing(
        'p5-s6-3s',
        eFret === 0 ? 'E5 Open (3-Senar)' : `Root Senar 6 (Fret ${eFret}) - 3 Senar`,
        [eFret, eFret + 2, eFret + 2, 'x', 'x', 'x']
      )
    );

    // 5. Root on String 4 (Senar 4 & 3: Root + 5th) - only if fret <= 9
    if (dFret <= 9) {
      powerShapes.push(
        buildVoicing(
          'p5-s4-2s',
          dFret === 0 ? 'D5 Open (2-Senar)' : `Root Senar 4 (Fret ${dFret}) - 2 Senar`,
          ['x', 'x', dFret, dFret + 2, 'x', 'x']
        )
      );
    }

    const uniqueMap = new Map<string, ChordShapeVoicing>();
    powerShapes.forEach((s) => {
      const key = s.frets.join(',');
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, s);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.baseFret !== b.baseFret) {
        return a.baseFret - b.baseFret;
      }
      return a.name.includes('2-Senar') ? -1 : 1;
    });
  }

  let suffix = '';
  if (chordType === 'maj9') suffix = 'maj9';
  else if (chordType === 'm9') suffix = 'm9';
  else if (chordType === 'dom9' || chordType === '9') suffix = '9';
  else if (chordType === 'dom11' || chordType === '11') suffix = '11';
  else if (chordType === '7sus4') suffix = '7sus4';
  else if (chordType === 'sus2') suffix = 'sus2';
  else if (chordType === 'sus4') suffix = 'sus4';
  else if (chordType === 'add9') suffix = 'add9';
  else if (chordType === 'maj6' || chordType === '6') suffix = '6';
  else if (chordType === 'm6') suffix = 'm6';
  else if (chordType === 'dim7') suffix = 'dim7';
  else if (chordType === 'm7b5') suffix = 'm7b5';
  else if (chordType === 'dim') suffix = 'dim';
  else if (chordType === 'aug7') suffix = 'aug7';
  else if (chordType === 'aug') suffix = 'aug';
  else if (chordType === 'power5' || chordType === '5') suffix = '5';
  else if (chordType === 'mmaj7') suffix = 'mmaj7';
  else if (isM7) suffix = 'maj7';
  else if (isMin7) suffix = 'm7';
  else if (is7) suffix = '7';
  else if (isMinor) suffix = 'm';

  const baseKey = `${root}${suffix}`;
  const slashKey = bassNote ? `${baseKey}/${bassNote}` : baseKey;
  const openFretPattern = OPEN_CHORDS[slashKey] || (bassNote ? OPEN_CHORDS[`${root}/${bassNote}`] : undefined) || OPEN_CHORDS[baseKey];

  if (openFretPattern) {
    shapes.push(buildVoicing('open', bassNote ? `Posisi Open (${slashKey})` : 'Posisi Open', openFretPattern));
  }

  // 1. E Shape (Root on String 6)
  const eFret = (rootPitch - getChromaticIndex('E') + 12) % 12;
  let s6Frets: (number | 'x')[] = [];
  if (chordType === 'dom9' || chordType === '9') {
    s6Frets = [eFret, 'x', eFret, eFret + 1, eFret + 2, 'x'];
  } else if (chordType === 'dom11' || chordType === '11') {
    s6Frets = [eFret, 'x', eFret, eFret + 2, eFret + 1, 'x'];
  } else if (chordType === 'mmaj7') {
    s6Frets = [eFret, eFret + 2, eFret + 1, eFret, eFret, eFret];
  } else if (chordType === 'm9') {
    s6Frets = [eFret, 'x', eFret, eFret, eFret + 2, 'x'];
  } else if (chordType === 'maj9') {
    s6Frets = [eFret, 'x', eFret + 1, eFret + 1, eFret + 2, 'x'];
  } else if (chordType === 'sus2') {
    s6Frets = [eFret, eFret + 2, eFret + 4, eFret + 4, eFret, eFret];
  } else if (chordType === 'sus4') {
    s6Frets = [eFret, eFret + 2, eFret + 2, eFret + 2, eFret, eFret];
  } else if (chordType === '7sus4') {
    s6Frets = [eFret, eFret + 2, eFret, eFret + 2, eFret, eFret];
  } else if (chordType === 'dim7') {
    s6Frets = [eFret, 'x', eFret - 1, eFret, eFret - 1, 'x'].map(f => (typeof f === 'number' && f < 0 ? f + 12 : f) as number | 'x');
  } else if (chordType === 'm7b5') {
    s6Frets = [eFret, 'x', eFret, eFret, eFret - 1, 'x'].map(f => (typeof f === 'number' && f < 0 ? f + 12 : f) as number | 'x');
  } else if (chordType === 'aug' || chordType === 'aug7') {
    s6Frets = [eFret, 'x', eFret + 2, eFret + 1, eFret + 1, 'x'];
  } else if (chordType === 'maj6' || chordType === '6') {
    s6Frets = [eFret, 'x', eFret - 1, eFret + 1, eFret + 2, 'x'].map(f => (typeof f === 'number' && f < 0 ? f + 12 : f) as number | 'x');
  } else if (chordType === 'm6') {
    s6Frets = [eFret, 'x', eFret - 1, eFret, eFret + 2, 'x'].map(f => (typeof f === 'number' && f < 0 ? f + 12 : f) as number | 'x');
  } else if (chordType === 'add9') {
    s6Frets = [eFret, eFret + 2, eFret + 4, eFret + 1, eFret, eFret];
  } else if (isMinor) {
    s6Frets = [eFret, eFret + 2, eFret + 2, eFret, eFret, eFret];
  } else if (is7) {
    s6Frets = [eFret, eFret + 2, eFret, eFret + 1, eFret, eFret];
  } else if (isMin7) {
    s6Frets = [eFret, eFret + 2, eFret, eFret, eFret, eFret];
  } else if (isM7) {
    s6Frets = [eFret, 'x', eFret + 1, eFret + 1, eFret, 'x'];
  } else {
    s6Frets = [eFret, eFret + 2, eFret + 2, eFret + 1, eFret, eFret];
  }
  shapes.push(
    buildVoicing(
      'shape-e',
      eFret === 0 ? 'E-Shape (Open)' : `E-Shape (Fret ${eFret})`,
      s6Frets
    )
  );

  // 2. A Shape (Root on String 5)
  const aFret = (rootPitch - getChromaticIndex('A') + 12) % 12;
  let s5Frets: (number | 'x')[] = [];
  if (chordType === 'dom9' || chordType === '9') {
    s5Frets = ['x', aFret, aFret - 1, aFret, aFret, 'x'].map(f => (typeof f === 'number' && f < 0 ? f + 12 : f) as number | 'x');
  } else if (chordType === 'dom11' || chordType === '11') {
    s5Frets = ['x', aFret, aFret, aFret, aFret, 'x'];
  } else if (chordType === 'mmaj7') {
    s5Frets = ['x', aFret, aFret + 1, aFret + 1, aFret + 1, aFret];
  } else if (chordType === 'm9') {
    s5Frets = ['x', aFret, aFret - 1, aFret, aFret, aFret].map(f => (typeof f === 'number' && f < 0 ? f + 12 : f) as number | 'x');
  } else if (chordType === 'maj9') {
    s5Frets = ['x', aFret, aFret + 1, aFret + 1, aFret, 'x'];
  } else if (chordType === 'sus2') {
    s5Frets = ['x', aFret, aFret + 2, aFret + 2, aFret, aFret];
  } else if (chordType === 'sus4') {
    s5Frets = ['x', aFret, aFret + 2, aFret + 2, aFret + 3, aFret];
  } else if (chordType === '7sus4') {
    s5Frets = ['x', aFret, aFret + 2, aFret, aFret + 3, aFret];
  } else if (chordType === 'dim7') {
    s5Frets = ['x', aFret, aFret + 1, aFret - 1, aFret + 1, 'x'].map(f => (typeof f === 'number' && f < 0 ? f + 12 : f) as number | 'x');
  } else if (chordType === 'm7b5') {
    s5Frets = ['x', aFret, aFret + 1, aFret, aFret + 1, 'x'];
  } else if (chordType === 'maj6' || chordType === '6') {
    s5Frets = ['x', aFret, aFret + 4, aFret + 2, aFret + 2, 'x'];
  } else if (chordType === 'm6') {
    s5Frets = ['x', aFret, aFret + 4, aFret + 2, aFret + 1, 'x'];
  } else if (chordType === 'add9') {
    s5Frets = ['x', aFret, aFret + 2, aFret + 4, aFret + 2, aFret];
  } else if (isMinor) {
    s5Frets = ['x', aFret, aFret + 2, aFret + 2, aFret + 1, aFret];
  } else if (is7) {
    s5Frets = ['x', aFret, aFret + 2, aFret, aFret + 2, aFret];
  } else if (isMin7) {
    s5Frets = ['x', aFret, aFret + 2, aFret, aFret + 1, aFret];
  } else if (isM7) {
    s5Frets = ['x', aFret, aFret + 2, aFret + 1, aFret + 2, aFret];
  } else {
    s5Frets = ['x', aFret, aFret + 2, aFret + 2, aFret + 2, aFret];
  }
  shapes.push(
    buildVoicing(
      'shape-a',
      aFret === 0 ? 'A-Shape (Open)' : `A-Shape (Fret ${aFret})`,
      s5Frets
    )
  );

  // 3. C Shape (Root on String 5) & 4. D Shape (Root on String 4)
  // ONLY for standard Major, Minor, Dominant 7, and Major 7 chords where CAGED voicings are natural
  const isCagedStandard = ['major', '', 'minor', 'm', 'dom7', '7', 'maj7', 'm7', 'min7'].includes(chordType);
  if (isCagedStandard) {
    const cBarre = (rootPitch - getChromaticIndex('C') + 12) % 12;
    if (cBarre > 0 || isM7) {
      let cFrets: (number | 'x')[] = [];
      if (isMinor) {
        cFrets = ['x', cBarre + 3, cBarre + 1, cBarre, cBarre + 1, cBarre];
      } else if (isM7) {
        cFrets = ['x', cBarre + 3, cBarre + 2, cBarre, cBarre, cBarre];
      } else {
        cFrets = ['x', cBarre + 3, cBarre + 2, cBarre, cBarre + 1, cBarre];
      }
      shapes.push(
        buildVoicing('shape-c', cBarre === 0 ? 'C-Shape (Open)' : `C-Shape (Fret ${cBarre})`, cFrets)
      );
    }

    const dFret = (rootPitch - getChromaticIndex('D') + 12) % 12;
    let dFrets: (number | 'x')[] = [];
    if (isMinor) {
      dFrets = ['x', 'x', dFret, dFret + 2, dFret + 3, dFret + 1];
    } else if (is7) {
      dFrets = ['x', 'x', dFret, dFret + 2, dFret + 1, dFret + 2];
    } else if (isM7) {
      dFrets = ['x', 'x', dFret, dFret + 2, dFret + 2, dFret + 2];
    } else {
      dFrets = ['x', 'x', dFret, dFret + 2, dFret + 3, dFret + 2];
    }
    shapes.push(
      buildVoicing('shape-d', `D-Shape (Fret ${dFret || 12})`, dFrets)
    );
  }

  // Filter unique shapes (by frets pattern string representation) and sort by base fret
  const uniqueMap = new Map<string, ChordShapeVoicing>();
  shapes.forEach((s) => {
    const key = s.frets.join(',');
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, s);
    }
  });

  const uniqueShapes = Array.from(uniqueMap.values()).sort(
    (a, b) => a.baseFret - b.baseFret
  );

  return uniqueShapes;
}

// Generate Arpeggios & Triads across contiguous string groups
export function getTriadVoicings(
  root: string,
  chordNotes: string[],
  intervals: number[]
): ChordShapeVoicing[] {
  const targetNotes = chordNotes.map((n) => n.toUpperCase());
  if (targetNotes.length < 3) return [];

  const voicings: ChordShapeVoicing[] = [];

  if (targetNotes.length >= 4) {
    const groups4: { label: string; strings: [number, number, number, number] }[] = [
      { label: 'Senar 1-2-3-4', strings: [4, 3, 2, 1] },
      { label: 'Senar 2-3-4-5', strings: [5, 4, 3, 2] },
    ];

    groups4.forEach((grp) => {
      const [s4, s3, s2, s1] = grp.strings;
      const g4 = GUITAR_STRINGS.find((s) => s.stringNumber === s4)!;
      const g3 = GUITAR_STRINGS.find((s) => s.stringNumber === s3)!;
      const g2 = GUITAR_STRINGS.find((s) => s.stringNumber === s2)!;
      const g1 = GUITAR_STRINGS.find((s) => s.stringNumber === s1)!;

      for (let baseFret = 0; baseFret <= 9; baseFret++) {
        const f4 = baseFret === 0 ? 0 : baseFret;
        const f3 = baseFret === 0 ? 0 : baseFret;
        const f2 = baseFret === 0 ? 0 : baseFret;
        const f1 = baseFret === 0 ? 0 : baseFret;

        const n4 = getGuitarFretNote(g4.openNote, f4).note.toUpperCase();
        const n3 = getGuitarFretNote(g3.openNote, f3).note.toUpperCase();
        const n2 = getGuitarFretNote(g2.openNote, f2).note.toUpperCase();
        const n1 = getGuitarFretNote(g1.openNote, f1).note.toUpperCase();

        if (
          targetNotes.includes(n4) &&
          targetNotes.includes(n3) &&
          targetNotes.includes(n2) &&
          targetNotes.includes(n1)
        ) {
          const fretList: (number | 'x')[] = ['x', 'x', 'x', 'x', 'x', 'x'];
          [6, 5, 4, 3, 2, 1].forEach((sNum, sIdx) => {
            if (sNum === s4) fretList[sIdx] = f4;
            if (sNum === s3) fretList[sIdx] = f3;
            if (sNum === s2) fretList[sIdx] = f2;
            if (sNum === s1) fretList[sIdx] = f1;
          });

          const positions: ChordStringPosition[] = [];
          const notesSeq: ChordShapeVoicing['notesSequence'] = [];

          [6, 5, 4, 3, 2, 1].forEach((strNum, idx) => {
            const fret = fretList[idx];
            const gString = GUITAR_STRINGS.find((s) => s.stringNumber === strNum)!;
            if (fret === 'x') {
              positions.push({ stringNum: strNum, fret: 'x', note: null, degree: null, octave: null });
            } else {
              const { note, octaveDiff } = getGuitarFretNote(gString.openNote, fret as number);
              const octave = gString.openOctave + octaveDiff;
              const degree = getDegreeLabel(root, note, intervals);
              positions.push({ stringNum: strNum, fret: fret as number, note, degree, octave });
              notesSeq.push({ stringNum: strNum, fret: fret as number, note, degree, octave });
            }
          });

          voicings.push({
            id: `triad-4-${grp.label}-${baseFret}`,
            name: `${grp.label} (Fret ${baseFret || 'Open'})`,
            category: 'triad',
            frets: fretList,
            fretRange: [Math.max(1, baseFret), Math.max(4, baseFret + 3)],
            baseFret: Math.max(1, baseFret === 0 ? 1 : baseFret),
            positions,
            notesSequence: notesSeq,
          });
          break;
        }
      }
    });
  }

  return voicings;
}
