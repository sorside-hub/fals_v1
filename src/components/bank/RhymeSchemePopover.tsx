import React, { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface RhymeSchemePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentScheme: string;
  onSelectScheme: (scheme: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export const RhymeSchemePopover: React.FC<RhymeSchemePopoverProps> = ({
  isOpen,
  onClose,
  currentScheme,
  onSelectScheme,
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

  const schemes: { key: string; label: string; desc: string }[] = [
    { key: 'Free', label: 'Free Flow', desc: 'Rima bebas tanpa pola terikat' },
    { key: 'AABB', label: 'AABB', desc: 'Rima berpasangan (baris 1-2 & 3-4)' },
    { key: 'ABAB', label: 'ABAB', desc: 'Rima bersilang (baris 1-3 & 2-4)' },
    { key: 'AAAA', label: 'AAAA', desc: 'Rima seragam di seluruh baris' },
    { key: 'Internal', label: 'Internal Rhyme', desc: 'Rima di tengah baris lirik' },
  ];

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div
      ref={ref}
      className={`absolute ${alignmentClass} top-full mt-1.5 w-52 sm:w-56 bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5 ${className}`}
    >
      {schemes.map((s) => {
        const isSelected = currentScheme === s.key || (s.key === 'Free' && !currentScheme);
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              onSelectScheme(s.key);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition cursor-pointer ${
              isSelected ? 'bg-[#F5F4EE] text-[#1C1917]' : 'hover:bg-[#FAF9F5] text-[#44403C]'
            }`}
          >
            <div className="flex flex-col">
              <span className={`text-xs ${isSelected ? 'font-bold text-[#1C1917]' : 'font-medium'}`}>
                {s.label}
              </span>
              <span className="text-[10px] text-[#78716C] leading-snug">
                {s.desc}
              </span>
            </div>
            {isSelected && <Check className="w-3.5 h-3.5 text-[#1C1917] shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};
