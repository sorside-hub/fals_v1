import React, { useState, useMemo } from 'react';
import { Menu, ChevronDown, BookOpen } from 'lucide-react';
import { parseChordSymbol } from '../../utils/chordParser';
import { getFullChordShapes, ChordShapeVoicing } from '../../utils/guitarChordVoicings';
import { sound } from '../../utils/audioEngine';
import { RadialNotePicker } from './RadialNotePicker';
import { GuitarFretboardDiagram } from './GuitarFretboardDiagram';
import { LabDrawerSidebar, LabFeature } from './LabDrawerSidebar';
import { ScaleView } from './ScaleView';

// Categories of Chord Extensions / Qualities
interface ChordTypeCategory {
  category: string;
  types: {
    symbol: string;
    label: string;
    formula: string;
  }[];
}

const CHORD_TYPE_CATEGORIES: ChordTypeCategory[] = [
  {
    category: 'Utama',
    types: [
      { symbol: '', label: 'Mayor', formula: '1 - 3 - 5' },
      { symbol: 'm', label: 'Minor', formula: '1 - b3 - 5' },
      { symbol: '5', label: 'Power', formula: '1 - 5' },
    ],
  },
  {
    category: 'Seventh (7th)',
    types: [
      { symbol: '7', label: 'Dom 7', formula: '1 - 3 - 5 - b7' },
      { symbol: 'maj7', label: 'Maj 7', formula: '1 - 3 - 5 - 7' },
      { symbol: 'm7', label: 'Min 7', formula: '1 - b3 - 5 - b7' },
      { symbol: 'mmaj7', label: 'Min/Maj7', formula: '1 - b3 - 5 - 7' },
    ],
  },
  {
    category: 'Suspended & Add',
    types: [
      { symbol: 'sus2', label: 'Sus 2', formula: '1 - 2 - 5' },
      { symbol: 'sus4', label: 'Sus 4', formula: '1 - 4 - 5' },
      { symbol: '7sus4', label: '7sus4', formula: '1 - 4 - 5 - b7' },
      { symbol: 'add9', label: 'Add 9', formula: '1 - 3 - 5 - 9' },
      { symbol: '6', label: 'Maj 6', formula: '1 - 3 - 5 - 6' },
      { symbol: 'm6', label: 'Min 6', formula: '1 - b3 - 5 - 6' },
    ],
  },
  {
    category: 'Extended (9/11/13)',
    types: [
      { symbol: '9', label: 'Dom 9', formula: '1 - 3 - 5 - b7 - 9' },
      { symbol: 'maj9', label: 'Maj 9', formula: '1 - 3 - 5 - 7 - 9' },
      { symbol: 'm9', label: 'Min 9', formula: '1 - b3 - 5 - b7 - 9' },
      { symbol: '11', label: '11th', formula: '1 - 3 - 5 - b7 - 9 - 11' },
    ],
  },
  {
    category: 'Diminished & Augmented',
    types: [
      { symbol: 'dim', label: 'Dim', formula: '1 - b3 - b5' },
      { symbol: 'dim7', label: 'Dim 7', formula: '1 - b3 - b5 - bb7' },
      { symbol: 'm7b5', label: 'Half-Dim (ø)', formula: '1 - b3 - b5 - b7' },
      { symbol: 'aug', label: 'Aug (+)', formula: '1 - 3 - #5' },
      { symbol: 'aug7', label: 'Aug 7', formula: '1 - 3 - #5 - b7' },
    ],
  },
];

