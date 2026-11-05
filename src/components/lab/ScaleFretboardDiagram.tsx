import React, { useState, useRef, useEffect } from 'react';
import { ScaleType } from '../../data/scaleData';
import {
  ScaleNotePosition,
  getScaleFretboardPositions,
  getScalePatternCount,
  getScalePatternPositions,
} from '../../utils/scaleCalculations';
import { Play, Square, Repeat, Maximize2, Layers, X, ChevronLeft, ChevronRight, SlidersHorizontal, RotateCw } from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface ScaleFretboardDiagramProps {
  rootNote: string;
  selectedScale: ScaleType;
  scaleNotes: string[];
}

export const ScaleFretboardDiagram: React.FC<ScaleFretboardDiagramProps> = ({
  rootNote,
  selectedScale,
  scaleNotes,
}) => {
  // Mode: 'box' (Vertical Pola) vs 'full' (Horizontal Full Neck Fullscreen Modal)
  const [viewMode, setViewMode] = useState<'box' | 'full'>('box');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Display label mode: 'note' (C, D, E) vs 'degree' (R, b3, 5)
  const [displayLabelMode, setDisplayLabelMode] = useState<'note' | 'degree'>('note');
  // Selected Pattern index (0 to 6 for 7-note 3NPS, 0 to 4 for 2NPS pentatonic)
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [activeNoteKey, setActiveNoteKey] = useState<string | null>(null);
  const [activePlayingPatternIndex, setActivePlayingPatternIndex] = useState<number | null>(null);

  // Playback Sequencer Engine state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(90);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [playDirection, setPlayDirection] = useState<'up-down' | 'up' | 'down'>('up-down');

  // Full Neck practice mode: 'snake' (Sambung Pola 1->2->3...) | 'sequential' (Tiap Pola Naik-Turun) | 'single' (Fokus Satu Pola)
  const [fullNeckMode, setFullNeckMode] = useState<'snake' | 'sequential' | 'single'>('snake');
  const [fullNeckStartPoint, setFullNeckStartPoint] = useState<'pattern1' | 'nut'>('nut');
  const [isFullNeckSettingsOpen, setIsFullNeckSettingsOpen] = useState<boolean>(false);
  const [isPopupRotated, setIsPopupRotated] = useState<boolean>(true);

  // Sequencer refs for real-time adjustments without re-binding timers
  const isPlayingRef = useRef<boolean>(false);
  const bpmRef = useRef<number>(bpm);
  const isLoopRef = useRef<boolean>(isLoop);
  const playDirectionRef = useRef<'up-down' | 'up' | 'down'>(playDirection);
  const fullNeckModeRef = useRef<'snake' | 'sequential' | 'single'>(fullNeckMode);
  const fullNeckStartPointRef = useRef<'pattern1' | 'nut'>(fullNeckStartPoint);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fullNeckModeRef.current = fullNeckMode;
  }, [fullNeckMode]);

  useEffect(() => {
    fullNeckStartPointRef.current = fullNeckStartPoint;
  }, [fullNeckStartPoint]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isLoopRef.current = isLoop;
  }, [isLoop]);

  useEffect(() => {
    playDirectionRef.current = playDirection;
  }, [playDirection]);

  // Pattern count: 7 for 7-note diatonic/modes (3NPS), 5 for pentatonic (2NPS)
  const patternCount = getScalePatternCount(selectedScale.intervals);
  const activePatternIndex = selectedPosition % patternCount;

  // Get active note positions for Box View via 3NPS (7 patterns) or 2NPS (5 patterns)
  const {
    positions: boxPositions,
    minFret: calculatedMinFret,
    maxFret: calculatedMaxFret,
  } = getScalePatternPositions(
    rootNote,
    selectedScale.intervals,
    selectedScale.characteristicSemitones || [],
    activePatternIndex
  );

  const boxMinFret = calculatedMinFret <= 0 ? 1 : calculatedMinFret;
  const boxMaxFret = Math.max(boxMinFret + 3, calculatedMaxFret);

  // Get active note positions for Full Neck View (0-15 frets)
  const fullPositions: ScaleNotePosition[] = getScaleFretboardPositions(
    rootNote,
    selectedScale.intervals,
    selectedScale.characteristicSemitones || [],
    0,
    15
  );

  // Active pattern to highlight on Full Neck: currently playing pattern or active selected pattern
  const highlightPatternIdx =
    activePlayingPatternIndex !== null ? activePlayingPatternIndex : activePatternIndex;

  const {
    minFret: highlightMinFret,
    maxFret: highlightMaxFret,
  } = getScalePatternPositions(
    rootNote,
    selectedScale.intervals,
    selectedScale.characteristicSemitones || [],
    highlightPatternIdx
  );

  const focusBoxTop = highlightMinFret <= 0 ? 4 : 34 + (highlightMinFret - 1) * 46 + 4;
  const focusBoxBottom = 34 + Math.min(15, highlightMaxFret) * 46 - 4;
  const focusBoxHeight = Math.max(46, focusBoxBottom - focusBoxTop);

  interface SequencerNotePosition extends ScaleNotePosition {
    patternIndex?: number;
  }

  // Build scale sequence according to directional mode (Naik-Turun, Naik, Turun)
  // When 'up-down': nada puncak berbunyi 2 kali saat putar balik, begitu juga nada dasar saat kembali ke senar 6
  const buildSequence = (
    positions: ScaleNotePosition[],
    direction: 'up-down' | 'up' | 'down',
    patIdx?: number
  ): SequencerNotePosition[] => {
    // Sort positions ascending from lowest pitch to highest pitch:
    // String 6 (lowest pitch) down to String 1 (highest pitch)
    // Within same string: lower fret -> higher fret
    const ascending: SequencerNotePosition[] = [...positions]
      .sort((a, b) => {
        if (a.stringNum !== b.stringNum) {
          return b.stringNum - a.stringNum;
        }
        return a.fret - b.fret;
      })
      .map((p) => ({ ...p, patternIndex: patIdx }));

    if (ascending.length <= 1) return ascending;

    if (direction === 'up') {
      return ascending;
    }
    if (direction === 'down') {
      return [...ascending].reverse();
    }

    // 'up-down': Naik sampai nada puncak, lalu saat balik nada puncak dibunyikan 2 kali
    // (misal C mayor senar 1: d-e-f lalu balik f-e-d, begitu juga di senar 6 saat loop/balik)
    const descending = [...ascending].reverse();
    return [...ascending, ...descending];
  };

  // Build pattern-based sequence for Full Neck mode (Snake Connecting Run, Sequential, or Single Pattern)
  const buildFullNeckSequence = (
    mode: 'snake' | 'sequential' | 'single',
    direction: 'up-down' | 'up' | 'down',
    selectedPatIdx: number,
    startPoint: 'pattern1' | 'nut'
  ): SequencerNotePosition[] => {
    if (mode === 'single') {
      const { positions } = getScalePatternPositions(
        rootNote,
        selectedScale.intervals,
        selectedScale.characteristicSemitones || [],
        selectedPatIdx
      );
      const valid = positions.filter((p) => p.fret <= 15 && p.fret >= 0);
      return buildSequence(valid, direction, selectedPatIdx);
    }

    // Determine pattern order: 'nut' (sorted by minFret from fret 0 upwards) vs 'pattern1' (0, 1, 2...)
    const patternOrder: number[] =
      startPoint === 'nut'
        ? Array.from({ length: patternCount }, (_, i) => {
            const { minFret } = getScalePatternPositions(
              rootNote,
              selectedScale.intervals,
              selectedScale.characteristicSemitones || [],
              i
            );
            return { pIdx: i, minFret: minFret <= 0 ? 0 : minFret };
          })
            .sort((a, b) => a.minFret - b.minFret)
            .map((item) => item.pIdx)
        : Array.from({ length: patternCount }, (_, i) => i);

    if (mode === 'sequential') {
      const fullSeq: SequencerNotePosition[] = [];
      for (let i = 0; i < patternOrder.length; i++) {
        const p = patternOrder[i];
        const { positions } = getScalePatternPositions(
          rootNote,
          selectedScale.intervals,
          selectedScale.characteristicSemitones || [],
          p
        );
        const valid = positions.filter((pos) => pos.fret <= 15 && pos.fret >= 0);
        const patSeq = buildSequence(valid, direction, p);
        fullSeq.push(...patSeq);
      }
      return fullSeq;
    }

    // mode === 'snake' (Zig-Zag Connecting Run across the entire neck)
    const fullSeq: SequencerNotePosition[] = [];
    for (let i = 0; i < patternOrder.length; i++) {
      const p = patternOrder[i];
      const { positions } = getScalePatternPositions(
        rootNote,
        selectedScale.intervals,
        selectedScale.characteristicSemitones || [],
        p
      );
      const valid = positions.filter((pos) => pos.fret <= 15 && pos.fret >= 0);
      const ascending: SequencerNotePosition[] = [...valid]
        .sort((a, b) => {
          if (a.stringNum !== b.stringNum) {
            return b.stringNum - a.stringNum; // string 6 up to 1
          }
          return a.fret - b.fret;
        })
        .map((item) => ({ ...item, patternIndex: p }));

      if (ascending.length === 0) continue;

      // In snake run:
      // Even index in patternOrder goes Ascending (str 6 -> str 1)
      // Odd index goes Descending (str 1 -> str 6)
      // If user selected direction 'down', invert the starting orientation
      const isAscending = direction === 'down' ? i % 2 === 1 : i % 2 === 0;
      if (isAscending) {
        fullSeq.push(...ascending);
      } else {
        fullSeq.push(...[...ascending].reverse());
      }
    }

    // If user selected 'up-down' on snake mode:
    // Snake all the way across the neck, then snake backwards with turnaround note repeated
    if (direction === 'up-down' && fullSeq.length > 2) {
      const returnSeq = [...fullSeq].reverse();
      return [...fullSeq, ...returnSeq];
    }

    return fullSeq;
  };

  // Stop playback cleanly
  const stopPlayback = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveNoteKey(null);
    setActivePlayingPatternIndex(null);
  };

  // Generic playback sequencer engine
  const playSequence = (getSeqFn: () => SequencerNotePosition[]) => {
    stopPlayback();

    const initialSeq = getSeqFn();
    if (initialSeq.length === 0) return;

    isPlayingRef.current = true;
    setIsPlaying(true);

    let stepIndex = 0;

    const playStep = () => {
      if (!isPlayingRef.current) return;

      const currentSeq = getSeqFn();
      if (currentSeq.length === 0) {
        stopPlayback();
        return;
      }

      if (stepIndex >= currentSeq.length) {
        if (isLoopRef.current) {
          stepIndex = 0;
        } else {
          stopPlayback();
          return;
        }
      }

      const targetPos = currentSeq[stepIndex % currentSeq.length];
      setActiveNoteKey(`${targetPos.stringNum}-${targetPos.fret}`);
      if (targetPos.patternIndex !== undefined) {
        setActivePlayingPatternIndex(targetPos.patternIndex);
      }
      sound.playGuitarNote(targetPos.note, targetPos.octave);

      const stepMs = Math.round((60 / bpmRef.current) * 1000);
      const highlightDuration = Math.min(Math.round(stepMs * 0.75), 300);

      setTimeout(() => {
        setActiveNoteKey((curr) =>
          curr === `${targetPos.stringNum}-${targetPos.fret}` ? null : curr
        );
      }, highlightDuration);

      stepIndex++;
      timerRef.current = setTimeout(playStep, stepMs);
    };

    playStep();
  };

  // Playback handlers
  const startBoxPlayback = () => {
    playSequence(() => buildSequence(boxPositions, playDirectionRef.current, activePatternIndex));
  };

  const startFullNeckPlayback = () => {
    playSequence(() =>
      buildFullNeckSequence(
        fullNeckModeRef.current,
        playDirectionRef.current,
        activePatternIndex,
        fullNeckStartPointRef.current
      )
    );
  };

  // Stop playback on unmount or when root, scale, or pattern changes
  useEffect(() => {
    stopPlayback();
  }, [rootNote, selectedScale.name, selectedPosition]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Sound handler for single note pluck
  const handlePlayNote = (pos: ScaleNotePosition) => {
    setActiveNoteKey(`${pos.stringNum}-${pos.fret}`);
    sound.playGuitarNote(pos.note, pos.octave);
    setTimeout(() => {
      setActiveNoteKey((curr) =>
        curr === `${pos.stringNum}-${pos.fret}` ? null : curr
      );
    }, 250);
  };

  // Dimensions for Vertical Box View
  const numBoxFrets = Math.max(4, boxMaxFret - boxMinFret + 1);
  const padX = 36;
  const padY = 32;
  const stringSpacing = 28;
  const fretSpacing = 36;
  const widthBox = padX * 2 + 5 * stringSpacing; // 212px
  const heightBox = padY * 2 + numBoxFrets * fretSpacing;

  const getStringX = (stringNum: number) => padX + (6 - stringNum) * stringSpacing;

  // State for Full Neck layout orientation forced override in modal ('auto' | 'vertical' | 'horizontal')
  const [modalOrientation, setModalOrientation] = useState<'auto' | 'vertical' | 'horizontal'>('auto');

  return (
    <>
      {/* NORMAL CARD CONTAINER (Standard Page Flow) */}
      <div className="w-full bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Header: Title, Formula & View Mode Toggles */}
        <div className="space-y-3 border-b border-[#F0EFEA] pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Identity Badge + Name */}
            <div className="flex items-center justify-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 bg-[#1C1917] text-[#FAF9F5] rounded-xl font-mono font-black text-sm sm:text-base shadow-xs shrink-0">
                {rootNote} {selectedScale.name}
              </span>
            </div>

            {/* Controls: View Mode & Display Label Mode (Centered) */}
            <div className="flex items-center justify-center gap-1.5 shrink-0 flex-wrap">
              {/* Display Mode: Note Name vs Degree */}
              <div className="flex items-center bg-[#FAF9F5] border border-[#E5E4DE] p-0.5 rounded-xl shadow-2xs text-[10.5px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setDisplayLabelMode('note')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    displayLabelMode === 'note'
                      ? 'bg-[#1C1917] text-[#FAF9F5]'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  Nada
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayLabelMode('degree')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    displayLabelMode === 'degree'
                      ? 'bg-[#1C1917] text-[#FAF9F5]'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  Rumus
                </button>
              </div>

              {/* View Mode: Box (Vertical) vs Fullscreen Full Neck Modal */}
              <div className="flex items-center bg-[#FAF9F5] border border-[#E5E4DE] p-0.5 rounded-xl shadow-2xs text-[10.5px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('box')}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'box'
                      ? 'bg-[#1C1917] text-[#FAF9F5]'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                  title="Tampilan Pola Box Vertikal"
                >
                  <Layers className="w-3 h-3" />
                  <span>Box</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(true)}
                  className="px-2.5 py-1 rounded-lg flex items-center gap-1 text-[#D97706] hover:bg-[#FFFBEB] font-extrabold transition cursor-pointer"
                  title="Buka Mode Full Neck Layar Penuh"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Full Neck</span>
                </button>
              </div>
            </div>
          </div>

          {/* Compact Metadata Row: Scale Notes & Formula */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] font-mono py-2 border-y border-[#F0EFEA] text-center">
            <div>
              <span className="text-[#78716C]">Anggota Nada:</span>{' '}
              <span className="font-bold text-[#1C1917]">{scaleNotes.join(' - ')}</span>
            </div>
            <span className="text-[#D6D3D1]" aria-hidden="true">•</span>
            <div>
              <span className="text-[#78716C]">Rumus:</span>{' '}
              <span className="font-semibold text-[#44403C]">{selectedScale.formulaNames}</span>
            </div>
          </div>

          {/* Pattern Selectors (Dynamic: P1 - P7 on mobile, Pola 1 - Pola 7 on sm+) */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-[#78716C] uppercase mr-1">
              Pola:
            </span>
            {Array.from({ length: patternCount }).map((_, posIdx) => (
              <button
                key={posIdx}
                type="button"
                onClick={() => setSelectedPosition(posIdx)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
                  activePatternIndex === posIdx
                    ? 'bg-[#1C1917] text-[#FAF9F5]'
                    : 'bg-[#FAF9F5] hover:bg-[#F5F4EE] text-[#1C1917] border border-[#E5E4DE]'
                }`}
              >
                <span className="sm:hidden">P{posIdx + 1}</span>
                <span className="hidden sm:inline">Pola {posIdx + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* VERTICAL BOX DIAGRAM VIEW: < diagram > */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-4 py-1 select-none">
          {/* Tombol Pola Sebelumnya (<) */}
          <button
            type="button"
            disabled={patternCount <= 1}
            onClick={() =>
              setSelectedPosition((prev) => (prev > 0 ? prev - 1 : patternCount - 1))
            }
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF9F5] hover:bg-[#F5F4EE] active:scale-95 disabled:opacity-25 disabled:pointer-events-none border border-[#E5E4DE] flex items-center justify-center text-[#1C1917] cursor-pointer shadow-2xs shrink-0 transition"
            title="Pola Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* SVG Diagram */}
          <div className="flex flex-col items-center justify-center">
            <svg
              viewBox={`0 0 ${widthBox} ${heightBox + 15}`}
              className="w-52 sm:w-60 max-w-full drop-shadow-2xs overflow-visible"
            >
            {/* Nut Line (if starting at fret 1) */}
            {boxMinFret === 1 ? (
              <rect
                x={padX}
                y={padY - 3}
                width={5 * stringSpacing}
                height={5}
                fill="#1C1917"
                rx={1.5}
              />
            ) : (
              <>
                <text
                  x={padX - 10}
                  y={padY + fretSpacing / 2 + 4}
                  textAnchor="end"
                  className="text-[11.5px] font-mono font-black fill-[#78716C]"
                >
                  {boxMinFret}fr
                </text>
                <line
                  x1={padX}
                  y1={padY}
                  x2={padX + 5 * stringSpacing}
                  y2={padY}
                  stroke="#A8A29E"
                  strokeWidth={2}
                />
              </>
            )}

            {/* Fret Horizontal Lines */}
            {Array.from({ length: numBoxFrets }).map((_, i) => (
              <line
                key={`fret-line-${i}`}
                x1={padX}
                y1={padY + (i + 1) * fretSpacing}
                x2={padX + 5 * stringSpacing}
                y2={padY + (i + 1) * fretSpacing}
                stroke="#D6D3D1"
                strokeWidth={1.5}
              />
            ))}

            {/* 6 Vertical String Lines */}
            {[6, 5, 4, 3, 2, 1].map((strNum) => {
              const sx = getStringX(strNum);
              const strokeW = strNum >= 5 ? 2.5 : strNum >= 3 ? 1.8 : 1.2;

              return (
                <g key={`str-${strNum}`}>
                  <line
                    x1={sx}
                    y1={padY}
                    x2={sx}
                    y2={padY + numBoxFrets * fretSpacing}
                    stroke="#78716C"
                    strokeWidth={strokeW}
                  />
                  <text
                    x={sx}
                    y={padY + numBoxFrets * fretSpacing + 16}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-semibold fill-[#A8A29E]"
                  >
                    {strNum}
                  </text>
                </g>
              );
            })}

            {/* Active Scale Note Circles */}
            {boxPositions.map((pos) => {
              const sx = getStringX(pos.stringNum);
              const isPlaying = activeNoteKey === `${pos.stringNum}-${pos.fret}`;
              const label = displayLabelMode === 'note' ? pos.note : pos.degree;

              const fill = isPlaying
                ? '#D97706'
                : pos.role === 'root'
                ? '#1C1917'
                : pos.role === 'characteristic'
                ? '#D97706'
                : '#FAF9F5';

              const stroke = isPlaying
                ? '#D97706'
                : pos.role === 'root'
                ? '#1C1917'
                : pos.role === 'characteristic'
                ? '#D97706'
                : '#A8A29E';

              const textColor =
                isPlaying || pos.role === 'root' || pos.role === 'characteristic'
                  ? '#FAF9F5'
                  : '#1C1917';

              // If open string
              if (pos.fret === 0) {
                return (
                  <g
                    key={`open-${pos.stringNum}`}
                    className="cursor-pointer active:scale-95 transition-transform"
                    onClick={() => handlePlayNote(pos)}
                  >
                    <circle
                      cx={sx}
                      cy={padY - 16}
                      r={8.5}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={1.6}
                    />
                    <text
                      x={sx}
                      y={padY - 13}
                      textAnchor="middle"
                      className="text-[8px] font-mono font-black pointer-events-none"
                      fill={textColor}
                    >
                      {label}
                    </text>
                  </g>
                );
              }

              // Fretted Note Circle
              const fretIndex = pos.fret - boxMinFret;
              if (fretIndex >= 0 && fretIndex < numBoxFrets) {
                const cy = padY + fretIndex * fretSpacing + fretSpacing / 2;

                return (
                  <g
                    key={`fret-${pos.stringNum}-${pos.fret}`}
                    className="cursor-pointer active:scale-95 transition-transform"
                    onClick={() => handlePlayNote(pos)}
                  >
                    <circle
                      cx={sx}
                      cy={cy}
                      r={9.5}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={1.6}
                    />
                    <text
                      x={sx}
                      y={cy + 3}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-black pointer-events-none"
                      fill={textColor}
                    >
                      {label}
                    </text>
                  </g>
                );
              }

              return null;
            })}
            </svg>
          </div>

          {/* Tombol Pola Berikutnya (>) */}
          <button
            type="button"
            disabled={patternCount <= 1}
            onClick={() =>
              setSelectedPosition((prev) => (prev + 1) % patternCount)
            }
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF9F5] hover:bg-[#F5F4EE] active:scale-95 disabled:opacity-25 disabled:pointer-events-none border border-[#E5E4DE] flex items-center justify-center text-[#1C1917] cursor-pointer shadow-2xs shrink-0 transition"
            title="Pola Berikutnya"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Legend & Scale Practice Sequencer Footer */}
        <div className="pt-2 border-t border-[#F0EFEA] flex flex-col gap-2.5">
          {/* High Contrast Color Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] font-mono text-[#78716C]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#1C1917] border border-[#1C1917] inline-block shadow-2xs"></span>
              <span className="font-extrabold text-[#1C1917]">Root ({rootNote})</span>
            </div>
            {selectedScale.characteristicSemitones && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#D97706] border border-[#D97706] inline-block shadow-2xs"></span>
                <span className="font-extrabold text-[#D97706]">Blue Note</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FAF9F5] border border-[#A8A29E] inline-block shadow-2xs"></span>
              <span className="font-medium text-[#44403C]">Nada Skala</span>
            </div>
          </div>

          {/* Practice Sequencer Control Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#FAF9F5] border border-[#E5E4DE] p-1.5 sm:p-2 rounded-xl">
            {/* Arah Main: Naik-Turun | Naik | Turun */}
            <div className="flex items-center bg-[#FFFFFF] border border-[#E5E4DE] p-0.5 rounded-lg text-[10px] font-mono font-bold shadow-2xs w-fit mx-auto sm:mx-0">
              <button
                type="button"
                onClick={() => setPlayDirection('up-down')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  playDirection === 'up-down'
                    ? 'bg-[#1C1917] text-[#FAF9F5]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
                title="Mainkan Naik lalu Turun"
              >
                Naik-Turun
              </button>
              <button
                type="button"
                onClick={() => setPlayDirection('up')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  playDirection === 'up'
                    ? 'bg-[#1C1917] text-[#FAF9F5]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
                title="Mainkan Naik saja"
              >
                Naik
              </button>
              <button
                type="button"
                onClick={() => setPlayDirection('down')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  playDirection === 'down'
                    ? 'bg-[#1C1917] text-[#FAF9F5]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
                title="Mainkan Turun saja"
              >
                Turun
              </button>
            </div>

            {/* Controls: BPM Stepper + Loop Toggle + Mainkan/Berhenti Button */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
              {/* BPM Stepper */}
              <div className="flex items-center bg-[#FFFFFF] border border-[#E5E4DE] rounded-lg px-1 py-0.5 shadow-2xs font-mono text-[10.5px]">
                <button
                  type="button"
                  onClick={() => setBpm((prev) => Math.max(40, prev - 5))}
                  className="w-5 h-5 flex items-center justify-center text-[#78716C] hover:text-[#1C1917] active:scale-95 cursor-pointer font-bold select-none"
                  title="Kurangi BPM (-5)"
                >
                  -
                </button>
                <span className="px-1.5 font-bold text-[#1C1917] min-w-[54px] text-center select-none">
                  {bpm} <span className="text-[9px] text-[#78716C] font-normal">BPM</span>
                </span>
                <button
                  type="button"
                  onClick={() => setBpm((prev) => Math.min(220, prev + 5))}
                  className="w-5 h-5 flex items-center justify-center text-[#78716C] hover:text-[#1C1917] active:scale-95 cursor-pointer font-bold select-none"
                  title="Tambah BPM (+5)"
                >
                  +
                </button>
              </div>

              {/* Loop Toggle Button */}
              <button
                type="button"
                onClick={() => setIsLoop((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 ${
                  isLoop
                    ? 'bg-[#FFFBEB] border-[#D97706] text-[#D97706]'
                    : 'bg-[#FFFFFF] border-[#E5E4DE] text-[#78716C] hover:text-[#1C1917]'
                }`}
                title={isLoop ? 'Loop Aktif (Memainkan berulang terus)' : 'Loop Nonaktif (Mainkan sekali)'}
              >
                <Repeat className={`w-3 h-3 ${isLoop ? 'text-[#D97706]' : ''}`} />
                <span>Loop</span>
              </button>

              {/* Mainkan / Berhenti Button */}
              <button
                type="button"
                onClick={() => (isPlaying ? stopPlayback() : startBoxPlayback())}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 ${
                  isPlaying
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF9F5] ring-2 ring-[#DC2626]/30'
                    : 'bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5]'
                }`}
                title={isPlaying ? 'Hentikan Pemutaran Skala' : 'Mainkan Pola Skala Ini'}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Berhenti</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mainkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN ADAPTIVE FULL NECK MODAL OVERLAY (ROTATED 3-COLUMN LAYOUT) */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1917] text-[#FAF9F5] flex flex-row items-center justify-between p-1 sm:p-2 select-none overflow-hidden animate-fade-in">
          {/* 1. LEFT SIDEBAR: LEGEND & FORMULA (Rotated 90deg, Evenly Spaced & Zero Overlap) */}
          <div className="w-10 sm:w-12 h-full flex flex-col items-center justify-evenly py-6 border-r border-[#383533] shrink-0 bg-[#24211F] text-[10px] font-mono text-[#D6D3D1]">
            {/* Item 1: Root Note */}
            <div className="h-20 w-full flex items-center justify-center shrink-0">
              <div className="rotate-90 whitespace-nowrap flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FAF9F5] inline-block shadow-2xs"></span>
                <span className="text-[#FAF9F5]">Root ({rootNote})</span>
              </div>
            </div>

            {/* Item 2: Blue Note (if present) */}
            {selectedScale.characteristicSemitones && (
              <div className="h-20 w-full flex items-center justify-center shrink-0">
                <div className="rotate-90 whitespace-nowrap flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] inline-block shadow-2xs"></span>
                  <span className="text-[#D97706]">Blue Note</span>
                </div>
              </div>
            )}

            {/* Item 3: Nada Skala */}
            <div className="h-20 w-full flex items-center justify-center shrink-0">
              <div className="rotate-90 whitespace-nowrap flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#383533] border border-[#57534E] inline-block shadow-2xs"></span>
                <span className="text-[#A8A29E]">Nada Skala</span>
              </div>
            </div>

            {/* Item 4: Rumus */}
            <div className="h-32 w-full flex items-center justify-center shrink-0">
              <div className="rotate-90 whitespace-nowrap text-[9px] font-mono text-[#FAF9F5] font-semibold tracking-tight">
                {selectedScale.formulaNames}
              </div>
            </div>
          </div>

          {/* 2. CENTER CANVAS: 0-15 FRETBOARD (Stretching vertical height, spaced nut circles, equal Fret 1 box) */}
          <div className="flex-1 h-full min-w-0 flex items-center justify-center p-0 overflow-hidden my-auto">
            <svg
              viewBox="0 0 320 735"
              className="w-full h-full max-h-[99vh] drop-shadow-md overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Nut Line at Fret 0 Top (Placed at y=28 to y=34 so nut circles have clean breathing room above) */}
              <rect x="35" y="28" width="230" height="6" fill="#FAF9F5" rx="1.5" />

              {/* 6 Vertical Strings (String 6 on left x=35, String 1 on right x=265) */}
              {[6, 5, 4, 3, 2, 1].map((strNum) => {
                const sx = 35 + (6 - strNum) * 46;
                const strokeW = strNum >= 5 ? 2.8 : strNum >= 3 ? 2.0 : 1.4;

                return (
                  <g key={`fn-v-str-${strNum}`}>
                    <line
                      x1={sx}
                      y1="34"
                      x2={sx}
                      y2="724"
                      stroke="#A8A29E"
                      strokeWidth={strokeW}
                    />
                    {/* Open Nut Note at Top (Directly showing E A D G B E, Rotated 90deg) */}
                    <text
                      x={sx}
                      y="13"
                      transform={`rotate(90 ${sx} 13)`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[11px] font-mono font-black fill-[#FAF9F5]"
                    >
                      {['E', 'A', 'D', 'G', 'B', 'E'][6 - strNum]}
                    </text>
                  </g>
                );
              })}

              {/* 15 Horizontal Frets (Stretching height ~46px per fret) */}
              {Array.from({ length: 15 }).map((_, fIdx) => {
                const fretNum = fIdx + 1;
                const fy = 34 + fretNum * 46;
                const cy = 34 + (fretNum - 0.5) * 46;
                const isSingleMarker = [3, 5, 7, 9, 15].includes(fretNum);
                const isDoubleMarker = fretNum === 12;

                return (
                  <g key={`fn-v-fret-${fretNum}`}>
                    <line
                      x1="35"
                      y1={fy}
                      x2="265"
                      y2={fy}
                      stroke="#57534E"
                      strokeWidth="1.5"
                    />
                    {/* Fret Number (Positioned on top side x=285 when rotated, Rotated 90deg) */}
                    <text
                      x="285"
                      y={cy}
                      transform={`rotate(90 285 ${cy})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[11px] font-mono font-black fill-[#A8A29E]"
                    >
                      {fretNum}
                    </text>

                    {/* Inlay Dots */}
                    {isSingleMarker && (
                      <circle cx="150" cy={cy} r="4" fill="#A8A29E" opacity="0.35" />
                    )}
                    {isDoubleMarker && (
                      <>
                        <circle cx="104" cy={cy} r="4" fill="#A8A29E" opacity="0.35" />
                        <circle cx="196" cy={cy} r="4" fill="#A8A29E" opacity="0.35" />
                      </>
                    )}
                  </g>
                );
              })}

              {/* Translucent Pattern Focus Box on Full Neck - Only visible when playing */}
              {isPlaying && activePlayingPatternIndex !== null && (
                <g className="transition-all duration-300 ease-in-out pointer-events-none">
                  <rect
                    x="18"
                    y={focusBoxTop}
                    width="264"
                    height={focusBoxHeight}
                    rx="14"
                    fill="#D97706"
                    fillOpacity="0.09"
                    stroke="#D97706"
                    strokeWidth="1.8"
                    strokeDasharray="6 4"
                  />
                  <text
                    x="302"
                    y={focusBoxTop + Math.min(28, focusBoxHeight / 2)}
                    transform={`rotate(90 302 ${focusBoxTop + Math.min(28, focusBoxHeight / 2)})`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[9.5px] font-mono font-black fill-[#D97706] tracking-wider"
                  >
                    POLA {highlightPatternIdx + 1}
                  </text>
                </g>
              )}

              {/* Active Note Badges (Nut & fret note circles have equal radius r=11, Rotated 90deg) */}
              {fullPositions.map((pos) => {
                const sx = 35 + (6 - pos.stringNum) * 46;
                const cy = pos.fret === 0 ? 13 : 34 + (pos.fret - 0.5) * 46;
                const isPlaying = activeNoteKey === `${pos.stringNum}-${pos.fret}`;
                const label = displayLabelMode === 'note' ? pos.note : pos.degree;

                const fill = isPlaying
                  ? '#D97706'
                  : pos.role === 'root'
                  ? '#FAF9F5'
                  : pos.role === 'characteristic'
                  ? '#D97706'
                  : '#383533';

                const stroke = isPlaying
                  ? '#D97706'
                  : pos.role === 'root'
                  ? '#FAF9F5'
                  : pos.role === 'characteristic'
                  ? '#D97706'
                  : '#57534E';

                const textColor =
                  pos.role === 'root'
                    ? '#1C1917'
                    : isPlaying || pos.role === 'characteristic'
                    ? '#FAF9F5'
                    : '#E5E4DE';

                return (
                  <g
                    key={`fn-v-note-${pos.stringNum}-${pos.fret}`}
                    className="cursor-pointer active:scale-95 transition-transform"
                    onClick={() => handlePlayNote(pos)}
                  >
                    <circle
                      cx={sx}
                      cy={cy}
                      r={11}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.8"
                    />
                    <text
                      x={sx}
                      y={cy}
                      transform={`rotate(90 ${sx} ${cy})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9.5px] font-mono font-black pointer-events-none"
                      fill={textColor}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 3. RIGHT SIDEBAR: CONTROLS & TITLE (Perfect Rotated Layout with Exact Bounding Boxes) */}
          <div className="w-12 sm:w-14 h-full flex flex-col items-center justify-between py-2 border-l border-[#383533] shrink-0 bg-[#292524] relative">
            {/* 1. Tombol X (Close Button) */}
            <div className="h-10 w-full flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  stopPlayback();
                  setIsFullscreenOpen(false);
                  setIsFullNeckSettingsOpen(false);
                }}
                className="w-8 h-8 rounded-xl bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] border border-[#57534E] transition active:scale-95 cursor-pointer rotate-90"
                title="Tutup Mode Full Neck"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Nama Skala Badge (Rotated width ~140px -> Wrapper h-32) */}
            <div className="h-32 w-full flex items-center justify-center shrink-0">
              <div className="rotate-90 whitespace-nowrap px-3 py-1 bg-[#FAF9F5] text-[#1C1917] rounded-xl font-mono font-black text-[11px] sm:text-xs shadow-xs">
                {rootNote} {selectedScale.name}
              </div>
            </div>

            {/* 3. Tab Rumus / Nada (Rotated width ~90px -> Wrapper h-24) */}
            <div className="h-24 w-full flex items-center justify-center shrink-0">
              <div className="flex flex-col items-center bg-[#1C1917] border border-[#44403C] p-0.5 rounded-xl text-[10px] font-mono font-bold rotate-90">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setDisplayLabelMode('note')}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                      displayLabelMode === 'note'
                        ? 'bg-[#FAF9F5] text-[#1C1917]'
                        : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                    }`}
                  >
                    Nada
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayLabelMode('degree')}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                      displayLabelMode === 'degree'
                        ? 'bg-[#FAF9F5] text-[#1C1917]'
                        : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                    }`}
                  >
                    Rumus
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Tombol Dropdown Mode Latihan (Rotated width ~70px -> Wrapper h-18) */}
            <div className="h-18 w-full flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => setIsFullNeckSettingsOpen((prev) => !prev)}
                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs rotate-90 whitespace-nowrap ${
                  isFullNeckSettingsOpen
                    ? 'bg-[#FAF9F5] text-[#1C1917] ring-1 ring-[#FAF9F5]'
                    : 'bg-[#383533] text-[#FAF9F5] hover:bg-[#57534E] border border-[#57534E]'
                }`}
                title="Pilihan Mode Mainkan Full Neck"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Mode</span>
              </button>
            </div>

            {/* 5. Tombol Mainkan / Berhenti (Rotated width ~90px -> Wrapper h-24) */}
            <div className="h-24 w-full flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => (isPlaying ? stopPlayback() : startFullNeckPlayback())}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs rotate-90 whitespace-nowrap ${
                  isPlaying
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF9F5] ring-2 ring-[#DC2626]/40'
                    : 'bg-[#D97706] hover:bg-[#B45309] text-[#FAF9F5]'
                }`}
                title={isPlaying ? 'Hentikan Pemutaran Skala' : 'Mainkan Urutan Skala'}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Berhenti</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mainkan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DROPDOWN / POPOVER MODAL PENGATURAN MODE LATIHAN FULL NECK */}
          {isFullNeckSettingsOpen && (
            <div
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 select-none"
              onClick={() => setIsFullNeckSettingsOpen(false)}
            >
              <div
                className={`bg-[#24211F] text-[#FAF9F5] border border-[#44403C] rounded-2xl p-2.5 sm:p-3.5 w-[86vw] max-w-72 sm:max-w-80 shadow-2xl space-y-1.5 shrink-0 transition-transform ${
                  isPopupRotated
                    ? 'rotate-90 sm:rotate-0 max-h-[72vw] sm:max-h-[85vh] overflow-y-auto'
                    : 'rotate-0 max-h-[85vh] overflow-y-auto'
                } [scrollbar-width:thin] [scrollbar-color:#57534E_transparent]`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with Title, Orientation Toggle, and Close X */}
                <div className="flex items-center justify-between border-b border-[#383533] pb-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#D97706]" />
                    <span className="font-mono font-black text-[10.5px] text-[#FAF9F5] uppercase tracking-wide">
                      Mode Mainkan Full Neck
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsPopupRotated((prev) => !prev)}
                      className="w-5 h-5 rounded-md bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] cursor-pointer transition active:scale-90"
                      title={isPopupRotated ? 'Ubah ke Orientasi Tegak (0°)' : 'Ubah ke Orientasi Gitar (90°)'}
                    >
                      <RotateCw className="w-2.5 h-2.5 text-[#A8A29E] hover:text-[#FAF9F5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFullNeckSettingsOpen(false)}
                      className="w-5 h-5 rounded-md bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] cursor-pointer transition active:scale-90"
                      title="Tutup Pengaturan"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 0. Titik Mulai Latihan: Mulai dari Pola 1 vs Mulai dari Nut (Fret 0) */}
                <div className="space-y-0.5 font-mono text-[9.5px]">
                  <div className="text-[#A8A29E] font-bold text-[9px]">Mulai Dari:</div>
                  <div className="flex items-center bg-[#1C1917] border border-[#383533] p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setFullNeckStartPoint('pattern1');
                        if (isPlaying) stopPlayback();
                      }}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        fullNeckStartPoint === 'pattern1'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Pola 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFullNeckStartPoint('nut');
                        if (isPlaying) stopPlayback();
                      }}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        fullNeckStartPoint === 'nut'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Nut (Fret 0)
                    </button>
                  </div>
                </div>

                {/* 1. Alur Pola: Segmented 3-button toggle */}
                <div className="space-y-0.5 font-mono text-[9.5px]">
                  <div className="text-[#A8A29E] font-bold text-[9px]">Alur Pola:</div>
                  <div className="flex items-center bg-[#1C1917] border border-[#383533] p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setFullNeckMode('snake');
                        if (isPlaying) stopPlayback();
                      }}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        fullNeckMode === 'snake'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Snake
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFullNeckMode('sequential');
                        if (isPlaying) stopPlayback();
                      }}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        fullNeckMode === 'sequential'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Berurutan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFullNeckMode('single');
                        if (isPlaying) stopPlayback();
                      }}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        fullNeckMode === 'single'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Fokus
                    </button>
                  </div>

                  {/* Concise Description Line */}
                  <div className="text-[8px] text-[#D97706] font-semibold px-0.5 leading-tight">
                    {fullNeckMode === 'snake' && 'Sambung Pola (P1 naik → P2 turun → P3...)'}
                    {fullNeckMode === 'sequential' && 'Per Pola (Pola 1 naik-turun → P2...)'}
                    {fullNeckMode === 'single' && 'Fokus pada satu pola tertentu di neck'}
                  </div>
                </div>

                {/* If Fokus Satu Pola: Pola Selector */}
                {fullNeckMode === 'single' && (
                  <div className="space-y-0.5 font-mono text-[9px]">
                    <div className="text-[#A8A29E] font-bold text-[8.5px]">Pilih Pola:</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: patternCount }).map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setSelectedPosition(pIdx);
                            if (isPlaying) stopPlayback();
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition cursor-pointer ${
                            activePatternIndex === pIdx
                              ? 'bg-[#D97706] text-[#FAF9F5]'
                              : 'bg-[#292524] text-[#A8A29E] hover:text-[#FAF9F5] border border-[#383533]'
                          }`}
                        >
                          P{pIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Arah Main (Naik-Turun / Naik / Turun) */}
                <div className="space-y-0.5 font-mono text-[9.5px]">
                  <div className="text-[#A8A29E] font-bold text-[9px]">Arah Main:</div>
                  <div className="flex items-center bg-[#1C1917] border border-[#383533] p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPlayDirection('up-down')}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        playDirection === 'up-down'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Naik-Turun
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayDirection('up')}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        playDirection === 'up'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayDirection('down')}
                      className={`flex-1 py-0.5 rounded font-bold text-center transition cursor-pointer text-[9px] ${
                        playDirection === 'down'
                          ? 'bg-[#FAF9F5] text-[#1C1917]'
                          : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                      }`}
                    >
                      Turun
                    </button>
                  </div>
                </div>

                {/* 3. BPM Stepper & Loop Row */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#383533] font-mono text-[9.5px] shrink-0">
                  {/* BPM */}
                  <div className="flex items-center bg-[#1C1917] border border-[#383533] rounded-lg px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => setBpm((prev) => Math.max(40, prev - 5))}
                      className="w-4 h-4 flex items-center justify-center text-[#A8A29E] hover:text-[#FAF9F5] font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-1 font-bold text-[#FAF9F5] min-w-[42px] text-center text-[9px]">
                      {bpm} <span className="text-[7.5px] text-[#A8A29E]">BPM</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBpm((prev) => Math.min(220, prev + 5))}
                      className="w-4 h-4 flex items-center justify-center text-[#A8A29E] hover:text-[#FAF9F5] font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Loop Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsLoop((prev) => !prev)}
                    className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 transition cursor-pointer text-[9px] ${
                      isLoop
                        ? 'bg-[#FFFBEB] border-[#D97706] text-[#D97706]'
                        : 'bg-[#1C1917] border-[#383533] text-[#A8A29E] hover:text-[#FAF9F5]'
                    }`}
                  >
                    <Repeat className="w-2.5 h-2.5" />
                    <span>Loop {isLoop ? 'On' : 'Off'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

