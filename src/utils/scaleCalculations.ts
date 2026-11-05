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
 * Returns number of patterns for the scale: 7 for 7-note modal/diatonic, 5 for pentatonic
 */
export function getScalePatternCount(intervals: number[]): number {
  return intervals.length === 7 ? 7 : 5;
}

/**
 * Calculates accurate non-doubled scale positions for a pattern.
 * Uses 3NPS (3 Notes Per String) for 7-note scales (7 patterns).
 * Uses 2NPS (2 Notes Per String) for pentatonic scales (5 patterns).
 */
export function getScalePatternPositions(
  root: string,
  intervals: number[],
  characteristicSemitones: number[] = [],
  patternIndex: number = 0
): { positions: ScaleNotePosition[]; minFret: number; maxFret: number } {
  const rootIdx = getChromaticIndex(root);
  if (rootIdx === -1 || intervals.length === 0) {
    return { positions: [], minFret: 1, maxFret: 5 };
  }

  const is7NoteScale = intervals.length === 7;
  const characteristicPitches = characteristicSemitones.map((i) => (rootIdx + i) % 12);
  const openStringMidis = [40, 45, 50, 55, 59, 64]; // strings 6, 5, 4, 3, 2, 1

  if (is7NoteScale) {
    // 3NPS: 7 Patterns, each string has strictly 3 ascending notes
    const pIdx = ((patternIndex % 7) + 7) % 7;
    const degOffset = intervals[pIdx];
    const pitchClassOnString6 = (rootIdx + degOffset) % 12;

    // Base fret on string 6
    let startFret = (pitchClassOnString6 - 4 + 12) % 12;

    const build3NpsFrets = (sFret: number) => {
      const items: { strNum: number; fret: number; pitch: number; degIdx: number }[] = [];
      let currentPitch = 40 + sFret;

      for (let s = 0; s < 6; s++) {
        const strNum = 6 - s;
        const openMidi = openStringMidis[s];

        for (let n = 0; n < 3; n++) {
          const globalNoteIdx = s * 3 + n;
          const currentDegIdx = (pIdx + globalNoteIdx) % 7;
          const nextDegIdx = (pIdx + globalNoteIdx + 1) % 7;

          const fret = currentPitch - openMidi;
          items.push({ strNum, fret, pitch: currentPitch, degIdx: currentDegIdx });

          // Semitones to next degree in scale
          const semitonesToNext =
            (intervals[nextDegIdx] - intervals[currentDegIdx] + 12) % 12 || 12;
          currentPitch += semitonesToNext;
        }
      }
      return items;
    };

    let items = build3NpsFrets(startFret);
    let maxF = Math.max(...items.map((i) => i.fret));

    // If pattern goes off fret 15 and we can shift down 12 frets, shift down
    if (maxF > 15 && startFret >= 12) {
      startFret -= 12;
      items = build3NpsFrets(startFret);
      maxF = Math.max(...items.map((i) => i.fret));
    }
    // Or if starting fret is low (e.g. fret 0-2) but max is <= 15, verify fretboard bounds
    let minF = Math.min(...items.map((i) => i.fret));
    if (minF < 0) {
      startFret += 12;
      items = build3NpsFrets(startFret);
      minF = Math.min(...items.map((i) => i.fret));
      maxF = Math.max(...items.map((i) => i.fret));
    }

    const positions: ScaleNotePosition[] = items.map((item) => {
      const noteIdx = item.pitch % 12;
      const note = CHROMATIC_NOTES[noteIdx];
      const octave = Math.floor(item.pitch / 12) - 1;
      const semitones = (noteIdx - rootIdx + 12) % 12;
      const degree = getDegreeLabel(semitones);

      let role: ScaleNotePosition['role'] = 'normal';
      if (semitones === 0) {
        role = 'root';
      } else if (characteristicPitches.includes(noteIdx)) {
        role = 'characteristic';
      }

      return {
        stringNum: item.strNum,
        fret: item.fret,
        note,
        degree,
        octave,
        role,
      };
    });

    return {
      positions,
      minFret: minF,
      maxFret: maxF,
    };
  }

  // 2NPS Pentatonic / Blues: 5 Patterns
  const pIdx = ((patternIndex % 5) + 5) % 5;
  const numDeg = intervals.length >= 5 ? 5 : intervals.length;
  const degOffset = intervals[pIdx % numDeg];
  const pitchClassOnString6 = (rootIdx + degOffset) % 12;

  let startFret = (pitchClassOnString6 - 4 + 12) % 12;

  // Degrees per string mapping for standard 5 CAGED pentatonic boxes
  const stringDegOffsets = [
    [0, 1], // str 6
    [2, 3], // str 5
    [4, 0], // str 4
    [1, 2], // str 3
    [3, 4], // str 2
    [0, 1], // str 1
  ];

  const buildPentatonicFrets = (sFret: number) => {
    const items: { strNum: number; fret: number; pitch: number; degIdx: number }[] = [];
    let currentPitch = 40 + sFret;

    for (let s = 0; s < 6; s++) {
      const strNum = 6 - s;
      const openMidi = openStringMidis[s];
      const [d1Offset, d2Offset] = stringDegOffsets[s];

      const deg1 = (pIdx + d1Offset) % numDeg;
      const deg2 = (pIdx + d2Offset) % numDeg;

      // Ensure current pitch class matches deg1
      const targetPitchClass1 = (rootIdx + intervals[deg1]) % 12;
      while (currentPitch % 12 !== targetPitchClass1) {
        currentPitch++;
      }

      const fret1 = currentPitch - openMidi;
      items.push({ strNum, fret: fret1, pitch: currentPitch, degIdx: deg1 });

      const semitonesToDeg2 = (intervals[deg2] - intervals[deg1] + 12) % 12 || 12;
      currentPitch += semitonesToDeg2;
      const fret2 = currentPitch - openMidi;
      items.push({ strNum, fret: fret2, pitch: currentPitch, degIdx: deg2 });
    }
    return items;
  };

  let items = buildPentatonicFrets(startFret);
  let maxF = Math.max(...items.map((i) => i.fret));
  let minF = Math.min(...items.map((i) => i.fret));

  if (maxF > 15 && startFret >= 12) {
    startFret -= 12;
    items = buildPentatonicFrets(startFret);
    minF = Math.min(...items.map((i) => i.fret));
    maxF = Math.max(...items.map((i) => i.fret));
  } else if (minF < 0) {
    startFret += 12;
    items = buildPentatonicFrets(startFret);
    minF = Math.min(...items.map((i) => i.fret));
    maxF = Math.max(...items.map((i) => i.fret));
  }

  const positions: ScaleNotePosition[] = items.map((item) => {
    const noteIdx = item.pitch % 12;
    const note = CHROMATIC_NOTES[noteIdx];
    const octave = Math.floor(item.pitch / 12) - 1;
    const semitones = (noteIdx - rootIdx + 12) % 12;
    const degree = getDegreeLabel(semitones);

    let role: ScaleNotePosition['role'] = 'normal';
    if (semitones === 0) {
      role = 'root';
    } else if (characteristicPitches.includes(noteIdx)) {
      role = 'characteristic';
    }

    return {
      stringNum: item.strNum,
      fret: item.fret,
      note,
      degree,
      octave,
      role,
    };
  });

  // If Blues scale with Blue note (b5), add blue notes that fall within this box window
  if (characteristicSemitones.length > 0) {
    const bluePitchClass = (rootIdx + 6) % 12; // b5
    [6, 5, 4, 3, 2, 1].forEach((strNum) => {
      const gString = GUITAR_STRINGS.find((s) => s.stringNumber === strNum)!;
      for (let f = minF; f <= maxF; f++) {
        const { note, octaveDiff } = getGuitarFretNote(gString.openNote, f);
        if (getChromaticIndex(note) === bluePitchClass) {
          // Avoid duplicate if already in positions
          if (!positions.some((p) => p.stringNum === strNum && p.fret === f)) {
            positions.push({
              stringNum: strNum,
              fret: f,
              note,
              degree: 'b5',
              octave: gString.openOctave + octaveDiff,
              role: 'characteristic',
            });
          }
        }
      }
    });
  }

  return {
    positions,
    minFret: minF,
    maxFret: maxF,
  };
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
