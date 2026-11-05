import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, Disc, Save, FolderOpen, Trash2, Plus, Sparkles, Check } from 'lucide-react';
import { drumSequencer, DRUM_INSTRUMENTS, DEFAULT_PATTERNS, SoundKitType, SavedDrumPattern } from '../../utils/drumSequencerEngine';

export const CustomDrumBuilderView: React.FC = () => {
  const [state, setState] = useState(drumSequencer.getState());
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [patternName, setPatternName] = useState<string>('Pola Drumku 1');
  const [savedPatterns, setSavedPatterns] = useState<SavedDrumPattern[]>(() => {
    try {
      const stored = localStorage.getItem('fals_saved_drum_patterns');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_PATTERNS;
  });
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    const unsubState = drumSequencer.subscribe(() => {
      setState(drumSequencer.getState());
    });
    const unsubStep = drumSequencer.subscribeStep((step) => {
      setActiveStep(step);
    });
    return () => {
      unsubState();
      unsubStep();
    };
  }, []);

  const handleSavePattern = () => {
    const newPattern: SavedDrumPattern = {
      id: `pattern-${Date.now()}`,
      name: patternName.trim() || 'Tanpa Judul',
      kit: state.kit,
      bpm: state.bpm,
      steps: state.steps,
      updatedAt: Date.now(),
    };

    const updatedList = [newPattern, ...savedPatterns];
    setSavedPatterns(updatedList);
    try {
      localStorage.setItem('fals_saved_drum_patterns', JSON.stringify(updatedList));
    } catch {
      // ignore
    }
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleDeletePattern = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedPatterns.filter((p) => p.id !== id);
    setSavedPatterns(filtered);
    try {
      localStorage.setItem('fals_saved_drum_patterns', JSON.stringify(filtered));
    } catch {
      // ignore
    }
  };

  const soundKits: { id: SoundKitType; label: string; desc: string }[] = [
    { id: 'trap', label: 'Trap 808 Kit', desc: 'Sub 808 booming & crisp hats' },
    { id: 'drill', label: 'UK Drill Kit', desc: 'Sliding 808 & drill rims' },
    { id: 'acoustic', label: 'Acoustic Rock Kit', desc: 'Punchy wood kick & snare' },
    { id: 'lofi', label: 'Lo-Fi Chill Kit', desc: 'Muffled warm tape beats' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-20 animate-fade-in select-none">
      {/* Header Card */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-[#1C1917]" />
          <span className="text-base font-bold text-[#1C1917] tracking-tight">Drum Sequencer Builder</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSavedModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-xs font-mono font-bold text-[#1C1917] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Preset ({savedPatterns.length})</span>
          </button>
        </div>
      </div>

      {/* Main Sequencer Control & Grid Card */}
      <div className="w-full bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Top Controls Row: Kit Picker, BPM, Play Button */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-[#F0EFEA] pb-4">
          {/* Sound Kit Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-[#78716C] uppercase font-bold">
              Pilih Sound Kit:
            </label>
            <select
              value={state.kit}
              onChange={(e) => drumSequencer.setKit(e.target.value as SoundKitType)}
              className="w-full h-10 px-3 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl font-mono text-xs font-bold text-[#1C1917] cursor-pointer focus:outline-none"
            >
              {soundKits.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label} ({k.desc})
                </option>
              ))}
            </select>
          </div>

          {/* BPM Stepper */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-[#78716C] uppercase font-bold">
              Tempo (BPM):
            </label>
            <div className="flex items-center bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl px-2 h-10 justify-between font-mono">
              <button
                type="button"
                onClick={() => drumSequencer.setBpm(state.bpm - 5)}
                className="w-7 h-7 flex items-center justify-center text-[#1C1917] hover:bg-[#E5E4DE] font-bold rounded-lg bg-[#FFFFFF] border border-[#E5E4DE] cursor-pointer"
              >
                -
              </button>
              <span className="font-bold text-[#1C1917] text-xs">
                {state.bpm} <span className="text-[10px] text-[#78716C]">BPM</span>
              </span>
              <button
                type="button"
                onClick={() => drumSequencer.setBpm(state.bpm + 5)}
                className="w-7 h-7 flex items-center justify-center text-[#1C1917] hover:bg-[#E5E4DE] font-bold rounded-lg bg-[#FFFFFF] border border-[#E5E4DE] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Master Play / Stop Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => drumSequencer.togglePlay()}
              className={`w-full h-10 rounded-xl font-mono font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-xs ${
                state.isPlaying
                  ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF9F5] ring-2 ring-[#DC2626]/30'
                  : 'bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5]'
              }`}
            >
              {state.isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current animate-pulse" />
                  <span>Stop Beat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Beat</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 32 Steps Sequencer Grid (2 Bars of 16th notes) */}
        <div className="space-y-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div className="min-w-[700px] space-y-2">
            {DRUM_INSTRUMENTS.map((inst) => {
              const rowSteps = state.steps[inst.id] || Array(32).fill(false);

              return (
                <div key={inst.id} className="flex items-center gap-2 bg-[#FAF9F5] p-2 rounded-xl border border-[#E5E4DE]">
                  {/* Instrument Label */}
                  <div className="w-32 flex items-center gap-2 shrink-0">
                    <span className="text-base">{inst.icon}</span>
                    <span className="font-mono font-bold text-xs text-[#1C1917] truncate">{inst.name}</span>
                  </div>

                  {/* 32 Step Buttons (Divided into 2 groups of 16 for Bar 1 & Bar 2) */}
                  <div className="flex items-center gap-1 flex-1">
                    {rowSteps.slice(0, 32).map((isActive, sIdx) => {
                      const isCurrentPlayingStep = state.isPlaying && activeStep === sIdx;
                      const isBarBoundary = sIdx % 4 === 0;

                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => drumSequencer.toggleStep(inst.id, sIdx)}
                          className={`flex-1 h-8 rounded-lg transition-all cursor-pointer border ${
                            isBarBoundary ? 'ml-0.5' : ''
                          } ${
                            isActive
                              ? isCurrentPlayingStep
                                ? 'bg-[#10B981] border-[#059669] shadow-sm ring-1 ring-[#10B981]'
                                : 'bg-[#1C1917] border-[#1C1917] text-[#FAF9F5]'
                              : isCurrentPlayingStep
                              ? 'bg-[#E5E4DE] border-[#A8A29E]'
                              : sIdx % 8 < 4
                              ? 'bg-[#FFFFFF] border-[#E5E4DE] hover:border-[#D6D3D1]'
                              : 'bg-[#F5F4EE] border-[#E5E4DE] hover:border-[#D6D3D1]'
                          }`}
                          title={`Step ${sIdx + 1}`}
                        >
                          <span className="sr-only">Step {sIdx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Save Row */}
        <div className="pt-3 border-t border-[#F0EFEA] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={patternName}
              onChange={(e) => setPatternName(e.target.value)}
              placeholder="Nama Pola Drum..."
              className="h-10 px-3 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl font-bold text-[#1C1917] w-full sm:w-60 focus:outline-none focus:border-[#1C1917]"
            />
            <button
              type="button"
              onClick={handleSavePattern}
              className="h-10 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-[#FAF9F5] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pattern</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Pattern berhasil disimpan!</span>
            </div>
          )}
        </div>
      </div>

      {/* Preset / Saved Patterns Modal */}
      {isSavedModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none"
          onClick={() => setIsSavedModalOpen(false)}
        >
          <div
            className="bg-[#24211F] text-[#FAF9F5] border border-[#44403C] rounded-2xl p-4 sm:p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl space-y-3 [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#383533] pb-2.5">
              <span className="font-mono font-black text-xs sm:text-sm uppercase tracking-wide">
                Daftar Preset & Pattern Tersimpan
              </span>
              <button
                type="button"
                onClick={() => setIsSavedModalOpen(false)}
                className="w-6 h-6 rounded-lg bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 font-mono">
              {savedPatterns.map((pat) => (
                <div
                  key={pat.id}
                  onClick={() => {
                    drumSequencer.setPattern(pat);
                    setPatternName(pat.name);
                    setIsSavedModalOpen(false);
                  }}
                  className="p-3 rounded-xl bg-[#1C1917] hover:bg-[#292524] border border-[#383533] cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-[#FAF9F5] block">{pat.name}</span>
                    <span className="text-[10px] text-[#A8A29E] block">
                      Kit: <span className="uppercase text-[#D97706] font-bold">{pat.kit}</span> • {pat.bpm} BPM
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeletePattern(pat.id, e)}
                    className="w-7 h-7 rounded-lg bg-[#383533] hover:bg-red-600 text-[#A8A29E] hover:text-[#FAF9F5] flex items-center justify-center transition cursor-pointer"
                    title="Hapus Preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
