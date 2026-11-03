import React from 'react';
import { Check } from 'lucide-react';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';

export interface BarWritingToolbarProps {
  rhymeScheme: string;
  onSelectRhymeScheme: (scheme: string) => void;
  onInsertSnippet?: (snippet: string) => void;
  onDismissKeyboard?: () => void;
  variant?: 'auto' | 'desktop' | 'mobile';
  keyboardOffset?: number;
}

export const BarWritingToolbar: React.FC<BarWritingToolbarProps> = ({
  rhymeScheme,
  onSelectRhymeScheme,
  onDismissKeyboard,
  variant = 'auto',
  keyboardOffset: customKeyboardOffset,
}) => {
  const schemes = ['AABB', 'ABAB', 'AAAA', 'Internal', 'Free'];
  const { isKeyboardVisible, keyboardOffset: detectedOffset } = useVirtualKeyboard();

  const effectiveOffset = customKeyboardOffset !== undefined ? customKeyboardOffset : detectedOffset;

  const renderDesktopStrip = () => (
    <div className="w-full flex items-center justify-between py-2 border-b border-[#F0EFEA] text-xs text-[#78716C] animate-fade-in">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-mono mr-1 shrink-0">Skema Rima Cepat:</span>
        {schemes.map((s) => (
          <button
            key={s}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onSelectRhymeScheme(s);
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
              rhymeScheme === s
                ? 'bg-[#1C1917] text-[#FAF9F5] border-[#1C1917]'
                : 'bg-[#FFFFFF] text-[#44403C] border-[#E5E4DE] hover:bg-[#F5F4EE]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMobileStrip = () => (
    <div
      style={{
        bottom: `${effectiveOffset}px`,
      }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#FAF9F5]/98 backdrop-blur-md border-t border-b border-[#E5E4DE] shadow-xl px-2 py-1.5 flex items-center gap-1.5 animate-fade-in"
    >
      <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        <span className="text-[10px] font-mono text-[#78716C] uppercase shrink-0 mr-1">Rima:</span>
        {schemes.map((s) => (
          <button
            key={s}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onSelectRhymeScheme(s);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium shrink-0 border ${
              rhymeScheme === s
                ? 'bg-[#1C1917] text-[#FAF9F5] border-[#1C1917]'
                : 'bg-[#FFFFFF] text-[#1C1917] border-[#E5E4DE] active:bg-[#EAE8DF]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {onDismissKeyboard && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onDismissKeyboard();
          }}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md bg-[#F5F4EE] hover:bg-[#EAE8DF] text-[#1C1917] active:scale-95 border border-[#E5E4DE] cursor-pointer"
          title="Tutup Keyboard"
        >
          <Check className="w-4 h-4 text-[#1C1917]" />
        </button>
      )}
    </div>
  );

  if (variant === 'desktop') {
    return renderDesktopStrip();
  }

  if (variant === 'mobile') {
    return renderMobileStrip();
  }

  return (
    <>
      <div className="hidden md:block">
        {renderDesktopStrip()}
      </div>
      {isKeyboardVisible && (
        <div className="md:hidden">
          {renderMobileStrip()}
        </div>
      )}
    </>
  );
};
