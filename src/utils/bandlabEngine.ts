// BandLab Style Drum Sequencer Engine (Unified vertical grid, category-based instrument adding, custom sound types)

export type InstrumentCategory = 'kick' | 'snare' | 'hihat' | 'perc';

export interface SoundPreset {
  id: string;
  name: string;
  category: InstrumentCategory;
  description: string;
}

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'sub808', name: '808 Sub Bass Kick', category: 'kick', description: 'Booming deep trap 808 sub bass' },
  { id: 'punchykick', name: 'Punchy Acoustic Kick', category: 'kick', description: 'Solid rock & pop wooden punch' },
  { id: 'lofikick', name: 'Lo-Fi Muffled Kick', category: 'kick', description: 'Warm dusty tape-filtered kick' },
  { id: 'clap', name: 'TR-808 Clap', category: 'snare', description: 'Classic crisp electronic clap' },
  { id: 'acousticSnare', name: 'Acoustic Snare', category: 'snare', description: 'Snappy snare with acoustic ring' },
  { id: 'rimshot', name: 'Drill Rimshot', category: 'snare', description: 'Sharp metallic drill rim' },
  { id: 'closedHat', name: 'Closed Hi-Hat', category: 'hihat', description: 'Tight crisp electronic hat' },
  { id: 'openHat', name: 'Open Hi-Hat', category: 'hihat', description: 'Sustain metallic open hat' },
  { id: 'perc', name: 'Wood Perc', category: 'perc', description: 'Organic wooden block percussion' },
  { id: 'cowbell', name: 'TR-808 Cowbell', category: 'perc', description: 'Classic retro electronic cowbell' },
  { id: 'shaker', name: 'Acoustic Shaker', category: 'perc', description: 'Smooth rhythmic shaker' },
];

export interface BandLabChannel {
  id: string;
  name: string;
  category: InstrumentCategory;
  soundId: string;
  steps: boolean[]; // 32, 64, or 128 steps
  volume: number;
  muted: boolean;
  soloed: boolean;
}

export interface SavedBandLabProject {
  id: string;
  name: string;
  bpm: number;
  totalSteps: number;
  channels: BandLabChannel[];
  updatedAt: number;
}

export const DEFAULT_BANDLAB_CHANNELS: BandLabChannel[] = [
  {
    id: 'ch-1',
    name: '808 Kick',
    category: 'kick',
    soundId: 'sub808',
    steps: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false,
            true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
    volume: 0.9,
    muted: false,
    soloed: false,
  },
  {
    id: 'ch-2',
    name: 'TR-808 Clap',
    category: 'snare',
    soundId: 'clap',
    steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    volume: 0.8,
    muted: false,
    soloed: false,
  },
  {
    id: 'ch-3',
    name: 'Closed Hat',
    category: 'hihat',
    soundId: 'closedHat',
    steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    volume: 0.6,
    muted: false,
    soloed: false,
  },
];

class BandLabSequencerEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private bpm: number = 130;
  private totalSteps: number = 32;
  private currentStep: number = 0;
  private stepTimer: NodeJS.Timeout | null = null;
  private channels: BandLabChannel[] = DEFAULT_BANDLAB_CHANNELS;
  private listeners: Set<() => void> = new Set();
  private stepListeners: Set<(step: number) => void> = new Set();

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
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
      totalSteps: this.totalSteps,
      channels: this.channels,
    };
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(220, newBpm));
    this.notify();
  }

  public setTotalSteps(steps: number) {
    this.totalSteps = steps;
    this.channels = this.channels.map((ch) => {
      const newSteps = Array(steps).fill(false);
      for (let i = 0; i < Math.min(steps, ch.steps.length); i++) {
        newSteps[i] = ch.steps[i];
      }
      return { ...ch, steps: newSteps };
    });
    this.notify();
  }

  public addChannel(category: InstrumentCategory, soundId: string) {
    const preset = SOUND_PRESETS.find((p) => p.id === soundId) || SOUND_PRESETS[0];
    const newCh: BandLabChannel = {
      id: `ch-${Date.now()}`,
      name: preset.name,
      category,
      soundId,
      steps: Array(this.totalSteps).fill(false),
      volume: 0.8,
      muted: false,
      soloed: false,
    };
    this.channels = [...this.channels, newCh];
    this.notify();
  }

  public removeChannel(id: string) {
    this.channels = this.channels.filter((ch) => ch.id !== id);
    this.notify();
  }

  public updateChannel(id: string, updates: Partial<BandLabChannel>) {
    this.channels = this.channels.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch));
    this.notify();
  }

  public toggleStep(channelId: string, stepIndex: number) {
    this.channels = this.channels.map((ch) => {
      if (ch.id === channelId) {
        const updatedSteps = [...ch.steps];
        updatedSteps[stepIndex] = !updatedSteps[stepIndex];
        return { ...ch, steps: updatedSteps };
      }
      return ch;
    });
    this.notify();
  }

  public loadProject(project: SavedBandLabProject) {
    this.bpm = project.bpm;
    this.totalSteps = project.totalSteps || 32;
    this.channels = JSON.parse(JSON.stringify(project.channels));
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

    const stepMs = Math.round((60 / this.bpm / 4) * 1000);
    this.currentStep = (this.currentStep + 1) % this.totalSteps;

    this.stepTimer = setTimeout(() => {
      this.scheduleNextStep();
    }, stepMs);
  }

  private playStep(step: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + 0.01;

    const anySoloed = this.channels.some((c) => c.soloed);

    this.channels.forEach((ch) => {
      if (ch.muted) return;
      if (anySoloed && !ch.soloed) return;
      if (ch.steps[step]) {
        this.triggerSound(ch.soundId, ch.volume, now);
      }
    });
  }

  private triggerSound(soundId: string, volume: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.connect(this.masterGain);

    switch (soundId) {
      case 'sub808': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.55);
        break;
      }

      case 'punchykick': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, time);
        osc.frequency.exponentialRampToValueAtTime(45, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.22);
        break;
      }

      case 'lofikick': {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        osc.connect(filter);
        filter.connect(gain);
        osc.start(time);
        osc.stop(time + 0.28);
        break;
      }

      case 'clap': {
        for (let i = 0; i < 3; i++) {
          const burst = time + i * 0.012;
          const bufferSize = this.ctx.sampleRate * 0.015;
          const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200, burst);
          src.connect(filter);
          filter.connect(gain);
          src.start(burst);
          src.stop(burst + 0.02);
        }
        break;
      }

      case 'acousticSnare': {
        const bufferSize = this.ctx.sampleRate * 0.14;
        const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1600, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
        src.connect(filter);
        filter.connect(gain);
        src.start(time);
        src.stop(time + 0.16);
        break;
      }

      case 'rimshot': {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, time);
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.06);
        break;
      }

      case 'closedHat': {
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        src.connect(filter);
        filter.connect(gain);
        src.start(time);
        src.stop(time + 0.05);
        break;
      }

      case 'openHat': {
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        src.connect(filter);
        filter.connect(gain);
        src.start(time);
        src.stop(time + 0.22);
        break;
      }

      case 'perc': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, time);
        osc.frequency.exponentialRampToValueAtTime(120, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.06);
        break;
      }

      case 'cowbell': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(587.33, time);
        osc2.frequency.setValueAtTime(845.0, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.15);
        osc2.stop(time + 0.15);
        break;
      }

      case 'shaker': {
        const bufferSize = this.ctx.sampleRate * 0.06;
        const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(5000, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        src.connect(filter);
        filter.connect(gain);
        src.start(time);
        src.stop(time + 0.07);
        break;
      }
    }
  }
}

export const bandlabEngine = new BandLabSequencerEngine();
