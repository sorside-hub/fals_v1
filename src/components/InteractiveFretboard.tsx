import React, { useState } from 'react';
import { GUITAR_STRINGS, getGuitarFretNote } from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import { Volume2 } from 'lucide-react';

interface InteractiveFretboardProps {
  highlightNotes?: string[];
  rootNote?: string;
  onNoteClick?: (note: string, fret: number, stringNum: number) => void;
  title?: string;
  subTitle?: string;
  fretRange?: [number, number];
  maxFret?: number;
  isolateRange?: boolean;
  showStrumButton?: boolean;
  patternPositions?: { stringNum: number; fret: number; note?: string }[];
  orientation?: 'vertical' | 'horizontal';
}

export const InteractiveFretboard: React.FC<InteractiveFretboardProps> = ({
  highlightNotes = [],
  rootNote = 'C',
  onNoteClick,
  title,
  subTitle,
  fretRange,
  maxFret = 15,
  isolateRange = false,
  showStrumButton = true,
  patternPositions,
  orientation = 'vertical',
}) => {
  const frets = Array.from({ length: maxFret + 1 }, (_, i) => i);
  const [activeFretPos, setActiveFretPos] = useState<string | null>(null);

  const isInRange = (fret: number) => {
    if (!fretRange) return true;
    return fret >= fretRange[0] && fret <= fretRange[1];
  };

  const isPatternActive = (stringNum: number, fret: number) => {
    if (!patternPositions) return true;
    return patternPositions.some(p => p.stringNum === stringNum && p.fret === fret);
  };

  const isHighlighted = (note: string) => {
    return highlightNotes.some(n => n.toUpperCase() === note.toUpperCase());
  };

  const isRoot = (note: string) => {
    return rootNote && rootNote.toUpperCase() === note.toUpperCase();
  };

  const handleFretClick = (openNote: string, openOctave: number, fret: number, stringNum: number) => {
    const { note, octaveDiff } = getGuitarFretNote(openNote, fret);
    const finalOctave = openOctave + octaveDiff;
    const posId = `${stringNum}-${fret}`;

    setActiveFretPos(posId);
    sound.playGuitarNote(note, finalOctave);

    if (onNoteClick) {
      onNoteClick(note, fret, stringNum);
    }

    setTimeout(() => {
      setActiveFretPos(null);
    }, 200);
  };

  // Strum all 6 open strings
  const handleStrumOpen = () => {
    GUITAR_STRINGS.forEach((str, idx) => {
      sound.playGuitarNote(str.openNote, str.openOctave, 2.0, idx * 0.04);
    });
  };

  // In vertical fullscreen mode, remove outer double wrapper, stretch width, and place fret markers in the wood between strings
  if (orientation === 'vertical') {
    return (
      <div className="w-full flex justify-center items-center py-1 select-none">
        <div className="w-full max-w-lg sm:max-w-xl bg-[#FAF9F5] border border-[#E2DFD7] rounded-2xl p-2.5 sm:p-3 pt-2 shadow-2xl">
          {/* Header Nut Row - Dark rounded boxes for open notes: Senar 6 (E), 5 (A), 4 (D), 3 (G), 2 (B), 1 (E) */}
          <div className="grid grid-cols-[repeat(6,1fr)_48px] text-center text-xs font-mono font-bold text-[#1C1917] pb-2 border-b-2 border-[#1C1917]">
            {[...GUITAR_STRINGS].reverse().map((guitarString) => {
              const { note } = getGuitarFretNote(guitarString.openNote, 0);
              return (
                <div key={guitarString.stringNumber} className="flex justify-center items-center">
                  <button
                    onClick={() => handleFretClick(guitarString.openNote, guitarString.openOctave, 0, guitarString.stringNumber)}
                    className="w-8 h-8 rounded-lg bg-[#44403C] hover:bg-[#1C1917] text-[#FAF9F5] flex items-center justify-center text-xs font-black shadow-2xs transition cursor-pointer"
                    title={`Senar ${guitarString.stringNumber} (Open ${guitarString.openNote})`}
                  >
                    <span className="rotate-90 inline-block">{note}</span>
                  </button>
                </div>
              );
            })}
            <span className="text-[11px] text-[#78716C] self-center font-bold font-mono"><span className="rotate-90 inline-block">Nut</span></span>
          </div>

          {/* Fret rows (1 to maxFret) with Strings 6 to 1 left-to-right */}
          <div className="relative mt-1 space-y-0">
            {frets.slice(1).map((fret) => {
              const isMarker = fret === 3 || fret === 5 || fret === 7 || fret === 9 || fret === 15;
              const isOctaveMarker = fret === 12;
              const inRange = isInRange(fret);

              return (
                <div
                  key={fret}
                  className={`grid grid-cols-[repeat(6,1fr)_48px] h-10 sm:h-11 items-center relative border-b border-[#D6D3D1] ${
                    isolateRange && inRange ? 'bg-[#F5F4EE]/50' : ''
                  }`}
                >
                  {/* Fret marker dot on the fretboard wood between strings 4 and 3 (identical to horizontal concept) */}
                  {isMarker && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#B8B5AA] pointer-events-none z-0"
                      style={{ left: 'calc((100% - 48px) / 2)' }}
                    />
                  )}
                  {isOctaveMarker && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-1 items-center justify-center pointer-events-none z-0"
                      style={{ left: 'calc((100% - 48px) / 2)' }}
                    >
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B8B5AA]" />
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B8B5AA]" />
                    </div>
                  )}

                  {/* 6 String columns (Senar 6 to Senar 1) */}
                  {[...GUITAR_STRINGS].reverse().map((guitarString) => {
                    const { note, octaveDiff } = getGuitarFretNote(guitarString.openNote, fret);
                    const highlighted = isHighlighted(note);
                    const root = isRoot(note);
                    const isPressed = activeFretPos === `${guitarString.stringNumber}-${fret}`;

                    const showFret = patternPositions
                      ? isPatternActive(guitarString.stringNumber, fret)
                      : isolateRange
                      ? inRange
                      : true;

                    const thickness = 1 + (guitarString.stringNumber - 1) * 0.5;

                    return (
                      <div
                        key={guitarString.stringNumber}
                        className="relative h-full flex items-center justify-center"
                      >
                        {/* Vertical metal string line */}
                        <div
                          className="absolute top-0 bottom-0 bg-[#A8A29E]/60 pointer-events-none"
                          style={{ width: `${thickness}px`, left: '50%', transform: 'translateX(-50%)' }}
                        />

                        {!showFret ? null : (
                          <button
                            onClick={() => handleFretClick(guitarString.openNote, guitarString.openOctave, fret, guitarString.stringNumber)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-xs transition-all cursor-pointer z-10 ${
                              isPressed
                                ? 'scale-90 bg-[#D6D3D1]'
                                : highlighted
                                ? inRange
                                  ? root
                                    ? 'bg-[#1C1917] text-[#FAF9F5] shadow-xs ring-2 ring-[#1C1917] font-extrabold'
                                    : 'bg-[#EAE8DF] text-[#1C1917] border border-[#78716C] font-bold'
                                  : 'bg-[#FAF9F5] text-[#78716C] border border-[#E5E4DE] opacity-35'
                                : 'opacity-0 hover:opacity-100 bg-[#FFFFFF] border border-[#E5E4DE] text-[#78716C]'
                            }`}
                            title={`Senar ${guitarString.stringNumber}, Fret ${fret}: Nada ${note} (Oktav ${guitarString.openOctave + octaveDiff})`}
                          >
                            <span className="rotate-90 inline-block">{note}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Fret label column (Right edge for facing-left design) - Clean number only */}
                  <div className="flex items-center justify-center font-mono text-xs text-[#78716C] font-semibold pl-1">
                    <span className="rotate-90 inline-block">{fret}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl p-3 sm:p-4 shadow-2xs">
      {/* Horizontal Fretboard (Nut at Left, Frets 1..15 Left to Right) */}
        <div
          className="w-full overflow-x-auto pb-1 scrollbar-thin select-none overscroll-x-contain touch-pan-x touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="inline-block min-w-[700px] sm:min-w-full bg-[#FAF9F5] border border-[#E2DFD7] rounded-lg p-2">
            {/* Fret numbers header */}
            <div
              className="grid text-center text-[10px] font-mono text-[#78716C] pb-1 border-b border-[#E5E4DE]"
              style={{ gridTemplateColumns: `50px repeat(${maxFret}, 1fr)` }}
            >
              <span className={isolateRange && isInRange(0) ? 'font-bold text-[#1C1917] bg-[#EAE8DF] rounded' : ''}>
                Nut (0)
              </span>
              {frets.slice(1).map(f => {
                const inRange = isInRange(f);
                const isMarker = f === 3 || f === 5 || f === 7 || f === 9 || f === 12 || f === 15;
                return (
                  <span
                    key={f}
                    className={`py-0.5 ${
                      isolateRange && inRange
                        ? 'font-bold text-[#1C1917] bg-[#EAE8DF] rounded-xs'
                        : isMarker
                        ? 'font-bold text-[#1C1917]'
                        : ''
                    }`}
                  >
                    {f}
                  </span>
                );
              })}
            </div>

            {/* Strings 1 to 6 */}
            <div className="relative mt-1">
              {GUITAR_STRINGS.map((guitarString) => {
                const thickness = 1 + (guitarString.stringNumber - 1) * 0.5;

                return (
                  <div
                    key={guitarString.stringNumber}
                    className="grid h-8 sm:h-9 items-center relative group border-b border-[#F5F4EE] last:border-b-0"
                    style={{ gridTemplateColumns: `50px repeat(${maxFret}, 1fr)` }}
                  >
                    <div
                      className="absolute left-[50px] right-0 bg-[#A8A29E]/60 pointer-events-none"
                      style={{ height: `${thickness}px`, top: '50%', transform: 'translateY(-50%)' }}
                    />

                    {/* Nut note (Fret 0) */}
                    {(() => {
                      const { note } = getGuitarFretNote(guitarString.openNote, 0);
                      const highlighted = isHighlighted(note);
                      const root = isRoot(note);
                      const inRange = isInRange(0);
                      const isPressed = activeFretPos === `${guitarString.stringNumber}-0`;

                      const showNut = patternPositions
                        ? isPatternActive(guitarString.stringNumber, 0)
                        : isolateRange
                        ? inRange
                        : true;

                      if (!showNut && (patternPositions || isolateRange)) {
                        return (
                          <div className="h-7 w-9 mx-auto flex items-center justify-center font-mono text-[10px] text-[#A8A29E]/40 z-10">
                            -
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={() => handleFretClick(guitarString.openNote, guitarString.openOctave, 0, guitarString.stringNumber)}
                          className={`h-7 w-9 mx-auto rounded flex items-center justify-center font-mono text-[11px] font-medium border transition-transform cursor-pointer z-10 ${
                            isPressed
                              ? 'scale-90 bg-[#D6D3D1]'
                              : highlighted
                              ? inRange
                                ? root
                                  ? 'bg-[#1C1917] text-[#FAF9F5] border-[#1C1917] font-bold shadow-xs'
                                  : 'bg-[#44403C] text-[#FAF9F5] border-[#44403C]'
                                : 'bg-[#F5F4EE] text-[#78716C] border-[#E5E4DE] opacity-35'
                              : 'bg-[#F5F4EE] text-[#57534E] border-[#E5E4DE] hover:bg-[#EAE8DF]'
                          }`}
                        >
                          {note}
                        </button>
                      );
                    })()}

                    {/* Frets 1 to maxFret */}
                    {frets.slice(1).map(fret => {
                      const { note, octaveDiff } = getGuitarFretNote(guitarString.openNote, fret);
                      const highlighted = isHighlighted(note);
                      const root = isRoot(note);
                      const inRange = isInRange(fret);
                      const isPressed = activeFretPos === `${guitarString.stringNumber}-${fret}`;

                      const showFret = patternPositions
                        ? isPatternActive(guitarString.stringNumber, fret)
                        : isolateRange
                        ? inRange
                        : true;

                      return (
                        <div
                          key={fret}
                          className={`relative h-full flex items-center justify-center border-r border-[#E2DFD7] last:border-r-0 ${
                            isolateRange && inRange ? 'bg-[#F5F4EE]/50' : ''
                          }`}
                        >
                          {guitarString.stringNumber === 3 && (fret === 3 || fret === 5 || fret === 7 || fret === 9 || fret === 15) && (
                            <div className="absolute top-full -translate-y-1/2 w-2 h-2 rounded-full bg-[#B8B5AA] pointer-events-none z-0" />
                          )}
                          {guitarString.stringNumber === 3 && fret === 12 && (
                            <div className="absolute top-full -translate-y-1/2 flex gap-1 items-center justify-center pointer-events-none z-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B8B5AA]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B8B5AA]" />
                            </div>
                          )}

                          {!showFret ? null : (
                            <button
                              onClick={() => handleFretClick(guitarString.openNote, guitarString.openOctave, fret, guitarString.stringNumber)}
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-mono text-[10px] transition-all cursor-pointer z-10 ${
                                isPressed
                                  ? 'scale-90 bg-[#D6D3D1]'
                                  : highlighted
                                  ? inRange
                                    ? root
                                      ? 'bg-[#1C1917] text-[#FAF9F5] shadow-xs ring-2 ring-[#1C1917] font-bold'
                                      : 'bg-[#EAE8DF] text-[#1C1917] border border-[#A8A29E] font-medium'
                                    : 'bg-[#FAF9F5] text-[#78716C] border border-[#E5E4DE] opacity-35'
                                  : 'opacity-0 group-hover:opacity-40 hover:opacity-100 bg-[#FFFFFF] border border-[#E5E4DE] text-[#78716C]'
                              }`}
                              title={`Senar ${guitarString.stringNumber}, Fret ${fret}: Nada ${note} (Oktav ${guitarString.openOctave + octaveDiff})`}
                            >
                              {note}
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
        </div>

      {/* Action button at bottom */}
      {showStrumButton && (
        <div className="mt-3 pt-2.5 border-t border-[#F0EFEA] flex justify-center">
          <button
            onClick={handleStrumOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl text-[#1C1917] font-semibold transition cursor-pointer text-xs shadow-2xs"
            title="Strum senar gitar"
          >
            <Volume2 className="w-4 h-4 text-[#1C1917]" />
            <span>Genjreng Senar</span>
          </button>
        </div>
      )}
    </div>
  );
};
