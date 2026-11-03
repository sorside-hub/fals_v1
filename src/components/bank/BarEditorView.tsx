import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarItem, BarCategory } from '../../types';
import { countSyllablesInLine } from '../../utils/syllableCounter';
import { CategoryPopover } from './CategoryPopover';
import { RhymeSchemePopover } from './RhymeSchemePopover';
import {
  ArrowLeft,
  Send,
  Copy,
  Check,
  ChevronDown,
  Tag,
  Plus,
  X,
  BookOpen,
} from 'lucide-react';

interface BarEditorViewProps {
  bar: BarItem;
  onSaveBar: (updatedBar: BarItem) => void;
  onBack: () => void;
  onSendToLyric?: (text: string) => void;
}

export const BarEditorView: React.FC<BarEditorViewProps> = ({
  bar,
  onSaveBar,
  onBack,
  onSendToLyric,
}) => {
  const [text, setText] = useState(bar.text);
  const [meaning, setMeaning] = useState(bar.meaning || '');
  const [category, setCategory] = useState<BarCategory>(() => {
    const cat = bar.category || 'diksi';
    if (cat === 'punchline' || cat === 'rhyme') return 'bar';
    if (cat === 'idea' || (cat as string) === 'metaphor') return 'metafor';
    return cat;
  });
  const [rhymeScheme, setRhymeScheme] = useState<string>(bar.rhymeScheme || 'Free');
  const [tags, setTags] = useState<string[]>(bar.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const formattedDate = useMemo(() => {
    return new Date(bar.createdAt || Date.now()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  }, [bar.createdAt]);

  // Popover state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRhymeOpen, setIsRhymeOpen] = useState(false);

  // Line-by-line syllable count for Bar & Hook
  const linesInfo = useMemo(() => {
    const rawLines = text.split('\n');
    return rawLines.map((line, idx) => {
      const syllables = countSyllablesInLine(line);
      return {
        lineNum: idx + 1,
        lineText: line,
        syllables,
        isEmpty: line.trim() === '',
      };
    });
  }, [text]);

  const totalSyllables = useMemo(() => {
    return linesInfo.reduce((sum, l) => sum + l.syllables, 0);
  }, [linesInfo]);

  // Autosave effect (debounced 350ms)
  const isFirstRender = useRef(true);
  const latestDataRef = useRef({ text, meaning, category, rhymeScheme, tags, totalSyllables });
  latestDataRef.current = { text, meaning, category, rhymeScheme, tags, totalSyllables };

  const triggerSave = () => {
    const d = latestDataRef.current;
    const updated: BarItem = {
      ...bar,
      text: d.text,
      meaning: d.meaning,
      category: d.category,
      rhymeScheme: d.rhymeScheme,
      syllableCount: d.totalSyllables,
      tags: d.tags,
    };
    onSaveBar(updated);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      triggerSave();
    }, 350);

    return () => clearTimeout(timer);
  }, [text, meaning, category, rhymeScheme, tags, totalSyllables]);

  // Flush save on unmount
  useEffect(() => {
    return () => {
      triggerSave();
    };
  }, []);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCopy = () => {
    const copyContent =
      (category === 'diksi' || category === 'metafor') && meaning.trim()
        ? `${text.trim()}\n\nMakna:\n${meaning.trim()}`
        : text.trim();
    navigator.clipboard.writeText(copyContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleSend = () => {
    triggerSave();
    if (onSendToLyric) {
      onSendToLyric(text);
    }
  };

  const getCategoryLabel = (cat: BarCategory) => {
    switch (cat) {
      case 'diksi':
        return 'Diksi';
      case 'metafor':
        return 'Metafor';
      case 'bar':
        return 'Bar';
      case 'hook':
        return 'Hook';
      default:
        return 'Diksi';
    }
  };

  const isBarOrHook = category === 'bar' || category === 'hook';

  return (
    <div className="w-full flex flex-col bg-[#FAF9F5] min-h-[calc(100vh-140px)] animate-fade-in">
      {/* 1. Header Toolbar */}
      <div className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E5E4DE] py-2 px-1 mb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Back button: Icon only, hidden on mobile */}
            <button
              type="button"
              onClick={() => {
                triggerSave();
                onBack();
              }}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-[#E5E4DE] bg-[#FFFFFF] hover:bg-[#F5F4EE] transition cursor-pointer text-[#57534E] shadow-2xs"
              title="Kembali ke Amunisi"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Custom Category Popover Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsRhymeOpen(false);
                }}
                className="h-8 flex items-center gap-1.5 px-2.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-semibold text-[#1C1917] cursor-pointer shadow-2xs transition"
              >
                <span className="text-[#78716C] font-normal">Kategori:</span>
                <span>{getCategoryLabel(category)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
              </button>

              <CategoryPopover
                isOpen={isCategoryOpen}
                onClose={() => setIsCategoryOpen(false)}
                currentCategory={category}
                onSelectCategory={(newCat) => setCategory(newCat)}
                align="left"
              />
            </div>

            {/* Custom Rhyme Popover Dropdown: ONLY for bar & hook */}
            {isBarOrHook && (
              <div className="relative animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setIsRhymeOpen(!isRhymeOpen);
                    setIsCategoryOpen(false);
                  }}
                  className="h-8 flex items-center gap-1.5 px-2.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-semibold text-[#1C1917] cursor-pointer shadow-2xs transition"
                >
                  <span className="text-[#78716C] font-normal">Rima:</span>
                  <span>{rhymeScheme || 'Free'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
                </button>

                <RhymeSchemePopover
                  isOpen={isRhymeOpen}
                  onClose={() => setIsRhymeOpen(false)}
                  currentScheme={rhymeScheme}
                  onSelectScheme={(newScheme) => setRhymeScheme(newScheme)}
                  align="left"
                />
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#78716C] mr-0.5">
              {formattedDate}
            </span>

            {/* Copy Button: Icon only */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] hover:bg-[#F5F4EE] text-[#1C1917] border border-[#E5E4DE] rounded-lg transition cursor-pointer shadow-2xs"
              title="Salin Amunisi"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-[#57534E]" />
              )}
            </button>

            {/* Send to Lyric: Icon only */}
            {onSendToLyric && (
              <button
                type="button"
                onClick={handleSend}
                className="w-8 h-8 flex items-center justify-center bg-[#FFFFFF] hover:bg-[#F5F4EE] text-[#1C1917] border border-[#E5E4DE] rounded-lg transition cursor-pointer shadow-2xs"
                title="Kirim ke Lirik"
              >
                <Send className="w-4 h-4 text-[#57534E]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Editor Canvas */}
      <div className="relative flex flex-col w-full bg-[#FAF9F5] paper-pattern rounded-2xl border border-[#E5E4DE] overflow-hidden shadow-2xs">
        {/* CASE A: Category is 'bar' or 'hook' -> Match lyric editor (gutter line numbers + live syllable count, NO makna) */}
        {isBarOrHook ? (
          <div className="flex w-full min-h-[300px] sm:min-h-[360px]">
            {/* Left Gutter: Live Syllable Count */}
            <div className="w-7 sm:w-8 shrink-0 py-3 select-none border-r border-[#E5E4DE]/60 bg-[#FAF9F5] font-mono text-[11px] text-[#A8A29E] flex flex-col items-center">
              {linesInfo.map((l) => (
                <div
                  key={l.lineNum}
                  className="h-[1.6rem] flex items-center justify-center w-full px-1"
                >
                  {l.syllables > 0 ? (
                    <span
                      className="text-[10px] font-mono font-medium text-[#78716C] px-1 rounded bg-[#EAE8DF]"
                      title={`${l.syllables} suku kata`}
                    >
                      {l.syllables}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Main Textarea matching line-height exactly */}
            <div className="flex-1 py-3 px-3 sm:px-4">
              <textarea
                rows={Math.max(8, linesInfo.length + 1)}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tulis baris lirik, punchline, atau rima hook di sini...&#10;Tekan Enter untuk baris baru."
                className="w-full h-full bg-transparent border-none outline-hidden text-[#1C1917] text-[14.5px] sm:text-[15.5px] leading-[1.6rem] resize-none font-normal placeholder:text-[#A8A29E]"
              />
            </div>
          </div>
        ) : (
          /* CASE B: Category is 'diksi' or 'metafor' -> No syllable gutter, has dedicated Makna field */
          <div className="flex flex-col w-full">
            {/* Main Word / Metaphor Input */}
            <div className="p-4 sm:p-5 min-h-[140px] sm:min-h-[160px]">
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  category === 'diksi'
                    ? "Tulis kata, istilah, atau diksi puitis di sini...&#10;Contoh: 'Aporia' atau 'Saujana'"
                    : "Tulis metafor, majas, atau kiasan rasa di sini...&#10;Contoh: 'Jendela berembun menatap sepi'"
                }
                className="w-full h-full bg-transparent border-none outline-hidden text-[#1C1917] text-[16px] sm:text-[18px] leading-relaxed resize-none font-semibold placeholder:font-normal placeholder:text-[#A8A29E]"
              />
            </div>

            {/* Dedicated Makna Section */}
            <div className="border-t border-[#E5E4DE] bg-[#FFFFFF] p-4 sm:p-5 space-y-2">
              <label className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-[#57534E]" />
                <span>Makna</span>
              </label>
              <textarea
                rows={3}
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder={
                  category === 'diksi'
                    ? 'Tulis makna, arti istilah, atau nuansa rasa dari kata ini...'
                    : 'Tulis maksud metafor, analogi simbolis, atau konteks suasana di sini...'
                }
                className="w-full text-xs sm:text-sm text-[#1C1917] bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl p-3 focus:bg-[#FFFFFF] focus:border-[#1C1917] outline-hidden resize-none transition leading-relaxed placeholder:text-[#A8A29E]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Integrated Tags Section */}
      <div className="py-3 px-1 space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#78716C]">
          <span className="flex items-center gap-1.5 uppercase font-mono text-[11px]">
            <Tag className="w-3.5 h-3.5" />
            <span>Label & Tag Amunisi</span>
          </span>
          <span className="text-[11px] font-mono">{tags.length} tag</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 text-xs font-mono bg-[#FFFFFF] border border-[#E5E4DE] text-[#1C1917] px-2.5 py-1 rounded-lg shadow-2xs"
            >
              <span>#{t}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="hover:text-rose-600 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Add tag input */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Tambah tag..."
              className="w-24 sm:w-32 px-2.5 py-1 text-xs bg-[#FFFFFF] border border-[#E5E4DE] rounded-lg outline-hidden text-[#1C1917] focus:border-[#1C1917] shadow-2xs"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="p-1 rounded bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#1C1917] cursor-pointer shadow-2xs"
              title="Tambah Tag"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
