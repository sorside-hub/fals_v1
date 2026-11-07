import React, { useMemo, useEffect } from 'react';
import { parseChordSymbol } from '../../utils/chordParser';
import { getFullChordShapes } from '../../utils/guitarChordVoicings';
import { GuitarFretboardDiagram } from '../lab/GuitarFretboardDiagram';

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
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const parsed = useMemo(() => {
    return parseChordSymbol(chordSymbol || 'C');
  }, [chordSymbol]);

  const fullShapes = useMemo(() => {
    return getFullChordShapes(parsed.root, parsed.type, parsed.notes, parsed.intervals, parsed.bass);
  }, [parsed]);

  if (!isOpen || !chordSymbol) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <GuitarFretboardDiagram
          chordName={parsed.rawSymbol}
          displayName={parsed.displayName}
          formulaNames={parsed.formulaNames}
          notes={parsed.notes}
          shapes={fullShapes}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
