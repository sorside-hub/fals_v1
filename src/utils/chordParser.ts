import { CHROMATIC_NOTES } from '../data/constants';
import { CHORD_FORMULAS } from '../data/chordFormulas';

export interface ParsedChord {
  rawSymbol: string;
  root: string;
  type: string;
  bass?: string;
  intervals: number[];
  notes: string[];
  displayName: string;
  feeling: string;
  formulaNames: string;
}

/**
 * Parses any chord symbol (e.g. "C", "Am", "G7", "Cmaj7", "C/G", "D/F#", "Dsus2")
 * into its root note, slash bass, intervals, chord notes, and music theory metadata.
 */
export function parseChordSymbol(symbol: string): ParsedChord {
  const clean = symbol.trim().replace(/[\[\]]/g, '');

  // Split by slash if present (e.g., C/G -> main="C", slashBass="G")
  const parts = clean.split('/');
  const mainPart = parts[0].trim();
  const rawBass = parts[1] ? parts[1].trim() : null;

  // Extract root note: [A-G] followed optionally by '#' or 'b'
  const match = mainPart.match(/^([A-G][b#]?)(.*)$/i);
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

  // Normalize bass note if present
  let chromaticBass: string | undefined = undefined;
  if (rawBass) {
    let bRoot = rawBass.charAt(0).toUpperCase();
    if (rawBass.length > 1) {
      const acc = rawBass.charAt(1).toLowerCase();
      if (acc === '#' || acc === 'b') {
        bRoot += acc;
      }
    }
    const flatToSharp: Record<string, string> = {
      'Db': 'C#',
      'Eb': 'D#',
      'Gb': 'F#',
      'Ab': 'G#',
      'Bb': 'A#',
    };
    chromaticBass = flatToSharp[bRoot] || bRoot;
    if (!CHROMATIC_NOTES.includes(chromaticBass)) {
      chromaticBass = undefined;
    }
  }

  const suffix = match[2].trim().toLowerCase();

  let formulaKey = 'major';
  if (suffix === 'm' || suffix === 'min' || suffix === '-') {
    formulaKey = 'minor';
  } else if (suffix === 'mmaj7' || suffix === 'minmaj7') {
    formulaKey = 'mmaj7';
  } else if (suffix === 'maj7' || suffix === 'm7+' || suffix === 'major7') {
    formulaKey = 'maj7';
  } else if (suffix === 'm7' || suffix === 'min7' || suffix === '-7') {
    formulaKey = 'm7';
  } else if (suffix === 'm9') {
    formulaKey = 'm9';
  } else if (suffix === 'maj9') {
    formulaKey = 'maj9';
  } else if (suffix === '9' || suffix === 'dom9') {
    formulaKey = 'dom9';
  } else if (suffix === '11' || suffix === 'dom11') {
    formulaKey = 'dom11';
  } else if (suffix === '7sus4' || suffix === '7sus') {
    formulaKey = '7sus4';
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
  } else if (suffix === 'dim7') {
    formulaKey = 'dim7';
  } else if (suffix === 'm7b5' || suffix === 'halfdim') {
    formulaKey = 'm7b5';
  } else if (suffix === 'dim' || suffix === 'o') {
    formulaKey = 'dim';
  } else if (suffix === 'aug7' || suffix === '+7') {
    formulaKey = 'aug7';
  } else if (suffix === 'aug' || suffix === '+') {
    formulaKey = 'aug';
  } else if (suffix === '5') {
    formulaKey = 'power5';
  }

  const formula = CHORD_FORMULAS[formulaKey] || CHORD_FORMULAS['major'];
  const rootIdx = CHROMATIC_NOTES.indexOf(chromaticRoot);

  let notes = rootIdx !== -1
    ? formula.intervals.map(semitones => CHROMATIC_NOTES[(rootIdx + semitones) % 12])
    : ['C', 'E', 'G'];

  // If slash bass note is present and not already in notes, include it
  if (chromaticBass && !notes.includes(chromaticBass)) {
    notes = [chromaticBass, ...notes];
  }

  const bassLabel = chromaticBass ? ` (Bass ${chromaticBass})` : '';

  return {
    rawSymbol: clean,
    root: chromaticRoot,
    type: formulaKey,
    bass: chromaticBass,
    intervals: formula.intervals,
    notes,
    displayName: `${formula.name}${bassLabel}`,
    feeling: formula.feeling || 'Harmonis',
    formulaNames: formula.formulaNames || '1 - 3 - 5',
  };
}
