import React, { useState, useEffect } from 'react';
import { Play, Square, SlidersHorizontal, X, Volume2, Music2, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { backingTrack, BACKING_TRACK_GENRES, BackingTrackGenre } from '../../utils/backingTrackEngine';

export const FloatingBackingTrackWidget: React.FC = () => {
  const [state, setState] = useState(backingTrack.getState());
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const unsubscribe = backingTrack.subscribe(() => {
      setState(backingTrack.getState());
    });
    return unsubscribe;
  }, []);

  const activeGenreObj = BACKING_TRACK_GENRES.find((g) => g.id === state.genre) || BACKING_TRACK_GENRES[0];

  return (
    <>
      {/* FLOATING MINI PLAYER WIDGET (DOCK AT BOTTOM RIGHT ABOVE NAV BAR) */}
      <div className="fixed bottom-18 right-3 sm:right-6 z-40 select-none animate-fade-in flex flex-col items-end gap-1.5">
        {!isMinimized ? (
          <div className="bg-[#1C1917]/95 text-[#FAF9F5] border border-[#383533] backdrop-blur-md rounded-2xl p-1.5 sm:p-2 shadow-2xl flex items-center gap-2 max-w-[calc(100vw-24px)] transition-all">
            {/* Genre Badge & Setup Trigger */}
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#292524] hover:bg-[#383533] border border-[#44403C] transition cursor-pointer text-left min-w-0"
              title="Buka Pengaturan Drum Backing Track"
            >
              <span className="text-sm shrink-0">{activeGenreObj.icon}</span>
              <div className="flex flex-col min-w-0 pr-1">
                <span className="font-mono font-bold text-[10.5px] text-[#FAF9F5] truncate leading-tight">
                  {activeGenreObj.name}
                </span>
                <span className="font-mono text-[9px] text-[#D97706] font-semibold truncate leading-tight">
                  {state.bpm} BPM
                </span>
              </div>
            </button>

            {/* Play / Stop Toggle Button */}
            <button
              type="button"
              onClick={() => backingTrack.togglePlay()}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-mono font-bold flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0 shadow-md ${
                state.isPlaying
                  ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF9F5] ring-2 ring-[#DC2626]/40'
                  : 'bg-[#D97706] hover:bg-[#B45309] text-[#FAF9F5]'
              }`}
              title={state.isPlaying ? 'Hentikan Rhythm Backing Track' : 'Mainkan Rhythm Backing Track'}
            >
              {state.isPlaying ? (
                <Square className="w-4 h-4 fill-current animate-pulse" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Setup Settings Icon */}
            <button
              type="button"
              onClick={() => setIsSetupOpen((prev) => !prev)}
              className="w-8 h-8 rounded-xl bg-[#292524] hover:bg-[#383533] text-[#A8A29E] hover:text-[#FAF9F5] flex items-center justify-center transition cursor-pointer shrink-0"
              title="Pengaturan Genre & Tempo"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Minimize Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="w-6 h-6 rounded-lg text-[#78716C] hover:text-[#FAF9F5] flex items-center justify-center cursor-pointer shrink-0"
              title="Ciutkan Widget"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Minimized Icon Pill */
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xl transition active:scale-95 cursor-pointer font-mono text-[10px] font-bold ${
              state.isPlaying
                ? 'bg-[#D97706] text-[#FAF9F5] border-[#D97706] animate-bounce'
                : 'bg-[#1C1917] text-[#FAF9F5] border-[#383533]'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Drum Jam {state.isPlaying ? '● ON' : ''}</span>
            <ChevronUp className="w-3 h-3 ml-0.5" />
          </button>
        )}
      </div>

      {/* BACKING TRACK SETUP MODAL / DRAWER */}
      {isSetupOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none"
          onClick={() => setIsSetupOpen(false)}
        >
          <div
            className="bg-[#24211F] text-[#FAF9F5] border border-[#44403C] rounded-2xl p-4 sm:p-5 w-full max-w-md max-h-[88vh] overflow-y-auto shadow-2xl space-y-4 [scrollbar-width:thin] [scrollbar-color:#57534E_transparent]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#383533] pb-2.5">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-[#D97706]" />
                <span className="font-mono font-black text-xs sm:text-sm uppercase tracking-wide">
                  Pengaturan Rhythm Backing Track
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSetupOpen(false)}
                className="w-6 h-6 rounded-lg bg-[#383533] hover:bg-[#57534E] flex items-center justify-center text-[#FAF9F5] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1. Genre Selection Grid */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="text-[#A8A29E] font-bold text-[11px] flex items-center justify-between">
                <span>PILIH GENRE DRUM:</span>
                <span className="text-[#D97706] text-[10px] font-normal">Authentic Web Audio Beats</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BACKING_TRACK_GENRES.map((g) => {
                  const isSelected = state.genre === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => backingTrack.setGenre(g.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-[#1C1917] border-[#D97706] ring-1 ring-[#D97706]'
                          : 'bg-[#1C1917]/60 border-[#383533] hover:border-[#57534E]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{g.icon}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-[#D97706] text-[#FAF9F5]' : 'bg-[#292524] text-[#A8A29E]'
                        }`}>
                          {g.soundKitType}
                        </span>
                      </div>
                      <span className="font-bold text-[11px] text-[#FAF9F5]">{g.name}</span>
                      <span className="text-[9px] text-[#A8A29E] leading-tight line-clamp-2">{g.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recommended Scales Badge for Selected Genre */}
            <div className="bg-[#1C1917] border border-[#383533] p-2.5 rounded-xl text-[10.5px] font-mono flex items-center gap-2 text-[#D6D3D1]">
              <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
              <div>
                <span className="text-[#A8A29E] font-bold">Rekomendasi Skala Soloing: </span>
                <span className="text-[#FAF9F5] font-semibold">{activeGenreObj.recommendedScale}</span>
              </div>
            </div>

            {/* 2. BPM Stepper & Volume Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#383533] font-mono text-xs">
              {/* BPM Stepper */}
              <div className="space-y-1">
                <div className="text-[#A8A29E] font-bold text-[10.5px]">TEMPO (BPM):</div>
                <div className="flex items-center bg-[#1C1917] border border-[#383533] rounded-xl px-2 py-1 justify-between">
                  <button
                    type="button"
                    onClick={() => backingTrack.setBpm(state.bpm - 5)}
                    className="w-7 h-7 flex items-center justify-center text-[#A8A29E] hover:text-[#FAF9F5] font-bold cursor-pointer bg-[#292524] rounded-lg"
                  >
                    -
                  </button>
                  <span className="font-bold text-[#FAF9F5] text-sm">
                    {state.bpm} <span className="text-[10px] text-[#A8A29E]">BPM</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => backingTrack.setBpm(state.bpm + 5)}
                    className="w-7 h-7 flex items-center justify-center text-[#A8A29E] hover:text-[#FAF9F5] font-bold cursor-pointer bg-[#292524] rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="text-[#A8A29E] font-bold text-[10.5px] flex items-center justify-between">
                  <span>VOLUME BACKING TRACK:</span>
                  <span className="text-[#FAF9F5]">{Math.round(state.volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-2 bg-[#1C1917] border border-[#383533] rounded-xl px-2.5 py-1.5">
                  <Volume2 className="w-4 h-4 text-[#A8A29E] shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.volume}
                    onChange={(e) => backingTrack.setVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#D97706] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Main Action Play / Stop Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => backingTrack.togglePlay()}
                className={`w-full py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg ${
                  state.isPlaying
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF9F5]'
                    : 'bg-[#D97706] hover:bg-[#B45309] text-[#FAF9F5]'
                }`}
              >
                {state.isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>HENTIKAN BACKING TRACK</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>MAINKAN BACKING TRACK ({activeGenreObj.name})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
