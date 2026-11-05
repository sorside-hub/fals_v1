import { CHROMATIC_NOTES, GUITAR_STRINGS } from '../data/constants';
import { getGuitarFretNote } from './musicCalculations';

export interface ScaleNotePosition {
  stringNum: number;
  fret: number;
  note: string;
  degree: string;
  octave: number;
  role: 'root' | 'characteristic' | 'normal';
}

const flatToSharp: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

export function getChromaticIndex(note: string): number {
  if (!note) return 0;
  const clean = note.trim();
  const upper = clean.charAt(0).toUpperCase() + (clean.length > 1 ? clean.charAt(1).toLowerCase() : '');
  const normalized = flatToSharp[upper] || upper;
  return CHROMATIC_NOTES.indexOf(normalized);
}

export function getDegreeLabel(semitones: number): string {
  switch (semitones) {
    case 0: return 'R';
    case 1: return 'b2';
    case 2: return '2';
    case 3: return 'b3';
    case 4: return '3';
    case 5: return '4';
    case 6: return 'b5';
    case 7: return '5';
    case 8: return 'b6';
    case 9: return '6';
    case 10: return 'b7';
    case 11: return '7';
    default: return `${semitones}`;
  }
}

/**
 * Returns notes array in chromatic order for a scale
 */
export function getScaleNotes(root: string, intervals: number[]): string[] {
  const rootIdx = getChromaticIndex(root);
  if (rootIdx === -1) return [];
  return intervals.map((i) => CHROMATIC_NOTES[(rootIdx + i) % 12]);
}

/**
 * Calculates CAGED Box / Position fret ranges (1 to 5) for a given root on string 6
 */
export function getScalePositionFretRange(root: string, positionIndex: number): [number, number] {
  const rootPitch = getChromaticIndex(root);
  const rootOnString6 = (rootPitch - getChromaticIndex('E') + 12) % 12;

  // Box 1 starts at rootOnString6 (or rootOnString6 + 12)
  const baseFret = rootOnString6 === 0 ? 12 : rootOnString6;

  // Offset per CAGED position
  const offsets = [0, 2, 4, 7, 9];
  let startFret = (baseFret + (offsets[positionIndex % 5] || 0));

  if (startFret > 12) startFret -= 12;
  if (startFret <= 0) startFret = 1;

  const endFret = startFret + 3;
  return [startFret, endFret];
}

/**
 * Gets all scale note positions on the guitar fretboard within a specified fret range
 */
export function getScaleFretboardPositions(
  root: string,
  intervals: number[],
  characteristicSemitones: number[] = [],
  minFret: number = 0,
  maxFret: number = 15
): ScaleNotePosition[] {
  const rootIdx = getChromaticIndex(root);
  if (rootIdx === -1) return [];

  const scalePitches = intervals.map((i) => (rootIdx + i) % 12);
  const characteristicPitches = characteristicSemitones.map((i) => (rootIdx + i) % 12);

  const positions: ScaleNotePosition[] = [];

  [6, 5, 4, 3, 2, 1].forEach((strNum) => {
    const gString = GUITAR_STRINGS.find((s) => s.stringNumber === strNum)!;

    for (let fret = minFret; fret <= maxFret; fret++) {
      const { note, octaveDiff } = getGuitarFretNote(gString.openNote, fret);
      const noteIdx = getChromaticIndex(note);

      if (scalePitches.includes(noteIdx)) {
        const octave = gString.openOctave + octaveDiff;
        const semitones = (noteIdx - rootIdx + 12) % 12;
        const degree = getDegreeLabel(semitones);

        let role: ScaleNotePosition['role'] = 'normal';
        if (semitones === 0) {
          role = 'root';
        } else if (characteristicPitches.includes(noteIdx)) {
          role = 'characteristic';
        }

        positions.push({
          stringNum: strNum,
          fret,
          note,
          degree,
          octave,
          role,
        });
      }
    }
  });

  return positions;
}
