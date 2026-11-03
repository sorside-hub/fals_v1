import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SongDraft } from '../../types';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface ConceptEditorProps {
  currentSong: SongDraft;
  onUpdateSong: (song: SongDraft) => void;
  onBack?: () => void;
}

export const ConceptEditor: React.FC<ConceptEditorProps> = ({
  currentSong,
  onUpdateSong,
  onBack,
}) => {
  const [conceptText, setConceptText] = useState(currentSong.concept || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Tuliskan konsep cerita, latar belakang inspirasi, atau premis emosi lagu ini di sini...',
      }),
    ],
    content: currentSong.concept || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-hidden min-h-[450px] text-[15px] sm:text-[16px] text-[#1C1917] leading-relaxed font-normal px-2 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setConceptText(html);
      onUpdateSong({
        ...currentSong,
        concept: html,
        updatedAt: Date.now(),
      });
    },
  });

  return (
    <div className="w-full flex flex-col bg-[#FAF9F5] min-h-[calc(100vh-140px)] animate-fade-in space-y-3">
      {/* Minimalist Header */}
      {/* On Desktop: Show ← Back Button. On Mobile: HIDE ← Back Button as requested */}
      <div className="sticky top-0 z-20 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E5E4DE] py-2.5 px-3 sm:px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Desktop Back Button ONLY (hidden on mobile) */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="hidden md:flex w-9 h-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E4DE] bg-[#FFFFFF] hover:bg-[#F5F4EE] text-[#1C1917] transition cursor-pointer shadow-2xs"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4 text-[#57534E]" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-[#78716C] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#78716C] block">
                Konsep & Premis
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-[#1C1917] tracking-tight truncate">
                {currentSong.title || 'Tanpa Judul'}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main Minimalist TipTap Writing Canvas (No Syllable Counter Gutter) */}
      <div className="flex-1 w-full max-w-4xl mx-auto bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs p-4 sm:p-6 my-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
