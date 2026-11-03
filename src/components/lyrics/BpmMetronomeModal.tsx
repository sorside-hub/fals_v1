import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Activity } from 'lucide-react';

interface BpmMetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
  onChangeBpm: (newBpm: number) => void;
}

export const BpmMetronomeModal: React.FC<BpmMetronomeModalProps> = ({
  isOpen,
  onClose,
  bpm,
  onChangeBpm,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Audio click function via Web Audio API
  const playClick = (isAccent: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch: 1050Hz for Beat 1 accent, 780Hz for beats 2, 3, 4
      osc.frequency.setValueAtTime(isAccent ? 1050 : 780, ctx.currentTime);

      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {
      console.warn('Metronome audio notice:', e);
    }
  };

  // Metronome Loop: continues playing in background even if modal is closed (isOpen=false)
  useEffect(() => {
    if (!isPlaying) {
      setCurrentBeat(0);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    let beat = 0;

    const tick = () => {
      const isAccent = beat === 0;
      playClick(isAccent);
      setCurrentBeat(beat);
      beat = (beat + 1) % 4;
    };

    tick();
    const timerId = setInterval(tick, intervalMs);

    return () => {
      clearInterval(timerId);
    };
  }, [isPlaying, bpm]);

  // Tap Tempo Logic
  const handleTapTempo = () => {
    const now = Date.now();
    const times = [...tapTimesRef.current, now].filter((t) => now - t < 3000);
    tapTimesRef.current = times;

    if (times.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const calculatedBpm = Math.round(60000 / avgInterval);
        const clampedBpm = Math.min(240, Math.max(40, calculatedBpm));
        onChangeBpm(clampedBpm);
      }
    }
  };

  const adjustBpm = (delta: number) => {
    const nextBpm = Math.min(240, Math.max(40, bpm + delta));
    onChangeBpm(nextBpm);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in cursor-pointer"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-xl overflow-hidden flex flex-col space-y-4 p-5 animate-scale-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1C1917]" />
            <h3 className="text-sm font-bold text-[#1C1917]">Tempo & Metronom</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big BPM Display & Beat Flashing Lights */}
        <div className="flex flex-col items-center justify-center py-2 bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl space-y-3">
          <div className="text-center">
            <span className="text-4xl font-extrabold font-mono text-[#1C1917] tracking-tight tabular-nums">
              {bpm}
            </span>
            <span className="text-xs font-bold text-[#78716C] block uppercase tracking-wider mt-0.5">
              BPM
            </span>
          </div>

          {/* 4 Visual Beat Circles */}
          <div className="flex items-center gap-2 pt-1">
            {[0, 1, 2, 3].map((b) => {
              const isActive = isPlaying && currentBeat === b;
              const isAccent = b === 0;

              return (
                <div
                  key={b}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-75 ${
                    isActive
                      ? isAccent
                        ? 'bg-amber-500 scale-125 shadow-xs'
                        : 'bg-[#1C1917] scale-110 shadow-2xs'
                      : 'bg-[#EAE8DF] border border-[#E5E4DE]'
                  }`}
                  title={`Beat ${b + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#78716C]">
            <span>40 BPM (Lento)</span>
            <span>240 BPM (Presto)</span>
          </div>
          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => onChangeBpm(Number(e.target.value))}
            className="w-full accent-[#1C1917] cursor-pointer"
          />
        </div>

        {/* Increment / Decrement & Tap Tempo Grid */}
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => adjustBpm(-5)}
            className="py-1.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-mono font-bold text-[#44403C] transition cursor-pointer shadow-2xs"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => adjustBpm(-1)}
            className="py-1.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-mono font-bold text-[#44403C] transition cursor-pointer shadow-2xs"
          >
            -1
          </button>
          <button
            type="button"
            onClick={handleTapTempo}
            className="col-span-1 py-1.5 bg-[#EAE8DF] hover:bg-[#DFDCD2] border border-[#E5E4DE] rounded-lg text-[11px] font-bold text-[#1C1917] transition cursor-pointer shadow-2xs active:scale-95"
            title="Ketuk irama jari secara berulang untuk menentukan tempo"
          >
            TAP
          </button>
          <button
            type="button"
            onClick={() => adjustBpm(1)}
            className="py-1.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-mono font-bold text-[#44403C] transition cursor-pointer shadow-2xs"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => adjustBpm(5)}
            className="py-1.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] rounded-lg text-xs font-mono font-bold text-[#44403C] transition cursor-pointer shadow-2xs"
          >
            +5
          </button>
        </div>

        {/* Play / Stop Primary Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F5]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Hentikan Metronom</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Putar Metronom ({bpm} BPM)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
