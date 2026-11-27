class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTone(
    freq: number,
    durationSec = 0.12,
    type: OscillatorType = 'sine',
    gainPeak = 0.14,
    delaySec = 0,
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playCountdownTick(finalStep = false): void {
    this.playTone(finalStep ? 880 : 520, finalStep ? 0.14 : 0.08, 'triangle', 0.12);
  }

  public playGoSignal(): void {
    this.playTone(740, 0.09, 'sine', 0.14, 0);
    this.playTone(987.77, 0.14, 'sine', 0.14, 0.05);
  }

  public playSuccess(): void {
    this.playTone(587.33, 0.09, 'sine', 0.12, 0);
    this.playTone(880, 0.14, 'sine', 0.14, 0.06);
  }

  public playError(): void {
    this.playTone(210, 0.18, 'sawtooth', 0.1, 0);
    this.playTone(155, 0.22, 'sawtooth', 0.1, 0.08);
  }

  public playNewBest(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.16, 'triangle', 0.13, idx * 0.075);
    });
  }

  public playClick(): void {
    this.playTone(440, 0.04, 'sine', 0.06);
  }
}

export const soundEngine = new SoundEngine();
