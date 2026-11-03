import React, { useState, useEffect, useMemo, useRef } from 'react';
import { parseChordSymbol } from '../../utils/chordParser';
import {
  getFullChordShapes,
  getTriadVoicings,
  ChordShapeVoicing,
} from '../../utils/guitarChordVoicings';
import { GUITAR_STRINGS, getGuitarFretNote } from '../../utils/musicTheory';
import { sound } from '../../utils/audioEngine';
import {
  X,
  Play,
  Volume2,
  Sparkles,
  Music,
  ChevronLeft,
  ChevronRight,
  Square,
  Layers,
} from 'lucide-react';

interface ChordInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chordSymbol: string | null;
}

export const ChordInspectionModal: React.FC<ChordInspectionModalProps> = ({
  isOpen,
  onClose,
  chordSymbol,
}) => {
  const [activeCategory, setActiveCategory] = useState<'triad' | 'full'>('full');
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number>(0);
  const [activePlayingString, setActivePlayingString] = useState<number | null>(null);
  const [isArpeggiating, setIsArpeggiating] = useState<boolean>(false);
  const [isStrumming, setIsStrumming] = useState<boolean>(false);

  const audioTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const parsed = useMemo(() => {
    return parseChordSymbol(chordSymbol || 'C');
  }, [chordSymbol]);

  // Compute Full CAGED Chord shapes
  const fullShapes = useMemo<ChordShapeVoicing[]>(() => {
    return getFullChordShapes(parsed.root, parsed.type, parsed.notes, parsed.intervals);
  }, [parsed]);

  // Compute 3-Note Triad & Arpeggio voicings
  const triadShapes = useMemo<ChordShapeVoicing[]>(() => {
    return getTriadVoicings(parsed.root, parsed.notes, parsed.intervals);
  }, [parsed]);

  // Active shape list depending on category
  const activeShapesList = activeCategory === 'triad' ? triadShapes : fullShapes;
  const currentShape: ChordShapeVoicing | undefined =
    activeShapesList[selectedShapeIndex] || activeShapesList[0];

  // Stop any ongoing arpeggio timeouts
  const clearAudioTimeouts = () => {
    audioTimeoutsRef.current.forEach((t) => clearTimeout(t));
    audioTimeoutsRef.current = [];
    setIsArpeggiating(false);
    setIsStrumming(false);
    setActivePlayingString(null);
  };

  // Reset selected shape index when chordSymbol changes or category changes
  useEffect(() => {
    setSelectedShapeIndex(0);
    clearAudioTimeouts();
  }, [chordSymbol, activeCategory]);

  // Clean up timeouts on modal close/unmount
  useEffect(() => {
    return () => {
      clearAudioTimeouts();
    };
  }, []);

  // Play a single note at specific string & fret
  const handleNoteClick = (stringNum: number, fret: number | 'x') => {
    if (fret === 'x') return;
    clearAudioTimeouts();

    const gString = GUITAR_STRINGS.find((s) => s.stringNumber === stringNum);
    if (!gString) return;

    const { note, octaveDiff } = getGuitarFretNote(gString.openNote, fret);
    const octave = gString.openOctave + octaveDiff;

    setActivePlayingString(stringNum);
    sound.playGuitarNote(note, octave, 1.4);

    const t = setTimeout(() => {
      setActivePlayingString(null);
    }, 280);
    audioTimeoutsRef.current.push(t);
  };

  // Play Arpeggio sequence (pick notes one by one sequentially)
  const handlePlayArpeggio = () => {
    if (!currentShape || isArpeggiating) {
      clearAudioTimeouts();
      return;
    }

    clearAudioTimeouts();
    setIsArpeggiating(true);

    const sequence = currentShape.notesSequence;
    if (sequence.length === 0) {
      setIsArpeggiating(false);
      return;
    }

    const stepInterval = 320; // 320ms per note

    sequence.forEach((item, idx) => {
      const t = setTimeout(() => {
        setActivePlayingString(item.stringNum);
        sound.playGuitarNote(item.note, item.octave, 1.2);

        if (idx === sequence.length - 1) {
          const finishTimer = setTimeout(() => {
            setActivePlayingString(null);
            setIsArpeggiating(false);
          }, stepInterval);
          audioTimeoutsRef.current.push(finishTimer);
        }
      }, idx * stepInterval);

      audioTimeoutsRef.current.push(t);
    });
  };

  // Play Strum (genjreng all active strings with realistic micro-delays)
  const handleStrumChord = () => {
    if (!currentShape) return;
    clearAudioTimeouts();
    setIsStrumming(true);

    const sequence = currentShape.notesSequence;
    sequence.forEach((item, idx) => {
      sound.playGuitarNote(item.note, item.octave, 2.0, idx * 0.035);
    });

    setTimeout(() => {
      setIsStrumming(false);
    }, 400);
  };

  if (!isOpen || !chordSymbol) return null;

  // Compute displayed fret range for the current chord box
  const startFret = currentShape ? currentShape.fretRange[0] : 1;
  const endFret = currentShape ? currentShape.fretRange[1] : 4;
  const isNutPresent = startFret <= 1;

  // Fret columns to display (e.g. frets 1..4 or 5..8)
  const displayedFrets = Array.from(
    { length: Math.max(3, endFret - startFret + 1) },
    (_, i) => startFret + i
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header: Chord Badge, Notes, & Close Button */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 border-b border-[#E5E4DE] bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Chord Badge Pill */}
            <div className="flex items-center px-3 py-1 bg-[#1C1917] text-[#FAF9F5] rounded-xl font-mono font-black text-base shadow-xs shrink-0">
              <span>{parsed.rawSymbol}</span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-[#1C1917] truncate">
                {parsed.displayName.replace(parsed.rawSymbol, '').trim().replace(/^\((.*)\)$/, '$1') || parsed.displayName}
              </h3>
              <div className="text-[11px] font-mono text-[#78716C] mt-0.5 leading-tight space-y-0.5">
                <div className="truncate">
                  <span className="text-[#78716C]">Nada:</span>{' '}
                  <span className="font-extrabold text-[#1C1917]">{parsed.notes.join(' - ')}</span>
                </div>
                <div className="truncate">
                  <span className="text-[#78716C]">Rumus:</span>{' '}
                  <span className="font-bold text-[#44403C]">{parsed.formulaNames}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#1C1917] flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0 ml-2 active:scale-95"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4 text-[#78716C]" />
          </button>
        </div>

        {/* 2. Mode Category Switcher Tabs: [ Triad ] vs [ Akor Penuh ] */}
        <div className="px-3.5 sm:px-5 pt-2.5 pb-1.5 border-b border-[#E5E4DE] bg-[#FAF9F5] flex items-center justify-between gap-2">
          <div className="inline-flex bg-[#EAE8DF] p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('triad')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'triad'
                  ? 'bg-[#1C1917] text-[#FAF9F5] shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Arpeggio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('full')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'full'
                  ? 'bg-[#1C1917] text-[#FAF9F5] shadow-2xs font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Akor Penuh</span>
            </button>
          </div>
        </div>

        {/* 3. Shape Carousel Nav (Bentuk 1, Bentuk 2, Bentuk 3...) */}
        <div className="px-3.5 sm:px-5 py-2 bg-[#FFFFFF] border-b border-[#E5E4DE]/70 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              clearAudioTimeouts();
              setSelectedShapeIndex((prev) =>
                prev > 0 ? prev - 1 : activeShapesList.length - 1
              );
            }}
            className="w-7 h-7 rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#1C1917] flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
            title="Bentuk Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 text-[#1C1917]" />
          </button>

          <div className="flex-1 text-center min-w-0 px-1">
            <div className="inline-flex flex-col items-center justify-center bg-[#FAF9F5] text-[#1C1917] rounded-xl px-3 py-1 border border-[#E5E4DE] max-w-full">
              <span className="text-amber-700 font-extrabold text-[10.5px] font-mono leading-tight">
                Bentuk {selectedShapeIndex + 1} dari {activeShapesList.length}
              </span>
              <span className="text-[#1C1917] font-bold text-[11px] font-mono truncate max-w-full leading-tight">
                {currentShape?.name}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              clearAudioTimeouts();
              setSelectedShapeIndex((prev) =>
                prev < activeShapesList.length - 1 ? prev + 1 : 0
              );
            }}
            className="w-7 h-7 rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#1C1917] flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
            title="Bentuk Berikutnya"
          >
            <ChevronRight className="w-4 h-4 text-[#1C1917]" />
          </button>
        </div>

        {/* 4. THE HORIZONTAL CHORD & TRIAD BOX */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="w-full bg-[#FFFFFF] border-2 border-[#D6D3D1] rounded-2xl p-3 sm:p-4 shadow-xs select-none">
            {/* Header Column Numbers: Fret numbers at top */}
            <div
              className="grid text-center font-mono text-xs font-bold text-[#78716C] pb-2 border-b-2 border-[#1C1917]"
              style={{
                gridTemplateColumns: `42px repeat(${displayedFrets.length}, 1fr)`,
              }}
            >
              {/* String Head / Nut column */}
              <div className="text-[11px] font-bold text-[#78716C] self-center">
                {isNutPresent ? 'Nut' : `Fr.${startFret}`}
              </div>

              {displayedFrets.map((fret) => {
                const isMarker = fret === 3 || fret === 5 || fret === 7 || fret === 9 || fret === 12 || fret === 15;
                return (
                  <div key={fret} className="flex flex-col items-center justify-center">
                    <span className="font-mono text-xs font-black text-[#1C1917]">
                      {fret}
                    </span>
                    <div className="h-1.5 flex items-center justify-center">
                      {isMarker && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 6 Guitar Strings: Senar 1 (high E) at TOP, Senar 6 (low E) at BOTTOM */}
            <div className="relative mt-1">
              {/* Visual Barre Line Overlay (Garis Balok Telunjuk) */}
              {currentShape?.barreInfo && displayedFrets.includes(currentShape.barreInfo.fret) && (
                <div
                  className="absolute z-5 pointer-events-none transition-all flex items-center justify-center"
                  style={{
                    left: `calc(42px + (${displayedFrets.indexOf(currentShape.barreInfo.fret)} + 0.5) * ((100% - 42px) / ${displayedFrets.length}))`,
                    transform: 'translateX(-50%)',
                    top: `${((currentShape.barreInfo.toString - 1) / 6) * 100 + 1.5}%`,
                    bottom: `${((6 - currentShape.barreInfo.fromString) / 6) * 100 + 1.5}%`,
                    width: '24px',
                  }}
                >
                  <div className="w-full h-full bg-[#1C1917]/25 border-2 border-[#1C1917]/60 rounded-full shadow-xs flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-[#FAF9F5] opacity-90">
                      |
                    </span>
                  </div>
                </div>
              )}

              {[1, 2, 3, 4, 5, 6].map((strNum) => {
                const gString = GUITAR_STRINGS.find((s) => s.stringNumber === strNum)!;
                const pos = currentShape?.positions.find((p) => p.stringNum === strNum);
                const isMuted = pos?.fret === 'x';
                const isOpenString = pos?.fret === 0;
                const isPlaying = activePlayingString === strNum;

                // Gauge thickness for realistic feel: Senar 1 is 1px, Senar 6 is 3.2px
                const thickness = 1 + (strNum - 1) * 0.45;

                return (
                  <div
                    key={strNum}
                    className="grid h-10 sm:h-11 items-center relative border-b border-[#E5E4DE]/70 last:border-b-0"
                    style={{
                      gridTemplateColumns: `42px repeat(${displayedFrets.length}, 1fr)`,
                    }}
                  >
                    {/* Metal horizontal string line */}
                    <div
                      className="absolute left-[42px] right-0 bg-[#A8A29E]/65 pointer-events-none z-0"
                      style={{
                        height: `${thickness}px`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />

                    {/* Leftmost Nut / String status header: [X] or Open Note Bead or String Name */}
                    <div className="flex items-center justify-center z-10">
                      {isMuted ? (
                        <span className="w-6 h-6 rounded-md bg-[#FAF9F5] border border-[#E5E4DE] text-[#A8A29E] font-mono text-[11px] font-bold flex items-center justify-center">
                          ✕
                        </span>
                      ) : isOpenString ? (
                        <button
                          type="button"
                          onClick={() => handleNoteClick(strNum, 0)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex flex-col items-center justify-center font-mono transition-all cursor-pointer shadow-xs border-2 ${
                            isPlaying
                              ? 'bg-amber-400 text-[#1C1917] border-amber-500 scale-110 ring-2 ring-amber-500 animate-bounce'
                              : pos?.degree === 'R'
                              ? 'bg-[#1C1917] text-[#FAF9F5] border-amber-400 font-black'
                              : 'bg-[#FAF9F5] text-[#1C1917] border-[#1C1917] font-bold hover:scale-105'
                          }`}
                          title={`Petik Senar ${strNum} Lepas (Open ${pos?.note})`}
                        >
                          <span className="text-[10px] font-black leading-none">
                            {pos?.note}
                          </span>
                          <span
                            className={`text-[8px] font-bold leading-none ${
                              pos?.degree === 'R' ? 'text-amber-400' : 'text-[#78716C]'
                            }`}
                          >
                            {pos?.degree}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[10.5px] font-mono text-[#78716C] font-semibold">
                          {strNum} <span className="text-[9px] opacity-70">({gString.openNote})</span>
                        </span>
                      )}
                    </div>

                    {/* Fret cells on this string */}
                    {displayedFrets.map((fret) => {
                      const isFretPressed = pos && pos.fret === fret;
                      const isRoot = pos?.degree === 'R';

                      return (
                        <div
                          key={fret}
                          className="relative h-full flex items-center justify-center border-r border-[#E2DFD7] last:border-r-0"
                        >
                          {isFretPressed && pos && pos.note && (
                            <button
                              type="button"
                              onClick={() => handleNoteClick(strNum, fret)}
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center font-mono transition-all cursor-pointer z-10 ${
                                isPlaying
                                  ? 'bg-amber-400 text-[#1C1917] scale-115 ring-4 ring-amber-500 font-black shadow-lg animate-bounce'
                                  : isRoot
                                  ? 'bg-[#1C1917] text-[#FAF9F5] ring-2 ring-amber-400 font-black shadow-md hover:scale-110 active:scale-95'
                                  : 'bg-[#FFFFFF] text-[#1C1917] border-2 border-[#1C1917] font-bold shadow-xs hover:scale-110 active:scale-95'
                              }`}
                              title={`Petik nada ${pos.note} (${pos.degree}) pada Senar ${strNum}, Fret ${fret}`}
                            >
                              <span className="text-xs font-black leading-tight">
                                {pos.note}
                              </span>
                              <span
                                className={`text-[9px] font-bold leading-none ${
                                  isRoot ? 'text-amber-400' : 'text-[#78716C]'
                                }`}
                              >
                                {pos.degree}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Audio Player Controls: Petik Arpeggio (1 per 1) & Genjreng (Strum) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Button: Petik Arpeggio */}
              <button
                type="button"
                onClick={handlePlayArpeggio}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer border shadow-xs ${
                  isArpeggiating
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] border-[#1C1917] active:scale-98'
                }`}
                title="Petik nada arpeggio satu per satu secara berurutan"
              >
                {isArpeggiating ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                    <span>Hentikan Petikan</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-[#FAF9F5] text-[#FAF9F5]" />
                    <span>Petik Arpeggio</span>
                  </>
                )}
              </button>

              {/* Button: Genjreng (Strum) */}
              <button
                type="button"
                onClick={handleStrumChord}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer border shadow-2xs ${
                  isStrumming
                    ? 'bg-amber-100 border-amber-400 text-amber-900 scale-95'
                    : 'bg-[#FFFFFF] hover:bg-[#FAF9F5] border-[#E5E4DE] text-[#1C1917]'
                }`}
                title="Bunyikan akor secara bersamaan (genjreng)"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#57534E]" />
                <span>Genjreng (Strum)</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-[#78716C] text-center sm:text-right">
              <span>💡 Klik bulatan nada untuk mendengar suara per not</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
