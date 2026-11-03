// Web Audio API Sound Engine for FALS
// High-fidelity physical modeling (Karplus-Strong) + Studio SoundFont sample streaming
// 100% responsive, zero external blocking, realistic acoustic guitar & piano

export type InstrumentType = 'guitar' | 'piano';
export type GuitarSoundMode = 'studio' | 'karplus' | 'synth';

// Standard scientific pitch notation helpers
const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1,
  'D': 2, 'D#': 3, 'EB': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'GB': 6,
  'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10,
  'B': 11
};

// FluidR3_GM / midi-js-soundfonts uses flat notation for all accidentals ('Db', 'Eb', 'Gb', 'Ab', 'Bb')
const SOUNDFONT_FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SHARP_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function normalizeToSoundFont(note: string, octave: number): string {
  const clean = note.toUpperCase().replace('♯', '#').replace('♭', 'B');
  const semitone = NOTE_SEMITONES[clean] ?? 0;
  const noteName = SOUNDFONT_FLAT_NAMES[semitone % 12];
  return `${noteName}${octave}`;
}

export function normalizeToSharp(note: string, octave: number): string {
  const clean = note.toUpperCase().replace('♯', '#').replace('♭', 'B');
  const semitone = NOTE_SEMITONES[clean] ?? 0;
  const cleanNote = SHARP_NOTE_NAMES[semitone % 12];
  return `${cleanNote}${octave}`;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Guitar mode setting: 'studio' (real studio soundfont with instant Karplus fallback) | 'karplus' | 'synth'
  private guitarMode: GuitarSoundMode = 'studio';

  // SoundFont audio sample buffers cache (noteKey -> AudioBuffer)
  private soundfontSamples: Map<string, AudioBuffer> = new Map();
  private soundfontLoading: boolean = false;
  private soundfontLoaded: boolean = false;
  private predecodePending: boolean = false;

  // Karplus-Strong string synthesis buffer cache (noteKey -> AudioBuffer)
  private karplusBufferCache: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Pre-warm soundfont loader asynchronously if in browser
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initSoundFont();
      }, 1000);
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.88;

      // Studio mastering dynamics compressor: prevents harsh volume peaks and balances all instruments
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      if (this.predecodePending && this.soundfontLoaded) {
        this.predecodeCommonNotes();
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.88;
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setGuitarMode(mode: GuitarSoundMode) {
    this.guitarMode = mode;
  }

  public getGuitarMode(): GuitarSoundMode {
    return this.guitarMode;
  }

  public isSoundFontReady(): boolean {
    return this.soundfontLoaded;
  }

  // Convert note name and octave into frequency (e.g., C4 = 261.63 Hz)
  public noteToFreq(note: string, octave: number = 4): number {
    const clean = note.toUpperCase().replace('♯', '#').replace('♭', 'B');
    const semitone = NOTE_SEMITONES[clean] ?? 0;
    const midi = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * SoundFont Loader
   * Loads high-resolution steel-string acoustic guitar recordings from FluidR3_GM
   */
  private initSoundFont() {
    if (this.soundfontLoading || this.soundfontLoaded || typeof window === 'undefined') return;
    this.soundfontLoading = true;

    // Setup window.MIDI namespace expected by midi-js-soundfonts
    const win = window as unknown as { MIDI?: { Soundfont?: Record<string, Record<string, string>> } };
    win.MIDI = win.MIDI || {};
    win.MIDI.Soundfont = win.MIDI.Soundfont || {};

    const script = document.createElement('script');
    script.src = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_guitar_steel-mp3.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      const guitarData = win.MIDI?.Soundfont?.acoustic_guitar_steel;
      if (guitarData) {
        this.soundfontLoaded = true;
        if (this.ctx) {
          this.predecodeCommonNotes();
        } else {
          this.predecodePending = true;
        }
      }
      this.soundfontLoading = false;
    };

    script.onerror = () => {
      // Gracefully fall back to calibrated Karplus-Strong physical modeling
      this.soundfontLoading = false;
    };

    document.head.appendChild(script);
  }

  /**
   * Pre-decode common guitar note range in the background for zero-latency plucks
   */
  private predecodeCommonNotes() {
    if (!this.ctx || !this.soundfontLoaded) return;
    this.predecodePending = false;

    const commonNotes = [
      'E2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'B2',
      'C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3',
      'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4',
      'C5', 'Db5', 'D5', 'Eb5', 'E5', 'F5', 'Gb5', 'G5'
    ];

    let idx = 0;
    const decodeNext = () => {
      if (idx >= commonNotes.length || !this.ctx) return;
      const key = commonNotes[idx++];
      if (!this.soundfontSamples.has(key)) {
        this.loadSampleBuffer(key).then(() => {
          setTimeout(decodeNext, 16);
        });
      } else {
        decodeNext();
      }
    };

    setTimeout(decodeNext, 100);
  }

  /**
   * Load and decode sample buffer for a specific note key
   */
  private async loadSampleBuffer(noteKey: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const existing = this.soundfontSamples.get(noteKey);
    if (existing) return existing;

    const win = window as unknown as { MIDI?: { Soundfont?: Record<string, Record<string, string>> } };
    const guitarData = win.MIDI?.Soundfont?.acoustic_guitar_steel;
    if (!guitarData) return null;

    // Check direct key or alternative enharmonic key (Gb vs F#)
    let dataUri = guitarData[noteKey];
    if (!dataUri) {
      // Try resolving via flat equivalent
      const match = noteKey.match(/^([A-G][b#]?)([0-9]+)$/);
      if (match) {
        const flatKey = normalizeToSoundFont(match[1], parseInt(match[2], 10));
        dataUri = guitarData[flatKey];
      }
    }

    if (!dataUri) return null;

    try {
      const response = await fetch(dataUri);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.soundfontSamples.set(noteKey, buffer);
      return buffer;
    } catch {
      return null;
    }
  }

  /**
   * Play from pre-recorded Studio SoundFont
   */
  private async playSoundFontNote(noteKey: string, duration: number = 2.5, delay: number = 0): Promise<boolean> {
    if (!this.ctx || !this.masterGain) return false;

    let buffer = await this.loadSampleBuffer(noteKey);
    if (!buffer) return false;

    const startTime = this.ctx.currentTime + delay;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Natural acoustic guitar envelope & uniform loudness
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.85, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(startTime);
    source.stop(startTime + duration + 0.1);
    return true;
  }

  /**
   * Karplus-Strong Physical String Modeling Algorithm
   * Balanced and calibrated so volume/loudness is 100% uniform with studio samples.
   */
  private getOrCreateKarplusBuffer(frequency: number, noteKey: string, duration: number = 2.4): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext required');

    const cached = this.karplusBufferCache.get(noteKey);
    if (cached) return cached;

    const sampleRate = this.ctx.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    // Fundamental period in samples
    const N = Math.max(2, Math.round(sampleRate / frequency));

    // Pluck excitation: shaped noise burst simulating pick striking bronze/steel string
    const pickOffset = Math.max(1, Math.round(N / 6));
    const noiseBurst = new Float32Array(N);
    let prevNoise = 0;

    for (let i = 0; i < N; i++) {
      const white = (Math.random() * 2 - 1) * 0.40; // Controlled initial amplitude
      prevNoise = prevNoise * 0.45 + white * 0.55;
      noiseBurst[i] = prevNoise;
    }

    // Apply comb filter for pick strike position
    for (let i = 0; i < N; i++) {
      const delayed = i >= pickOffset ? noiseBurst[i - pickOffset] : 0;
      data[i] = (noiseBurst[i] - 0.7 * delayed) * 0.5;
    }

    // Feedback delay line with moving average lowpass filter
    const decay = Math.min(0.9965, 0.985 + (1 / (frequency + 45)) * 2.0);
    const S = 0.5;

    for (let i = N; i < numSamples; i++) {
      const y0 = data[i - N];
      const y1 = data[i - N - 1] ?? y0;
      data[i] = (y0 * S + y1 * (1 - S)) * decay;
    }

    this.karplusBufferCache.set(noteKey, buffer);
    return buffer;
  }

  /**
   * Play guitar note using calibrated Karplus-Strong string physical modeling
   */
  private playKarplusNote(frequency: number, noteKey: string, duration: number = 2.4, delay: number = 0) {
    if (!this.ctx || !this.masterGain) return;

    const buffer = this.getOrCreateKarplusBuffer(frequency, noteKey, duration);
    const startTime = this.ctx.currentTime + delay;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Gentle acoustic body resonance filter without harsh volume spikes
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(120, startTime);
    bodyFilter.Q.setValueAtTime(1.2, startTime);
    bodyFilter.gain.setValueAtTime(1.5, startTime);

    const soundboardFilter = this.ctx.createBiquadFilter();
    soundboardFilter.type = 'peaking';
    soundboardFilter.frequency.setValueAtTime(220, startTime);
    soundboardFilter.Q.setValueAtTime(1.2, startTime);
    soundboardFilter.gain.setValueAtTime(1.0, startTime);

    // Warm high shelf filter
    const highFilter = this.ctx.createBiquadFilter();
    highFilter.type = 'highshelf';
    highFilter.frequency.setValueAtTime(3200, startTime);
    highFilter.gain.setValueAtTime(-2.5, startTime);

    // Calibrated gain to match acoustic soundfont sample level
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.48, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(bodyFilter);
    bodyFilter.connect(soundboardFilter);
    soundboardFilter.connect(highFilter);
    highFilter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(startTime);
    source.stop(startTime + duration + 0.1);
  }

  /**
   * Legacy synthetic oscillator (fallback only)
   */
  private playSynthGuitarNote(frequency: number, duration: number = 2.0, delay: number = 0) {
    if (!this.ctx || !this.masterGain) return;
    const startTime = this.ctx.currentTime + delay;

    const oscSaw = this.ctx.createOscillator();
    const oscTri = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    oscSaw.type = 'sawtooth';
    oscTri.type = 'triangle';

    oscSaw.frequency.setValueAtTime(frequency, startTime);
    oscTri.frequency.setValueAtTime(frequency, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, startTime);
    filter.frequency.exponentialRampToValueAtTime(300, startTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscSaw.connect(filter);
    oscTri.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscSaw.start(startTime);
    oscTri.start(startTime);
    oscSaw.stop(startTime + duration);
    oscTri.stop(startTime + duration);
  }

  /**
   * Main Guitar Pluck Method:
   * Defaults to Studio Sample (FluidR3_GM Steel Acoustic Guitar).
   * Automatically and instantaneously falls back to calibrated Karplus-Strong string physical modeling
   * when samples are still loading or if offline.
   */
  public playGuitarNote(noteName: string, octave: number = 3, duration: number = 2.5, delay: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const soundfontKey = normalizeToSoundFont(noteName, octave);
    const freq = this.noteToFreq(noteName, octave);

    // If explicit synth requested
    if (this.guitarMode === 'synth') {
      this.playSynthGuitarNote(freq, duration, delay);
      return;
    }

    // If pure Karplus-Strong requested
    if (this.guitarMode === 'karplus') {
      this.playKarplusNote(freq, soundfontKey, duration, delay);
      return;
    }

    // Default 'studio' mode:
    // If SoundFont is loaded, try playing studio sample
    if (this.soundfontLoaded) {
      this.playSoundFontNote(soundfontKey, duration, delay).then((success) => {
        if (!success) {
          this.playKarplusNote(freq, soundfontKey, duration, delay);
        }
      });
    } else {
      // Instant Karplus-Strong physical string simulation with 0ms delay
      this.playKarplusNote(freq, soundfontKey, duration, delay);
      // Trigger background soundfont load for future plucks
      this.initSoundFont();
    }
  }

  /**
   * Rich Acoustic Piano Synthesis
   */
  public playPianoNote(noteName: string, octave: number = 4, duration: number = 1.8, delay: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const freq = this.noteToFreq(noteName, octave);
    const startTime = this.ctx.currentTime + delay;

    // 1. Piano hammer felt impact knock
    const hammerOsc = this.ctx.createOscillator();
    const hammerGain = this.ctx.createGain();
    hammerOsc.type = 'sine';
    hammerOsc.frequency.setValueAtTime(Math.min(250, freq * 0.8), startTime);
    hammerOsc.frequency.exponentialRampToValueAtTime(60, startTime + 0.03);

    hammerGain.gain.setValueAtTime(0.18, startTime);
    hammerGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);

    hammerOsc.connect(hammerGain);
    hammerGain.connect(this.masterGain);
    hammerOsc.start(startTime);
    hammerOsc.stop(startTime + 0.04);

    // 2. Unison strings: 2 oscillators slightly detuned (±1.8 cents) for natural chorusing
    const oscMain = this.ctx.createOscillator();
    const oscUnison = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();

    const pianoFilter = this.ctx.createBiquadFilter();
    const pianoGain = this.ctx.createGain();

    oscMain.type = 'triangle';
    oscMain.frequency.setValueAtTime(freq, startTime);

    oscUnison.type = 'sine';
    oscUnison.frequency.setValueAtTime(freq * Math.pow(2, 1.8 / 1200), startTime);

    // Subtle 2nd harmonic chime (felt hammer resonance)
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

    pianoFilter.type = 'lowpass';
    const initialCutoff = Math.min(3800, freq * 6);
    pianoFilter.frequency.setValueAtTime(initialCutoff, startTime);
    pianoFilter.frequency.exponentialRampToValueAtTime(Math.max(500, freq * 2), startTime + 0.25);
    pianoFilter.frequency.exponentialRampToValueAtTime(Math.max(250, freq * 1.1), startTime + duration);
    pianoFilter.Q.setValueAtTime(1.2, startTime);

    pianoGain.gain.setValueAtTime(0.0001, startTime);
    pianoGain.gain.linearRampToValueAtTime(0.40, startTime + 0.012);
    pianoGain.gain.exponentialRampToValueAtTime(0.24, startTime + 0.22);
    pianoGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const gainMain = this.ctx.createGain();
    gainMain.gain.value = 0.55;
    const gainUnison = this.ctx.createGain();
    gainUnison.gain.value = 0.35;
    const gainHarmonic = this.ctx.createGain();
    gainHarmonic.gain.value = 0.12;

    oscMain.connect(gainMain);
    oscUnison.connect(gainUnison);
    oscHarmonic.connect(gainHarmonic);

    gainMain.connect(pianoFilter);
    gainUnison.connect(pianoFilter);
    gainHarmonic.connect(pianoFilter);

    pianoFilter.connect(pianoGain);
    pianoGain.connect(this.masterGain);

    oscMain.start(startTime);
    oscUnison.start(startTime);
    oscHarmonic.start(startTime);

    oscMain.stop(startTime + duration + 0.05);
    oscUnison.stop(startTime + duration + 0.05);
    oscHarmonic.stop(startTime + duration + 0.05);
  }

  // Play note with selectable instrument (defaults to piano)
  public playNote(noteName: string, octave: number = 4, duration: number = 1.6, delay: number = 0, instrument: InstrumentType = 'piano') {
    if (instrument === 'guitar') {
      this.playGuitarNote(noteName, octave, duration, delay);
    } else {
      this.playPianoNote(noteName, octave, duration, delay);
    }
  }

  // Play a full chord with natural instrument strumming / striking
  public playChord(root: string, intervals: number[], octave: number = 3, strum: boolean = true, instrument: InstrumentType = 'guitar') {
    const flatToSharp: Record<string, string> = {
      'DB': 'C#',
      'EB': 'D#',
      'GB': 'F#',
      'AB': 'G#',
      'BB': 'A#',
      'CB': 'B',
      'FB': 'E',
    };
    const cleanRoot = root.trim().toUpperCase().replace('♭', 'B').replace('♯', '#');
    const rootMatch = cleanRoot.match(/^([A-G][B#]?)/);
    const baseRoot = rootMatch ? rootMatch[1] : cleanRoot;
    const normalizedRoot = flatToSharp[baseRoot] || baseRoot;

    const noteMapList = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteMapList.indexOf(normalizedRoot);
    if (rootIndex === -1) return;

    intervals.forEach((interval, index) => {
      const semitoneIndex = (rootIndex + interval) % 12;
      const noteName = noteMapList[semitoneIndex];
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      // Guitar has a natural strum delay (32ms per string); piano has subtle human touch (12ms)
      const delay = strum ? index * (instrument === 'guitar' ? 0.032 : 0.012) : 0;
      this.playNote(noteName, noteOctave, 2.2, delay, instrument);
    });
  }

  // Play metronome click
  public playClick(isAccent: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const startTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isAccent ? 1200 : 750;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.04);

    gainNode.gain.setValueAtTime(0.5, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }
}

export const sound = new AudioEngine();
