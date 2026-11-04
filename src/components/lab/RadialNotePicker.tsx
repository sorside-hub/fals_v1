import React from 'react';
import { CHROMATIC_NOTES } from '../../data/constants';
import { X } from 'lucide-react';

interface RadialNotePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNote: string;
  onSelectNote: (note: string) => void;
  title?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

// 12 chromatic notes arranged in a circle starting at 12 o'clock (C)
// Notes: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
const WHEEL_NOTES = [
  { note: 'C', enharmonic: null },
  { note: 'C#', enharmonic: 'Db' },
  { note: 'D', enharmonic: null },
  { note: 'D#', enharmonic: 'Eb' },
  { note: 'E', enharmonic: null },
  { note: 'F', enharmonic: null },
  { note: 'F#', enharmonic: 'Gb' },
  { note: 'G', enharmonic: null },
  { note: 'G#', enharmonic: 'Ab' },
  { note: 'A', enharmonic: null },
  { note: 'A#', enharmonic: 'Bb' },
  { note: 'B', enharmonic: null },
];

export const RadialNotePicker: React.FC<RadialNotePickerProps> = ({
  isOpen,
  onClose,
  selectedNote,
  onSelectNote,
  title = 'Pilih Nada',
  allowEmpty = false,
  emptyLabel = 'Tanpa Bass',
}) => {
  if (!isOpen) return null;

  // Center radius calculations for circular placement
  const radius = 105; // radius in px from center
  const center = 145; // center of the 290x290 box

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] bg-[#FAF9F5] border border-[#E5E4DE] rounded-3xl shadow-2xl p-4 flex flex-col items-center animate-scale-in select-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#E5E4DE]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1C1917]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C1917]">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Circular Wheel Canvas */}
        <div className="relative w-[290px] h-[290px] my-2 flex items-center justify-center">
          {/* Decorative Outer Guide Ring */}
          <div className="absolute inset-2 rounded-full border border-dashed border-[#D6D3D1]/70 pointer-events-none" />
          <div className="absolute inset-14 rounded-full border border-[#E5E4DE] bg-[#FAF9F5] pointer-events-none" />

          {/* Center Hub: Shows Current Selection */}
          <div className="absolute w-20 h-20 rounded-full bg-[#FFFFFF] border-2 border-[#1C1917] shadow-xs flex flex-col items-center justify-center z-10 pointer-events-none">
            <span className="text-[10px] font-mono text-[#78716C] uppercase font-bold leading-none">
              Aktif
            </span>
            <span className="text-xl font-mono font-black text-[#1C1917] mt-0.5 leading-none">
              {selectedNote || '—'}
            </span>
          </div>

          {/* 12 Circular Note Buttons */}
          {WHEEL_NOTES.map((item, idx) => {
            // angle in radians: start at -90 deg (12 o'clock) and go clockwise (360/12 = 30 deg each)
            const angleDeg = -90 + idx * 30;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = center + radius * Math.cos(angleRad);
            const y = center + radius * Math.sin(angleRad);

            const isCurrent =
              selectedNote.toUpperCase() === item.note.toUpperCase() ||
              (item.enharmonic && selectedNote.toUpperCase() === item.enharmonic.toUpperCase());

            return (
              <button
                key={item.note}
                type="button"
                onClick={() => {
                  onSelectNote(item.note);
                  onClose();
                }}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute w-11 h-11 rounded-full flex flex-col items-center justify-center font-mono transition-all cursor-pointer shadow-xs active:scale-90 ${
                  isCurrent
                    ? 'bg-[#1C1917] text-[#FAF9F5] ring-2 ring-[#1C1917]/20 scale-110 z-20 font-black'
                    : 'bg-[#FFFFFF] text-[#1C1917] border border-[#D6D3D1] hover:border-[#1C1917] hover:bg-[#F5F4EE] font-bold z-10'
                }`}
              >
                <span className="text-xs leading-none">{item.note}</span>
                {item.enharmonic && (
                  <span
                    className={`text-[8.5px] leading-tight font-normal ${
                      isCurrent ? 'text-[#FAF9F5]/70' : 'text-[#78716C]'
                    }`}
                  >
                    {item.enharmonic}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Optional Empty / Reset Button (e.g. for Slash Bass Note) */}
        {allowEmpty && (
          <button
            type="button"
            onClick={() => {
              onSelectNote('');
              onClose();
            }}
            className="w-full py-2 px-3 mt-1 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl text-xs font-mono font-semibold text-[#78716C] hover:text-[#1C1917] transition cursor-pointer shadow-2xs"
          >
            {emptyLabel}
          </button>
        )}
      </div>
    </div>
  );
};
