import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, Music2, Sparkles, Disc } from 'lucide-react';
import { backingTrack, BACKING_TRACK_GENRES, BackingTrackGenre } from '../../utils/backingTrackEngine';

export const BackingTrackLabSection: React.FC = () => {
  const [state, setState] = useState(backingTrack.getState());

  useEffect(() => {
    const unsubscribe = backingTrack.subscribe(() => {
      setState(backingTrack.getState());
    });
    return unsubscribe;
  }, []);

  const activeGenreObj = BACKING_TRACK_GENRES.find((g) => g.id === state.genre) || BACKING_TRACK_GENRES[0];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E4DE] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#1C1917] flex items-center justify-center text-[#FAF9F5] shrink-0">
            <Disc className="w-4 h-4 text-[#D97706] animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-[#1C1917] tracking-tight uppercase">
              Rhythm Backing Track Jam
            </h3>
            <p className="text-[11px] font-mono text-[#78716C] leading-none">
              Web Audio Drum Machine (Trap 808, UK Drill, Blues & Rock Beats)
            </p>
          </div>
        </div>

        {/* Quick Play Status Pill */}
        <div className={`px-2.5 py-1 rounded-xl text-[10.5px] font-mono font-bold flex items-center gap-1.5 border transition ${
          state.isPlaying
            ? 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]'
            : 'bg-[#FAF9F5] text-[#78716C] border-[#E5E4DE]'
        }`}>
          <span className={`w-2 h-2 rounded-full ${state.isPlaying ? 'bg-[#D97706] animate-ping' : 'bg-[#A8A29E]'}`}></span>
          <span>{state.isPlaying ? 'BERJALAN' : 'INAKTIF'}</span>
        </div>
      </div>

      {/* 1. Genre Cards Grid */}
      <div className="space-y-2">
        <span className="text-[10.5px] font-mono font-bold text-[#78716C] uppercase tracking-wider">
          Pilih Genre Beats:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {BACKING_TRACK_GENRES.map((g) => {
            const isSelected = state.genre === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => backingTrack.setGenre(g.id)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 shadow-2xs active:scale-98 ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FAF9F5] border-[#D97706] ring-1 ring-[#D97706]'
                    : 'bg-[#FAF9F5] hover:bg-[#F5F4EE] text-[#1C1917] border-[#E5E4DE]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{g.icon}</span>
                    <span className="font-mono font-bold text-xs">{g.name}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-[#D97706] text-[#FAF9F5]' : 'bg-[#E5E4DE] text-[#44403C]'
                  }`}>
                    {g.soundKitType}
                  </span>
                </div>

                <p className={`text-[10px] font-mono leading-relaxed ${
                  isSelected ? 'text-[#D6D3D1]' : 'text-[#78716C]'
                }`}>
                  {g.description}
                </p>

                <div className={`pt-1 border-t text-[9.5px] font-mono font-medium truncate ${
                  isSelected ? 'border-[#383533] text-[#D97706]' : 'border-[#F0EFEA] text-[#78716C]'
                }`}>
                  ★ {g.recommendedScale}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls Row: BPM Stepper & Volume Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F0EFEA] font-mono text-xs">
        {/* BPM Stepper */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-[#78716C] uppercase">
            Tempo Drum (BPM):
          </label>
          <div className="flex items-center bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl px-2 py-1 justify-between shadow-2xs">
            <button
              type="button"
              onClick={() => backingTrack.setBpm(state.bpm - 5)}
              className="w-7 h-7 flex items-center justify-center text-[#1C1917] hover:bg-[#E5E4DE] font-bold cursor-pointer rounded-lg bg-[#FFFFFF] border border-[#E5E4DE] transition"
            >
              -
            </button>
            <span className="font-bold text-[#1C1917] text-sm">
              {state.bpm} <span className="text-[10px] text-[#78716C]">BPM</span>
            </span>
            <button
              type="button"
              onClick={() => backingTrack.setBpm(state.bpm + 5)}
              className="w-7 h-7 flex items-center justify-center text-[#1C1917] hover:bg-[#E5E4DE] font-bold cursor-pointer rounded-lg bg-[#FFFFFF] border border-[#E5E4DE] transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#78716C] uppercase">
            <span>Volume Drums:</span>
            <span className="text-[#1C1917]">{Math.round(state.volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#E5E4DE] rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Volume2 className="w-4 h-4 text-[#78716C] shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.volume}
              onChange={(e) => backingTrack.setVolume(parseFloat(e.target.value))}
              className="w-full accent-[#1C1917] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Play / Stop Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => backingTrack.togglePlay()}
          className={`w-full py-3 rounded-xl font-mono font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-xs ${
            state.isPlaying
              ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF9F5] ring-2 ring-[#DC2626]/30'
              : 'bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5]'
          }`}
        >
          {state.isPlaying ? (
            <>
              <Square className="w-4 h-4 fill-current animate-pulse" />
              <span>HENTIKAN RHYTHM BEATS</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>MAINKAN RHYTHM BEATS ({activeGenreObj.name} - {state.bpm} BPM)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
