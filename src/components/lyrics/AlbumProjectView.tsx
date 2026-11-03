import React, { useState, useEffect, useRef } from 'react';
import { SongDraft } from '../../types';
import { formatDate } from '../../utils/dateFormatter';
import {
  ArrowLeft,
  Plus,
  Trash2,
  SlidersHorizontal,
  Music,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  FileText,
  Sparkles,
  BookOpen,
  FolderOutput,
} from 'lucide-react';
import { StatusPopover } from './StatusPopover';

interface AlbumProjectViewProps {
  project: SongDraft;
  onBackToStudio: () => void;
  onSelectTrack: (track: SongDraft) => void;
  onAddTrack: (projectId: string, title?: string) => void;
  onDeleteTrack: (projectId: string, trackId: string) => void;
  onUpdateProject: (updated: SongDraft) => void;
  onOpenConceptEditor?: () => void;
  onConvertTrackToSingle?: (trackId: string, parentAlbumId: string) => void;
}

export const AlbumProjectView: React.FC<AlbumProjectViewProps> = ({
  project,
  onBackToStudio,
  onSelectTrack,
  onAddTrack,
  onDeleteTrack,
  onUpdateProject,
  onOpenConceptEditor,
  onConvertTrackToSingle,
}) => {
  const desktopStatusBtnRef = useRef<HTMLButtonElement>(null);
  const mobileStatusBtnRef = useRef<HTMLButtonElement>(null);
  const [title, setTitle] = useState(project.title || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isMobileStatusOpen, setIsMobileStatusOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<SongDraft | null>(null);
  const [trackToConvertToSingle, setTrackToConvertToSingle] = useState<SongDraft | null>(null);

  const tracks = project.tracks || [];
  const isEP = project.projectType === 'ep';

  // Extract clean snippet from TipTap HTML or plain text concept (sama seperti single)
  const getConceptExcerpt = (htmlOrText?: string) => {
    if (!htmlOrText) return 'Belum ada konsep/premis yang ditulis...';
    const clean = htmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return 'Belum ada konsep/premis yang ditulis...';
    return clean.length > 120 ? clean.slice(0, 120) + '...' : clean;
  };

  useEffect(() => {
    setTitle(project.title || '');
  }, [project.title]);

  // Handle title change inline
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateProject({
      ...project,
      title: newTitle,
      updatedAt: Date.now(),
    });
  };

  // Handle status change
  const handleStatusChange = (status: 'draft' | 'progress' | 'release' | 'final') => {
    onUpdateProject({
      ...project,
      status,
      updatedAt: Date.now(),
    });
  };

  // Add track at the bottom
  const handleQuickAddTrack = () => {
    const nextNum = tracks.length + 1;
    const formattedNum = String(nextNum).padStart(2, '0');
    onAddTrack(project.id, `Track ${formattedNum}`);
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'release') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          RELEASE
        </span>
      );
    }
    if (status === 'final') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          FINAL
        </span>
      );
    }
    if (status === 'progress' || status === 'proses') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
          PROGRESS
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-[#F5F4EE] text-[#78716C] border border-[#E5E4DE]">
        DRAFT
      </span>
    );
  };

  const normalizedProjectStatus = project.status === 'proses' ? 'progress' : (project.status || 'draft');

  return (
    <div className="w-full flex flex-col bg-[#FAF9F5] min-h-[calc(100vh-140px)] animate-fade-in">
      {/* 1. ADAPTIVE HEADER */}
      {/* DESKTOP HEADER (1 Single Row: [←] (hidden on mobile) + Badge + Editable Title + Status + Track count + Sidebar Trigger) */}
      <div className="hidden md:flex sticky top-0 z-20 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E5E4DE] py-2.5 items-center justify-between gap-3">
        {/* Left: Back button (hidden on mobile, visible on desktop) + Badge + Big Title input */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={onBackToStudio}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-[#E5E4DE] bg-[#FFFFFF] hover:bg-[#F5F4EE] text-[#1C1917] transition cursor-pointer shadow-2xs"
            title="Kembali ke Studio"
          >
            <ArrowLeft className="w-4 h-4 text-[#57534E]" />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md border shrink-0 ${
                isEP
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isEP ? 'EP' : 'ALBUM'}
            </span>

            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={isEP ? 'Judul EP...' : 'Judul Album...'}
              className="w-full text-2xl font-extrabold text-[#1C1917] bg-transparent border-none outline-hidden tracking-tight placeholder:text-[#A8A29E] min-w-0"
            />
          </div>
        </div>

        {/* Right: Status selector + Total track pill + Sidebar Drawer Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status selector custom popover */}
          <div className="relative">
            <button
              ref={desktopStatusBtnRef}
              type="button"
              onClick={() => setIsStatusOpen((prev) => !prev)}
              className="h-8 flex items-center gap-1.5 px-2.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-mono transition cursor-pointer shadow-2xs group"
              title="Ubah Status Progres Proyek"
            >
              <span className="text-[#78716C]">Status:</span>
              <span className="font-bold text-[#1C1917] capitalize">
                {normalizedProjectStatus}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1C1917]" />
            </button>
            <StatusPopover
              isOpen={isStatusOpen}
              onClose={() => setIsStatusOpen(false)}
              currentStatus={normalizedProjectStatus}
              onSelectStatus={handleStatusChange}
              mode="project"
              align="right"
              triggerRef={desktopStatusBtnRef}
            />
          </div>

          {/* Track counter */}
          <span className="h-8 flex items-center px-2.5 bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-mono font-semibold text-[#78716C]">
            {tracks.length} Track
          </span>

          {/* Right Sidebar Drawer Trigger (Menu Icon Garis 3) */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg transition cursor-pointer shadow-2xs text-[#1C1917]"
            title="Buka Konsep & Premis"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE HEADER (2 Rows: Back button is HIDDEN on mobile) */}
      <div className="md:hidden sticky top-0 z-20 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E5E4DE] pt-1.5 pb-2 px-3">
        {/* Row 1: Format Badge, Status & Sidebar Trigger (No Back Button) */}
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border shrink-0 ${
                isEP
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isEP ? 'EP' : 'ALBUM'}
            </span>

            {/* Status selector custom popover */}
            <div className="relative">
              <button
                ref={mobileStatusBtnRef}
                type="button"
                onClick={() => setIsMobileStatusOpen((prev) => !prev)}
                className="h-7.5 flex items-center gap-1 px-2 bg-[#FFFFFF] active:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-[11px] font-mono cursor-pointer shadow-2xs group"
                title="Ubah Status Progres Proyek"
              >
                <span className="text-[#78716C]">Status:</span>
                <span className="font-bold text-[#1C1917] capitalize">
                  {normalizedProjectStatus}
                </span>
                <ChevronDown className="w-3 h-3 text-[#78716C]" />
              </button>
              <StatusPopover
                isOpen={isMobileStatusOpen}
                onClose={() => setIsMobileStatusOpen(false)}
                currentStatus={normalizedProjectStatus}
                onSelectStatus={handleStatusChange}
                mode="project"
                align="left"
                triggerRef={mobileStatusBtnRef}
              />
            </div>

            <span className="h-7.5 flex items-center px-2 bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-[11px] font-mono font-semibold text-[#78716C]">
              {tracks.length} Track
            </span>
          </div>

          {/* Right Sidebar Drawer Trigger Mobile (Menu Icon Garis 3) */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="w-7.5 h-7.5 flex items-center justify-center bg-[#FFFFFF] active:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg transition cursor-pointer shadow-2xs text-[#1C1917]"
            title="Buka Konsep & Premis"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Editable Full Title */}
        <div className="pt-1">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={isEP ? 'Judul EP...' : 'Judul Album...'}
            className="w-full text-xl font-extrabold text-[#1C1917] bg-transparent border-none outline-hidden tracking-tight placeholder:text-[#A8A29E]"
          />
        </div>
      </div>

      {/* 2. MAIN TRACKLIST CONTENT */}
      <div className="px-3 sm:px-0 py-4 space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#78716C]">
            Daftar Track ({tracks.length})
          </h3>
          <span className="text-[11px] text-[#78716C]">
            Klik track untuk membuka editor lirik
          </span>
        </div>

        {/* Track Items */}
        {tracks.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl text-[#78716C] space-y-2">
            <Music className="w-6 h-6 mx-auto text-[#78716C]" />
            <p className="text-sm font-semibold text-[#1C1917]">Belum ada track di proyek ini</p>
            <p className="text-xs">Klik tombol "Tambah Track Baru" di bawah untuk memasukkan lagu pertama.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, idx) => {
              const finalVersion = track.versions?.find(v => v.isFinal) || track.versions?.[0];
              const displayKey = finalVersion?.key || track.key || 'C';
              const displayBpm = finalVersion?.bpm ?? track.bpm ?? 95;
              const trackNum = String(idx + 1).padStart(2, '0');

              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className="p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl transition cursor-pointer shadow-2xs group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#78716C] px-2 py-1 bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg shrink-0">
                      {trackNum}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1C1917] truncate group-hover:text-black">
                          {track.title}
                        </h4>
                        {getStatusBadge(track.status || 'draft')}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#78716C] mt-1 font-mono">
                        <span>{track.versions?.length || 1} Versi</span>
                        {track.audioMemos && track.audioMemos.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-medium">
                              {track.audioMemos.length} Audio
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onConvertTrackToSingle && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrackToConvertToSingle(track);
                        }}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] rounded-lg transition opacity-60 group-hover:opacity-100 cursor-pointer"
                        title="Jadikan Single Terpisah"
                      >
                        <FolderOutput className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrackToDelete(track);
                      }}
                      className="p-1.5 text-[#78716C] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-60 group-hover:opacity-100 cursor-pointer"
                      title="Hapus Track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. + TAMBAH TRACK DILETAKKAN DI BAWAH TRACKLIST */}
        <button
          type="button"
          onClick={handleQuickAddTrack}
          className="w-full py-3.5 px-4 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-dashed border-[#D6D3D1] hover:border-[#1C1917] rounded-xl text-xs font-semibold text-[#78716C] hover:text-[#1C1917] flex items-center justify-center gap-2.5 transition cursor-pointer shadow-2xs group active:scale-[0.99]"
        >
          <div className="w-6 h-6 rounded-lg bg-[#F5F4EE] group-hover:bg-[#1C1917] group-hover:text-[#FAF9F5] flex items-center justify-center transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Tambah Track Baru</span>
        </button>
      </div>

      {/* 4. KONSEP & PREMIS SIDEBAR DRAWER (Sama persis seperti di single/track) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md h-full bg-[#FAF9F5] border-l border-[#E5E4DE] shadow-2xl flex flex-col p-4 sm:p-5 space-y-5 animate-slide-in-right cursor-default overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1C1917]" />
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] line-clamp-1">Konsep & Premis</h3>
                  <p className="text-[11px] text-[#78716C] line-clamp-1">
                    {isEP ? 'EP' : 'Album'}: {title || 'Tanpa Judul'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
                title="Tutup Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Konsep & Premis Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#78716C]">
                <span>1. Konsep & Premis</span>
              </div>

              <div
                onClick={() => {
                  setIsSidebarOpen(false);
                  if (onOpenConceptEditor) {
                    onOpenConceptEditor();
                  }
                }}
                className="p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-xl transition cursor-pointer shadow-2xs group"
              >
                <p className="text-xs text-[#78716C] italic leading-relaxed line-clamp-3">
                  "{getConceptExcerpt(project.concept)}"
                </p>
              </div>
            </div>

            {/* Footer Tanggal Proyek Album */}
            <div className="pt-3 border-t border-[#E5E4DE] text-[11px] font-mono text-[#78716C] flex items-center justify-between gap-2 shrink-0 mt-auto">
              <div>
                <span className="opacity-70">createdAt:</span>{' '}
                <span className="font-bold text-[#44403C]">{formatDate(project.createdAt || project.updatedAt)}</span>
              </div>
              <div>
                <span className="opacity-70">updatedAt:</span>{' '}
                <span className="font-bold text-[#1C1917]">{formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Track */}
      {trackToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setTrackToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl p-5 space-y-3 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[#1C1917]">Hapus Track?</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Track <span className="font-bold text-[#1C1917]">"{trackToDelete.title}"</span> beserta seluruh versi lirik dan audio di dalamnya akan dihapus.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E4DE]">
              <button
                type="button"
                onClick={() => setTrackToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTrack(project.id, trackToDelete.id);
                  setTrackToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer shadow-2xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Jadikan Single Terpisah */}
      {trackToConvertToSingle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setTrackToConvertToSingle(null)}
        >
          <div
            className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl p-5 space-y-3 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[#1C1917]">Jadikan Single Terpisah?</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Track <span className="font-bold text-[#1C1917]">"{trackToConvertToSingle.title}"</span> akan dikeluarkan dari <span className="font-bold text-[#1C1917]">"{project.title}"</span> dan menjadi Single mandiri di daftar lagu. Semua data lirik, chord, versi, dan audio tetap aman.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E4DE]">
              <button
                type="button"
                onClick={() => setTrackToConvertToSingle(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConvertTrackToSingle) {
                    onConvertTrackToSingle(trackToConvertToSingle.id, project.id);
                  }
                  setTrackToConvertToSingle(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg transition cursor-pointer shadow-2xs"
              >
                Jadikan Single
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

