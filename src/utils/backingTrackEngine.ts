// Web Audio Pure Rhythm Drum Machine Engine for FALS
// Authentic genre drum kits & arrangements for Trap 808, UK Drill, Blues Shuffle, Pop/Rock, Funk, and Lo-Fi Chill

export type BackingTrackGenre = 'trap' | 'drill' | 'blues' | 'pop' | 'funk' | 'lofi';

export interface GenreInfo {
  id: BackingTrackGenre;
  name: string;
  icon: string;
  description: string;
  defaultBpm: number;
  soundKitType: 'Sintetis 808' | 'Drill Electronic' | 'Acoustic Swing' | 'Acoustic Rock' | 'Funky Drum' | 'Lo-Fi Tape';
  recommendedScale: string;
}

export const BACKING_TRACK_GENRES: GenreInfo[] = [
  {
    id: 'trap',
    name: 'Trap 808',
    icon: '🥁',
    description: '808 Sub-kick booming, TR-808 clap & 32nd triplet hi-hat rolls.',
    defaultBpm: 130,
    soundKitType: 'Sintetis 808',
    recommendedScale: 'Minor Pentatonic, Natural Minor & Phrygian',
  },
  {
    id: 'drill',
    name: 'UK Drill',
    icon: '🔪',
    description: 'Sliding 808 bass-kick, 3/4 syncopated rimshot & drill hats.',
    defaultBpm: 140,
    soundKitType: 'Drill Electronic',
    recommendedScale: 'Phrygian, Locrian & Minor Blues',
  },
  {
    id: 'blues',
    name: 'Blues 12-Bar',
    icon: '🎸',
    description: 'Classic 12-bar acoustic drum shuffle dengan swing 8th feel.',
    defaultBpm: 95,
    soundKitType: 'Acoustic Swing',
    recommendedScale: 'Blues Scale & Minor/Major Pentatonic',
  },
  {
    id: 'pop',
    name: 'Pop / Rock',
    icon: '🎶',
    description: 'Punchy acoustic kick, solid rock snare 2/4 & driving hi-hats.',
    defaultBpm: 110,
    soundKitType: 'Acoustic Rock',
    recommendedScale: 'Skala Mayor, Ionian & Mixolydian',
  },
  {
    id: 'funk',
    name: 'Funk / Soul',
    icon: '🎷',
    description: '16th-note syncopated funk beat, ghost snares & open hat accents.',
    defaultBpm: 105,
    soundKitType: 'Funky Drum',
    recommendedScale: 'Dorian & Aeolian Mode',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill',
    icon: '☕',
    description: 'Warm lowpass drum beat, dusty vinyl snare & laid-back swing.',
    defaultBpm: 80,
    soundKitType: 'Lo-Fi Tape',
    recommendedScale: 'Major Pentatonic & Lydian Mode',
  },
];

class BackingTrackEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private genre: BackingTrackGenre = 'trap';
  private bpm: number = 130;
  private volume: number = 0.75;
  private stepTimer: NodeJS.Timeout | null = null;
  private currentStep: number = 0;
  private listeners: Set<() => void> = new Set();

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

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      genre: this.genre,
      bpm: this.bpm,
      volume: this.volume,
    };
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(220, newBpm));
    this.notify();
  }

  public setGenre(newGenre: BackingTrackGenre) {
    this.genre = newGenre;
    const gInfo = BACKING_TRACK_GENRES.find((g) => g.id === newGenre);
    if (gInfo) {
      this.bpm = gInfo.defaultBpm;
    }
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
    this.notify();
  }

  private scheduleNextStep() {
    if (!this.isPlaying) return;

    this.playStep(this.currentStep);

    // 16th note subdivision time in ms
    const stepMs = Math.round((60 / this.bpm / 4) * 1000);
    this.currentStep = (this.currentStep + 1) % 64; // 4 bars grid = 64 steps

    this.stepTimer = setTimeout(() => {
      this.scheduleNextStep();
    }, stepMs);
  }

  // Synthesis methods for distinct Drum Kits (808, Drill, Acoustic, Lo-Fi)
  private triggerKick(time: number, style: '808' | 'drill808' | 'acoustic' | 'lofi' = '808', gainMult: number = 1.0) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';

    if (style === '808' || style === 'drill808') {
      const startFreq = style === 'drill808' ? 180 : 150;
      const endFreq = style === 'drill808' ? 36 : 40;
      const duration = style === 'drill808' ? 0.5 : 0.42;

      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.07);

      // Drill 808 Pitch Glide on specific beats
      if (style === 'drill808' && Math.random() > 0.5) {
        osc.frequency.exponentialRampToValueAtTime(endFreq * 1.6, time + 0.18);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.38);
      }

      gain.gain.setValueAtTime(1.0 * gainMult, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else if (style === 'lofi') {
      // Muffled, warm lo-fi kick
      osc.frequency.setValueAtTime(110, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.05);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, time);

      gain.gain.setValueAtTime(0.85 * gainMult, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.25);
      return;
    } else {
      // Acoustic punchy kick
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.04);

      gain.gain.setValueAtTime(0.9 * gainMult, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  private triggerSnare(time: number, style: '808clap' | 'drillrim' | 'acoustic' | 'lofisnare' = '808clap', gainMult: number = 1.0) {
    if (!this.ctx || !this.masterGain) return;

    if (style === '808clap') {
      // TR-808 Snare Clap: Bandpass noise + 3 quick clap bursts
      for (let i = 0; i < 3; i++) {
        const burstTime = time + i * 0.012;
        const bufferSize = this.ctx.sampleRate * 0.015;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, burstTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5 * gainMult, burstTime);
        gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.015);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(burstTime);
        noise.stop(burstTime + 0.02);
      }

      // Clap tail
      const tailSize = this.ctx.sampleRate * 0.15;
      const tailBuf = this.ctx.createBuffer(1, tailSize, this.ctx.sampleRate);
      const tailData = tailBuf.getChannelData(0);
      for (let k = 0; k < tailSize; k++) tailData[k] = Math.random() * 2 - 1;

      const tail = this.ctx.createBufferSource();
      tail.buffer = tailBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, time + 0.035);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65 * gainMult, time + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      tail.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      tail.start(time + 0.035);
      tail.stop(time + 0.2);
      return;
    }

    if (style === 'drillrim') {
      // Sharp UK Drill Rimshot / Snare
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, time);
      osc.frequency.exponentialRampToValueAtTime(140, time + 0.04);

      gain.gain.setValueAtTime(0.7 * gainMult, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.07);

      // Metallic rim noise
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5 * gainMult, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.09);
      return;
    }

    if (style === 'lofisnare') {
      // Dusty warm lo-fi snare
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.55 * gainMult, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.15);
      return;
    }

    // Acoustic Rock/Blues Snare
    const bufferSize = this.ctx.sampleRate * 0.14;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65 * gainMult, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    const body = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(180, time);
    body.frequency.exponentialRampToValueAtTime(90, time + 0.07);
    bodyGain.gain.setValueAtTime(0.45 * gainMult, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    body.connect(bodyGain);
    bodyGain.connect(this.masterGain);

    noise.start(time);
    body.start(time);
    noise.stop(time + 0.15);
    body.stop(time + 0.08);
  }

  private triggerHiHat(time: number, style: 'metallic808' | 'drillhat' | 'acoustic' | 'lofi' = 'metallic808', isOpen: boolean = false, isAccent: boolean = false) {
    if (!this.ctx || !this.masterGain) return;

    const duration = isOpen ? (style === 'lofi' ? 0.14 : 0.2) : 0.04;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let k = 0; k < bufferSize; k++) data[k] = Math.random() * 2 - 1;

    const hat = this.ctx.createBufferSource();
    hat.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = style === 'lofi' ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(style === 'lofi' ? 3200 : style === 'metallic808' ? 8500 : 7000, time);

    const gain = this.ctx.createGain();
    const baseVol = isAccent ? 0.35 : 0.18;
    gain.gain.setValueAtTime(baseVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    hat.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    hat.start(time);
    hat.stop(time + duration + 0.02);
  }

  // Step sequencer drum arrangement according to authentic genre patterns
  private playStep(step: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + 0.02;

    switch (this.genre) {
      case 'trap': {
        // TRAP 808 ARRANGEMENT:
        // Snare/Clap on beat 3 of every 4-beat bar (step 8, 24, 40, 56)
        if (step % 16 === 8) {
          this.triggerSnare(now, '808clap');
        }

        // Syncopated 808 Sub-kick pattern
        if (
          step === 0 ||
          step === 10 ||
          step === 16 ||
          step === 26 ||
          step === 32 ||
          step === 42 ||
          step === 44 ||
          step === 48 ||
          step === 58
        ) {
          this.triggerKick(now, '808');
        }

        // Fast Trap Hi-Hat 8th notes + 32nd triplet rolls before snare
        const isRollStep = step === 14 || step === 15 || step === 30 || step === 31 || step === 46 || step === 47 || step === 62 || step === 63;
        if (step % 2 === 0 || isRollStep) {
          this.triggerHiHat(now, 'metallic808', step % 16 === 14, step % 4 === 0);
        }
        break;
      }

      case 'drill': {
        // UK DRILL ARRANGEMENT:
        // Syncopated Drill Rimshot/Snare on step 6 & 14 (3/4 bouncy feel)
        if (step % 8 === 6) {
          this.triggerSnare(now, 'drillrim');
        }

        // Sliding 808 Drill Kick
        if (
          step === 0 ||
          step === 9 ||
          step === 16 ||
          step === 27 ||
          step === 32 ||
          step === 41 ||
          step === 48 ||
          step === 59
        ) {
          this.triggerKick(now, 'drill808');
        }

        // Drill hi-hats with offbeat triplet rolls
        if (step % 2 === 0 || step % 16 === 7 || step % 16 === 11 || step % 16 === 15) {
          this.triggerHiHat(now, 'drillhat', step % 8 === 4, step % 4 === 0);
        }
        break;
      }

      case 'blues': {
        // BLUES 12-BAR SHUFFLE ARRANGEMENT:
        // Swing 8th triplets (steps 0, 3, 4, 7, 8, 11, 12, 15)
        if (step % 4 === 0 || step % 4 === 3) {
          this.triggerHiHat(now, 'acoustic', step % 4 === 3, step % 4 === 0);
        }

        // Acoustic Snare on 2 & 4 (steps 4, 12, 20, 28, 36, 44, 52, 60)
        if (step % 8 === 4) {
          this.triggerSnare(now, 'acoustic');
        }

        // Acoustic Kick on 1 & 3
        if (step % 8 === 0) {
          this.triggerKick(now, 'acoustic');
        }
        break;
      }

      case 'pop': {
        // POP / ROCK ARRANGEMENT:
        // Steady 8th-note acoustic hi-hats
        if (step % 2 === 0) {
          this.triggerHiHat(now, 'acoustic', step % 16 === 14, step % 4 === 0);
        }

        // Rock Snare backbeat on 2 & 4
        if (step % 8 === 4) {
          this.triggerSnare(now, 'acoustic');
        }

        // Punchy Rock Kick on 1 & 3-and
        if (step % 8 === 0 || step % 16 === 10) {
          this.triggerKick(now, 'acoustic');
        }
        break;
      }

      case 'funk': {
        // FUNK / SOUL ARRANGEMENT:
        // 16th-note busy funk hi-hats
        this.triggerHiHat(now, 'acoustic', step % 8 === 6, step % 4 === 0);

        // Funky Snare on 2 & 4 + Ghost snares
        if (step % 8 === 4) {
          this.triggerSnare(now, 'acoustic', 1.0);
        } else if (step % 16 === 7 || step % 16 === 10 || step % 16 === 15) {
          // Ghost snare
          this.triggerSnare(now, 'acoustic', 0.25);
        }

        // Syncopated Funk Kick
        if (step % 16 === 0 || step % 16 === 6 || step % 16 === 10 || step % 16 === 14) {
          this.triggerKick(now, 'acoustic');
        }
        break;
      }

      case 'lofi': {
        // LO-FI CHILL ARRANGEMENT:
        // Soft lofi hats on 8th notes
        if (step % 2 === 0) {
          this.triggerHiHat(now, 'lofi', step % 8 === 4, step % 4 === 0);
        }

        // Dusty Lo-Fi Snare on 2 & 4
        if (step % 8 === 4) {
          this.triggerSnare(now, 'lofisnare');
        }

        // Muffled Boom-bap Kick
        if (step % 16 === 0 || step % 16 === 10) {
          this.triggerKick(now, 'lofi');
        }
        break;
      }
    }
  }
}

export const backingTrack = new BackingTrackEngine();
