// Smart Syllable Counter for Indonesian & English lyrics

export function countSyllablesInWord(word: string): number {
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 2) return 1;

  // Indonesian syllable heuristics (Indonesian is phonetically syllable-timed)
  // Vowels: a, i, u, e, o, plus dipthongs ai, au, oi
  const matches = clean.match(/[aiueo]+/g);
  if (!matches) return 1;

  let count = 0;
  for (const group of matches) {
    if (group.length === 1) {
      count += 1;
    } else if (group === 'ai' || group === 'au' || group === 'oi') {
      count += 1; // standard diphthong
    } else {
      // e.g. "ia" in "dia", "ua" in "dua", "io" in "radio" -> usually 2 syllables in Indo
      count += group.length;
    }
  }

  return Math.max(1, count);
}

// Regular expression to match standard chord notations (e.g. C, Am, G7, F#m, Esus2, Eadd9, Bbmaj7, D/F#)
export const CHORD_PATTERN = /^[A-G][b#]?(?:m|maj|min|dim|aug|sus[24]?|add[0-9]+|[0-9]+)*(?:\/[A-G][b#]?)?$/;

export function isChordToken(token: string): boolean {
  const clean = token.trim().replace(/^[\(\[\{]/, '').replace(/[\)\]\}]$/, '');
  return CHORD_PATTERN.test(clean);
}

export function countSyllablesInLine(line: string): number {
  if (!line) return 0;

  // 1. Strip anything inside brackets [..] or parentheses (..) entirely (chords, tags, notes)
  let text = line
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^\)]*\)/g, ' ')
    .trim();

  if (!text) return 0;

  // 2. Ignore section headings if written without brackets
  if (/^(verse|chorus|bridge|pre-chorus|hook|outro|intro|reff)/i.test(text.replace(/[:\-]/g, ''))) {
    return 0;
  }

  // 3. Split by whitespace into individual words
  const tokens = text.split(/\s+/).filter(Boolean);

  // 4. Filter out any words that are chords or pure numbers
  const lyricWords = tokens.filter((token) => {
    if (isChordToken(token)) return false;
    if (/^[0-9]+$/.test(token)) return false;
    return true;
  });

  // If the line consists only of chords (e.g. "Am F C G" or "Esus2 Eadd9"), do not count any syllables
  if (lyricWords.length === 0) return 0;

  return lyricWords.reduce((total, word) => total + countSyllablesInWord(word), 0);
}

// Find words that end in similar rhyme sound
export function getRhymeEnding(word: string): string {
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (clean.length < 2) return clean;
  // Get last 2-3 letters including last vowel
  const lastVowelIdx = clean.search(/[aiueo][^aiueo]*$/);
  if (lastVowelIdx !== -1) {
    return clean.slice(lastVowelIdx);
  }
  return clean.slice(-2);
}
