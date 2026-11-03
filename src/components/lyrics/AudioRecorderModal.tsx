import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Square, Play, Pause, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (name: string, duration: number, blob: Blob) => void;
  defaultTakeNumber: number;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveRecord,
  defaultTakeNumber,
}) => {
  const [recordState, setRecordState] = useState<'idle' | 'recording' | 'paused' | 'preview'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [memoName, setMemoName] = useState(`Take ${defaultTakeNumber}`);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number[]>(new Array(16).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync default name when opening
  useEffect(() => {
    if (isOpen) {
      setMemoName(`Take ${defaultTakeNumber}`);
      setRecordState('idle');
      setElapsedTime(0);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setPermissionError(null);
    }
  }, [isOpen, defaultTakeNumber]);

  // Clean up media streams and audio context on unmount or close
  const cleanupMedia = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupMedia();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  if (!isOpen) return null;

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 16 bars
        const bars: number[] = [];
        const step = Math.floor(bufferLength / 16);
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          // Scale 0-255 to min 4px, max 40px
          const barHeight = Math.max(4, Math.round((val / 255) * 40));
          bars.push(barHeight);
        }
        setVolumeLevel(bars);
        animationFrameRef.current = requestAnimationFrame(updateBars);
      };

      animationFrameRef.current = requestAnimationFrame(updateBars);
    } catch (e) {
      console.warn('AudioContext visualizer not supported or failed:', e);
    }
  };

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(finalBlob);
        setRecordedBlob(finalBlob);
        setRecordedUrl(url);
        setRecordedDuration(elapsedTime);
        setRecordState('preview');
        cleanupMedia();
      };

      recorder.start(200); // 200ms slices
      setRecordState('recording');
      setElapsedTime(0);

      startVisualizer(stream);

      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('Error accessing microphone:', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Permission') || message.includes('denied') || message.includes('NotAllowedError')) {
        setPermissionError('Izin mikrofon tidak diberikan. Silakan aktifkan akses mikrofon di peramban.');
      } else {
        setPermissionError('Gagal mengakses mikrofon perangkat. Pastikan mikrofon terpasang.');
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordState('paused');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordState('recording');
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordState === 'recording' || recordState === 'paused')) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleReset = () => {
    cleanupMedia();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordState('idle');
    setElapsedTime(0);
    setPreviewPlaying(false);
    setPreviewTime(0);
  };

  const handleTogglePreviewPlay = () => {
    if (!recordedUrl) return;
    if (!previewAudioRef.current) {
      const audio = new Audio(recordedUrl);
      previewAudioRef.current = audio;
      audio.ontimeupdate = () => setPreviewTime(audio.currentTime);
      audio.onended = () => {
        setPreviewPlaying(false);
        setPreviewTime(0);
      };
    }

    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      previewAudioRef.current.play().catch(console.error);
      setPreviewPlaying(true);
    }
  };

  const handleSave = () => {
    if (!recordedBlob) return;
    const finalName = memoName.trim() || `Take ${defaultTakeNumber}`;
    onSaveRecord(finalName, recordedDuration || elapsedTime || 1, recordedBlob);
    cleanupMedia();
    onClose();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer"
      onClick={() => {
        cleanupMedia();
        onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-[#FAF9F5] border border-[#E5E4DE] rounded-2xl shadow-2xl p-5 space-y-4 animate-scale-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-[#1C1917]">Rekam Suara Langsung</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              cleanupMedia();
              onClose();
            }}
            className="p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notice */}
        {permissionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p>{permissionError}</p>
          </div>
        )}

        {/* Visualizer & Timer Display */}
        <div className="bg-[#FFFFFF] border border-[#E5E4DE] rounded-xl p-5 flex flex-col items-center justify-center space-y-3 min-h-[140px] shadow-2xs">
          {/* Waveform Bars */}
          <div className="flex items-center justify-center gap-1.5 h-12 w-full px-4">
            {recordState === 'recording' ? (
              volumeLevel.map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-rose-500 rounded-full transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              ))
            ) : recordState === 'preview' ? (
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-[#78716C]">Rekaman selesai ({formatTime(recordedDuration)})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 opacity-40">
                {new Array(16).fill(4).map((h, i) => (
                  <div key={i} className="w-1.5 bg-[#A8A29E] rounded-full" style={{ height: `${h}px` }} />
                ))}
              </div>
            )}
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-2">
            {recordState === 'recording' && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            )}
            <span className="font-mono text-2xl font-bold tracking-wider text-[#1C1917] tabular-nums">
              {formatTime(recordState === 'preview' ? previewTime || recordedDuration : elapsedTime)}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#78716C] uppercase tracking-wider">
            {recordState === 'idle'
              ? 'Siap Merekam'
              : recordState === 'recording'
              ? 'Sedang Merekam Suara...'
              : recordState === 'paused'
              ? 'Perekaman Dijeda'
              : 'Pratinjau Hasil Rekaman'}
          </span>
        </div>

        {/* State Controls */}
        {recordState === 'idle' && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              onClick={startRecording}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer"
              title="Mulai Rekam"
            >
              <Mic className="w-6 h-6" />
            </button>
            <span className="text-xs text-[#78716C]">Tekan untuk mulai bernyanyi atau bersenandung</span>
          </div>
        )}

        {(recordState === 'recording' || recordState === 'paused') && (
          <div className="flex items-center justify-center gap-4 pt-2">
            {recordState === 'recording' ? (
              <button
                type="button"
                onClick={pauseRecording}
                className="w-11 h-11 rounded-full bg-[#EAE8DF] hover:bg-[#DEDCD3] text-[#1C1917] flex items-center justify-center transition cursor-pointer shadow-xs"
                title="Jeda"
              >
                <Pause className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeRecording}
                className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                title="Lanjutkan"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="w-12 h-12 rounded-full bg-[#1C1917] hover:bg-[#292524] text-white flex items-center justify-center transition cursor-pointer shadow-md"
              title="Selesai & Simpan"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </div>
        )}

        {recordState === 'preview' && (
          <div className="space-y-3 pt-1">
            {/* Memo Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#78716C]">
                Nama Memo Audio
              </label>
              <input
                type="text"
                value={memoName}
                onChange={(e) => setMemoName(e.target.value)}
                placeholder="Contoh: Take 1, Melodi Reff"
                className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E4DE] focus:border-[#1C1917] rounded-xl text-xs font-bold outline-hidden shadow-2xs"
              />
            </div>

            {/* Actions: Re-record, Play Preview, Save */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E4DE]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePreviewPlay}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F5F4EE] border border-[#E5E4DE] text-[#1C1917] rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  {previewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{previewPlaying ? 'Jeda' : 'Dengarkan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE8DF] rounded-xl text-xs font-medium transition cursor-pointer"
                  title="Rekam Ulang"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1C1917] hover:bg-[#292524] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
