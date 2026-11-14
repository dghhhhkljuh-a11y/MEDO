import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Square,
  Activity,
  Music,
  Disc,
  SlidersVertical,
  Volume1,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { playSystemSound, getAudioContext } from '../../utils/sound';

export const AudioStudioApp: React.FC = () => {
  const { volume, mixerChannels, setMixerChannelVolume, toggleMixerChannelMute } = useOS();

  const [activeTab, setActiveTab] = useState<'mixer' | 'equalizer' | 'synth'>('mixer');
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const [selectedWaveform, setSelectedWaveform] = useState<OscillatorType>('sine');
  const [activeFrequency, setActiveFrequency] = useState(440); // A4
  const [activePreset, setActivePreset] = useState<string>('flat');

  // 5 Equalizer bands in dB (-12 to +12)
  const [eqBands, setEqBands] = useState({
    band60: 0,
    band250: 0,
    band1k: 0,
    band4k: 0,
    band16k: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Web Audio API
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const existing = getAudioContext();
      if (existing) {
        audioCtxRef.current = existing;
      } else {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const startTone = (freq = activeFrequency) => {
    initAudio();
    if (!audioCtxRef.current || !analyserRef.current) return;

    stopTone();

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.type = selectedWaveform;
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);

    // Ensure clear audible volume
    const vol = Math.max(0.12, (volume / 100) * 0.3);
    gain.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);

    osc.connect(gain);
    gain.connect(analyserRef.current);
    analyserRef.current.connect(audioCtxRef.current.destination);

    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    setIsPlayingTone(true);
  };

  const stopTone = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch {}
      oscRef.current = null;
    }
    setIsPlayingTone(false);
  };

  // Real canvas spectrum visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localAngle = 0;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, width, height);

      if (analyserRef.current && isPlayingTone) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;

          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(0.5, '#6366f1');
          gradient.addColorStop(1, '#ec4899');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }
      } else {
        localAngle += 0.04;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < width; x += 3) {
          const y = height / 2 + Math.sin(x * 0.02 + localAngle) * 8 + Math.cos(x * 0.01 - localAngle) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopTone();
    };
  }, [isPlayingTone]);

  const setPreset = (name: string) => {
    setActivePreset(name);
    if (name === 'flat') {
      setEqBands({ band60: 0, band250: 0, band1k: 0, band4k: 0, band16k: 0 });
    } else if (name === 'bass') {
      setEqBands({ band60: 6, band250: 4, band1k: -1, band4k: 1, band16k: 2 });
    } else if (name === 'vocal') {
      setEqBands({ band60: -3, band250: 1, band1k: 5, band4k: 4, band16k: 1 });
    } else if (name === 'electronic') {
      setEqBands({ band60: 5, band250: 3, band1k: -2, band4k: 4, band16k: 6 });
    }
  };

  const musicalNotes = [
    { label: 'C4', freq: 261.63 },
    { label: 'D4', freq: 293.66 },
    { label: 'E4', freq: 329.63 },
    { label: 'F4', freq: 349.23 },
    { label: 'G4', freq: 392.0 },
    { label: 'A4', freq: 440.0 },
    { label: 'B4', freq: 493.88 },
    { label: 'C5', freq: 523.25 },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Banner & Tabs */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">Pluto Audio DSP & Hardware Engine</h3>
            <span className="text-[11px] text-slate-400 font-mono">Real-time low-latency pipewire audio compositor</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('mixer')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'mixer'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersVertical className="w-3.5 h-3.5" />
            Audio Mixer ({mixerChannels.length})
          </button>
          <button
            onClick={() => setActiveTab('equalizer')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'equalizer'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            5-Band EQ
          </button>
          <button
            onClick={() => setActiveTab('synth')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'synth'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Synthesizer
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* AUDIO MIXER TAB */}
        {activeTab === 'mixer' && (
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Multi-Process Audio Mixer</h4>
                <p className="text-xs text-slate-400">
                  Independently adjust output volume, mute status, and peak levels for active system applications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    initAudio();
                    playSystemSound('chime', 1.2);
                  }}
                  className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/40 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Play instant crystal audio chime through soundcard"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Test Audio Chime
                </button>
                <button
                  onClick={() => {
                    mixerChannels.forEach((ch) => setMixerChannelVolume(ch.id, 80));
                  }}
                  className="px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to 80% Unity
                </button>
              </div>
            </div>

            {/* Channels Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {mixerChannels.map((channel) => {
                const isMaster = channel.id === 'master';
                return (
                  <div
                    key={channel.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isMaster
                        ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-800/60 shadow-lg ring-1 ring-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{channel.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {isMaster ? 'Hardware DAC Pipe' : `PID Active · Sink #${channel.id}`}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleMixerChannelMute(channel.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          channel.muted
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                        title={channel.muted ? 'Unmute' : 'Mute Channel'}
                      >
                        {channel.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Volume Slider & Level Gauge */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Gain Fader</span>
                        <span className="font-bold text-cyan-400 tabular-nums">
                          {channel.muted ? '0%' : `${channel.volume}%`}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={channel.muted ? 0 : channel.volume}
                        onChange={(e) => setMixerChannelVolume(channel.id, parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />

                      {/* Animated Simulated Peak Meter */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                          <span>Peak VU</span>
                          <span className={channel.volume > 85 ? 'text-rose-400' : 'text-emerald-400'}>
                            {channel.muted ? '-∞ dB' : `${channel.peakDb} dB`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden flex gap-0.5">
                          <div
                            style={{ width: `${Math.min(70, channel.muted ? 0 : channel.volume * 0.7)}%` }}
                            className="h-full bg-emerald-500 rounded-l transition-all duration-150"
                          />
                          <div
                            style={{
                              width: `${
                                channel.muted || channel.volume <= 70
                                  ? 0
                                  : Math.min(20, (channel.volume - 70) * 1.5)
                              }%`,
                            }}
                            className="h-full bg-amber-400 transition-all duration-150"
                          />
                          <div
                            style={{
                              width: `${
                                channel.muted || channel.volume <= 90
                                  ? 0
                                  : (channel.volume - 90) * 10
                              }%`,
                            }}
                            className="h-full bg-rose-500 rounded-r transition-all duration-150"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5-BAND EQUALIZER TAB */}
        {activeTab === 'equalizer' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Graphic Equalizer</h4>
                <p className="text-xs text-slate-400">Tune audio output response across 5 frequency bands.</p>
              </div>

              <div className="flex items-center gap-1.5">
                {['flat', 'bass', 'vocal', 'electronic'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                      activePreset === p
                        ? 'bg-pink-500 text-slate-950 border-pink-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="grid grid-cols-5 gap-4 pt-2">
                {[
                  { key: 'band60', label: '60 Hz', sub: 'Sub-Bass' },
                  { key: 'band250', label: '250 Hz', sub: 'Bass' },
                  { key: 'band1k', label: '1.0 kHz', sub: 'Midrange' },
                  { key: 'band4k', label: '4.0 kHz', sub: 'Presence' },
                  { key: 'band16k', label: '16.0 kHz', sub: 'Treble' },
                ].map((band) => (
                  <div key={band.key} className="flex flex-col items-center p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                    <span className="text-xs font-bold font-mono text-slate-200">{band.label}</span>
                    <span className="text-[10px] text-slate-500">{band.sub}</span>

                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={(eqBands as any)[band.key]}
                      onChange={(e) =>
                        setEqBands((prev) => ({ ...prev, [band.key]: parseInt(e.target.value) }))
                      }
                      className="w-24 -rotate-90 my-8 accent-pink-500 cursor-pointer"
                    />

                    <span className="text-xs font-mono font-semibold text-pink-400 tabular-nums">
                      {(eqBands as any)[band.key] > 0 ? `+${(eqBands as any)[band.key]}` : (eqBands as any)[band.key]} dB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SYNTHESIZER TAB */}
        {activeTab === 'synth' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Real Canvas Spectrum Visualizer */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Real-Time FFT Spectrum Visualizer (64 Bins)
                </span>
                <span className="font-mono text-[11px] text-pink-400">
                  {isPlayingTone ? `Generating ${selectedWaveform.toUpperCase()} @ ${activeFrequency} Hz` : 'Spectrum Engine Idle'}
                </span>
              </div>
              <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <canvas ref={canvasRef} width={760} height={112} className="w-full h-full block" />
              </div>
            </div>

            {/* Keyboard & Waveform Controls */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Live Synthesizer Keyboard</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Click any musical note to play directly through the DSP engine.</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['sine', 'triangle', 'square', 'sawtooth'] as OscillatorType[]).map((wave) => (
                    <button
                      key={wave}
                      onClick={() => {
                        setSelectedWaveform(wave);
                        if (isPlayingTone) startTone(activeFrequency);
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                        selectedWaveform === wave
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {wave}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
                {musicalNotes.map((n) => (
                  <button
                    key={n.label}
                    onClick={() => {
                      setActiveFrequency(n.freq);
                      startTone(n.freq);
                    }}
                    className={`p-3 rounded-lg border flex flex-col items-center transition-all ${
                      isPlayingTone && activeFrequency === n.freq
                        ? 'bg-pink-500 text-slate-950 border-pink-400 shadow-lg scale-95'
                        : 'bg-slate-950 hover:bg-slate-800/80 text-slate-200 border-slate-800'
                    }`}
                  >
                    <span className="text-sm font-bold">{n.label}</span>
                    <span className="text-[10px] font-mono opacity-70 mt-1">{n.freq.toFixed(0)} Hz</span>
                  </button>
                ))}
              </div>

              {isPlayingTone && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={stopTone}
                    className="px-4 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Stop Sound
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
