// Lightweight ambient background music synthesized with the Web Audio API.
// No audio files needed — a soft, looping lo-fi pad + gentle arpeggio.
// Shared singleton so the whole shorts feed uses one audio graph.

type Accent = 'saffron' | 'indigo' | 'teal';

// Pleasant chord progressions (frequencies in Hz) keyed loosely by accent mood.
const PROGRESSIONS: Record<Accent, number[][]> = {
  // warm major-ish
  saffron: [
    [261.63, 329.63, 392.0],   // C E G
    [220.0, 277.18, 329.63],   // A C# E
    [196.0, 246.94, 293.66],   // G B D
    [174.61, 220.0, 261.63],   // F A C
  ],
  // dreamy
  indigo: [
    [220.0, 261.63, 329.63],   // Am
    [196.0, 246.94, 293.66],   // G
    [174.61, 220.0, 261.63],   // F
    [261.63, 329.63, 392.0],   // C
  ],
  // calm
  teal: [
    [196.0, 246.94, 293.66],   // G
    [261.63, 329.63, 392.0],   // C
    [220.0, 277.18, 329.63],   // A
    [246.94, 311.13, 369.99],  // B
  ],
};

class AmbientMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private playing = false;
  private muted = false;
  private chordIdx = 0;

  private ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.10; // gentle
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200; // warm
    this.master.connect(filter);
    filter.connect(this.ctx.destination);
  }

  private playChord(freqs: number[]) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const dur = 4; // seconds per chord

    // Pad layer — soft triangle waves, slow swell
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f / (i === 0 ? 2 : 1); // root an octave down
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.18, now + 1.2);
      g.gain.linearRampToValueAtTime(0.0001, now + dur);
      osc.connect(g);
      g.connect(this.master!);
      osc.start(now);
      osc.stop(now + dur + 0.1);
    });

    // Gentle arpeggio sparkle on top
    const top = freqs[freqs.length - 1] * 2;
    [0, 1, 2, 3].forEach(step => {
      const t = now + step * (dur / 4) + 0.2;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = top * [1, 1.25, 1.5, 1.25][step];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(g);
      g.connect(this.master!);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  start(accent: Accent = 'saffron') {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.playing) return;
    this.playing = true;
    const prog = PROGRESSIONS[accent] ?? PROGRESSIONS.saffron;
    const tick = () => {
      if (!this.playing) return;
      this.playChord(prog[this.chordIdx % prog.length]);
      this.chordIdx++;
      this.timer = window.setTimeout(tick, 4000);
    };
    tick();
  }

  stop() {
    this.playing = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.10, this.ctx.currentTime, 0.2);
    }
  }

  isMuted() { return this.muted; }
}

// Singleton instance shared across the app.
let instance: AmbientMusic | null = null;
export function getAmbientMusic(): AmbientMusic {
  if (!instance) instance = new AmbientMusic();
  return instance;
}
