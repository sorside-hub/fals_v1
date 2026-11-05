import React, { useEffect } from 'react';
import { X, BookOpen, Music, GitBranch, Sparkles, Disc } from 'lucide-react';

export type LabFeature = 'chords' | 'scales' | 'progressions' | 'backing-track';

interface LabDrawerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeature: LabFeature;
  onSelectFeature: (feature: LabFeature) => void;
}

export const LabDrawerSidebar: React.FC<LabDrawerSidebarProps> = ({
  isOpen,
  onClose,
  activeFeature,
  onSelectFeature,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'chords' as LabFeature,
      title: 'Kamus Akor',
      description: 'Cari posisi jari fretboard, variasi voicing, dan formula akor.',
      icon: BookOpen,
      available: true,
    },
    {
      id: 'scales' as LabFeature,
      title: 'Skala & Modus',
      description: 'Eksplorasi nada melodi mayor, minor, pentatonik & modus modal.',
      icon: Music,
      available: true,
    },
    {
      id: 'progressions' as LabFeature,
      title: 'Progresi Akor',
      description: 'Rangkai progresi akor, dengarkan loop tempo, dan kirim ke lirik.',
      icon: GitBranch,
      available: false,
    },
    {
      id: 'backing-track' as LabFeature,
      title: 'Drum Sequencer Builder',
      description: 'Buat pola drum 8 bar kustom sendiri, pilih sound kit, atur BPM, dan simpan.',
      icon: Disc,
      available: true,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs sm:max-w-sm h-full bg-[#FAF9F5] border-l border-[#E5E4DE] shadow-2xl flex flex-col p-4 sm:p-5 space-y-5 animate-slide-in-right cursor-default overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1C1917]" />
            <h3 className="text-sm font-bold text-[#1C1917]">Laboratorium Musik</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Menu List */}
        <div className="space-y-2.5 flex-1">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#78716C]">
            Pilih Modul
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeFeature === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.available) {
                      onSelectFeature(item.id);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-65'
                  } ${
                    isSelected
                      ? 'bg-[#FFFFFF] border-[#1C1917] shadow-xs ring-1 ring-[#1C1917]/10'
                      : 'bg-[#FFFFFF] border-[#E5E4DE] hover:border-[#D6D3D1]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-[#1C1917] text-[#FAF9F5] border-[#1C1917]'
                          : 'bg-[#FAF9F5] text-[#78716C] border-[#E5E4DE]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-[#1C1917] truncate">
                          {item.title}
                        </h4>
                        {!item.available && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md bg-[#F5F4EE] text-[#78716C] border border-[#E5E4DE] shrink-0">
                            Coming Soon
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#78716C] mt-1 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-[#E5E4DE] text-[11px] font-mono text-[#78716C] text-center shrink-0">
          FALS Harmonic Engine v1.0
        </div>
      </div>
    </div>
  );
};