export const LabView: React.FC = () => {
  // Navigation & Drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<LabFeature>('chords');

  // Chord Formula state
  const [rootNote, setRootNote] = useState<string>('C');
  const [chordType, setChordType] = useState<string>(''); // '' = Major, 'm' = Minor, etc.
  const [bassNote, setBassNote] = useState<string>('');   // optional slash bass (e.g. 'G')

  // Pickers modal state
  const [isRootPickerOpen, setIsRootPickerOpen] = useState(false);
  const [isBassPickerOpen, setIsBassPickerOpen] = useState(false);

  // Full chord symbol representation (e.g. 'C', 'Am', 'C/G', 'F#m7/C#')
  const fullChordSymbol = useMemo(() => {
    const base = `${rootNote}${chordType}`;
    return bassNote ? `${base}/${bassNote}` : base;
  }, [rootNote, chordType, bassNote]);

  // Parse chord notes and intervals
  const parsedChord = useMemo(() => {
    return parseChordSymbol(fullChordSymbol);
  }, [fullChordSymbol]);

  // Compute Full CAGED Guitar Chord shapes
  const guitarShapes = useMemo<ChordShapeVoicing[]>(() => {
    return getFullChordShapes(
      parsedChord.root,
      parsedChord.type,
      parsedChord.notes,
      parsedChord.intervals,
      parsedChord.bass
    );
  }, [parsedChord]);

  const handlePlayChord = () => {
    sound.playChord(parsedChord.root, parsedChord.intervals, 3, true, 'guitar', parsedChord.bass);
  };

  if (activeFeature === 'scales') {
    return (
      <div className="w-full max-w-4xl mx-auto pb-20 animate-fade-in">
        <ScaleView onOpenSidebar={() => setIsSidebarOpen(true)} />
        <LabDrawerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeFeature={activeFeature}
          onSelectFeature={(feat) => {
            setActiveFeature(feat);
            setIsSidebarOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-20 animate-fade-in">
      {/* 1. Header Tab Lab: Title + Drawer Menu Trigger (Ukuran seragam dengan Lirik & Amunisi, tanpa sub judul) */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1C1917]" />
          <span className="text-base font-bold text-[#1C1917] tracking-tight">Kamus Akor</span>
        </div>

        {/* Tombol Menu Garis 3 untuk membuka Drawer Sidebar */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg transition cursor-pointer shadow-2xs text-[#1C1917] shrink-0 active:scale-95"
          title="Buka Menu Laboratorium"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* 2. CHORD PICKER: Langsung Nada Dasar (Root) & Bass */}
      <div className="p-3.5 sm:p-5 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-3.5">
        {/* Input Triggers: Root Note Box + Slash Bass Box */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Root Note Trigger (Opens Radial Note Picker) */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-mono text-[#78716C] uppercase font-bold mb-1">
              Nada Dasar (Root)
            </label>
            <button
              type="button"
              onClick={() => setIsRootPickerOpen(true)}
              className="w-full h-11 px-3 bg-[#FAF9F5] hover:bg-[#F5F4EE] border-2 border-[#1C1917] rounded-xl flex items-center justify-between font-mono cursor-pointer transition shadow-2xs active:scale-[0.99]"
            >
              <span className="text-lg font-black text-[#1C1917]">{rootNote}</span>
              <ChevronDown className="w-4 h-4 text-[#78716C]" />
            </button>
          </div>

          {/* Separator Slash Symbol */}
          <div className="pt-5 text-xl font-mono font-bold text-[#A8A29E] select-none">
            /
          </div>

          {/* 2. Slash Bass Note Trigger (Optional) */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-mono text-[#78716C] uppercase font-bold mb-1">
              Bass (Opsional)
            </label>
            <button
              type="button"
              onClick={() => setIsBassPickerOpen(true)}
              className={`w-full h-11 px-3 bg-[#FAF9F5] hover:bg-[#F5F4EE] border rounded-xl flex items-center justify-between font-mono cursor-pointer transition shadow-2xs active:scale-[0.99] ${
                bassNote ? 'border-[#1C1917] font-black' : 'border-[#D6D3D1] font-semibold text-[#78716C]'
              }`}
            >
              <span className="text-base text-[#1C1917]">{bassNote || 'Standar'}</span>
              <ChevronDown className="w-4 h-4 text-[#78716C]" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CHORD TYPE SELECTOR GRID (Tab & Chip Buttons) */}
      <div className="p-3 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-2.5">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#78716C]">
          Variasi Akor
        </span>

        <div className="space-y-2">
          {CHORD_TYPE_CATEGORIES.map((cat) => (
            <div key={cat.category} className="space-y-1">
              <span className="text-[9.5px] font-mono text-[#A8A29E] uppercase font-bold">
                {cat.category}
              </span>
              <div className="flex flex-wrap gap-1">
                {cat.types.map((t) => {
                  const isSelected = chordType === t.symbol;

                  return (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => setChordType(t.symbol)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isSelected
                          ? 'bg-[#1C1917] text-[#FAF9F5] font-black ring-1 ring-[#1C1917]'
                          : 'bg-[#FAF9F5] hover:bg-[#F5F4EE] text-[#1C1917] border border-[#E5E4DE] font-semibold'
                      }`}
                    >
                      <span>{t.symbol === '' ? 'Mayor (M)' : t.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. GUITAR FRETBOARD DIAGRAM CARD (Menggabungkan Identitas Akor, Nada, Rumus, dan Fretboard) */}
      <GuitarFretboardDiagram
        chordName={fullChordSymbol}
        displayName={parsedChord.displayName}
        formulaNames={parsedChord.formulaNames}
        notes={parsedChord.notes}
        shapes={guitarShapes}
        onPlayFullChord={handlePlayChord}
      />

      {/* Radial Root Note Picker Modal */}
      <RadialNotePicker
        isOpen={isRootPickerOpen}
        onClose={() => setIsRootPickerOpen(false)}
        selectedNote={rootNote}
        onSelectNote={(note) => setRootNote(note)}
        title="Pilih Nada Dasar (Root)"
      />

      {/* Radial Slash Bass Note Picker Modal */}
      <RadialNotePicker
        isOpen={isBassPickerOpen}
        onClose={() => setIsBassPickerOpen(false)}
        selectedNote={bassNote}
        onSelectNote={(note) => setBassNote(note)}
        title="Pilih Nada Bass (Slash)"
        allowEmpty={true}
        emptyLabel="Reset (Gunakan Nada Dasar Asli)"
      />

      {/* Lab Drawer Sidebar */}
      <LabDrawerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeFeature={activeFeature}
        onSelectFeature={(feat) => setActiveFeature(feat)}
      />
    </div>
  );
};
