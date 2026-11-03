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
  intervals: number[]
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

    // Base fret to display: if any string is open (0) or lowest fret is <= 3, always start at fret 1
    const hasOpenString = fretList.includes(0);
    const baseFret = (hasOpenString || minF <= 3) ? 1 : minF;
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

  // Common Open / Barre Shapes override dictionary (supporting sharp & flat keys)
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
    'C5': [3, 3, 5, 5, 'x', 'x'],
    'E5': [0, 2, 2, 'x', 'x', 'x'],
    'A5': ['x', 0, 2, 2, 'x', 'x'],
  };

  let suffix = '';
  if (chordType === 'maj9') suffix = 'maj9';
  else if (chordType === 'm9') suffix = 'm9';
  else if (chordType === 'maj6' || chordType === '6') suffix = '6';
  else if (chordType === 'm6') suffix = 'm6';
  else if (chordType === 'aug') suffix = 'aug';
  else if (chordType === 'power5' || chordType === '5') suffix = '5';
  else if (isM7) suffix = 'maj7';
  else if (isMin7) suffix = 'm7';
  else if (is7) suffix = '7';
  else if (isMinor) suffix = 'm';

  const chordKey = `${root}${suffix}`;
  const openFretPattern = OPEN_CHORDS[chordKey];

  if (openFretPattern) {
    shapes.push(buildVoicing('open', 'Posisi Open', openFretPattern));
  }

  // 1. E Shape (Root on String 6)
  const eFret = (rootPitch - getChromaticIndex('E') + 12) % 12;
  let s6Frets: (number | 'x')[] = [];
  if (isMinor) {
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
  if (isMinor) {
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

  // 3. C Shape (Root on String 5)
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

  // 4. D Shape (Root on String 4)
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
