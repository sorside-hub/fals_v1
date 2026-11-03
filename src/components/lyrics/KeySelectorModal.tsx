import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface KeySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSelectKey: (key: string, autoTranspose: boolean) => void;
}

export const KeySelectorModal: React.FC<KeySelectorModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSelectKey,
}) => {
  const getInitialScaleType = (key: string): string => {
    if (!key) return 'major';
    const trimmed = key.trim();
    if (trimmed.includes('(Harm)') || trimmed.toLowerCase().includes('harmonic')) return 'harmonic-minor';
    if (trimmed.includes('(Mel)') || trimmed.toLowerCase().includes('melodic')) return 'melodic-minor';
    if (trimmed.includes('(Dorian)')) return 'dorian';
    if (trimmed.includes('(Mixolydian)')) return 'mixolydian';
    if (trimmed.includes('(Lydian)')) return 'lydian';
    if (trimmed.includes('(Blues)')) return 'blues';
    if (trimmed.endsWith('m') && !trimmed.endsWith('maj') && !trimmed.endsWith('dim')) return 'natural-minor';
    return 'major';
  };

  const [scaleType, setScaleType] = useState<string>(getInitialScaleType(currentKey));
  const [customInput, setCustomInput] = useState('');
  const [autoTranspose, setAutoTranspose] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setScaleType(getInitialScaleType(currentKey));
      setCustomInput('');
      setAutoTranspose(true);
    }
  }, [isOpen, currentKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  const MINOR_KEYS = ['Cm', 'Gm', 'Dm', 'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm'];
  const ROOT_NOTES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

  let activeKeysList = MAJOR_KEYS;
  if (scaleType === 'natural-minor') {
    activeKeysList = MINOR_KEYS;
  } else if (scaleType === 'harmonic-minor') {
    activeKeysList = MINOR_KEYS.map((k) => `${k} (Harm)`);
  } else if (scaleType === 'melodic-minor') {
    activeKeysList = MINOR_KEYS.map((k) => `${k} (Mel)`);
  } else if (scaleType === 'dorian') {
    activeKeysList = ROOT_NOTES.map((n) => `${n} (Dorian)`);
  } else if (scaleType === 'mixolydian') {
    activeKeysList = ROOT_NOTES.map((n) => `${n} (Mixolydian)`);
  } else if (scaleType === 'lydian') {
    activeKeysList = ROOT_NOTES.map((n) => `${n} (Lydian)`);
  } else if (scaleType === 'blues') {
    activeKeysList = ROOT_NOTES.map((n) => `${n} (Blues)`);
  }

  const currentGrid = [
    activeKeysList.slice(0, 4),
    activeKeysList.slice(4, 8),
    activeKeysList.slice(8, 12),
  ];

  const handleKeyClick = (keyName: string) => {
    onSelectKey(keyName, autoTranspose);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed) {
      onSelectKey(trimmed, autoTranspose);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[390px] bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xl p-4 z-10 flex flex-col gap-3.5 select-none">
        <div className="flex items-center justify-between gap-2 border-b border-[#F0EFEA] pb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#78716C]">
              Pilih Nada Dasar & Skala
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-md text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] transition cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Scale Segmented Tabs (Mayor, Nat. Min, Harm. Min, Mel. Min) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F5F4EE] border border-[#E5E4DE] rounded-xl text-[10px] font-mono font-bold">
          <button
            type="button"
            onClick={() => setScaleType('major')}
            className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
              scaleType === 'major'
                ? 'bg-[#1C1917] text-[#FFFFFF] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Mayor
          </button>
          <button
            type="button"
            onClick={() => setScaleType('natural-minor')}
            className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
              scaleType === 'natural-minor'
                ? 'bg-[#1C1917] text-[#FFFFFF] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Nat. Min
          </button>
          <button
            type="button"
            onClick={() => setScaleType('harmonic-minor')}
            className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
              scaleType === 'harmonic-minor'
                ? 'bg-[#1C1917] text-[#FFFFFF] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Harm. Min
          </button>
          <button
            type="button"
            onClick={() => setScaleType('melodic-minor')}
            className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
              scaleType === 'melodic-minor'
                ? 'bg-[#1C1917] text-[#FFFFFF] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Mel. Min
          </button>
        </div>

        {/* Advanced Modes Selector (Dorian, Mixolydian, Lydian, Blues) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-[#78716C] shrink-0">Mode Lain:</span>
          <select
            value={['dorian', 'mixolydian', 'lydian', 'blues'].includes(scaleType) ? scaleType : ''}
            onChange={(e) => {
              if (e.target.value) setScaleType(e.target.value);
            }}
            className="flex-1 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#FAF9F5] border border-[#E5E4DE] rounded-lg text-[#1C1917] outline-hidden cursor-pointer"
          >
            <option value="" disabled>Pilih Skala Modal / Blues...</option>
            <option value="dorian">Dorian Mode</option>
            <option value="mixolydian">Mixolydian Mode</option>
            <option value="lydian">Lydian Mode</option>
            <option value="blues">Blues Scale</option>
          </select>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Ketik key lain (mis: C, Am, C (Harm))..."
            className="flex-1 px-3 py-2 text-xs font-mono font-medium text-[#1C1917] bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl outline-hidden focus:border-[#1C1917] focus:bg-[#FFFFFF] placeholder:text-[#A8A29E] transition"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFFFFF] rounded-xl text-xs font-mono font-bold transition shadow-2xs cursor-pointer shrink-0"
          >
            OK
          </button>
        </form>

        <label className="flex items-center gap-2 px-1 text-xs font-mono text-[#57534E] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoTranspose}
            onChange={(e) => setAutoTranspose(e.target.checked)}
            className="w-4 h-4 rounded border-[#E5E4DE] text-[#1C1917] focus:ring-0 cursor-pointer accent-[#1C1917]"
          />
          <span>Transpose akor otomatis di lirik</span>
        </label>

        <div className="grid grid-cols-4 gap-2">
          {currentGrid.flat().map((keyName) => {
            const isSelected = currentKey.trim().toLowerCase() === keyName.toLowerCase();
            const displayLabel = keyName
              .replace(' (Harm)', 'ᵃ')
              .replace(' (Mel)', 'ᵐ')
              .replace(' (Dorian)', ' ᵈᵒʳ')
              .replace(' (Mixolydian)', ' ᵐᶦˣ')
              .replace(' (Lydian)', ' ˡʸᵈ')
              .replace(' (Blues)', ' ᵇˡˢ');
            return (
              <button
                key={keyName}
                type="button"
                onClick={() => handleKeyClick(keyName)}
                className={`h-11 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center transition cursor-pointer select-none truncate px-1 ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FFFFFF] shadow-sm scale-[1.02]'
                    : 'bg-[#FAF9F5] hover:bg-[#F5F4EE] active:bg-[#EAE8DF] text-[#1C1917] border border-[#E5E4DE] shadow-2xs hover:border-[#D6D3D1]'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
