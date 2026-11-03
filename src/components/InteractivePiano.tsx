import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../utils/audioEngine';
import { Volume2, Music } from 'lucide-react';

interface InteractivePianoProps {
  highlightNotes?: string[]; // Note names to highlight, e.g. ['C', 'E', 'G']
  rootNote?: string;
  onNoteClick?: (note: string, octave: number) => void;
  title?: string;
  subtitle?: string;
  orientation?: 'vertical' | 'horizontal';
  octaveBase?: number;
}

interface ActiveTouch {
  startY: number;
  startX: number;
  note: string;
  octave: number;
  isScrolling: boolean;
  started: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

export const InteractivePiano: React.FC<InteractivePianoProps> = ({
  highlightNotes = [],
  rootNote = 'C',
  onNoteClick,
  title,
  subtitle,
  orientation = 'horizontal',
  octaveBase: externalOctaveBase,
}) => {
  const [internalOctaveBase, setInternalOctaveBase] = useState<number>(4);
  const octaveBase = externalOctaveBase ?? internalOctaveBase;
  const setOctaveBase = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setInternalOctaveBase(val(octaveBase));
    } else {
      setInternalOctaveBase(val);
    }
  };

  // Support multiple simultaneous active keys (chords & multi-touch)
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Track touches to distinguish intentional taps/chords from horizontal & vertical scrolling
  const touchesRef = useRef<Map<number, ActiveTouch>>(new Map());
  const lastPlayedRef = useRef<Map<string, number>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isContainerScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate 2 octaves of keys
  const octaves = [octaveBase, octaveBase + 1];

  const handleNoteStart = useCallback((note: string, octave: number) => {
    const keyId = `${note}${octave}`;
    const now = Date.now();
    const lastTime = lastPlayedRef.current.get(keyId) || 0;
    // Prevent double triggering from touch + synthetic mouse events within 90ms
    if (now - lastTime < 90) {
      return;
    }
    lastPlayedRef.current.set(keyId, now);

    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(keyId);
      return next;
    });

    sound.playPianoNote(note, octave, 1.8);

    if (onNoteClick) {
      onNoteClick(note, octave);
    }

    // Safety timeout in case release is skipped
    setTimeout(() => {
      setActiveKeys(prev => {
        if (!prev.has(keyId)) return prev;
        const next = new Set(prev);
        next.delete(keyId);
        return next;
      });
    }, 450);
  }, [onNoteClick]);

  const handleNoteEnd = useCallback((note: string, octave: number) => {
    const keyId = `${note}${octave}`;
    setActiveKeys(prev => {
      if (!prev.has(keyId)) return prev;
      const next = new Set(prev);
      next.delete(keyId);
      return next;
    });
  }, []);

  // Desktop keyboard listener for playing chords & single notes simultaneously
  useEffect(() => {
    const keyMap: Record<string, { note: string; octOffset: number }> = {
      // Lower octave
      'a': { note: 'C', octOffset: 0 },
      'w': { note: 'C#', octOffset: 0 },
      's': { note: 'D', octOffset: 0 },
      'e': { note: 'D#', octOffset: 0 },
      'd': { note: 'E', octOffset: 0 },
      'f': { note: 'F', octOffset: 0 },
      't': { note: 'F#', octOffset: 0 },
      'g': { note: 'G', octOffset: 0 },
      'y': { note: 'G#', octOffset: 0 },
      'h': { note: 'A', octOffset: 0 },
      'u': { note: 'A#', octOffset: 0 },
      'j': { note: 'B', octOffset: 0 },
      // Upper octave
      'k': { note: 'C', octOffset: 1 },
      'o': { note: 'C#', octOffset: 1 },
      'l': { note: 'D', octOffset: 1 },
      'p': { note: 'D#', octOffset: 1 },
      ';': { note: 'E', octOffset: 1 },
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.repeat) return;
      const mapping = keyMap[e.key.toLowerCase()];
      if (mapping) {
        handleNoteStart(mapping.note, octaveBase + mapping.octOffset);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const mapping = keyMap[e.key.toLowerCase()];
      if (mapping) {
        handleNoteEnd(mapping.note, octaveBase + mapping.octOffset);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [octaveBase, handleNoteStart, handleNoteEnd]);

  // Handle active container scrolling - suppresses all sounds while scrolling
  const handleContainerScroll = () => {
    isContainerScrollingRef.current = true;
    touchesRef.current.forEach((info) => {
      info.isScrolling = true;
      if (info.timer) {
        clearTimeout(info.timer);
        info.timer = null;
      }
      if (info.started) {
        handleNoteEnd(info.note, info.octave);
        info.started = false;
      }
    });

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = setTimeout(() => {
      isContainerScrollingRef.current = false;
    }, 140);
  };

  // Touch gesture handlers for mobile: allows smooth horizontal & vertical scrolling without triggering unwanted piano sounds
  const handleTouchStart = (e: React.TouchEvent, note: string, octave: number) => {
    if (isContainerScrollingRef.current) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchId = touch.identifier;

      const info: ActiveTouch = {
        startX: touch.clientX,
        startY: touch.clientY,
        note,
        octave,
        isScrolling: false,
        started: false,
        timer: setTimeout(() => {
          // If finger hasn't moved beyond threshold within 95ms, it's a deliberate key press/hold
          if (!info.isScrolling && !isContainerScrollingRef.current) {
            info.started = true;
            handleNoteStart(note, octave);
          }
        }, 95),
      };

      touchesRef.current.set(touchId, info);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const info = touchesRef.current.get(touch.identifier);
      if (info) {
        const dy = Math.abs(touch.clientY - info.startY);
        const dx = Math.abs(touch.clientX - info.startX);
        // If finger moves more than 4px in any direction, user is scrolling or swiping!
        if (dy > 4 || dx > 4) {
          info.isScrolling = true;
          if (info.timer) {
            clearTimeout(info.timer);
            info.timer = null;
          }
          if (info.started) {
            handleNoteEnd(info.note, info.octave);
            info.started = false;
          }
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const info = touchesRef.current.get(touch.identifier);
      if (info) {
        if (info.timer) {
          clearTimeout(info.timer);
          info.timer = null;
        }
        if (!info.isScrolling && !isContainerScrollingRef.current) {
          if (!info.started) {
            // Quick deliberate tap without moving: trigger note cleanly with pleasant sustain
            handleNoteStart(info.note, info.octave);
            setTimeout(() => {
              handleNoteEnd(info.note, info.octave);
            }, 250);
          } else {
            // Held note released
            handleNoteEnd(info.note, info.octave);
          }
        }
        touchesRef.current.delete(touch.identifier);
      }
    }
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const info = touchesRef.current.get(touch.identifier);
      if (info) {
        if (info.timer) clearTimeout(info.timer);
        if (info.started) {
          handleNoteEnd(info.note, info.octave);
        }
        touchesRef.current.delete(touch.identifier);
      }
    }
  };

  const getKeyMouseProps = (note: string, octave: number) => ({
    onMouseDown: (e: React.MouseEvent) => {
      if (e.button === 0) {
        handleNoteStart(note, octave);
      }
    },
    onMouseUp: () => handleNoteEnd(note, octave),
    onMouseLeave: () => handleNoteEnd(note, octave),
  });

  const getKeyTouchProps = (note: string, octave: number) => ({
    onTouchStart: (e: React.TouchEvent) => handleTouchStart(e, note, octave),
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  });

  const isHighlighted = (note: string) => {
    return highlightNotes.some(n => n.toUpperCase() === note.toUpperCase());
  };

  const isRoot = (note: string) => {
    return rootNote && rootNote.toUpperCase() === note.toUpperCase();
  };

  // Play all highlighted notes as an arpeggiated chord
  const handlePlayArpeggio = () => {
    if (highlightNotes.length === 0) return;
    highlightNotes.forEach((note, idx) => {
      sound.playPianoNote(note, octaveBase, 1.8, idx * 0.12);
    });
  };

  // Play all highlighted notes simultaneously as a full chord
  const handlePlayChord = () => {
    if (highlightNotes.length === 0) return;
    highlightNotes.forEach((note, idx) => {
      sound.playPianoNote(note, octaveBase, 2.2, idx * 0.012);
    });
  };

  // Precise mathematical position percentage of black keys on 7 white keys (horizontal)
  const BLACK_KEYS_HORIZONTAL = [
    { note: 'C#', left: `${(1 / 7) * 100}%` }, // 14.2857%
    { note: 'D#', left: `${(2 / 7) * 100}%` }, // 28.5714%
    { note: 'F#', left: `${(4 / 7) * 100}%` }, // 57.1428%
    { note: 'G#', left: `${(5 / 7) * 100}%` }, // 71.4285%
    { note: 'A#', left: `${(6 / 7) * 100}%` }, // 85.7142%
  ];

  // Vertical position percentage of black keys on 7 white keys (top-to-bottom)
  const BLACK_KEYS_VERTICAL = [
    { note: 'C#', top: `${(1 / 7) * 100}%` },
    { note: 'D#', top: `${(2 / 7) * 100}%` },
    { note: 'F#', top: `${(4 / 7) * 100}%` },
    { note: 'G#', top: `${(5 / 7) * 100}%` },
    { note: 'A#', top: `${(6 / 7) * 100}%` },
  ];

  // In vertical fullscreen mode, remove the outer white card wrapper so the piano directly expands on the dark modal background
  if (orientation === 'vertical') {
    return (
      <div className="w-full flex justify-center items-center py-1 select-none">
        <div className="relative inline-block w-full max-w-sm sm:max-w-md bg-[#1C1917] p-2.5 pr-4 rounded-2xl border border-[#292524] shadow-2xl">
          {/* Piano Right Felt Strip (Top in landscape) */}
          <div className="w-1.5 absolute right-2.5 top-2.5 bottom-2.5 bg-[#991B1B] rounded-r-sm opacity-90 shadow-inner z-20 pointer-events-none" />

          {/* Octaves Container Stacked Vertically */}
          <div className="flex flex-col gap-2 w-full">
            {octaves.map(octave => (
              <div key={octave} className="relative w-full h-[310px] sm:h-[350px]">
                {/* Subtle octave indicator */}
                <div className="absolute right-4 top-1.5 z-20 pointer-events-none text-[9px] font-mono text-[#78716C]">
                  <span className="rotate-90 inline-block font-bold">Okt {octave}</span>
                </div>

                {/* 7 White keys (C, D, E, F, G, A, B) */}
                <div className="flex flex-col h-full w-full">
                  {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => {
                    const keyId = `${note}${octave}`;
                    const highlighted = isHighlighted(note);
                    const root = isRoot(note);
                    const isPressed = activeKeys.has(keyId);

                    return (
                      <button
                        key={keyId}
                        {...getKeyMouseProps(note, octave)}
                        {...getKeyTouchProps(note, octave)}
                        className={`relative flex-1 w-full rounded-l-lg border-b last:border-b-0 border-[#D6D3D1] transition-all cursor-pointer flex items-center justify-between pl-3.5 pr-4 shadow-xs ${
                          isPressed
                            ? 'bg-[#D6D3D1] -translate-x-1 shadow-inner'
                            : 'bg-[#FFFFFF] hover:bg-[#FAF9F5]'
                        }`}
                        style={{ touchAction: 'pan-y' }}
                      >
                        {/* Note Label at left (Bottom in landscape) */}
                        <span
                          className={`text-[11px] font-mono transition-colors z-10 ${
                            highlighted
                              ? root
                                ? 'text-[#1C1917] font-black'
                                : 'text-[#44403C] font-bold'
                              : 'text-[#A8A29E] font-medium'
                          }`}
                        >
                          <span className="rotate-90 inline-block">
                            {note}
                            <span className="text-[9px] text-[#A8A29E] font-normal ml-0.5">{octave}</span>
                          </span>
                        </span>

                        {/* Indicator dot near right felt (Top in landscape) */}
                        {highlighted && (
                          <div className="absolute right-3.5 flex items-center justify-center z-10">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                root
                                  ? 'bg-[#1C1917] ring-2 ring-[#E5E4DE]'
                                  : 'bg-[#78716C]'
                              }`}
                            />
                          </div>
                        )}

                        {/* Active bar highlight on left edge */}
                        {highlighted && (
                          <div
                            className={`absolute left-0 top-1 bottom-1 w-1 rounded-r-sm ${
                              root ? 'bg-[#1C1917]' : 'bg-[#A8A29E]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Black keys overlay (C#, D#, F#, G#, A#) - Anchored right, 55% width, never overlaps left labels */}
                <div className="absolute top-0 bottom-0 right-0 w-[55%] pointer-events-none">
                  {BLACK_KEYS_VERTICAL.map(({ note, top }) => {
                    const keyId = `${note}${octave}`;
                    const highlighted = isHighlighted(note);
                    const root = isRoot(note);
                    const isPressed = activeKeys.has(keyId);

                    return (
                      <button
                        key={keyId}
                        {...getKeyMouseProps(note, octave)}
                        {...getKeyTouchProps(note, octave)}
                        style={{ top, touchAction: 'pan-y' }}
                        className={`pointer-events-auto absolute -translate-y-1/2 right-0 w-full h-[8.8%] rounded-l-md shadow-lg transition-all cursor-pointer flex items-center justify-between pl-2.5 pr-3 z-10 ${
                          isPressed
                            ? 'bg-[#44403C] -translate-x-1 shadow-inner'
                            : highlighted
                            ? root
                              ? 'bg-[#1C1917] ring-2 ring-[#FAF9F5]'
                              : 'bg-[#292524] ring-1 ring-[#D6D3D1]'
                            : 'bg-[#1C1917] hover:bg-[#292524]'
                        }`}
                      >
                        {/* Black key note label at left (Bottom in landscape) */}
                        <span className="text-[9px] font-mono text-[#E7E5E4] font-semibold">
                          <span className="rotate-90 inline-block">{note}</span>
                        </span>

                        {/* Black key indicator dot at right (Top in landscape) */}
                        {highlighted && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              root ? 'bg-[#FAF9F5]' : 'bg-[#D6D3D1]'
                            }`}
                          />
                        )}

                        {/* Black key active bar highlight on left edge */}
                        {highlighted && (
                          <div
                            className={`absolute left-0 top-0.5 bottom-0.5 w-0.5 rounded-r-xs ${
                              root ? 'bg-[#FAF9F5]' : 'bg-[#A8A29E]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl p-3 sm:p-4 shadow-2xs select-none">
      {/* Header Info (Rendered only if title or subtitle provided) */}
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            {title && <h3 className="font-semibold text-[#1C1917] text-sm">{title}</h3>}
            {subtitle && <p className="text-xs text-[#78716C]">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* Horizontal Piano Keyboard with Full Touch Pan Support */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        className="w-full overflow-x-auto pb-1.5 scrollbar-thin select-none overscroll-x-contain touch-pan-x touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="relative inline-block min-w-[580px] sm:min-w-full bg-[#1C1917] p-2 pt-3 rounded-xl border border-[#292524] shadow-md">
          {/* Piano Top Felt Strip */}
          <div className="h-1 absolute top-2 left-2 right-2 bg-[#991B1B] rounded-t-sm opacity-90 shadow-inner z-20 pointer-events-none" />

          {/* Octaves Container */}
          <div className="flex gap-1.5 w-full">
            {octaves.map(octave => (
              <div key={octave} className="relative flex-1 h-36 sm:h-44">
                {/* Subtle octave indicator */}
                <div className="absolute top-1.5 left-2 z-20 pointer-events-none text-[9px] font-mono font-bold text-[#78716C]">
                  Okt {octave}
                </div>

                {/* White keys (C, D, E, F, G, A, B) */}
                <div className="flex h-full w-full">
                  {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => {
                    const keyId = `${note}${octave}`;
                    const highlighted = isHighlighted(note);
                    const root = isRoot(note);
                    const isPressed = activeKeys.has(keyId);

                    return (
                      <button
                        key={keyId}
                        {...getKeyMouseProps(note, octave)}
                        {...getKeyTouchProps(note, octave)}
                        className={`relative flex-1 h-full rounded-b-lg border-r last:border-r-0 border-[#D6D3D1] transition-all cursor-pointer flex flex-col justify-end items-center pb-2.5 shadow-xs ${
                          isPressed
                            ? 'bg-[#D6D3D1] translate-y-1 shadow-inner'
                            : 'bg-[#FFFFFF] hover:bg-[#FAF9F5]'
                        }`}
                        style={{ touchAction: 'pan-x pan-y' }}
                      >
                        {/* Top indicator dot / badge for white keys */}
                        {highlighted && (
                          <div className="absolute top-2 flex flex-col items-center">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                root
                                  ? 'bg-[#1C1917] ring-2 ring-[#E5E4DE]'
                                  : 'bg-[#78716C]'
                              }`}
                            />
                          </div>
                        )}

                        {/* Note Label at bottom */}
                        <span
                          className={`text-[11px] font-mono transition-colors ${
                            highlighted
                              ? root
                                ? 'text-[#1C1917] font-black'
                                : 'text-[#44403C] font-bold'
                              : 'text-[#A8A29E] font-medium'
                          }`}
                        >
                          {note}
                          <span className="text-[9px] text-[#A8A29E] font-normal ml-0.5">{octave}</span>
                        </span>

                        {/* Bottom active bar highlight */}
                        {highlighted && (
                          <div
                            className={`absolute bottom-0 left-1 right-1 h-1 rounded-t-sm ${
                              root ? 'bg-[#1C1917]' : 'bg-[#A8A29E]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Black keys overlay (C#, D#, F#, G#, A#) */}
                <div className="absolute top-0 left-0 right-0 h-[60%] pointer-events-none flex">
                  {BLACK_KEYS_HORIZONTAL.map(({ note, left }) => {
                    const keyId = `${note}${octave}`;
                    const highlighted = isHighlighted(note);
                    const root = isRoot(note);
                    const isPressed = activeKeys.has(keyId);

                    return (
                      <button
                        key={keyId}
                        {...getKeyMouseProps(note, octave)}
                        {...getKeyTouchProps(note, octave)}
                        style={{ left, touchAction: 'pan-x pan-y' }}
                        className={`pointer-events-auto absolute -translate-x-1/2 w-[8.8%] h-full rounded-b-md shadow-lg transition-all cursor-pointer flex flex-col justify-end items-center pb-2 z-10 ${
                          isPressed
                            ? 'bg-[#44403C] translate-y-1 shadow-inner'
                            : highlighted
                            ? root
                              ? 'bg-[#1C1917] ring-2 ring-[#FAF9F5]'
                              : 'bg-[#292524] ring-1 ring-[#D6D3D1]'
                            : 'bg-[#1C1917] hover:bg-[#292524]'
                        }`}
                      >
                        {highlighted && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mb-1.5 ${
                              root ? 'bg-[#FAF9F5]' : 'bg-[#D6D3D1]'
                            }`}
                          />
                        )}
                        <span className="text-[9px] font-mono text-[#E7E5E4] font-semibold">
                          {note}
                        </span>

                        {/* Bottom highlight bar for black keys */}
                        {highlighted && (
                          <div
                            className={`absolute bottom-0 left-0.5 right-0.5 h-0.5 rounded-t-xs ${
                              root ? 'bg-[#FAF9F5]' : 'bg-[#A8A29E]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action controls below keyboard */}
      <div className="mt-3 pt-2.5 border-t border-[#F0EFEA] flex flex-wrap items-center justify-center gap-3">
        {highlightNotes.length > 0 && (
          <>
            <button
              onClick={handlePlayChord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] rounded-xl font-semibold transition cursor-pointer text-xs shadow-xs"
              title="Bunyikan semua nada terpilih serentak membentuk chord"
            >
              <Music className="w-3.5 h-3.5 text-[#FAF9F5]" />
              <span>Dengar Chord</span>
            </button>
            <button
              onClick={handlePlayArpeggio}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl text-[#1C1917] font-semibold transition cursor-pointer text-xs shadow-2xs"
              title="Bunyikan semua nada terpilih secara berurutan (Arpeggio)"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#1C1917]" />
              <span>Dengar Arpeggio</span>
            </button>
          </>
        )}

        <div className="flex items-center bg-[#F5F4EE] border border-[#E5E4DE] rounded-xl p-1 font-mono text-xs">
          <button
            onClick={() => setOctaveBase(prev => Math.max(2, prev - 1))}
            disabled={octaveBase <= 2}
            className="w-6 h-6 flex items-center justify-center font-bold text-[#44403C] hover:text-[#1C1917] disabled:opacity-30 cursor-pointer"
          >
            -
          </button>
          <span className="px-2 text-[#78716C] font-semibold text-[11px]">Oktav {octaveBase}</span>
          <button
            onClick={() => setOctaveBase(prev => Math.min(5, prev + 1))}
            disabled={octaveBase >= 5}
            className="w-6 h-6 flex items-center justify-center font-bold text-[#44403C] hover:text-[#1C1917] disabled:opacity-30 cursor-pointer"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
