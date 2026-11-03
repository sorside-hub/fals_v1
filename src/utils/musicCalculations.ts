import { CHROMATIC_NOTES } from '../data/constants';
import { CHORD_FORMULAS } from '../data/chordFormulas';
import { SCALES } from '../data/scales';

// Helper to calculate notes of a scale
export function getScaleNotes(root: string, scaleKey: string): string[] {
  const scale = SCALES[scaleKey] || SCALES['major'];
  const rootIdx = CHROMATIC_NOTES.indexOf(root);
  if (rootIdx === -1) return [];
  return scale.intervals.map(interval => {
    return CHROMATIC_NOTES[(rootIdx + interval) % 12];
  });
}

// Helper to calculate notes of a chord
export function getChordNotes(root: string, chordKey: string): string[] {
  const formula = CHORD_FORMULAS[chordKey] || CHORD_FORMULAS['major'];
  const rootIdx = CHROMATIC_NOTES.indexOf(root);
  if (rootIdx === -1) return [];
  return formula.intervals.map(interval => {
    return CHROMATIC_NOTES[(rootIdx + interval) % 12];
  });
}

// Calculate note at guitar string & fret (0 to 12)
export function getGuitarFretNote(openNote: string, fret: number): { note: string; octaveDiff: number } {
  const rootIdx = CHROMATIC_NOTES.indexOf(openNote);
  const totalSemitones = rootIdx + fret;
  const note = CHROMATIC_NOTES[totalSemitones % 12];
  const octaveDiff = Math.floor(totalSemitones / 12);
  return { note, octaveDiff };
}
