import React, { useState } from 'react';
import { BarItem, BarCategory } from '../../types';
import { Plus, Send, Copy, Trash2, Check, Sparkles, BookOpen, AlertTriangle, Search, Cloud } from 'lucide-react';
import { UserSyncModal } from '../auth/UserSyncModal';
import { useAuth } from '../../context/AuthContext';

interface BankBarListViewProps {
  barItems: BarItem[];
  onSelectBar: (bar: BarItem) => void;
  onCreateNewBar: () => void;
  onDeleteBar: (id: string) => void;
  onSendToLyric?: (text: string) => void;
}

export const BankBarListView: React.FC<BankBarListViewProps> = ({
  barItems,
  onSelectBar,
  onCreateNewBar,
  onDeleteBar,
  onSendToLyric,
}) => {
  const { user } = useAuth();
  const [showUserSync, setShowUserSync] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BarItem | null>(null);

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'diksi', label: 'Diksi' },
    { key: 'metafor', label: 'Metafor' },
    { key: 'bar', label: 'Bar' },
    { key: 'hook', label: 'Hook' },
  ];

  const filteredBars = barItems.filter(b => {
    let matchCat = selectedCategory === 'all';
    if (!matchCat) {
      if (selectedCategory === 'diksi') matchCat = b.category === 'diksi';
      else if (selectedCategory === 'metafor') {
        matchCat = b.category === 'metafor' || (b.category as string) === 'metaphor' || (b.category as string) === 'idea';
      } else if (selectedCategory === 'bar') {
        matchCat = b.category === 'bar' || (b.category as string) === 'punchline' || (b.category as string) === 'rhyme';
      } else if (selectedCategory === 'hook') {
        matchCat = b.category === 'hook';
      } else {
        matchCat = b.category === selectedCategory;
      }
    }

    const q = search.toLowerCase().trim();
    const matchSearch =
      q === '' ||
      b.text.toLowerCase().includes(q) ||
      (b.meaning && b.meaning.toLowerCase().includes(q)) ||
      b.tags?.some(t => t.toLowerCase().includes(q));

    return matchCat && matchSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getCategoryBadgeLabel = (cat: string) => {
    if (cat === 'diksi') return 'Diksi';
    if (cat === 'metafor' || cat === 'metaphor' || cat === 'idea') return 'Metafor';
    if (cat === 'bar' || cat === 'punchline' || cat === 'rhyme') return 'Bar';
    if (cat === 'hook') return 'Hook';
    return cat;
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1C1917]" />
          <span className="text-base font-bold text-[#1C1917] tracking-tight">Amunisi</span>
          <span className="text-xs font-mono font-medium text-[#78716C] px-2 py-0.5 rounded-full bg-[#F5F4EE] border border-[#E5E4DE]">
            {barItems.length}
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
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#1C1917] text-[#FAF9F5] flex items-center justify-center text-[9px] font-bold">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[80px] truncate">{user.displayName?.split(' ')[0] || 'Akun'}</span>
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
            onClick={onCreateNewBar}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#1C1917] text-[#FAF9F5] rounded-xl text-xs font-semibold hover:bg-[#292524] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Amunisi Baru</span>
          </button>
        </div>
      </div>

      <UserSyncModal
        isOpen={showUserSync}
        onClose={() => setShowUserSync(false)}
      />

      {/* Category Filter Tabs & Search Bar (Centered, matching Lyric tab) */}
      <div className="flex flex-col items-center gap-2.5">
        <div className="inline-flex items-center gap-1 p-1 bg-[#F5F4EE] border border-[#E5E4DE] rounded-xl overflow-x-auto scrollbar-none text-xs">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-[#FFFFFF] text-[#1C1917] shadow-2xs font-semibold'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar matching LyricListView */}
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kata, metafor, makna, atau bar..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl text-[#1C1917] outline-hidden focus:border-[#1C1917] shadow-2xs"
          />
        </div>
      </div>

      {/* Bank Bar Items Grid */}
      {filteredBars.length === 0 ? (
        <div className="p-8 text-center bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl text-[#78716C] space-y-2">
          <p className="text-sm font-semibold text-[#1C1917]">
            {search.trim() ? 'Tidak ada amunisi yang cocok' : 'Belum ada amunisi di kategori ini'}
          </p>
          <p className="text-xs">
            {search.trim()
              ? `Tidak ditemukan amunisi dengan kata kunci "${search.trim()}".`
              : 'Klik tombol "Amunisi Baru" untuk menambah kata, metafor, atau bar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBars.map(bar => {
            const isBarOrHook = bar.category === 'bar' || bar.category === 'hook' || (bar.category as string) === 'punchline' || (bar.category as string) === 'rhyme';
            const isDiksiOrMetafor = bar.category === 'diksi' || bar.category === 'metafor' || (bar.category as string) === 'metaphor' || (bar.category as string) === 'idea';
            const formattedDate = new Date(bar.createdAt || Date.now()).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).toUpperCase();

            return (
              <div
                key={bar.id}
                onClick={() => onSelectBar(bar)}
                className="p-4 sm:p-5 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-2xl flex flex-col justify-between transition-all shadow-2xs group cursor-pointer"
              >
                <div>
                  {/* Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-[#78716C] mb-2.5 font-mono pb-2 border-b border-[#F5F4EE]">
                    <div className="flex items-center gap-2">
                      <span className="uppercase font-bold text-[#1C1917] bg-[#F5F4EE] px-1.5 py-0.5 rounded text-[10px]">
                        {getCategoryBadgeLabel(bar.category)}
                      </span>
                      {isBarOrHook && bar.rhymeScheme && bar.rhymeScheme !== 'Free' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{bar.rhymeScheme}</span>
                        </>
                      )}
                      {isBarOrHook && bar.syllableCount ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>~{bar.syllableCount} suku kata</span>
                        </>
                      ) : null}
                    </div>

                    {/* Date */}
                    <span className="text-[10px] font-mono text-[#A8A29E]">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Main text content (max 4 lines) */}
                  <div className="text-xs sm:text-sm text-[#1C1917] font-semibold leading-relaxed whitespace-pre-wrap pl-2.5 border-l-2 border-[#E5E4DE] group-hover:border-[#1C1917] line-clamp-4 overflow-hidden">
                    {bar.text}
                  </div>

                  {/* Makna Section (khusus Diksi & Metafor) */}
                  {isDiksiOrMetafor && bar.meaning && (
                    <div className="mt-3 p-2.5 bg-[#FAF9F5] rounded-xl text-xs text-[#57534E] leading-relaxed border border-[#E5E4DE]">
                      <div className="text-[10px] uppercase font-mono font-bold text-[#78716C] mb-0.5 tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#78716C]" />
                        <span>Makna:</span>
                      </div>
                      <div className="whitespace-pre-wrap text-[11.5px] sm:text-xs text-[#44403C] line-clamp-3">
                        {bar.meaning}
                      </div>
                    </div>
                  )}

                  {/* Tags if any */}
                  {bar.tags && bar.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-1.5">
                      {bar.tags.map(t => (
                        <span key={t} className="text-[10px] font-mono text-[#78716C] bg-[#FAF9F5] px-2 py-0.5 rounded border border-[#E5E4DE]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#F5F4EE]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(bar.id, bar.text);
                    }}
                    className="p-1.5 rounded-md text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] transition cursor-pointer text-xs flex items-center gap-1"
                    title="Salin amunisi ke clipboard"
                  >
                    {copiedId === bar.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] text-emerald-600 font-semibold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Salin</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(bar);
                    }}
                    className="p-1.5 rounded-md text-[#A8A29E] hover:text-rose-600 hover:bg-[#FAF9F5] transition cursor-pointer"
                    title="Hapus amunisi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {onSendToLyric && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendToLyric(bar.text);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#F5F4EE] hover:bg-[#EAE8DF] text-[#1C1917] border border-[#E5E4DE] rounded-md transition cursor-pointer"
                    title="Kirim dan sisipkan langsung ke draf lirik yang sedang dibuka"
                  >
                    <Send className="w-3 h-3 text-[#57534E]" />
                    <span>Kirim ke Lirik</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Sederhana Delete Confirmation Popup */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1C1917]">Hapus Amunisi?</h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Amunisi <span className="font-semibold text-[#1C1917]">&quot;{itemToDelete.text.slice(0, 32)}...&quot;</span> akan dihapus permanen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E4DE]">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] bg-[#FFFFFF] border border-[#E5E4DE] rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBar(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition cursor-pointer shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
