import React, { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { BarCategory } from '../../types';

interface CategoryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory: BarCategory;
  onSelectCategory: (cat: BarCategory) => void;
  align?: 'left' | 'right';
  className?: string;
}

export const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  isOpen,
  onClose,
  currentCategory,
  onSelectCategory,
  align = 'left',
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: { key: BarCategory; label: string; desc: string }[] = [
    { key: 'diksi', label: 'Diksi / Kata', desc: 'Kata puitis, terminologi, atau kosa kata bermakna' },
    { key: 'metafor', label: 'Metafor', desc: 'Analogi simbolis, majas, dan kiasan rasa' },
    { key: 'bar', label: 'Bar / Baris Lirik', desc: 'Baris rima, punchline, atau rima multi-bar' },
    { key: 'hook', label: 'Hook / Chorus', desc: 'Gagasan bait hook, reff, atau melodi inti lirik' },
  ];

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

  // Normalize legacy categories to 4 core
  const normalizedCurrent = (cat: BarCategory): BarCategory => {
    if (cat === 'punchline' || cat === 'rhyme') return 'bar';
    if (cat === 'idea') return 'metafor';
    return cat;
  };

  const activeKey = normalizedCurrent(currentCategory);

  return (
    <div
      ref={ref}
      className={`absolute ${alignmentClass} top-full mt-1.5 w-60 sm:w-64 bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5 ${className}`}
    >
      {categories.map((cat) => {
        const isSelected = activeKey === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => {
              onSelectCategory(cat.key);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition cursor-pointer ${
              isSelected ? 'bg-[#F5F4EE] text-[#1C1917]' : 'hover:bg-[#FAF9F5] text-[#44403C]'
            }`}
          >
            <div className="flex flex-col pr-2">
              <span className={`text-xs ${isSelected ? 'font-bold text-[#1C1917]' : 'font-medium'}`}>
                {cat.label}
              </span>
              <span className="text-[10.5px] text-[#78716C] leading-snug mt-0.5">
                {cat.desc}
              </span>
            </div>
            {isSelected && <Check className="w-4 h-4 text-[#1C1917] shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};
