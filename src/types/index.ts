export type TabType = 'lyrics' | 'bank';

export interface NoteInfo {
  name: string;
  octave: number;
  midi: number;
  isBlack: boolean;
  frequency: number;
}

export interface ChordFormula {
  name: string;
  symbol: string;
  intervals: number[]; // semitones from root
  formulaNames: string;
  feeling: string;
  example: string;
}

export interface ScaleFormula {
  name: string;
  symbol: string;
  intervals: number[];
  mood: string;
  usage: string;
}

export interface GuitarFingering {
  frets: (number | 'x')[]; // 6 strings from low E (6) to high E (1), e.g. ['x', 3, 2, 0, 1, 0] for C
  fingers?: string; // e.g. "x-3-2-0-1-0"
  barreFret?: number;
  description?: string;
}

export interface ChordDictionaryItem {
  name: string;
  symbol: string;
  formula: string;
  feeling: string;
  notesExample: string;
  intervals: number[];
  fingering: GuitarFingering;
}

export interface SongCaseStudy {
  song: string;
  artist: string;
  progression: string[];
  romanNumerals: string;
  whyItWorks: string;
}

export interface TheoryTheme {
  id: string;
  themeNumber: string;
  title: string;
  tagline: string;
  readTime: string;
  preview: {
    analogy: string;
    summary: string;
    cheatSheet: string[];
    quickTip: string;
    defaultRoot: string;
    highlightNotes: string[];
    toolType: 'piano' | 'fretboard' | 'circle' | 'chords';
  };
  deepDive: {
    overview: string;
    chapters: {
      chapterNum: string;
      heading: string;
      content: string;
      bulletPoints?: string[];
      proTip?: string;
    }[];
    chordDictionary?: ChordDictionaryItem[];
    songCaseStudies?: SongCaseStudy[];
  };
}

export interface TheoryLesson {
  id: string;
  level: 'dasar' | 'menengah' | 'lanjutan';
  levelNumber: string;
  title: string;
  subtitle: string;
  analogy: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
    bulletPoints?: string[];
    proTip?: string;
  }[];
  interactiveTool: 'piano' | 'fretboard' | 'circle' | 'chords';
  defaultRootNote?: string;
  highlightNotes?: string[];
  recommendedChords?: string[];
  progressionExample?: string[];
}

export interface LyricVersion {
  id: string;
  name: string;
  content: string;
  isFinal: boolean;
  createdAt: number;
  updatedAt?: number;
  key?: string;
  bpm?: number;
}

export interface AudioMemo {
  id: string;
  name: string;
  duration: number; // in seconds
  createdAt: number;
}

export type ProjectType = 'single' | 'ep' | 'album';

export type SongStatus = 'draft' | 'progress' | 'release' | 'final' | 'proses';

export interface SongDraft {
  id: string;
  title: string;
  content: string;
  concept?: string;
  projectType?: ProjectType; // 'single' (default) | 'ep' | 'album'
  tracks?: SongDraft[]; // Collection of tracks if projectType is 'ep' or 'album'
  versions?: LyricVersion[];
  activeVersionId?: string;
  audioMemos?: AudioMemo[];
  key: string;
  bpm: number;
  timeSignature: string;
  status: SongStatus;
  createdAt?: number;
  updatedAt: number;
  tags?: string[];
}

export type BarCategory = 'diksi' | 'metafor' | 'bar' | 'hook' | 'punchline' | 'rhyme' | 'idea';

export interface BarItem {
  id: string;
  text: string;
  meaning?: string; // Makna / maksud filosofis / konteks suasana
  category: BarCategory;
  rhymeScheme?: string; // e.g. "AABB", "ABAB", "Internal", "Free"
  syllableCount?: number;
  tags: string[];
  createdAt: number;
}
