import React, { useState } from 'react';
import { ChordShapeVoicing } from '../../utils/guitarChordVoicings';
import { GUITAR_STRINGS } from '../../data/constants';
import { getGuitarFretNote } from '../../utils/musicTheory';
import { Volume2, Play, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface GuitarFretboardDiagramProps {
  chordName: string;
  displayName: string;
  formulaNames: string;
  notes: string[];
  shapes: ChordShapeVoicing[];
  onPlayFullChord?: () => void;
  onClose?: () => void;
}

export const GuitarFretboardDiagram: React.FC<GuitarFretboardDiagramProps> = ({
  chordName,
  displayName,
  formulaNames,
  notes,
  shapes,
  onPlayFullChord,
  onClose,
}) => {
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(0);
  const [activeString, setActiveString] = useState<number | null>(null);

  const currentShape: ChordShapeVoicing | undefined = shapes[selectedShapeIndex] || shapes[0];

  const handlePlayString = (stringNum: number, fret: number | 'x') => {
    if (fret === 'x') return;
    const gString = GUITAR_STRINGS.find((s) => s.stringNumber === stringNum);
    if (!gString) return;

    setActiveString(stringNum);
    const { note, octaveDiff } = getGuitarFretNote(gString.openNote, fret);
    sound.playGuitarNote(note, gString.openOctave + octaveDiff);

    setTimeout(() => {
      setActiveString(null);
    }, 250);
  };

  const handlePlayStrum = () => {
    if (!currentShape) {
      if (onPlayFullChord) onPlayFullChord();
      return;
    }
    const playable = currentShape.positions.filter((p) => p.fret !== 'x');
    if (playable.length === 0) {
      if (onPlayFullChord) onPlayFullChord();
      return;
    }
    playable.forEach((pos, idx) => {
      setTimeout(() => {
        handlePlayString(pos.stringNum, pos.fret);
      }, idx * 35);
    });
  };

  const handlePlayArpeggio = () => {
    if (!currentShape) return;
    const playable = currentShape.positions.filter((p) => p.fret !== 'x');
    playable.forEach((pos, idx) => {
      setTimeout(() => {
        handlePlayString(pos.stringNum, pos.fret);
      }, idx * 180);
    });
  };

  if (!currentShape) {
    return (
      <div className="p-6 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl text-center text-[#78716C] text-xs font-mono">
        Bentuk diagram belum tersedia untuk akor ini.
      </div>
    );
  }

  // Diagram dimensions: dynamic fret slots based on actual shape frets (minimum 4 frets)
  const numericFrets = (currentShape.frets || []).filter((f): f is number => typeof f === 'number' && f > 0);
  const maxFret = numericFrets.length > 0 ? Math.max(...numericFrets) : 3;
  const startFret = currentShape.baseFret || 1;
  const numFrets = Math.max(4, maxFret - startFret + 1);
  const displayFrets = Array.from({ length: numFrets }, (_, i) => startFret + i);

  // SVG Coordinates
  const padX = 36;
  const padY = 32;
  const stringSpacing = 28; // width between 6 strings -> 5 intervals * 28 = 140px width
  const fretSpacing = 36;   // height between frets -> 4 frets * 36 = 144px height
  const width = padX * 2 + 5 * stringSpacing; // 72 + 140 = 212
  const height = padY * 2 + numFrets * fretSpacing; // 64 + 144 = 208

  // String X positions: string 6 (left) to string 1 (right)
  const getStringX = (stringNum: number) => {
    const colIndex = 6 - stringNum; // 6 -> 0, 5 -> 1, ..., 1 -> 5
    return padX + colIndex * stringSpacing;
  };

  // Fret Y line positions
  const getFretLineY = (fretIndex: number) => {
    return padY + fretIndex * fretSpacing;
  };

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header: Chord Identity & Metadata */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="px-2.5 py-1 bg-[#1C1917] text-[#FAF9F5] rounded-xl font-mono font-black text-sm sm:text-base shadow-xs shrink-0">
              {chordName}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-[#1C1917] truncate">
                {displayName}
              </div>
              <div className="text-[10.5px] font-mono text-[#78716C] truncate">
                {currentShape.name || `Bentuk ${selectedShapeIndex + 1}`}
              </div>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#FAF9F5] hover:bg-[#F5F4EE] active:scale-95 border border-[#E5E4DE] text-[#1C1917] flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0 ml-1"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4 text-[#78716C]" />
            </button>
          )}
        </div>

        {/* Compact Metadata Row: Nada & Formula (Symmetrically Centered Vertically & Horizontally) */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] font-mono py-2.5 border-y border-[#F0EFEA] text-center">
          <div>
            <span className="text-[#78716C]">Nada:</span>{' '}
            <span className="font-bold text-[#1C1917]">{notes.join(' - ')}</span>
          </div>
          <span className="text-[#D6D3D1]" aria-hidden="true">•</span>
          <div>
            <span className="text-[#78716C]">Rumus:</span>{' '}
            <span className="font-semibold text-[#44403C]">{formulaNames}</span>
          </div>
        </div>
      </div>

      {/* Voicing Counter Indicator */}
      <div className="flex items-center justify-center -mb-1">
        <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E5E4DE] text-[11px] font-mono font-bold text-[#1C1917] shadow-2xs">
          {selectedShapeIndex + 1}/{shapes.length}
        </span>
      </div>

      {/* Diagram with Left & Right Voicing Nav Buttons: < diagram > */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-4 py-1 select-none">
        {/* Tombol Sebelumnya (<) */}
        <button
          type="button"
          disabled={shapes.length <= 1}
          onClick={() => setSelectedShapeIndex((prev) => (prev > 0 ? prev - 1 : shapes.length - 1))}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF9F5] hover:bg-[#F5F4EE] active:scale-95 disabled:opacity-25 disabled:pointer-events-none border border-[#E5E4DE] flex items-center justify-center text-[#1C1917] cursor-pointer shadow-2xs shrink-0 transition"
          title="Bentuk Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* SVG Guitar Diagram */}
        <div className="flex items-center justify-center">
          <svg
            viewBox={`0 0 ${width} ${height + 15}`}
            className="w-52 sm:w-60 max-w-full drop-shadow-2xs overflow-visible"
          >
          {/* Nut line (fret 0 bar) if starting at fret 1 */}
          {startFret === 1 ? (
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
              {/* Starting fret indicator on the left side */}
              <text
                x={padX - 10}
                y={padY + fretSpacing / 2 + 5}
                textAnchor="end"
                className="text-[12px] font-mono font-black fill-[#78716C]"
              >
                {startFret}fr
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

          {/* Fret horizontal lines (1 to 4) */}
          {displayFrets.map((_, i) => (
            <line
              key={`fret-line-${i}`}
              x1={padX}
              y1={getFretLineY(i + 1)}
              x2={padX + 5 * stringSpacing}
              y2={getFretLineY(i + 1)}
              stroke="#D6D3D1"
              strokeWidth={1.5}
            />
          ))}

          {/* 6 Vertical string lines (String 6 on left, String 1 on right) */}
          {[6, 5, 4, 3, 2, 1].map((strNum, idx) => {
            const sx = getStringX(strNum);
            const isPlaying = activeString === strNum;
            // Thicker lines for bass strings
            const strokeW = strNum >= 5 ? 2.5 : strNum >= 3 ? 1.8 : 1.2;

            return (
              <g key={`string-${strNum}`}>
                <line
                  x1={sx}
                  y1={padY}
                  x2={sx}
                  y2={padY + numFrets * fretSpacing}
                  stroke={isPlaying ? '#D97706' : '#78716C'}
                  strokeWidth={isPlaying ? strokeW + 1.5 : strokeW}
                  className="transition-colors duration-150"
                />

                {/* String number label at bottom */}
                <text
                  x={sx}
                  y={padY + numFrets * fretSpacing + 16}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-semibold fill-[#A8A29E]"
                >
                  {strNum}
                </text>
              </g>
            );
          })}

          {/* Barre line if applicable */}
          {currentShape.barreInfo && (
            (() => {
              const b = currentShape.barreInfo;
              const fretIndex = b.fret - startFret;
              if (fretIndex >= 0 && fretIndex < numFrets) {
                const y = padY + fretIndex * fretSpacing + fretSpacing / 2;
                const x1 = getStringX(b.fromString);
                const x2 = getStringX(b.toString);
                return (
                  <rect
                    key="barre-strip"
                    x={Math.min(x1, x2) - 10}
                    y={y - 9}
                    width={Math.abs(x1 - x2) + 20}
                    height={18}
                    rx={9}
                    fill="#1C1917"
                    className="opacity-90"
                  />
                );
              }
              return null;
            })()
          )}

          {/* String Markers (Top: 'O', 'X', and Finger placement circles) */}
          {currentShape.positions.map((pos) => {
            const sx = getStringX(pos.stringNum);
            const isPlaying = activeString === pos.stringNum;

            // Muted string (X)
            if (pos.fret === 'x') {
              return (
                <text
                  key={`top-x-${pos.stringNum}`}
                  x={sx}
                  y={padY - 12}
                  textAnchor="middle"
                  className="text-[12px] font-mono font-bold fill-[#A8A29E]"
                >
                  ✕
                </text>
              );
            }

            // Open string (O) with Note Name Display
            if (pos.fret === 0) {
              const openNoteName = pos.note || GUITAR_STRINGS.find(s => s.stringNumber === pos.stringNum)?.openNote || '';
              const isRoot = pos.degree === 'R';

              return (
                <g
                  key={`top-open-${pos.stringNum}`}
                  className="cursor-pointer active:scale-95 transition-transform"
                  onClick={() => handlePlayString(pos.stringNum, 0)}
                >
                  <circle
                    cx={sx}
                    cy={padY - 16}
                    r={8.5}
                    fill={isPlaying ? '#D97706' : isRoot ? '#1C1917' : '#FAF9F5'}
                    stroke={isPlaying ? '#D97706' : '#1C1917'}
                    strokeWidth={1.6}
                  />
                  <text
                    x={sx}
                    y={padY - 13}
                    textAnchor="middle"
                    className={`text-[8.5px] font-mono font-bold pointer-events-none ${
                      isPlaying || isRoot ? 'fill-[#FAF9F5]' : 'fill-[#1C1917]'
                    }`}
                  >
                    {openNoteName}
                  </text>
                </g>
              );
            }

            // Fretted Note Circle
            const fretIndex = (pos.fret as number) - startFret;
            if (fretIndex >= 0 && fretIndex < numFrets) {
              const cy = padY + fretIndex * fretSpacing + fretSpacing / 2;
              const isRoot = pos.degree === 'R';

              return (
                <g
                  key={`fret-circle-${pos.stringNum}`}
                  className="cursor-pointer active:scale-95 transition-transform"
                  onClick={() => handlePlayString(pos.stringNum, pos.fret)}
                >
                  <circle
                    cx={sx}
                    cy={cy}
                    r={9.5}
                    fill={isPlaying ? '#D97706' : isRoot ? '#1C1917' : '#292524'}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                  {/* Note Name or Degree inside dot */}
                  <text
                    x={sx}
                    y={cy + 3}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-[#FAF9F5] pointer-events-none"
                  >
                    {pos.note || pos.degree}
                  </text>
                </g>
              );
            }

            return null;
          })}
          </svg>
        </div>

        {/* Tombol Berikutnya (>) */}
        <button
          type="button"
          disabled={shapes.length <= 1}
          onClick={() => setSelectedShapeIndex((prev) => (prev < shapes.length - 1 ? prev + 1 : 0))}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF9F5] hover:bg-[#F5F4EE] active:scale-95 disabled:opacity-25 disabled:pointer-events-none border border-[#E5E4DE] flex items-center justify-center text-[#1C1917] cursor-pointer shadow-2xs shrink-0 transition"
          title="Bentuk Berikutnya"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Audio Play Controls (Centered & Simplified) */}
      <div className="flex items-center justify-center gap-2.5 pt-2 border-t border-[#F0EFEA]">
        <button
          type="button"
          onClick={handlePlayStrum}
          className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
          title="Strum Seluruh Senar Akor"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Strum</span>
        </button>

        <button
          type="button"
          onClick={handlePlayArpeggio}
          className="px-5 py-2 bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#1C1917] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
          title="Petik Senar Satu per Satu"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Petik</span>
        </button>
      </div>
    </div>
  );
};
