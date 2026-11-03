import { CHROMATIC_NOTES, ENHARMONIC_EQUIVALENTS } from '../data/constants';

function getNoteIndex(noteStr: string): number {
  if (!noteStr) return 0;
  const trimmed = noteStr.trim();
  const clean = trimmed.charAt(0).toUpperCase() + (trimmed.length > 1 ? trimmed.charAt(1).toLowerCase() : '');
  let normalized = clean;
  if (ENHARMONIC_EQUIVALENTS[normalized]) {
    normalized = ENHARMONIC_EQUIVALENTS[normalized];
  }
  const idx = CHROMATIC_NOTES.indexOf(normalized);
  return idx !== -1 ? idx : 0;
}

function transposeSingleNote(note: string, semitoneShift: number): string {
  const idx = getNoteIndex(note);
  const newIdx = (idx + semitoneShift + 12) % 12;
  return CHROMATIC_NOTES[newIdx];
}

export function transposeChordSymbol(chord: string, semitoneShift: number): string {
  if (!chord || semitoneShift === 0) return chord;
  const clean = chord.trim().replace(/[\[\]]/g, '');
  
  // Check for slash chord (e.g. G/B)
  if (clean.includes('/')) {
    const parts = clean.split('/');
    const mainChord = parts[0];
    const bassNote = parts[1];
    return `${transposeChordSymbol(mainChord, semitoneShift)}/${transposeChordSymbol(bassNote, semitoneShift)}`;
  }

  // Extract root note: [A-G] followed by optional '#' or 'b'
  const match = clean.match(/^([A-G][b#]?)(.*)$/i);
  if (!match) return clean;

  const root = match[1];
  const suffix = match[2];
  const transposedRoot = transposeSingleNote(root, semitoneShift);
  return `${transposedRoot}${suffix}`;
}

export function calculateSemitoneShift(oldKey: string, newKey: string): number {
  if (!oldKey || !newKey) return 0;
  const cleanOld = oldKey.trim().replace(/m$|maj$|min$|dim$/i, '');
  const cleanNew = newKey.trim().replace(/m$|maj$|min$|dim$/i, '');
  
  const oldIdx = getNoteIndex(cleanOld);
  const newIdx = getNoteIndex(cleanNew);
  return (newIdx - oldIdx + 12) % 12;
}

export function transposeHtmlContent(htmlContent: string, semitoneShift: number): string {
  if (!htmlContent || semitoneShift === 0) return htmlContent;

  // 1. Replace data-chord attributes in spans
  let updated = htmlContent.replace(/data-chord="([^"]+)"/g, (_match, chord) => {
    const transposed = transposeChordSymbol(chord, semitoneShift);
    return `data-chord="${transposed}"`;
  });

  // 2. Replace bracketed chords [Chord] in text
  updated = updated.replace(/\[([A-G][b#]?(?:m|maj|min|dim|aug|sus[24]|add9|[0-9\/\#\b]*)?)\]/gi, (_match, chord) => {
    const transposed = transposeChordSymbol(chord, semitoneShift);
    return `[${transposed}]`;
  });

  return updated;
}
