import { CHROMATIC_NOTES } from '../data/constants';
import { CHORD_FORMULAS } from '../data/chordFormulas';

export interface ParsedChord {
  rawSymbol: string;
  root: string;
  type: string;
  intervals: number[];
  notes: string[];
  displayName: string;
  feeling: string;
  formulaNames: string;
}

/**
 * Parses any chord symbol (e.g. "C", "Am", "G7", "Cmaj7", "Dsus2", "F#m", "Bb")
 * into its root note, intervals, chord notes, and music theory metadata.
 */
export function parseChordSymbol(symbol: string): ParsedChord {
  const clean = symbol.trim().replace(/[\[\]]/g, '');

  // Extract root note: [A-G] followed optionally by '#' or 'b'
  const match = clean.match(/^([A-G][b#]?)(.*)$/i);
  if (!match) {
    return {
      rawSymbol: clean || 'C',
      root: 'C',
      type: 'major',
      intervals: [0, 4, 7],
      notes: ['C', 'E', 'G'],
      displayName: `${clean || 'C'} Mayor`,
      feeling: 'Terang dan harmonis',
      formulaNames: '1 - 3 - 5',
    };
  }

  // Normalize root to uppercase chromatic convention
  let root = match[1].charAt(0).toUpperCase();
  if (match[1].length > 1) {
    const acc = match[1].charAt(1).toLowerCase();
    if (acc === '#' || acc === 'b') {
      root += acc;
    }
  }

  // Map flat notes to sharp equivalents if not directly in CHROMATIC_NOTES
  let chromaticRoot = root;
  if (!CHROMATIC_NOTES.includes(chromaticRoot)) {
    const flatToSharp: Record<string, string> = {
      'Db': 'C#',
      'Eb': 'D#',
      'Gb': 'F#',
      'Ab': 'G#',
      'Bb': 'A#',
    };
    if (flatToSharp[root]) {
      chromaticRoot = flatToSharp[root];
    }
  }

  const suffix = match[2].trim().toLowerCase();

  let formulaKey = 'major';
  if (suffix === 'm' || suffix === 'min' || suffix === '-') {
    formulaKey = 'minor';
  } else if (suffix === 'maj7' || suffix === 'm7+' || suffix === 'major7') {
    formulaKey = 'maj7';
  } else if (suffix === 'm7' || suffix === 'min7' || suffix === '-7') {
    formulaKey = 'm7';
  } else if (suffix === 'm9') {
    formulaKey = 'm9';
  } else if (suffix === 'maj9') {
    formulaKey = 'maj9';
  } else if (suffix === '7' || suffix === 'dom7') {
    formulaKey = 'dom7';
  } else if (suffix === 'sus2') {
    formulaKey = 'sus2';
  } else if (suffix === 'sus4' || suffix === 'sus') {
    formulaKey = 'sus4';
  } else if (suffix === 'add9' || suffix === '2') {
    formulaKey = 'add9';
  } else if (suffix === '6') {
    formulaKey = 'maj6';
  } else if (suffix === 'm6') {
    formulaKey = 'm6';
  } else if (suffix === 'dim' || suffix === 'o') {
    formulaKey = 'dim';
  } else if (suffix === 'aug' || suffix === '+') {
    formulaKey = 'aug';
  } else if (suffix === '5') {
    formulaKey = 'power5';
  }

  const formula = CHORD_FORMULAS[formulaKey] || CHORD_FORMULAS['major'];
  const rootIdx = CHROMATIC_NOTES.indexOf(chromaticRoot);

  const notes = rootIdx !== -1
    ? formula.intervals.map(semitones => CHROMATIC_NOTES[(rootIdx + semitones) % 12])
    : ['C', 'E', 'G'];

  return {
    rawSymbol: clean,
    root: chromaticRoot,
    type: formulaKey,
    intervals: formula.intervals,
    notes,
    displayName: `${clean} (${formula.name})`,
    feeling: formula.feeling || 'Harmonis',
    formulaNames: formula.formulaNames || '1 - 3 - 5',
  };
}
