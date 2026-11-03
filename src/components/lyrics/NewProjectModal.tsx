import React from 'react';
import { ProjectType, SongStatus } from '../../types';
import { Disc3, Layers, Library, ChevronRight, X } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (
    type: ProjectType,
    title: string,
    options?: {
      key?: string;
      concept?: string;
      trackCount?: number;
      status?: SongStatus;
    }
  ) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  if (!isOpen) return null;

  const handleSelectType = (type: ProjectType) => {
    if (type === 'single') {
      onCreateProject('single', 'Lagu Baru', { key: 'C', status: 'draft' });
    } else if (type === 'ep') {
      onCreateProject('ep', 'EP Baru', { trackCount: 4, status: 'draft' });
    } else if (type === 'album') {
      onCreateProject('album', 'Album Baru', { trackCount: 8, status: 'draft' });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-[#FFFFFF] border-b border-[#E5E4DE]">
          <div>
            <h3 className="text-sm font-bold text-[#1C1917]">Pilih Format Karya</h3>
            <p className="text-[11px] text-[#78716C] mt-0.5">
              Pilih format untuk langsung mulai menulis di studio
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Type Cards */}
        <div className="p-4 space-y-2.5">
          {/* Single Card */}
          <button
            type="button"
            onClick={() => handleSelectType('single')}
            className="w-full text-left group p-3.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F4EE] border border-[#E5E4DE] flex items-center justify-center shrink-0 group-hover:bg-[#1C1917] group-hover:text-[#FAF9F5] transition-colors">
                <Disc3 className="w-5 h-5 text-[#1C1917] group-hover:text-[#FAF9F5] transition-colors" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#1C1917]">Single</h4>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-md bg-[#F5F4EE] text-[#78716C] border border-[#E5E4DE]">
                    1 Lagu
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">
                  Lagu mandiri dengan editor lirik penuh, multi-versi, metronom, dan memo audio.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#1C1917] group-hover:translate-x-0.5 shrink-0 transition" />
          </button>

          {/* EP Card */}
          <button
            type="button"
            onClick={() => handleSelectType('ep')}
            className="w-full text-left group p-3.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5 text-indigo-700 group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#1C1917]">EP (Mini Album)</h4>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    4 Track
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">
                  Koleksi lagu dengan premis terpadu, tracklist tersusun, dan sidebar konsep.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#1C1917] group-hover:translate-x-0.5 shrink-0 transition" />
          </button>

          {/* Album Card */}
          <button
            type="button"
            onClick={() => handleSelectType('album')}
            className="w-full text-left group p-3.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Library className="w-5 h-5 text-amber-700 group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#1C1917]">Album Penuh</h4>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                    8 Track
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">
                  Karya narasi mendalam dengan daftar tracklist penuh dan manajemen konsep terintegrasi.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#1C1917] group-hover:translate-x-0.5 shrink-0 transition" />
          </button>
        </div>
      </div>
    </div>
  );
};

