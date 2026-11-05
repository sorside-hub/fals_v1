import React, { useState, useMemo } from 'react';
import { Menu, ChevronDown, Music } from 'lucide-react';
import { SCALE_TYPES, ScaleType } from '../../data/scaleData';
import { getScaleNotes } from '../../utils/scaleCalculations';
import { RadialNotePicker } from './RadialNotePicker';
import { ScaleFretboardDiagram } from './ScaleFretboardDiagram';

interface ScaleViewProps {
  onOpenSidebar: () => void;
}

export const ScaleView: React.FC<ScaleViewProps> = ({ onOpenSidebar }) => {
  const [rootNote, setRootNote] = useState<string>('C');
  const [selectedScaleId, setSelectedScaleId] = useState<string>('pentatonic-minor');
  const [isRootPickerOpen, setIsRootPickerOpen] = useState(false);

  // Find active scale definition
  const activeScale = useMemo<ScaleType>(() => {
    return (
      SCALE_TYPES.find((s) => s.id === selectedScaleId) || SCALE_TYPES[0]
    );
  }, [selectedScaleId]);

  // Compute chromatic notes of active scale
  const scaleNotes = useMemo(() => {
    return getScaleNotes(rootNote, activeScale.intervals);
  }, [rootNote, activeScale]);

  const categories = [
    { id: 'popular', label: 'Populer (Jamming)' },
    { id: 'modes', label: 'Modus Modal' },
    { id: 'exotic', label: 'Eksotis & Spesifik' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-20 animate-fade-in">
      {/* 1. Header Tab Lab: Title + Drawer Menu Trigger */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-[#1C1917]" />
          <span className="text-base font-bold text-[#1C1917] tracking-tight">Skala & Modus</span>
        </div>

        <button
          type="button"
          onClick={onOpenSidebar}
          className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg transition cursor-pointer shadow-2xs text-[#1C1917] shrink-0 active:scale-95"
          title="Buka Menu Laboratorium"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* 2. ROOT NOTE PICKER */}
      <div className="p-3.5 sm:p-5 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-3">
        <div>
          <label className="block text-[10px] font-mono text-[#78716C] uppercase font-bold mb-1">
            Nada Dasar Skala (Root)
          </label>
          <button
            type="button"
            onClick={() => setIsRootPickerOpen(true)}
            className="w-full h-11 px-3.5 bg-[#FAF9F5] hover:bg-[#F5F4EE] border-2 border-[#1C1917] rounded-xl flex items-center justify-between font-mono cursor-pointer transition shadow-2xs active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#1C1917]">{rootNote}</span>
              <span className="text-xs font-mono font-semibold text-[#78716C]">
                {activeScale.name}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#78716C]" />
          </button>
        </div>
      </div>

      {/* 3. SCALE TYPE SELECTOR CHIPS */}
      <div className="p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs space-y-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#78716C]">
          Pilih Jenis Skala
        </span>

        <div className="space-y-2.5">
          {categories.map((cat) => {
            const scalesInCat = SCALE_TYPES.filter((s) => s.category === cat.id);
            if (scalesInCat.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-1">
                <span className="text-[9.5px] font-mono text-[#A8A29E] uppercase font-bold">
                  {cat.label}
                </span>
                <div className="flex flex-wrap gap-1">
                  {scalesInCat.map((scale) => {
                    const isSelected = selectedScaleId === scale.id;

                    return (
                      <button
                        key={scale.id}
                        type="button"
                        onClick={() => setSelectedScaleId(scale.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          isSelected
                            ? 'bg-[#1C1917] text-[#FAF9F5] font-black ring-1 ring-[#1C1917]'
                            : 'bg-[#FAF9F5] hover:bg-[#F5F4EE] text-[#1C1917] border border-[#E5E4DE] font-semibold'
                        }`}
                      >
                        <span>{scale.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scale Feeling / Description */}
        <div className="p-2.5 bg-[#FAF9F5] border border-[#F0EFEA] rounded-xl text-xs font-mono text-[#44403C]">
          <span className="font-bold text-[#1C1917]">Karakter: </span>
          <span>{activeScale.description}</span>
        </div>
      </div>

      {/* 4. SCALE FRETBOARD DIAGRAM */}
      <ScaleFretboardDiagram
        rootNote={rootNote}
        selectedScale={activeScale}
        scaleNotes={scaleNotes}
      />

      {/* Radial Root Note Picker Modal */}
      <RadialNotePicker
        isOpen={isRootPickerOpen}
        onClose={() => setIsRootPickerOpen(false)}
        selectedNote={rootNote}
        onSelectNote={(note) => setRootNote(note)}
        title="Pilih Nada Dasar Skala (Root)"
      />
    </div>
  );
};
