import React, { useState, useMemo, useRef } from 'react';
import { X, Search, Sparkles, Send, Plus, BookOpen } from 'lucide-react';
import { BarItem } from '../../types';

export interface WordBankDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
  barItems?: BarItem[];
}

export const WordBankDrawerModal: React.FC<WordBankDrawerModalProps> = ({
  isOpen,
  onClose,
  onInsertText,
  barItems = [],
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Swipe-down drag-to-dismiss state
  const [dragOffset, setDragOffset] = useState(0);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);

  const categories = [
    { key: 'all', label: 'Semua' },
    { key: 'diksi', label: 'Diksi' },
    { key: 'metafor', label: 'Metafor' },
    { key: 'bar', label: 'Bar' },
    { key: 'hook', label: 'Hook' },
  ];

  const getCategoryBadgeLabel = (cat: string) => {
    if (cat === 'diksi') return 'Diksi';
    if (cat === 'metafor' || cat === 'metaphor' || cat === 'idea') return 'Metafor';
    if (cat === 'bar' || cat === 'punchline' || cat === 'rhyme') return 'Bar';
    if (cat === 'hook') return 'Hook';
    return cat;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dy = e.clientY - startYRef.current;
    if (dy > 0) {
      setDragOffset(dy);
    } else {
      setDragOffset(0);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragOffset > 60) {
      onClose();
    }
    setDragOffset(0);
  };

  const handlePointerCancel = () => {
    isDraggingRef.current = false;
    setDragOffset(0);
  };

  const handleSelectWord = (text: string) => {
    onInsertText(text);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      onInsertText(trimmed);
      onClose();
    }
  };

  const filteredItems = useMemo(() => {
    return barItems.filter((item) => {
      let matchCat = selectedCategory === 'all';
      if (!matchCat) {
        if (selectedCategory === 'diksi') matchCat = item.category === 'diksi';
        else if (selectedCategory === 'metafor') {
          matchCat = item.category === 'metafor' || (item.category as string) === 'metaphor' || (item.category as string) === 'idea';
        } else if (selectedCategory === 'bar') {
          matchCat = item.category === 'bar' || (item.category as string) === 'punchline' || (item.category as string) === 'rhyme';
        } else if (selectedCategory === 'hook') {
          matchCat = item.category === 'hook';
        } else {
          matchCat = item.category === selectedCategory;
        }
      }

      const q = search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.text.toLowerCase().includes(q) ||
        (item.meaning && item.meaning.toLowerCase().includes(q)) ||
        item.tags?.some((t) => t.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [barItems, selectedCategory, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDraggingRef.current ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative w-full sm:max-w-xl bg-[#FAF9F5] border-t sm:border border-[#E5E4DE] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden z-10 select-none"
      >
        {/* Mobile grab handle container with touch/pointer drag listener */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none sm:hidden"
          title="Geser ke bawah untuk menutup"
        >
          <div className="w-12 h-1.5 bg-[#D6D3D1] rounded-full hover:bg-[#A8A29E] active:bg-[#78716C] transition-colors" />
        </div>

        {/* Minimalist Header: Icon + "Amunisi" (No subtitle) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#FFFFFF] border-b border-[#E5E4DE]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1C1917]" />
            <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">Amunisi</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4EE] transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Centered Category Tabs */}
        <div className="p-3 bg-[#FAF9F5] border-b border-[#E5E4DE] space-y-2.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kata, metafor, makna, atau bar..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl text-[#1C1917] outline-hidden focus:border-[#1C1917] placeholder:text-[#A8A29E] shadow-2xs"
              />
            </div>
            {search.trim() && (
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-mono font-bold bg-[#1C1917] text-[#FFFFFF] rounded-xl transition hover:bg-[#292524] cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sisipkan</span>
              </button>
            )}
          </form>

          {/* Segmented Category Tabs (Centered, identical to list amunisi) */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 bg-[#F5F4EE] border border-[#E5E4DE] rounded-xl overflow-x-auto scrollbar-none text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-[#FFFFFF] text-[#1C1917] shadow-2xs font-semibold'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items List (Cards styled identically to BankBarListView) */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl">
              <p className="text-xs text-[#78716C]">
                {search.trim()
                  ? `Tidak ada amunisi yang cocok dengan "${search.trim()}".`
                  : 'Belum ada amunisi di kategori ini.'}
              </p>
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelectWord(search.trim())}
                  className="px-3.5 py-1.5 bg-[#1C1917] text-white rounded-xl text-xs font-mono font-semibold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Tetap Sisipkan &quot;{search.trim()}&quot;</span>
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isBarOrHook =
                item.category === 'bar' ||
                item.category === 'hook' ||
                (item.category as string) === 'punchline' ||
                (item.category as string) === 'rhyme';
              const isDiksiOrMetafor =
                item.category === 'diksi' ||
                item.category === 'metafor' ||
                (item.category as string) === 'metaphor' ||
                (item.category as string) === 'idea';
              const formattedDate = new Date(item.createdAt || Date.now())
                .toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                .toUpperCase();

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectWord(item.text)}
                  className="p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] hover:border-[#1C1917] rounded-2xl transition cursor-pointer group flex flex-col justify-between shadow-2xs active:scale-[0.99]"
                >
                  <div>
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-[#78716C] mb-2 font-mono pb-1.5 border-b border-[#F5F4EE]">
                      <div className="flex items-center gap-1.5">
                        <span className="uppercase font-bold text-[#1C1917] bg-[#F5F4EE] px-1.5 py-0.5 rounded text-[9.5px]">
                          {getCategoryBadgeLabel(item.category)}
                        </span>
                        {isBarOrHook && item.rhymeScheme && item.rhymeScheme !== 'Free' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.rhymeScheme}</span>
                          </>
                        )}
                        {isBarOrHook && item.syllableCount ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>~{item.syllableCount} suku kata</span>
                          </>
                        ) : null}
                      </div>

                      {/* Date */}
                      <span className="text-[9.5px] font-mono text-[#A8A29E]">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Main text content (max 4 lines) */}
                    <div className="text-xs sm:text-sm text-[#1C1917] font-semibold leading-relaxed whitespace-pre-wrap pl-2.5 border-l-2 border-[#E5E4DE] group-hover:border-[#1C1917] line-clamp-4 overflow-hidden">
                      {item.text}
                    </div>

                    {/* Makna Section (khusus Diksi & Metafor) */}
                    {isDiksiOrMetafor && item.meaning && (
                      <div className="mt-2.5 p-2 bg-[#FAF9F5] rounded-xl text-xs text-[#57534E] leading-relaxed border border-[#E5E4DE]">
                        <div className="text-[9.5px] uppercase font-mono font-bold text-[#78716C] mb-0.5 tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#78716C]" />
                          <span>Makna:</span>
                        </div>
                        <div className="whitespace-pre-wrap text-[11px] sm:text-xs text-[#44403C] line-clamp-3">
                          {item.meaning}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Row: Tags on Left, Minimalist "Sisipkan" on Right */}
                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#F5F4EE]">
                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9.5px] font-mono text-[#78716C] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#E5E4DE]"
                          >
                            #{t}
                          </span>
                        ))
                      ) : null}
                    </div>

                    <span className="text-[11px] font-semibold text-[#1C1917] group-hover:underline flex items-center gap-1 shrink-0 ml-auto">
                      <Send className="w-3 h-3 text-[#57534E]" />
                      <span>Sisipkan</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
