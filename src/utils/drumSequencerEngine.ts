// Web Audio Custom Drum Step Sequencer Engine (8 Bars / 32 Steps or 64 Steps)
// Supports custom kit sounds (Trap 808, UK Drill, Acoustic Rock, Lo-Fi) and pattern saving

export type SoundKitType = 'trap' | 'drill' | 'acoustic' | 'lofi';

export interface DrumInstrument {
  id: string;
  name: string;
  icon: string;
}

export const DRUM_INSTRUMENTS: DrumInstrument[] = [
  { id: 'kick', name: 'Kick / 808', icon: '🎛️' },
  { id: 'snare', name: 'Snare / Clap', icon: '🥁' },
  { id: 'hihat', name: 'Hi-Hat Closed', icon: '🧢' },
  { id: 'openhat', name: 'Hi-Hat Open', icon: '🔔' },
  { id: 'perc', name: 'Perc / Rim', icon: '🪵' },
];

export interface SavedDrumPattern {
  id: string;
  name: string;
  kit: SoundKitType;
  bpm: number;
  steps: Record<string, boolean[]>; // instrumentId -> boolean array of length 32 or 64
  updatedAt: number;
}

// Default factory presets
export const DEFAULT_PATTERNS: SavedDrumPattern[] = [
  {
    id: 'preset-trap-1',
    name: 'Trap 808 Bounce',
    kit: 'trap',
    bpm: 130,
    steps: {
      kick: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false,
             true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
              false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true,
              true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      openhat: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false,
                false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
      perc: [false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false,
             false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false],
    },
    updatedAt: Date.now(),
  },
  {
    id: 'preset-drill-1',
    name: 'UK Drill Bounce',
    kit: 'drill',
    bpm: 140,
    steps: {
      kick: [true, false, false, true, false, false, false, false, true, false, false, false, true, false, false, false,
             true, false, false, true, false, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false,
              false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
      hihat: [true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true,
              true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true],
      openhat: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false,
                false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
      perc: [false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false,
             false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false],
    },
    updatedAt: Date.now(),
  },
];

class CustomDrumSequencerEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private bpm: number = 130;
  private kit: SoundKitType = 'trap';
  private volume: number = 0.8;
  private currentStep: number = 0;
  private stepTimer: NodeJS.Timeout | null = null;
  private stepsData: Record<string, boolean[]> = DEFAULT_PATTERNS[0].steps;
  private listeners: Set<() => void> = new Set();
  private stepListeners: Set<(step: number) => void> = new Set();

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeStep(listener: (step: number) => void): () => void {
    this.stepListeners.add(listener);
    return () => this.stepListeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private notifyStep(step: number) {
    this.stepListeners.forEach((fn) => fn(step));
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      bpm: this.bpm,
      kit: this.kit,
      volume: this.volume,
      steps: this.stepsData,
    };
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(220, newBpm));
    this.notify();
  }

  public setKit(newKit: SoundKitType) {
    this.kit = newKit;
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleStep(instId: string, stepIndex: number) {
    if (!this.stepsData[instId]) {
      this.stepsData[instId] = Array(32).fill(false);
    }
    const updated = [...this.stepsData[instId]];
    updated[stepIndex] = !updated[stepIndex];
    this.stepsData[instId] = updated;
    this.notify();
  }

  public setPattern(pattern: SavedDrumPattern) {
    this.bpm = pattern.bpm;
    this.kit = pattern.kit;
    this.stepsData = JSON.parse(JSON.stringify(pattern.steps));
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.notify();
    this.scheduleNextStep();
  }

  public stop() {
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    this.isPlaying = false;
    this.currentStep = 0;
    this.notifyStep(-1);
    this.notify();
  }

  private scheduleNextStep() {
    if (!this.isPlaying) return;

    this.playStep(this.currentStep);
    this.notifyStep(this.currentStep);

    // 16th note subdivision time in ms
    const stepMs = Math.round((60 / this.bpm / 4) * 1000);
    this.currentStep = (this.currentStep + 1) % 32; // 2 Bars = 32 Steps grid

    this.stepTimer = setTimeout(() => {
      this.scheduleNextStep();
    }, stepMs);
  }

  private playStep(step: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + 0.01;

    DRUM_INSTRUMENTS.forEach((inst) => {
      const activeArr = this.stepsData[inst.id];
      if (activeArr && activeArr[step]) {
        this.triggerSound(inst.id, now);
      }
    });
  }

  private triggerSound(instId: string, time: number) {
    if (!this.ctx || !this.masterGain) return;

    switch (instId) {
      case 'kick': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        if (this.kit === 'trap' || this.kit === 'drill') {
          osc.frequency.setValueAtTime(this.kit === 'drill' ? 170 : 150, time);
          osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);
          gain.gain.setValueAtTime(1.0, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
        } else if (this.kit === 'lofi') {
          osc.frequency.setValueAtTime(100, time);
          osc.frequency.exponentialRampToValueAtTime(45, time + 0.05);
          gain.gain.setValueAtTime(0.8, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        } else {
          // Acoustic
          osc.frequency.setValueAtTime(130, time);
          osc.frequency.exponentialRampToValueAtTime(50, time + 0.04);
          gain.gain.setValueAtTime(0.85, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        }

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.5);
        break;
      }

      case 'snare': {
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = this.kit === 'trap' ? 'bandpass' : 'highpass';
        filter.frequency.setValueAtTime(this.kit === 'trap' ? 1200 : 1600, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.65, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
        noise.stop(time + 0.15);
        break;
      }

      case 'hihat': {
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const hat = this.ctx.createBufferSource();
        hat.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        hat.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        hat.start(time);
        hat.stop(time + 0.05);
        break;
      }

      case 'openhat': {
        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const hat = this.ctx.createBufferSource();
        hat.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        hat.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        hat.start(time);
        hat.stop(time + 0.2);
        break;
      }

      case 'perc': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.03);

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.05);
        break;
      }
    }
  }
}

export const drumSequencer = new CustomDrumSequencerEngine();
