import React, { useState } from 'react';
import { X, Disc, Layers, Plus, ArrowRight, Check } from 'lucide-react';
import { SongDraft, ProjectType } from '../../types';

interface MoveToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: SongDraft;
  albumProjects: SongDraft[];
  onConfirmMove: (targetAlbumId: string) => void;
  onCreateAlbumAndMove?: (title: string, type: ProjectType) => void;
}

export const MoveToAlbumModal: React.FC<MoveToAlbumModalProps> = ({
  isOpen,
  onClose,
  song,
  albumProjects,
  onConfirmMove,
  onCreateAlbumAndMove,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<SongDraft | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ProjectType>('album');

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedAlbum(null);
    setIsConfirming(false);
    setIsCreatingNew(false);
    setNewTitle('');
    onClose();
  };

  const handleSelectAlbum = (album: SongDraft) => {
    setSelectedAlbum(album);
    setIsConfirming(true);
  };

  const handleExecuteMove = () => {
    if (selectedAlbum) {
      onConfirmMove(selectedAlbum.id);
      handleClose();
    }
  };

  const handleCreateAndMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onCreateAlbumAndMove) {
      onCreateAlbumAndMove(newTitle.trim(), newType);
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in cursor-pointer"
      onClick={handleClose}
    >
      {/* 1. Simple Confirmation Popup */}
      {isConfirming && selectedAlbum ? (
        <div
          className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl p-5 space-y-3.5 animate-scale-up cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center shrink-0">
              {selectedAlbum.projectType === 'ep' ? (
                <Layers className="w-4 h-4 text-indigo-300" />
              ) : (
                <Disc className="w-4 h-4 text-amber-300" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Pindahkan ke {selectedAlbum.projectType === 'ep' ? 'EP' : 'Album'}?</h3>
              <p className="text-[11px] text-[#78716C]">{selectedAlbum.title}</p>
            </div>
          </div>

          <p className="text-xs text-[#78716C] leading-relaxed">
            Lagu <span className="font-bold text-[#1C1917]">"{song.title || 'Tanpa Judul'}"</span> akan dipindahkan menjadi track di dalam <span className="font-bold text-[#1C1917]">"{selectedAlbum.title}"</span>. Semua lirik, chord, versi, dan rekaman audio tetap tersimpan utuh.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E4DE]">
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleExecuteMove}
              className="px-4 py-1.5 text-xs font-bold bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5] rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>Pindahkan Sekarang</span>
            </button>
          </div>
        </div>
      ) : isCreatingNew ? (
        /* 2. Create New EP/Album & Move Form */
        <div
          className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl p-5 space-y-4 animate-scale-up cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3">
            <h3 className="text-sm font-bold text-[#1C1917]">Buat EP / Album Baru</h3>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="p-1 text-[#78716C] hover:text-[#1C1917] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateAndMove} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-[#78716C]">
                Format Proyek
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('album')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    newType === 'album'
                      ? 'bg-white border-[#1C1917] ring-1 ring-[#1C1917]'
                      : 'bg-white/60 border-[#E5E4DE] hover:border-[#1C1917]'
                  }`}
                >
                  <Disc className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-[#1C1917]">Album</div>
                    <div className="text-[10px] text-[#78716C]">Koleksi LP</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('ep')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    newType === 'ep'
                      ? 'bg-white border-[#1C1917] ring-1 ring-[#1C1917]'
                      : 'bg-white/60 border-[#E5E4DE] hover:border-[#1C1917]'
                  }`}
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-bold text-[#1C1917]">EP</div>
                    <div className="text-[10px] text-[#78716C]">Mini Album</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-[#78716C]">
                Judul {newType === 'ep' ? 'EP' : 'Album'}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={newType === 'ep' ? 'Contoh: Senja di Pelabuhan EP' : 'Contoh: Perjalanan Hidup'}
                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-hidden focus:border-[#1C1917]"
                autoFocus
              />
            </div>

            <p className="text-[11px] text-[#78716C] leading-relaxed">
              Lagu <span className="font-bold text-[#1C1917]">"{song.title}"</span> akan langsung menjadi track pertama di proyek baru ini.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E4DE]">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 text-xs text-[#78716C] hover:text-[#1C1917] rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg transition cursor-pointer disabled:opacity-40"
              >
                Buat & Pindahkan
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* 3. List of Existing EP / Album Projects */
        <div
          className="w-full max-w-sm sm:max-w-md bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl p-5 space-y-4 animate-scale-up cursor-default max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Pindahkan ke EP / Album</h3>
              <p className="text-[11px] text-[#78716C] mt-0.5">
                Pilih tujuan untuk lagu <span className="font-bold text-[#1C1917]">"{song.title || 'Tanpa Judul'}"</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
            {albumProjects.length === 0 ? (
              <div className="p-6 text-center bg-white border border-[#E5E4DE] rounded-xl text-[#78716C] space-y-1.5">
                <Disc className="w-6 h-6 mx-auto text-[#78716C]" />
                <p className="text-xs font-bold text-[#1C1917]">Belum ada proyek EP atau Album</p>
                <p className="text-[11px]">Buat wadah EP atau Album terlebih dahulu untuk memuat lagu ini.</p>
              </div>
            ) : (
              albumProjects.map((album) => {
                const isEP = album.projectType === 'ep';
                const trackCount = album.tracks?.length || 0;

                return (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => handleSelectAlbum(album)}
                    className="w-full p-3 bg-white border border-[#E5E4DE] hover:border-[#1C1917] hover:bg-[#FAF9F5] rounded-xl transition text-left cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isEP
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        {isEP ? <Layers className="w-4 h-4" /> : <Disc className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded border ${
                              isEP
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isEP ? 'EP' : 'ALBUM'}
                          </span>
                          <h4 className="text-xs font-bold text-[#1C1917] truncate group-hover:text-black">
                            {album.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#78716C] font-mono mt-0.5">
                          {trackCount} Track saat ini
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#78716C] group-hover:text-[#1C1917] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                );
              })
            )}
          </div>

          {/* Create New Option */}
          <div className="pt-2 border-t border-[#E5E4DE] shrink-0">
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-2.5 px-3 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-dashed border-[#D6D3D1] hover:border-[#1C1917] rounded-xl text-xs font-semibold text-[#1C1917] flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat EP / Album Baru & Masukkan Lagu Ini</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
