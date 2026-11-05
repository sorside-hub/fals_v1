import React, { useState } from 'react';
import { ScaleType } from '../../data/scaleData';
import {
  ScaleNotePosition,
  getScaleFretboardPositions,
  getScalePositionFretRange,
} from '../../utils/scaleCalculations';
import { Volume2, Maximize2, Layers, X, RotateCcw } from 'lucide-react';
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
  // Mode: 'box' (Vertical Posisi) vs 'full' (Horizontal Full Neck Fullscreen Modal)
  const [viewMode, setViewMode] = useState<'box' | 'full'>('box');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Display label mode: 'note' (C, D, E) vs 'degree' (R, b3, 5)
  const [displayLabelMode, setDisplayLabelMode] = useState<'note' | 'degree'>('note');
  // Selected CAGED Position (0 to 4 -> Posisi 1 to 5)
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [activeNoteKey, setActiveNoteKey] = useState<string | null>(null);

  // Position Fret Range for Box View
  const [boxMinFret, boxMaxFret] = getScalePositionFretRange(rootNote, selectedPosition);

  // Get active note positions for Box View (4-5 frets)
  const boxPositions: ScaleNotePosition[] = getScaleFretboardPositions(
    rootNote,
    selectedScale.intervals,
    selectedScale.characteristicSemitones || [],
    boxMinFret,
    boxMaxFret
  );

  // Get active note positions for Full Neck View (0-15 frets)
  const fullPositions: ScaleNotePosition[] = getScaleFretboardPositions(
    rootNote,
    selectedScale.intervals,
    selectedScale.characteristicSemitones || [],
    0,
    15
  );

  // Sound handler for single note pluck
  const handlePlayNote = (pos: ScaleNotePosition) => {
    setActiveNoteKey(`${pos.stringNum}-${pos.fret}`);
    sound.playGuitarNote(pos.note, pos.octave);
    setTimeout(() => setActiveNoteKey(null), 250);
  };

  // Sound handler for play scale sequence ascending
  const handlePlayScaleSequence = (targetPositions: ScaleNotePosition[]) => {
    // Sort notes from lowest string & fret to highest string & fret
    const sorted = [...targetPositions].sort((a, b) => {
      if (a.stringNum !== b.stringNum) {
        return b.stringNum - a.stringNum; // string 6 up to 1
      }
      return a.fret - b.fret; // lower fret to higher fret
    });

    sorted.forEach((pos, idx) => {
      setTimeout(() => {
        handlePlayNote(pos);
      }, idx * 200);
    });
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

  return (
    <>
      {/* NORMAL CARD CONTAINER (Standard Page Flow) */}
      <div className="w-full bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Header: Title, Formula & View Mode Toggles */}
        <div className="space-y-3 border-b border-[#F0EFEA] pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Identity Badge + Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 bg-[#1C1917] text-[#FAF9F5] rounded-xl font-mono font-black text-sm sm:text-base shadow-xs shrink-0">
                {rootNote} {selectedScale.name}
              </span>
            </div>

            {/* Controls: View Mode & Display Label Mode */}
            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
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
                  title="Tampilan Posisi Box Vertikal"
                >
                  <Layers className="w-3 h-3" />
                  <span>Box</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(true)}
                  className="px-2.5 py-1 rounded-lg flex items-center gap-1 text-[#D97706] hover:bg-[#FFFBEB] font-extrabold transition cursor-pointer"
                  title="Buka Mode Full Neck Rotasi Layar Penuh"
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

          {/* Position Selectors (Posisi 1 - 5) */}
          <div className="flex items-center justify-center gap-1 pt-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-[#78716C] uppercase mr-1">
              Posisi:
            </span>
            {[0, 1, 2, 3, 4].map((posIdx) => (
              <button
                key={posIdx}
                type="button"
                onClick={() => setSelectedPosition(posIdx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
                  selectedPosition === posIdx
                    ? 'bg-[#1C1917] text-[#FAF9F5]'
                    : 'bg-[#FAF9F5] hover:bg-[#F5F4EE] text-[#1C1917] border border-[#E5E4DE]'
                }`}
              >
                Posisi {posIdx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* VERTICAL BOX DIAGRAM VIEW */}
        <div className="flex flex-col items-center justify-center py-1 select-none">
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

              // Color distinctions:
              // Root note: Solid Black (#1C1917)
              // Blue note: Vibrant Amber (#D97706)
              // Normal note: Soft Light Cream (#FAF9F5) with dark text & gray border
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
                      className={`text-[8px] font-mono font-black pointer-events-none fill-[${textColor}]`}
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

        {/* Legend & Audio Control Footer */}
        <div className="pt-2 border-t border-[#F0EFEA] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* High Contrast Color Legend */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#78716C]">
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

          {/* Play Scale Audio Button */}
          <button
            type="button"
            onClick={() => handlePlayScaleSequence(boxPositions)}
            className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Bunyikan Urutan Skala Naik"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Bunyikan Skala</span>
          </button>
        </div>
      </div>

      {/* FULLSCREEN LANDSCAPE FULL NECK MODAL OVERLAY */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/95 backdrop-blur-md flex flex-col p-3 sm:p-5 select-none animate-fade-in text-[#FAF9F5]">
          {/* Top Bar: Controls & Close Button */}
          <div className="flex items-center justify-between border-b border-[#44403C] pb-3 shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 bg-[#FAF9F5] text-[#1C1917] rounded-xl font-mono font-black text-xs sm:text-sm shrink-0">
                {rootNote} {selectedScale.name}
              </span>
              <span className="text-[11px] font-mono text-[#D6D3D1] truncate hidden sm:inline">
                {selectedScale.formulaNames}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Display Label Mode Switcher */}
              <div className="flex items-center bg-[#292524] border border-[#44403C] p-0.5 rounded-xl text-[10.5px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setDisplayLabelMode('note')}
                  className={`px-2 py-1 rounded-lg transition ${
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
                  className={`px-2 py-1 rounded-lg transition ${
                    displayLabelMode === 'degree'
                      ? 'bg-[#FAF9F5] text-[#1C1917]'
                      : 'text-[#A8A29E] hover:text-[#FAF9F5]'
                  }`}
                >
                  Rumus
                </button>
              </div>

              {/* Strum Scale Audio Button */}
              <button
                type="button"
                onClick={() => handlePlayScaleSequence(fullPositions)}
                className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-[#FAF9F5] rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                title="Bunyikan Urutan Skala Naik"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Bunyikan</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#292524] hover:bg-[#44403C] flex items-center justify-center text-[#FAF9F5] border border-[#57534E] transition active:scale-95 cursor-pointer"
                title="Tutup Mode Full Neck"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hint Bar for Mobile Landscape Rotation */}
          <div className="py-1 text-center text-[10.5px] font-mono text-[#A8A29E] flex items-center justify-center gap-1.5 shrink-0">
            <RotateCcw className="w-3 h-3" />
            <span>Tips: Miringkan HP (Mode Landscape) untuk tampilan peta nada Full Neck yang maksimal!</span>
          </div>

          {/* Full Neck Horizontal SVG Canvas (Scrollable) */}
          <div className="flex-1 overflow-x-auto overflow-y-auto flex items-center justify-start p-2">
            <div className="min-w-[840px] w-full p-4 bg-[#292524] border border-[#44403C] rounded-2xl flex items-center justify-center shadow-2xl">
              <svg
                viewBox="0 0 820 180"
                className="w-full h-auto overflow-visible"
              >
                {/* Nut Line at Fret 0 */}
                <rect x="40" y="25" width="5" height="120" fill="#FAF9F5" rx="1.5" />

                {/* 6 Horizontal Strings (String 1 on top, String 6 on bottom) */}
                {[1, 2, 3, 4, 5, 6].map((strNum) => {
                  const sy = 25 + (strNum - 1) * 24;
                  const strokeW = strNum >= 5 ? 2.5 : strNum >= 3 ? 1.8 : 1.2;

                  return (
                    <g key={`fn-str-${strNum}`}>
                      <line
                        x1="40"
                        y1={sy}
                        x2="800"
                        y2={sy}
                        stroke="#A8A29E"
                        strokeWidth={strokeW}
                      />
                      <text
                        x="20"
                        y={sy + 3.5}
                        textAnchor="middle"
                        className="text-[11px] font-mono font-black fill-[#D6D3D1]"
                      >
                        {strNum}
                      </text>
                    </g>
                  );
                })}

                {/* 15 Vertical Frets */}
                {Array.from({ length: 15 }).map((_, fIdx) => {
                  const fx = 40 + (fIdx + 1) * 50;
                  const fretNum = fIdx + 1;
                  const isSingleMarker = [3, 5, 7, 9, 15].includes(fretNum);
                  const isDoubleMarker = fretNum === 12;

                  return (
                    <g key={`fn-fret-${fretNum}`}>
                      <line
                        x1={fx}
                        y1="25"
                        x2={fx}
                        y2="145"
                        stroke="#57534E"
                        strokeWidth="1.5"
                      />
                      <text
                        x={fx - 25}
                        y="162"
                        textAnchor="middle"
                        className="text-[10.5px] font-mono font-bold fill-[#A8A29E]"
                      >
                        {fretNum}
                      </text>

                      {/* Inlay Dots */}
                      {isSingleMarker && (
                        <circle cx={fx - 25} cy="85" r="4" fill="#A8A29E" opacity="0.4" />
                      )}
                      {isDoubleMarker && (
                        <>
                          <circle cx={fx - 25} cy="60" r="4" fill="#A8A29E" opacity="0.4" />
                          <circle cx={fx - 25} cy="110" r="4" fill="#A8A29E" opacity="0.4" />
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Active Note Badges */}
                {fullPositions.map((pos) => {
                  const sy = 25 + (pos.stringNum - 1) * 24;
                  const fx = pos.fret === 0 ? 20 : 40 + pos.fret * 50 - 25;
                  const isPlaying = activeNoteKey === `${pos.stringNum}-${pos.fret}`;
                  const label = displayLabelMode === 'note' ? pos.note : pos.degree;

                  const fill = isPlaying
                    ? '#D97706'
                    : pos.role === 'root'
                    ? '#FAF9F5'
                    : pos.role === 'characteristic'
                    ? '#D97706'
                    : '#44403C';

                  const stroke = isPlaying
                    ? '#D97706'
                    : pos.role === 'root'
                    ? '#FAF9F5'
                    : pos.role === 'characteristic'
                    ? '#D97706'
                    : '#78716C';

                  const textColor =
                    pos.role === 'root'
                      ? '#1C1917'
                      : isPlaying || pos.role === 'characteristic'
                      ? '#FAF9F5'
                      : '#FAF9F5';

                  return (
                    <g
                      key={`fn-note-${pos.stringNum}-${pos.fret}`}
                      className="cursor-pointer active:scale-95 transition-transform"
                      onClick={() => handlePlayNote(pos)}
                    >
                      <circle
                        cx={fx}
                        cy={sy}
                        r={8.5}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="1.6"
                      />
                      <text
                        x={fx}
                        y={sy + 3}
                        textAnchor="middle"
                        className="text-[8px] font-mono font-black pointer-events-none"
                        fill={textColor}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
