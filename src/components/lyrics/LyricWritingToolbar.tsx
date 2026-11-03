import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Volume2, Check, Plus, X, Undo2, Redo2 } from 'lucide-react';
import { sound } from '../../utils/audioEngine';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';

export interface ChordOption {
  name: string;
  intervals: number[];
}

export interface SectionOption {
  key: string;
  name: string;
  nextNumber?: number;
  label: string;
}

export function getSectionOptions(text: string = ''): SectionOption[] {
  const definitions = [
    { key: 'verse', name: 'Verse', numbered: true },
    { key: 'pre-chorus', name: 'Pre-Chorus', numbered: false },
    { key: 'chorus', name: 'Chorus', numbered: true },
    { key: 'bridge', name: 'Bridge', numbered: false },
    { key: 'hook', name: 'Hook', numbered: false },
    { key: 'intro', name: 'Intro', numbered: false },
    { key: 'outro', name: 'Outro', numbered: false },
  ];

  return definitions.map(({ key, name, numbered }) => {
    // Regex to match existing tags in text
    const escaped = name.replace('-', '\\-');
    const regex = new RegExp(`\\[${escaped}(?:\\s*(\\d+))?\\]`, 'gi');
    const matches = Array.from(text.matchAll(regex));

    if (matches.length === 0) {
      if (numbered) {
        return {
          key,
          name,
          nextNumber: 1,
          label: `${name} 1`,
        };
      }
      return {
        key,
        name,
        label: name,
      };
    }

    let maxNum = 0;
    for (const m of matches) {
      if (m[1]) {
        const parsed = parseInt(m[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
      } else {
        if (maxNum === 0) maxNum = 1;
      }
    }

    const nextNum = maxNum + 1;
    return {
      key,
      name,
      nextNumber: nextNum,
      label: `${name} ${nextNum}`,
    };
  });
}

export interface LyricWritingToolbarProps {
  activeKey: string;
  editorText?: string;
  availableChords?: ChordOption[];
  onInsertSection: (sectionName: string) => void;
  onInsertChord: (chordName: string) => void;
  onPlayChord?: (key: string, intervals: number[]) => void;
  onOpenChordDrawer?: () => void;
  onOpenWordBank?: () => void;
  onDismissKeyboard?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  variant?: 'auto' | 'desktop' | 'mobile';
  keyboardOffset?: number;
}

export const LyricWritingToolbar: React.FC<LyricWritingToolbarProps> = ({
  activeKey,
  editorText = '',
  availableChords,
  onInsertSection,
  onInsertChord,
  onPlayChord,
  onOpenChordDrawer,
  onOpenWordBank,
  onDismissKeyboard,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  variant = 'auto',
  keyboardOffset: customKeyboardOffset,
}) => {
  const [showSectionDropdownDesktop, setShowSectionDropdownDesktop] = useState(false);
  const [showSectionDropdownMobile, setShowSectionDropdownMobile] = useState(false);
  const [showChordTrayDesktop, setShowChordTrayDesktop] = useState(false);

  const desktopSectionRef = useRef<HTMLDivElement>(null);
  const mobileSectionRef = useRef<HTMLDivElement>(null);

  const { isKeyboardVisible, keyboardOffset: detectedOffset } = useVirtualKeyboard();

  const effectiveOffset = customKeyboardOffset !== undefined ? customKeyboardOffset : detectedOffset;

  // Calculate dynamic section options with sequential numbering
  const sectionOptions = useMemo(() => {
    return getSectionOptions(editorText);
  }, [editorText]);

  // Pointer/touch tracking to distinguish scrolling vs tapping
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleItemPointerDown = (e: React.PointerEvent) => {
    // Only preventDefault on mouse so desktop click doesn't steal focus,
    // while allowing native touch scrolling gestures on mobile touch devices
    if (e.pointerType === 'mouse') {
      e.preventDefault();
    }
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handleItemPointerMove = (e: React.PointerEvent) => {
    if (pointerStartPos.current) {
      const dx = Math.abs(e.clientX - pointerStartPos.current.x);
      const dy = Math.abs(e.clientY - pointerStartPos.current.y);
      if (dx > 8 || dy > 8) {
        isDraggingRef.current = true;
      }
    }
  };

  const handleItemPointerUp = (label: string) => {
    if (!isDraggingRef.current) {
      onInsertSection(label);
      setShowSectionDropdownMobile(false);
    }
    pointerStartPos.current = null;
    isDraggingRef.current = false;
  };

  const handleItemPointerCancel = () => {
    pointerStartPos.current = null;
    isDraggingRef.current = false;
  };

  // Automatically close mobile section dropdown whenever the virtual keyboard closes
  useEffect(() => {
    if (!isKeyboardVisible) {
      setShowSectionDropdownMobile(false);
    }
  }, [isKeyboardVisible]);

  // Click outside listener to dismiss section dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (showSectionDropdownDesktop && desktopSectionRef.current && !desktopSectionRef.current.contains(target)) {
        setShowSectionDropdownDesktop(false);
      }
      if (showSectionDropdownMobile && mobileSectionRef.current && !mobileSectionRef.current.contains(target)) {
        setShowSectionDropdownMobile(false);
      }
    };

    if (showSectionDropdownDesktop || showSectionDropdownMobile) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [showSectionDropdownDesktop, showSectionDropdownMobile]);

  // Automatically compute common chords for active key if not passed
  const chords = useMemo(() => {
    if (availableChords && availableChords.length > 0) return availableChords;
    const root = activeKey || 'C';
    return [
      { name: root, intervals: [0, 4, 7] },
      { name: `${root}maj7`, intervals: [0, 4, 7, 11] },
      { name: `${root}add9`, intervals: [0, 4, 7, 14] },
      { name: `${root}sus2`, intervals: [0, 2, 7] },
      { name: `${root}sus4`, intervals: [0, 5, 7] },
    ];
  }, [activeKey, availableChords]);

  const handlePlayChordSound = (keyName: string, intervals: number[]) => {
    if (onPlayChord) {
      onPlayChord(keyName, intervals);
    } else {
      sound.playChord(keyName, intervals);
    }
  };

  // 1. Desktop Strip Component
  const renderDesktopStrip = () => (
    <div className="w-full flex flex-col border-b border-[#F0EFEA] animate-fade-in">
      <div className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Section: Undo/Redo & "+ Bagian" Dropdown */}
        <div className="flex items-center gap-2">
          {/* Pojok Kiri: Undo & Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canUndo}
              onPointerDown={(e) => {
                e.preventDefault();
                if (canUndo && onUndo) onUndo();
              }}
              className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#D6D3D1] bg-[#FFFFFF] transition shadow-2xs select-none ${
                canUndo
                  ? 'text-[#1C1917] hover:bg-[#F5F4EE] hover:border-[#1C1917] cursor-pointer'
                  : 'text-[#A8A29E] opacity-35 cursor-not-allowed'
              }`}
              title="Urungkan (Undo)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={!canRedo}
              onPointerDown={(e) => {
                e.preventDefault();
                if (canRedo && onRedo) onRedo();
              }}
              className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#D6D3D1] bg-[#FFFFFF] transition shadow-2xs select-none ${
                canRedo
                  ? 'text-[#1C1917] hover:bg-[#F5F4EE] hover:border-[#1C1917] cursor-pointer'
                  : 'text-[#A8A29E] opacity-35 cursor-not-allowed'
              }`}
              title="Ulangi (Redo)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="w-px h-4 bg-[#E5E4DE] mx-0.5 shrink-0" />

          <span className="text-[#78716C] font-mono text-[11px] shrink-0">Bagian:</span>
          
          <div ref={desktopSectionRef} className="relative">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setShowSectionDropdownDesktop((prev) => !prev);
              }}
              className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#1C1917] px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#D6D3D1] hover:bg-[#F5F4EE] hover:border-[#1C1917] transition cursor-pointer shadow-2xs select-none"
            >
              <Plus className="w-3.5 h-3.5 text-[#57534E]" />
              <span>Bagian</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-200 ${showSectionDropdownDesktop ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Desktop */}
            {showSectionDropdownDesktop && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-[#FFFFFF] border border-[#E5E4DE] rounded-lg shadow-lg py-1.5 z-50 animate-fade-in">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8A29E] px-2.5 py-1 font-semibold">
                  Sisip Bagian Lagu
                </div>
                <div className="flex flex-col gap-0.5 px-1">
                  {sectionOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        onInsertSection(opt.label);
                        setShowSectionDropdownDesktop(false);
                      }}
                      className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-mono font-medium text-[#1C1917] hover:bg-[#F5F4EE] rounded-md transition cursor-pointer text-left"
                    >
                      <span className="font-semibold">+{opt.label}</span>
                      {opt.nextNumber && opt.nextNumber > 1 && (
                        <span className="text-[10px] text-[#78716C] bg-[#F5F4EE] px-1.5 py-0.5 rounded border border-[#E5E4DE]">
                          ke-{opt.nextNumber}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Single Chord Drawer & Word Bank Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {onOpenChordDrawer && (
            <button
              type="button"
              onClick={() => {
                onDismissKeyboard?.();
                (document.activeElement as HTMLElement)?.blur?.();
                onOpenChordDrawer();
              }}
              className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#1C1917] px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#D6D3D1] hover:bg-[#F5F4EE] hover:border-[#1C1917] transition cursor-pointer shadow-2xs select-none"
              title="Buka Drawer Harmoni & Family Chord"
            >
              <Plus className="w-3.5 h-3.5 text-[#57534E]" />
              <span>Akor ({activeKey})</span>
            </button>
          )}

          {onOpenWordBank && (
            <button
              type="button"
              onClick={() => {
                onDismissKeyboard?.();
                (document.activeElement as HTMLElement)?.blur?.();
                onOpenWordBank();
              }}
              className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#1C1917] px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#D6D3D1] hover:bg-[#F5F4EE] hover:border-[#1C1917] transition cursor-pointer shadow-2xs select-none"
              title="Buka Amunisi"
            >
              <Plus className="w-3.5 h-3.5 text-[#57534E]" />
              <span>Amunisi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // 2. Mobile Floating Strip Component (docked directly above virtual keyboard)
  const renderMobileStrip = () => (
    <div
      style={{
        bottom: `${effectiveOffset}px`,
      }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#FAF9F5]/98 backdrop-blur-md border-t border-b border-[#E5E4DE] shadow-xl px-2.5 py-1.5 flex items-center justify-between gap-2 animate-fade-in"
    >
      <div className="flex items-center gap-1.5">
        {/* Pojok Kiri: Undo & Redo for Mobile */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={!canUndo}
            onPointerDown={(e) => {
              e.preventDefault();
              if (canUndo && onUndo) onUndo();
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#D6D3D1] bg-[#FFFFFF] transition shadow-2xs select-none ${
              canUndo
                ? 'text-[#1C1917] active:bg-[#EAE8DF] cursor-pointer'
                : 'text-[#A8A29E] opacity-35 cursor-not-allowed'
            }`}
            title="Urungkan (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onPointerDown={(e) => {
              e.preventDefault();
              if (canRedo && onRedo) onRedo();
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#D6D3D1] bg-[#FFFFFF] transition shadow-2xs select-none ${
              canRedo
                ? 'text-[#1C1917] active:bg-[#EAE8DF] cursor-pointer'
                : 'text-[#A8A29E] opacity-35 cursor-not-allowed'
            }`}
            title="Ulangi (Redo)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="w-px h-4 bg-[#E5E4DE] mx-0.5 shrink-0" />

        {/* Pinned Single Section Dropdown Button (Outside scroll container to avoid clipping and keep keyboard open) */}
        <div ref={mobileSectionRef} className="relative shrink-0">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setShowSectionDropdownMobile((prev) => !prev);
            }}
            className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#1C1917] px-2 py-1.5 rounded-md bg-[#FFFFFF] border border-[#D6D3D1] active:bg-[#EAE8DF] shadow-2xs shrink-0 select-none cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#57534E]" />
            <span>Bagian</span>
            <ChevronUp className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-200 ${showSectionDropdownMobile ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropup Menu Mobile: Pops UPWARDS above bottom toolbar in a 2-column grid, drag-safe */}
          {showSectionDropdownMobile && (
            <div className="absolute left-0 bottom-full mb-2 w-[290px] max-w-[calc(100vw-24px)] bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl shadow-2xl p-2 z-[100] animate-fade-in">
              <div className="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b border-[#F0EFEA]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-bold">
                  Sisip Bagian Lagu
                </span>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setShowSectionDropdownMobile(false);
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] cursor-pointer"
                  title="Tutup Menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2-Column Grid: Displays all options at once without clipping or requiring scroll */}
              <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-0.5">
                {sectionOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    tabIndex={-1}
                    onPointerDown={handleItemPointerDown}
                    onPointerMove={handleItemPointerMove}
                    onPointerUp={() => handleItemPointerUp(opt.label)}
                    onPointerCancel={handleItemPointerCancel}
                    className="flex items-center justify-between px-2.5 py-2 text-xs font-mono font-medium text-[#1C1917] bg-[#FAF9F5] hover:bg-[#F0EFEA] active:bg-[#E7E5DC] border border-[#E5E4DE] rounded-lg transition text-left cursor-pointer select-none"
                  >
                    <span className="font-semibold truncate">+{opt.label}</span>
                    {opt.nextNumber && opt.nextNumber > 1 && (
                      <span className="text-[9px] text-[#78716C] bg-[#FFFFFF] px-1 py-0.5 rounded border border-[#E5E4DE] shrink-0 ml-1">
                        #{opt.nextNumber}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Single Chord Drawer Button for Mobile */}
        {onOpenChordDrawer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSectionDropdownMobile(false);
              onDismissKeyboard?.();
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              onOpenChordDrawer();
            }}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#1C1917] px-2 py-1.5 rounded-md bg-[#FFFFFF] border border-[#D6D3D1] active:bg-[#EAE8DF] shadow-2xs shrink-0 select-none cursor-pointer"
            title="Buka Drawer Akor"
          >
            <Plus className="w-3.5 h-3.5 text-[#57534E]" />
            <span>Akor ({activeKey})</span>
          </button>
        )}

        {/* Amunisi Drawer Button for Mobile */}
        {onOpenWordBank && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSectionDropdownMobile(false);
              onDismissKeyboard?.();
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              onOpenWordBank();
            }}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#1C1917] px-2 py-1.5 rounded-md bg-[#FFFFFF] border border-[#D6D3D1] active:bg-[#EAE8DF] shadow-2xs shrink-0 select-none cursor-pointer"
            title="Buka Amunisi"
          >
            <Plus className="w-3.5 h-3.5 text-[#57534E]" />
            <span>Amunisi</span>
          </button>
        )}
      </div>
    </div>
  );

  if (variant === 'desktop') {
    return renderDesktopStrip();
  }

  if (variant === 'mobile') {
    return renderMobileStrip();
  }

  // AUTO VARIANT: Renders desktop view on md+ and mobile view on mobile when keyboard is visible
  return (
    <>
      <div className="hidden md:block">
        {renderDesktopStrip()}
      </div>
      {isKeyboardVisible && (
        <div className="md:hidden">
          {renderMobileStrip()}
        </div>
      )}
    </>
  );
};
