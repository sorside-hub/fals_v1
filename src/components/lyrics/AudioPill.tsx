import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Edit2, Trash2, Check, Music } from 'lucide-react';
import { AudioMemo } from '../../types';
import { getAudioBlob } from '../../utils/audioStorage';

interface AudioPillProps {
  memo: AudioMemo;
  onRename: (newName: string) => void;
  onDeleteRequest: () => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onEnded: () => void;
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AudioPill: React.FC<AudioPillProps> = ({
  memo,
  onRename,
  onDeleteRequest,
  isPlaying,
  onPlayToggle,
  onEnded,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(memo.duration || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(memo.name);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch Audio Blob when needed
  useEffect(() => {
    let url: string | null = null;
    let isCancelled = false;

    const loadBlob = async () => {
      setIsLoadingAudio(true);
      try {
        const blob = await getAudioBlob(memo.id);
        if (blob && !isCancelled) {
          url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
      } catch (err) {
        console.error('Error loading audio memo:', err);
      } finally {
        if (!isCancelled) setIsLoadingAudio(false);
      }
    };

    loadBlob();

    return () => {
      isCancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [memo.id]);

  // Audio element management
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setActualDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setCurrentTime(0);
      onEnded();
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [audioUrl, onEnded]);

  // Play / Pause reactivity
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Playback error or blocked:', err);
        onEnded();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, onEnded]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressTrackRef.current || !actualDuration) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * actualDuration;

    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSaveRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingName.trim()) {
      onRename(editingName.trim());
    }
    setIsEditing(false);
  };

  const progressPercent = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;

  return (
    <div
      className={`group relative flex flex-col p-2.5 rounded-xl border transition shadow-2xs ${
        isPlaying
          ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40'
          : 'bg-[#FFFFFF] border-[#E5E4DE] hover:border-[#1C1917]'
      }`}
    >
      {/* Top Line: Play Button, Name & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Circular Play / Pause Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoadingAudio) onPlayToggle();
            }}
            disabled={isLoadingAudio}
            className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition cursor-pointer shadow-xs ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-700 ring-2 ring-amber-500/30'
                : 'bg-[#1C1917] text-[#FAF9F5] hover:bg-[#292524]'
            }`}
            title={isPlaying ? 'Jeda Audio' : 'Putar Audio'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          {/* Title or Rename Input */}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(e);
                  }}
                  className="w-full px-2 py-0.5 text-xs bg-[#FAF9F5] border border-[#1C1917] rounded outline-hidden font-bold"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="p-1 bg-[#1C1917] text-white rounded cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-xs text-[#1C1917] truncate">
                  {memo.name}
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <span className="w-1 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="w-1 h-3.5 bg-amber-600 rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-amber-500 rounded-full animate-pulse delay-150" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action icons: Rename & Delete */}
        <div className="flex items-center gap-0.5 shrink-0">
          {!isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditingName(memo.name);
              }}
              className="p-1 text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F4EE] rounded transition cursor-pointer"
              title="Ubah Nama Rekaman"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest();
            }}
            className="p-1 text-[#A8A29E] hover:text-rose-600 hover:bg-[#FAF9F5] rounded transition cursor-pointer"
            title="Hapus Rekaman Audio"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Line: Interactive Scrub Bar & Timers */}
      <div className="mt-1.5 flex items-center gap-2">
        <div
          ref={progressTrackRef}
          onClick={handleSeek}
          className="relative flex-1 h-1.5 bg-[#EAE8DF] hover:h-2 rounded-full cursor-pointer transition-all overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-75 ${
              isPlaying ? 'bg-amber-600' : 'bg-[#78716C]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="font-mono text-[10px] text-[#78716C] tabular-nums shrink-0">
          <span>{formatDuration(currentTime)}</span>
          <span className="mx-0.5 opacity-50">/</span>
          <span>{formatDuration(actualDuration)}</span>
        </div>
      </div>
    </div>
  );
};
