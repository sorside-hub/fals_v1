import React, { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { SongStatus } from '../../types';

interface StatusPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: SongStatus | string;
  onSelectStatus: (status: 'draft' | 'progress' | 'release' | 'final') => void;
  mode?: 'project' | 'track';
  align?: 'left' | 'right';
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const StatusPopover: React.FC<StatusPopoverProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onSelectStatus,
  mode = 'project',
  align = 'right',
  className = '',
  triggerRef,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
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
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  // Options based on mode: Track uses 'Final', Project (Single/EP/Album) uses 'Release'
  const options: { key: 'draft' | 'progress' | 'release' | 'final'; label: string; badgeColor: string }[] =
    mode === 'track'
      ? [
          { key: 'draft', label: 'Draft', badgeColor: 'bg-[#78716C]' },
          { key: 'progress', label: 'Progress', badgeColor: 'bg-amber-500' },
          { key: 'final', label: 'Final', badgeColor: 'bg-emerald-500' },
        ]
      : [
          { key: 'draft', label: 'Draft', badgeColor: 'bg-[#78716C]' },
          { key: 'progress', label: 'Progress', badgeColor: 'bg-amber-500' },
          { key: 'release', label: 'Release', badgeColor: 'bg-emerald-500' },
        ];

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';
  const normalizedCurrent = currentStatus === 'proses' ? 'progress' : currentStatus;

  return (
    <div
      ref={ref}
      className={`absolute ${alignmentClass} top-full mt-1.5 w-36 sm:w-40 max-w-[calc(100vw-24px)] bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl shadow-lg p-1 z-50 animate-scale-up space-y-0.5 ${className}`}
    >
      {options.map((opt) => {
        const isSelected = normalizedCurrent === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              onSelectStatus(opt.key);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer text-xs ${
              isSelected ? 'bg-[#F5F4EE] font-bold text-[#1C1917]' : 'hover:bg-[#FAF9F5] text-[#44403C]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.badgeColor}`} />
              <span className="font-semibold text-xs">{opt.label}</span>
            </div>
            {isSelected && <Check className="w-3.5 h-3.5 text-[#1C1917] shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

