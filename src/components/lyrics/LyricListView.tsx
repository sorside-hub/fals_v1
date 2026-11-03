import React, { useState } from 'react';
import { SongDraft, ProjectType, SongStatus } from '../../types';
import { formatDate } from '../../utils/dateFormatter';
import { Plus, Search, Trash2, FileText, Disc3, Layers, Library, Cloud } from 'lucide-react';
import { NewProjectModal } from './NewProjectModal';
import { UserSyncModal } from '../auth/UserSyncModal';
import { useAuth } from '../../context/AuthContext';

interface LyricListViewProps {
  songs: SongDraft[];
  onSelectSong: (song: SongDraft) => void;
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
  onDeleteSong: (id: string) => void;
}

export const LyricListView: React.FC<LyricListViewProps> = ({
  songs,
  onSelectSong,
  onCreateProject,
  onDeleteSong,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'progress' | 'release'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showUserSync, setShowUserSync] = useState(false);
  const [songToDelete, setSongToDelete] = useState<SongDraft | null>(null);

  const filteredSongs = songs.filter(song => {
    const rawStatus = song.status || 'draft';
    const normalizedStatus = rawStatus === 'proses' ? 'progress' : rawStatus;
    const matchStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return matchStatus;

    const matchTitle = song.title.toLowerCase().includes(searchLower);
    const matchContent = song.content?.toLowerCase().includes(searchLower);
    const matchConcept = song.concept?.toLowerCase().includes(searchLower);
    const matchTracks = song.tracks?.some(t =>
      t.title.toLowerCase().includes(searchLower) || t.content?.toLowerCase().includes(searchLower)
    );

    return matchStatus && (matchTitle || matchContent || matchConcept || matchTracks);
  });

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

  const getFormatBadge = (type?: ProjectType) => {
    if (type === 'ep') {
      return (
        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70">
          EP
        </span>
      );
    }
    if (type === 'album') {
      return (
        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-50 text-amber-700 border border-amber-200/70">
          ALBUM
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md bg-[#F5F4EE] text-[#78716C] border border-[#E5E4DE]">
        SINGLE
      </span>
    );
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1C1917]" />
          <span className="text-base font-bold text-[#1C1917] tracking-tight">Studio</span>
          <span className="text-xs font-mono font-medium text-[#78716C] px-2 py-0.5 rounded-full bg-[#F5F4EE] border border-[#E5E4DE]">
            {songs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUserSync(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#1C1917] rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
            title="Akun & Cloud Sync"
          >
            {user ? (
              <>
                {(user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (
                  <img
                    src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#1C1917] text-[#FAF9F5] flex items-center justify-center text-[9px] font-bold">
                    {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Akun'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-[#78716C]" />
                <span className="hidden sm:inline text-[#78716C]">Cloud Sync</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#1C1917] text-[#FAF9F5] rounded-xl text-xs font-semibold hover:bg-[#292524] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lirik Baru</span>
          </button>
        </div>
      </div>

      <UserSyncModal
        isOpen={showUserSync}
        onClose={() => setShowUserSync(false)}
        onOpenSettings={() => {
          setShowUserSync(false);
          window.location.hash = '#settings';
        }}
      />

      {/* Filter Status Progres & Search Bar */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Status Filter Tabs (Centered) */}
        <div className="inline-flex items-center gap-1 p-1 bg-[#F5F4EE] border border-[#E5E4DE] rounded-xl overflow-x-auto scrollbar-none text-xs">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'draft', label: 'Draft' },
            { key: 'progress', label: 'Progress' },
            { key: 'release', label: 'Release' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#FFFFFF] text-[#1C1917] shadow-2xs font-semibold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, lirik, atau konsep..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl text-[#1C1917] outline-hidden focus:border-[#1C1917]"
          />
        </div>
      </div>

      {/* Grid of Lyric Cards */}
      {filteredSongs.length === 0 ? (
        <div className="p-8 text-center bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl text-[#78716C] space-y-2">
          <p className="text-sm font-semibold text-[#1C1917]">Tidak ada karya di kategori ini</p>
          <p className="text-xs">Klik tombol "+ Lirik Baru" untuk membuat lembar karya barumu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSongs.map(song => {
            const isCollection = song.projectType === 'ep' || song.projectType === 'album';
            const finalVersion = song.versions?.find(v => v.isFinal) || song.versions?.[0];
            const displayKey = finalVersion?.key || song.key || 'C';
            const displayBpm = finalVersion?.bpm ?? song.bpm ?? 95;

            const updatedDate = isCollection
              ? formatDate(song.updatedAt)
              : formatDate(finalVersion?.updatedAt || finalVersion?.createdAt || song.updatedAt);

            return (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
                className="p-4 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-2xl transition-all cursor-pointer shadow-2xs group flex flex-col justify-between gap-3"
              >
                {/* Top Row: Title & Format Badge & Delete button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getFormatBadge(song.projectType)}
                      <h3 className="text-base font-bold text-[#1C1917] group-hover:underline truncate">
                        {song.title || 'Tanpa Judul'}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSongToDelete(song);
                    }}
                    className="p-1.5 rounded-lg text-[#A8A29E] hover:text-rose-600 hover:bg-[#FAF9F5] transition cursor-pointer shrink-0"
                    title="Hapus proyek lagu ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Row: Metadata info */}
                <div className="flex items-center flex-wrap gap-2 text-xs text-[#78716C] pt-1 border-t border-[#E5E4DE]/50">
                  {getStatusBadge(song.status || 'draft')}
                  <span className="text-[#D6D3D1]" aria-hidden="true">•</span>

                  {isCollection ? (
                    <>
                      <span className="font-semibold text-[#1C1917] font-mono">
                        {song.tracks?.length || 0} Track
                      </span>
                      <span className="text-[#D6D3D1]" aria-hidden="true">•</span>
                      <span className="font-mono text-[11px] text-[#78716C]">{updatedDate}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-[11px] text-[#78716C]">{updatedDate}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Proyek */}
      {songToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in cursor-pointer"
          onClick={() => setSongToDelete(null)}
        >
          <div
            className="w-full max-w-xs bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl p-5 space-y-3 animate-scale-up cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[#1C1917]">Hapus Proyek?</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Proyek <span className="font-bold text-[#1C1917]">"{songToDelete.title || 'Tanpa Judul'}"</span> akan dihapus secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E4DE]">
              <button
                type="button"
                onClick={() => setSongToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSong(songToDelete.id);
                  setSongToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer shadow-2xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pilih Format Single, EP, atau Album */}
      <NewProjectModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreateProject={onCreateProject}
      />
    </div>
  );
};
