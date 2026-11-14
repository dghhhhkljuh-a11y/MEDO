// Web Audio API System Sound Engine for Pluto OS
// Handles browser autoplay permissions, synthesized system chimes, and UI audio effects.

let globalAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;
let systemVolume = 0.85;
let isMutedState = false;

// Initialize or return AudioContext
export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }

  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().then(() => {
      isAudioUnlocked = true;
    }).catch(() => {});
  }

  return globalAudioCtx;
};

// Auto-unlock audio on first user interaction anywhere in the window
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isAudioUnlocked = true;
        });
      } else {
        isAudioUnlocked = true;
      }
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

export const setSystemSoundVolume = (volPct: number, muted = false) => {
  systemVolume = Math.max(0, Math.min(1, volPct / 100));
  isMutedState = muted;
};

export type SoundEffectType =
  | 'click'
  | 'window_open'
  | 'window_close'
  | 'chime'
  | 'notification'
  | 'boot'
  | 'shutdown'
  | 'error'
  | 'key';

export const playSystemSound = (type: SoundEffectType, volumeMultiplier = 1.0) => {
  if (isMutedState || systemVolume === 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const effectiveGain = systemVolume * volumeMultiplier * 0.15;

  try {
    switch (type) {
      case 'click': {
        // High-frequency tactile mechanical click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

        gain.gain.setValueAtTime(effectiveGain * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'window_open': {
        // Futuristic upward sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(effectiveGain * 0.6, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }

      case 'window_close': {
        // Soft downward resolution
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

        gain.gain.setValueAtTime(effectiveGain * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'chime':
      case 'notification': {
        // Crystal arpeggio chord (E5 -> B5 -> E6)
        const notes = [659.25, 987.77, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.06;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.001, noteStart);
          gain.gain.linearRampToValueAtTime(effectiveGain * 0.7, noteStart + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.36);
        });
        break;
      }

      case 'boot': {
        // Iconic Pluto OS Startup Chord (C3 - G3 - E4 - C5)
        const chord = [130.81, 196.0, 329.63, 523.25];
        chord.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + i * 0.08;

          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.001, noteStart);
          gain.gain.linearRampToValueAtTime(effectiveGain * 0.9, noteStart + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 1.25);
        });
        break;
      }

      case 'shutdown': {
        // Power-off descending sub tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

        gain.gain.setValueAtTime(effectiveGain * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }

      case 'error': {
        // Dual alert buzz
        [0, 0.1].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + delay;

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, noteStart);

          gain.gain.setValueAtTime(effectiveGain * 0.5, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.07);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.07);
        });
        break;
      }

      case 'key': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(effectiveGain * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      }
    }
  } catch (err) {
    console.warn('System sound play error:', err);
  }
};

// Play synthesizer note for AudioStudioApp
export const playSynthTone = (
  frequency: number,
  waveform: OscillatorType = 'sine',
  durationSeconds = 0.5,
  volumePct = 50
) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const masterVol = (volumePct / 100) * (systemVolume || 0.85) * 0.25;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = waveform;
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(masterVol, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSeconds);
};

// Synthesize distinct Calendar Alarm tones
export const playAlarmTone = (
  soundType: 'crystal_chime' | 'digital_pulse' | 'orbital_bell' | 'gentle_synth' | 'silent',
  volumePct = 80
) => {
  if (soundType === 'silent' || isMutedState) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const masterVol = (Math.max(5, volumePct) / 100) * (systemVolume || 0.85) * 0.25;

  try {
    if (soundType === 'crystal_chime') {
      const notes = [587.33, 880, 1174.66, 1760];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(masterVol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.56);
      });
    } else if (soundType === 'digital_pulse') {
      [0, 0.16, 0.32, 0.6].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + offset;
        osc.type = 'square';
        osc.frequency.setValueAtTime(980, t);
        gain.gain.setValueAtTime(masterVol * 0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.11);
      });
    } else if (soundType === 'orbital_bell') {
      [440, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.18;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(masterVol * 0.9, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.72);
      });
    } else if (soundType === 'gentle_synth') {
      const chord = [261.63, 329.63, 392.0, 493.88];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(masterVol * 0.65, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.15);
      });
    }
  } catch (err) {
    console.warn('Alarm tone play error:', err);
  }
};
