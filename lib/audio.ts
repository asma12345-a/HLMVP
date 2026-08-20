// HuluLearn Web Audio Synthesizer - Exact Duolingo Sound Engine
// Accurately synthesized according to Duolingo's acoustic frequency models:
// - Correct: Ascending Major Third (F#5 -> A#5: 739.99 Hz -> 932.33 Hz) with marimba bell overtones
// - Incorrect: Descending Tritone (F#4 -> C4: 369.99 Hz -> 261.63 Hz) with muted wooden mallet thud
// - Victory Fanfare: F# Major fanfare (F#4 -> A#4 -> C#5 -> F#5 -> F# Major Chord + Shimmer)
// - Streak Flame: Rapid 5-note F# Major harp arpeggio
// - Bubble Pop: 1450 Hz -> 580 Hz tactile woodblock resonance
// - XP / Gem Ding: 1480 Hz -> 1865 Hz crystalline chime
// - Card Flip: Aerodynamic filter sweep + soft landing tap

class DuolingoSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('hululearn_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hululearn_muted', String(muted));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    if (!this.isMuted) {
      this.playPop();
    }
    return this.isMuted;
  }

  // --- Helper: Play a single marimba/bell mallet note with harmonic overtones ---
  private playMalletNote(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    baseVolume: number = 0.3,
    isMutedDecay: boolean = false
  ) {
    // 1. Fundamental tone (Sine wave)
    const fundamental = ctx.createOscillator();
    const fundGain = ctx.createGain();
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(freq, startTime);

    fundGain.gain.setValueAtTime(0.001, startTime);
    fundGain.gain.linearRampToValueAtTime(baseVolume, startTime + 0.008);
    fundGain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + (isMutedDecay ? duration * 0.5 : duration)
    );

    fundamental.connect(fundGain);
    fundGain.connect(ctx.destination);

    // 2. Second harmonic overtone (Triangle for warm marimba character)
    const overtone = ctx.createOscillator();
    const overGain = ctx.createGain();
    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, startTime);

    overGain.gain.setValueAtTime(0.001, startTime);
    overGain.gain.linearRampToValueAtTime(baseVolume * 0.35, startTime + 0.006);
    overGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.45);

    overtone.connect(overGain);
    overGain.connect(ctx.destination);

    // 3. Crisp mallet strike transient (tiny initial click)
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(freq * 3.8, startTime);
    clickGain.gain.setValueAtTime(baseVolume * 0.25, startTime);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025);

    click.connect(clickGain);
    clickGain.connect(ctx.destination);

    fundamental.start(startTime);
    fundamental.stop(startTime + duration);
    overtone.start(startTime);
    overtone.stop(startTime + duration);
    click.start(startTime);
    click.stop(startTime + 0.03);
  }

  // =========================================================================
  // 1. EXACT DUOLINGO CORRECT ANSWER SOUND
  // Musical Interval: Ascending Major Third (F#5 -> A#5)
  // Note 1: 739.99 Hz (F#5) at t = 0ms
  // Note 2: 932.33 Hz (A#5) at t = 90ms
  // Characteristic: Bright, crystalline marimba chime with cheerful ringing finish
  // =========================================================================
  public playCorrect() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: F#5 (739.99 Hz)
      this.playMalletNote(ctx, 739.99, now, 0.4, 0.35);

      // Note 2: A#5 (932.33 Hz) - 90ms later with longer sustain & shimmer
      this.playMalletNote(ctx, 932.33, now + 0.09, 0.7, 0.42);

      // Additional high crystalline shimmer on the A#5 (A#6 overtone)
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(1864.66, now + 0.09); // A#6
      shimmerGain.gain.setValueAtTime(0.001, now + 0.09);
      shimmerGain.gain.linearRampToValueAtTime(0.12, now + 0.105);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      shimmer.start(now + 0.09);
      shimmer.stop(now + 0.75);
    } catch {
      // Audio safety catch
    }
  }

  // =========================================================================
  // 2. EXACT DUOLINGO INCORRECT / WRONG ANSWER SOUND
  // Musical Interval: Descending Tritone (F#4 -> C4: 369.99 Hz -> 261.63 Hz)
  // "The Devil in Music" - iconic discordant wooden mallet buzz
  // Note 1: 369.99 Hz (F#4) at t = 0ms
  // Note 2: 261.63 Hz (C4) at t = 95ms
  // =========================================================================
  public playWrong() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: F#4 (369.99 Hz) - Muted wooden strike
      this.playMalletNote(ctx, 369.99, now, 0.22, 0.32, true);

      // Note 2: C4 (261.63 Hz) - Descending Tritone with hollow resonance
      const note2Start = now + 0.095;
      this.playMalletNote(ctx, 261.63, note2Start, 0.42, 0.38, true);

      // Add the classic Duolingo muffled buzzing undertone (sawtooth lowpass filtered)
      const buzz = ctx.createOscillator();
      const buzzFilter = ctx.createBiquadFilter();
      const buzzGain = ctx.createGain();

      buzz.type = 'sawtooth';
      buzz.frequency.setValueAtTime(185.0, note2Start); // F#3 undertone
      buzz.frequency.exponentialRampToValueAtTime(130.81, note2Start + 0.3); // C3 slide

      buzzFilter.type = 'lowpass';
      buzzFilter.frequency.setValueAtTime(420, note2Start);
      buzzFilter.frequency.exponentialRampToValueAtTime(160, note2Start + 0.3);

      buzzGain.gain.setValueAtTime(0.001, note2Start);
      buzzGain.gain.linearRampToValueAtTime(0.18, note2Start + 0.02);
      buzzGain.gain.exponentialRampToValueAtTime(0.0001, note2Start + 0.35);

      buzz.connect(buzzFilter);
      buzzFilter.connect(buzzGain);
      buzzGain.connect(ctx.destination);

      buzz.start(note2Start);
      buzz.stop(note2Start + 0.35);
    } catch {}
  }

  // =========================================================================
  // 3. EXACT DUOLINGO LESSON COMPLETE / VICTORY FANFARE
  // Melodic sequence in F# Major:
  // - F#4 (369.99 Hz) at t = 0ms
  // - A#4 (466.16 Hz) at t = 90ms
  // - C#5 (554.37 Hz) at t = 180ms
  // - F#5 (739.99 Hz) at t = 270ms
  // - Grand F# Major Chord (F#5 + A#5 + C#6 + F#6) sustained at t = 380ms with sparkle
  // =========================================================================
  public playCelebrationFanfare() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Ascending motif
      const motif = [
        { freq: 369.99, delay: 0.0, dur: 0.16, vol: 0.28 }, // F#4
        { freq: 466.16, delay: 0.09, dur: 0.16, vol: 0.3 }, // A#4
        { freq: 554.37, delay: 0.18, dur: 0.18, vol: 0.32 }, // C#5
        { freq: 739.99, delay: 0.27, dur: 0.22, vol: 0.36 }, // F#5
      ];

      motif.forEach(({ freq, delay, dur, vol }) => {
        this.playMalletNote(ctx, freq, now + delay, dur, vol);
      });

      // Grand sustained F# Major Chord at climax (t = 0.38s)
      const chordStart = now + 0.38;
      const chordNotes = [
        { freq: 739.99, vol: 0.32 }, // F#5
        { freq: 932.33, vol: 0.3 }, // A#5
        { freq: 1108.73, vol: 0.28 }, // C#6
        { freq: 1479.98, vol: 0.22 }, // F#6
      ];

      chordNotes.forEach(({ freq, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, chordStart);

        gain.gain.setValueAtTime(0.001, chordStart);
        gain.gain.linearRampToValueAtTime(vol, chordStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.95);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chordStart);
        osc.stop(chordStart + 0.95);
      });

      // Shimmering high sparkle bell shower
      const sparkles = [
        { freq: 1864.66, delay: 0.48 }, // A#6
        { freq: 2217.46, delay: 0.56 }, // C#7
        { freq: 2959.96, delay: 0.64 }, // F#7
      ];

      sparkles.forEach(({ freq, delay }) => {
        const sStart = now + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, sStart);

        gain.gain.setValueAtTime(0.001, sStart);
        gain.gain.linearRampToValueAtTime(0.12, sStart + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, sStart + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(sStart);
        osc.stop(sStart + 0.45);
      });
    } catch {}
  }

  // =========================================================================
  // 4. EXACT DUOLINGO TACTILE BUBBLE POP / BUTTON CLICK
  // Duolingo's signature snappy button pop
  // 1450 Hz -> 580 Hz rapid pitch plunge in 35ms with high-Q resonance
  // =========================================================================
  public playPop() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.038);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  public playClick(pitch: number = 600) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch * 1.8, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  // =========================================================================
  // 5. EXACT DUOLINGO STREAK / COMBO HARP GLISSANDO
  // Ascending 5-note F# Major harp roll:
  // F#4 -> A#4 -> C#5 -> F#5 -> A#5 (Rapid sparkle)
  // =========================================================================
  public playStreakChime() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const pitches = [369.99, 466.16, 554.37, 739.99, 932.33]; // F#4, A#4, C#5, F#5, A#5

      pitches.forEach((freq, idx) => {
        const start = now + idx * 0.05;
        this.playMalletNote(ctx, freq, start, 0.35, 0.28);
      });
    } catch {}
  }

  // =========================================================================
  // 6. EXACT DUOLINGO GEM / XP DING
  // Double crystal chime: F#6 (1479.98 Hz) -> A#6 (1864.66 Hz)
  // =========================================================================
  public playGemDing() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: F#6
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1479.98, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.005);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A#6 (40ms later)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1864.66, now + 0.04);
      gain2.gain.setValueAtTime(0.001, now + 0.04);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.048);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.55);
    } catch {}
  }

  // =========================================================================
  // 7. DUOLINGO CARD FLIP & AERODYNAMIC SWOOSH
  // =========================================================================
  public playFlip() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Bandpass filtered whoosh
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      // Light tactile card slap
      this.playMalletNote(ctx, 420, now + 0.06, 0.08, 0.18, true);
    } catch {}
  }

  // =========================================================================
  // 8. CHAT MESSAGE BUBBLES
  // =========================================================================
  public playMessageBubble(isSend: boolean = true) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isSend) {
        osc.frequency.setValueAtTime(466.16, now); // A#4
        osc.frequency.exponentialRampToValueAtTime(739.99, now + 0.06); // F#5
      } else {
        osc.frequency.setValueAtTime(739.99, now);
        osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.07);
      }

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }
}

// Export singleton instance
export const soundManager = new DuolingoSoundEngine();
