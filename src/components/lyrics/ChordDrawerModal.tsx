import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Volume2, Music } from 'lucide-react';
import { getFamilyChordGroups } from '../../utils/familyChords';
import { sound } from '../../utils/audioEngine';
import { CHROMATIC_NOTES } from '../../data/constants';

export interface ChordDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKey: string;
  onInsertChord: (chordName: string) => void;
}

export const ChordDrawerModal: React.FC<ChordDrawerModalProps> = ({
  isOpen,
  onClose,
  activeKey,
  onInsertChord,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'family' | 'extensions' | 'borrowed' | 'dictionary'>('all');
  const [dictRoot, setDictRoot] = useState('C');

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedCategory('all');
    }
  }, [isOpen, activeKey]);

  // Swipe-down drag-to-dismiss state
  const [dragOffset, setDragOffset] = useState(0);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dy = e.clientY - startYRef.current;
    if (dy > 0) {
      setDragOffset(dy);
    } else {
      setDragOffset(0);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragOffset > 60) {
      onClose();
    }
    setDragOffset(0);
  };

  const handlePointerCancel = () => {
    isDraggingRef.current = false;
    setDragOffset(0);
  };

  const chordGroup = useMemo(() => {
    return getFamilyChordGroups(activeKey);
  }, [activeKey]);

  function getRootNoteFromChord(chordName: string): string {
    const match = chordName.match(/^([A-G][b#]?)/i);
    return match ? match[1] : 'C';
  }

  if (!isOpen) return null;

  const handlePlaySound = (e: React.MouseEvent, keyName: string, intervals: number[]) => {
    e.stopPropagation();
    sound.playChord(keyName, intervals, 3, true, 'guitar');
  };

  const handleSelectChord = (chordName: string) => {
    onInsertChord(chordName);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      onInsertChord(trimmed);
      onClose();
    }
  };

  const query = search.trim().toLowerCase();
  const matchedFamily = chordGroup.familyChords.filter(
    (c) => c.name.toLowerCase().includes(query) || c.degree.toLowerCase().includes(query) || c.role.toLowerCase().includes(query)
  );
  const matchedExtensions = chordGroup.extensions.filter(
    (v) => v.name.toLowerCase().includes(query) || v.role.toLowerCase().includes(query)
  );
  const matchedBorrowed = chordGroup.borrowedChords.filter(
    (b) => b.name.toLowerCase().includes(query) || b.role.toLowerCase().includes(query)
  );

  const DICT_QUALITIES = [
    { suffix: '', label: 'Mayor', intervals: [0, 4, 7] },
    { suffix: 'm', label: 'Minor', intervals: [0, 3, 7] },
    { suffix: '7', label: '7th Dominan', intervals: [0, 4, 7, 10] },
    { suffix: 'maj7', label: 'Major 7th', intervals: [0, 4, 7, 11] },
    { suffix: 'm7', label: 'Minor 7th', intervals: [0, 3, 7, 10] },
    { suffix: 'm9', label: 'Minor 9th', intervals: [0, 3, 7, 10, 14] },
    { suffix: 'maj9', label: 'Major 9th', intervals: [0, 4, 7, 11, 14] },
    { suffix: 'sus4', label: 'Sus4', intervals: [0, 5, 7] },
    { suffix: 'sus2', label: 'Sus2', intervals: [0, 2, 7] },
    { suffix: 'add9', label: 'Add9', intervals: [0, 4, 7, 14] },
    { suffix: '6', label: 'Major 6th', intervals: [0, 4, 7, 9] },
    { suffix: 'm6', label: 'Minor 6th', intervals: [0, 3, 7, 9] },
    { suffix: 'dim', label: 'Diminished', intervals: [0, 3, 6] },
    { suffix: 'aug', label: 'Augmented', intervals: [0, 4, 8] },
    { suffix: '5', label: 'Power Chord', intervals: [0, 7] },
  ];

  const scaleTypeName = chordGroup.scaleType === 'harmonic-minor' ? 'Harmonic Minor' : chordGroup.scaleType === 'melodic-minor' ? 'Melodic Minor' : chordGroup.scaleType === 'natural-minor' ? 'Natural Minor' : 'Mayor';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDraggingRef.current ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative w-full sm:max-w-xl bg-[#FAF9F5] border-t sm:border border-[#E5E4DE] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden z-10 select-none"
      >
        {/* Mobile grab handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none sm:hidden"
        >
          <div className="w-12 h-1.5 bg-[#D6D3D1] rounded-full hover:bg-[#A8A29E] transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#FFFFFF] border-b border-[#E5E4DE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F4EE] border border-[#E5E4DE] flex items-center justify-center">
              <Music className="w-4 h-4 text-[#1C1917]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1C1917]">Sisipkan Akor / Harmoni</h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1C1917] text-[#FFFFFF]">
                  Key: {activeKey}
                </span>
              </div>
              <p className="text-[11px] text-[#78716C]">
                Tangga Nada {scaleTypeName} · Diatonik & Pinjaman Harmoni
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-3 bg-[#FAF9F5] border-b border-[#E5E4DE] space-y-2.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari akor (misal: Bm7, G7, Cmaj7)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#E5E4DE] rounded-lg text-[#1C1917] outline-hidden focus:border-[#1C1917] placeholder:text-[#A8A29E]"
              />
            </div>
            {search.trim() && (
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-mono font-bold bg-[#1C1917] text-[#FFFFFF] rounded-lg transition hover:bg-[#292524] cursor-pointer shrink-0"
              >
                + {search.trim()}
              </button>
            )}
          </form>

          {/* Category Tabs (Clean unboxed / button navigation) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px] font-mono">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#1C1917] text-[#FAF9F5] font-bold shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#78716C] border border-[#E5E4DE] hover:text-[#1C1917]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedCategory('family')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                selectedCategory === 'family'
                  ? 'bg-[#1C1917] text-[#FAF9F5] font-bold shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#78716C] border border-[#E5E4DE] hover:text-[#1C1917]'
              }`}
            >
              1. Famili Diatonik Asli
            </button>
            <button
              onClick={() => setSelectedCategory('extensions')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                selectedCategory === 'extensions'
                  ? 'bg-[#1C1917] text-[#FAF9F5] font-bold shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#78716C] border border-[#E5E4DE] hover:text-[#1C1917]'
              }`}
            >
              2. Ekstensi Skala
            </button>
            <button
              onClick={() => setSelectedCategory('borrowed')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                selectedCategory === 'borrowed'
                  ? 'bg-[#1C1917] text-[#FAF9F5] font-bold shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#78716C] border border-[#E5E4DE] hover:text-[#1C1917]'
              }`}
            >
              3. Pinjaman Harmoni
            </button>
            <button
              onClick={() => setSelectedCategory('dictionary')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 ${
                selectedCategory === 'dictionary'
                  ? 'bg-[#1C1917] text-[#FAF9F5] font-bold shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#78716C] border border-[#E5E4DE] hover:text-[#1C1917]'
              }`}
            >
              Kamus Kromatik
            </button>
          </div>
        </div>

        {/* Scrollable Chord Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* 1. FAMILY CHORDS SECTION */}
          {(selectedCategory === 'all' || selectedCategory === 'family') && matchedFamily.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-bold">
                  Famili Diatonik Asli ({scaleTypeName})
                </span>
                <span className="text-[10px] font-mono text-[#A8A29E]">
                  Nada Dasar: {activeKey}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {matchedFamily.map((c) => (
                  <div
                    key={`${c.degree}-${c.name}`}
                    onClick={() => handleSelectChord(c.name)}
                    className="p-2.5 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl transition cursor-pointer group flex items-center justify-between shadow-2xs active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#78716C]">
                        <span className="font-bold text-[#1C1917] px-1 py-0.2 bg-[#F5F4EE] rounded border border-[#E5E4DE]">
                          {c.degree}
                        </span>
                        <span className="truncate max-w-[80px]">{c.role}</span>
                      </div>
                      <div className="text-base font-mono font-bold text-[#1C1917] mt-0.5">
                        {c.name}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePlaySound(e, c.rootNote, c.intervals)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#78716C] group-hover:text-[#1C1917] transition cursor-pointer shrink-0"
                      title={`Dengarkan nada gitar ${c.name}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. EXTENSIONS & VARIATIONS SECTION */}
          {(selectedCategory === 'all' || selectedCategory === 'extensions') && matchedExtensions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-bold">
                  Ekstensi & Variasi Skala
                </span>
                <span className="text-[10px] font-mono text-[#A8A29E]">
                  7th, maj7, sus, add9
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {matchedExtensions.map((v) => (
                  <div
                    key={`${v.degree}-${v.name}`}
                    onClick={() => handleSelectChord(v.name)}
                    className="p-2.5 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl transition cursor-pointer group flex items-center justify-between shadow-2xs active:scale-[0.98]"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="text-[9px] font-mono text-[#78716C] truncate block w-full">
                        {v.role}
                      </span>
                      <span className="text-sm font-mono font-bold text-[#1C1917] mt-0.5 block truncate">
                        {v.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePlaySound(e, getRootNoteFromChord(v.name), v.intervals)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#78716C] group-hover:text-[#1C1917] transition cursor-pointer shrink-0"
                      title={`Dengarkan nada gitar ${v.name}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. BORROWED CHORDS / PINJAMAN HARMONI SECTION */}
          {(selectedCategory === 'all' || selectedCategory === 'borrowed') && matchedBorrowed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-bold">
                  Pinjaman Harmoni (Modal Interchange)
                </span>
                <span className="text-[10px] font-mono text-[#A8A29E]">
                  Parallel / Harmonic Borrowing
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {matchedBorrowed.map((b) => (
                  <div
                    key={`${b.degree}-${b.name}`}
                    onClick={() => handleSelectChord(b.name)}
                    className="p-2.5 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl transition cursor-pointer group flex items-center justify-between shadow-2xs active:scale-[0.98]"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="text-[9px] font-mono text-[#78716C] truncate block w-full">
                        {b.role}
                      </span>
                      <span className="text-sm font-mono font-bold text-[#1C1917] mt-0.5 block truncate">
                        {b.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePlaySound(e, getRootNoteFromChord(b.name), b.intervals)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#78716C] group-hover:text-[#1C1917] transition cursor-pointer shrink-0"
                      title={`Dengarkan nada gitar ${b.name}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. CHROMATIC DICTIONARY SECTION */}
          {(selectedCategory === 'all' || selectedCategory === 'dictionary') && (
            <div className="space-y-2.5 pt-2 border-t border-[#E5E4DE]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-bold">
                  Kamus Akor Kromatik
                </span>
                <span className="text-[10px] font-mono text-[#A8A29E]">
                  Pilih Nada Pokok & Tipe
                </span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
                {CHROMATIC_NOTES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDictRoot(n)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer shrink-0 ${
                      dictRoot === n
                        ? 'bg-[#1C1917] text-[#FFFFFF] shadow-2xs'
                        : 'bg-[#FFFFFF] text-[#1C1917] border border-[#E5E4DE] hover:bg-[#F5F4EE]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DICT_QUALITIES.map((q) => {
                  const chordName = `${dictRoot}${q.suffix}`;
                  return (
                    <div
                      key={q.suffix}
                      onClick={() => handleSelectChord(chordName)}
                      className="p-2 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl transition cursor-pointer flex items-center justify-between shadow-2xs group active:scale-[0.98]"
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="text-xs font-mono font-bold text-[#1C1917]">
                          {chordName}
                        </div>
                        <div className="text-[9px] font-mono text-[#78716C] truncate">
                          {q.label}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handlePlaySound(e, dictRoot, q.intervals)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#78716C] group-hover:text-[#1C1917] transition cursor-pointer shrink-0"
                        title={`Dengarkan nada gitar ${chordName}`}
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchedFamily.length === 0 && matchedExtensions.length === 0 && matchedBorrowed.length === 0 && selectedCategory !== 'dictionary' && (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-[#78716C]">
                Tidak ada akor yang cocok dengan &quot;{search}&quot;.
              </p>
              <button
                type="button"
                onClick={() => handleSelectChord(search.trim())}
                className="px-3.5 py-1.5 bg-[#1C1917] text-white rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                Tetap Sisipkan {search.trim()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
