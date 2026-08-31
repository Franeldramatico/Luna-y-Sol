import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private isMutedSignal = signal<boolean>(true);
  private isPlayingAmbient = signal<boolean>(false);
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientInterval: ReturnType<typeof setInterval> | null = null;

  readonly isMuted = this.isMutedSignal.asReadonly();
  readonly isPlaying = this.isPlayingAmbient.asReadonly();

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);

        this.ambientGain = this.audioCtx.createGain();
        this.ambientGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.ambientGain.connect(this.masterGain);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMusic(): boolean {
    this.initContext();
    if (!this.audioCtx) return false;

    if (this.isMutedSignal()) {
      this.isMutedSignal.set(false);
      this.startAmbientSoundscape();
      return true;
    } else {
      this.isMutedSignal.set(true);
      this.stopAmbientSoundscape();
      return false;
    }
  }

  private startAmbientSoundscape() {
    if (!this.audioCtx || !this.ambientGain) return;
    this.isPlayingAmbient.set(true);

    // Warm celestial harmonic chord frequencies (Root, 5th, Maj 7th, 9th in gentle octaves)
    // E.g., D major 9 / F# minor celestial harmonics
    const chordSets = [
      [146.83, 220.00, 277.18, 329.63, 440.00, 554.37], // Dmaj9
      [164.81, 246.94, 293.66, 369.99, 493.88, 587.33], // Em9
      [185.00, 277.18, 329.63, 440.00, 554.37, 659.25], // F#m7
      [196.00, 293.66, 369.99, 440.00, 587.33, 739.99], // Gmaj9
    ];

    let currentChordIndex = 0;

    const playChord = (chord: number[]) => {
      if (!this.audioCtx || !this.ambientGain || this.isMutedSignal()) return;

      // Smoothly fade out previous oscillators
      const now = this.audioCtx.currentTime;
      this.ambientGain.gain.linearRampToValueAtTime(0.08, now + 2);

      this.ambientOscillators.forEach((osc) => {
        try {
          osc.stop(now + 3);
        } catch {
          // ignore
        }
      });
      this.ambientOscillators = [];

      chord.forEach((freq, idx) => {
        if (!this.audioCtx || !this.ambientGain) return;
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        // Soft sine and triangle blend for warmth
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle vibrato
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();
        lfo.frequency.value = 0.2 + idx * 0.05;
        lfoGain.gain.value = 1.2;
        lfo.connect(osc.frequency);
        lfo.start(now);

        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.04 / chord.length, now + 3);

        osc.connect(oscGain);
        oscGain.connect(this.ambientGain);

        osc.start(now);
        this.ambientOscillators.push(osc);
      });
    };

    playChord(chordSets[0]);

    if (this.ambientInterval) clearInterval(this.ambientInterval);
    this.ambientInterval = setInterval(() => {
      if (this.isMutedSignal()) return;
      currentChordIndex = (currentChordIndex + 1) % chordSets.length;
      playChord(chordSets[currentChordIndex]);
    }, 9000);
  }

  private stopAmbientSoundscape() {
    if (!this.audioCtx || !this.ambientGain) return;
    this.isPlayingAmbient.set(false);
    const now = this.audioCtx.currentTime;
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 1);

    setTimeout(() => {
      this.ambientOscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // ignore
        }
      });
      this.ambientOscillators = [];
    }, 1000);

    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  /** Plays a delicate celestial star chime when hovering/clicking stars */
  playStarChime(frequencyOffset = 0) {
    if (this.isMutedSignal()) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    const baseFreqs = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
    const freq = baseFreqs[Math.abs(frequencyOffset) % baseFreqs.length];

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.6);
  }

  /** Plays paper unfolding sound */
  playPaperSound() {
    if (this.isMutedSignal()) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.4);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  /** Plays sweet glowing heart chime burst with melodic harp-like arpeggio */
  playHeartChime() {
    if (this.isMutedSignal()) return;
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    const now = this.audioCtx.currentTime;
    // Romantic celestial arpeggio (C major 9 / F maj 7 chord progression)
    const freqs = [392.0, 523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98];

    freqs.forEach((f, i) => {
      if (!this.audioCtx || !this.masterGain) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.07);

      gain.gain.setValueAtTime(0.09, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.07 + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 2.0);
    });
  }
}
