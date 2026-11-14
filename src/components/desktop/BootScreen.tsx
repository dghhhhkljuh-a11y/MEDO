import React, { useState, useEffect } from 'react';
import { Power, Sparkles, Cpu } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { PlutoLogo } from '../common/PlutoLogo';
import { playSystemSound } from '../../utils/sound';

export const BootScreen: React.FC = () => {
  const { osPowerState, powerOnOS, systemVersion, updateStepInfo, realSystemInfo, hardwareMetrics } = useOS();

  const [bootProgress, setBootProgress] = useState(0);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    if (osPowerState === 'restarting' || osPowerState === 'booting') {
      setBootProgress(0);
      setBootLogs([
        `Initializing ${realSystemInfo.osType} ${realSystemInfo.release} (${realSystemInfo.arch})...`,
        `Connecting Node.js ${realSystemInfo.nodeVersion} host telemetry service...`,
      ]);

      const t1 = setTimeout(() => {
        setBootProgress(35);
        setBootLogs((prev) => [
          ...prev,
          '[OK] Browser WebCrypto Engine: AES-GCM-256 Active',
          `[OK] Host RAM Detected: ${hardwareMetrics.ramTotalGb} GB (${realSystemInfo.cpuCoresCount} CPU cores)`,
        ]);
      }, 700);

      const t2 = setTimeout(() => {
        setBootProgress(70);
        setBootLogs((prev) => [
          ...prev,
          '[OK] Desktop Window Compositor & WebAudio DSP initialized',
          '[OK] Express API proxy, Wiki Reader & npm Registry linked',
        ]);
      }, 1600);

      const t3 = setTimeout(() => {
        setBootProgress(100);
        setBootLogs((prev) => [
          ...prev,
          '[OK] System ready. Workspace restored.',
        ]);
      }, 2600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [osPowerState]);

  // Powered Off State
  if (osPowerState === 'powered_off') {
    return (
      <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center text-slate-400 select-none p-6 space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner">
          <Power className="w-8 h-8 text-slate-600" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-slate-300">Pluto OS Workstation is Powered Off</h2>
          <p className="text-xs text-slate-500 font-mono">All encrypted storage rings unmounted safely.</p>
        </div>
        <button
          onClick={() => {
            playSystemSound('click');
            powerOnOS();
          }}
          className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Power className="w-4 h-4" />
          Power On Pluto OS
        </button>
      </div>
    );
  }

  // Shutting down state
  if (osPowerState === 'shutting_down') {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center text-slate-300 select-none p-6 space-y-6 font-mono text-xs">
        <div className="relative">
          <PlutoLogo size={64} />
          <div className="absolute inset-0 rounded-full border-2 border-rose-500/40 animate-ping pointer-events-none" />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h3 className="text-sm font-bold text-white font-sans">Powering Off System Services...</h3>
          <p className="text-slate-400 text-[11px]">
            [OK] Synchronizing NVMe storage buffers to 1TB Cloud Vault...
          </p>
          <p className="text-slate-500 text-[11px]">
            [OK] Zeroing volatile RAM cache and encrypting hardware keys...
          </p>
        </div>
      </div>
    );
  }

  // PLUTO IS UPDATING BOOT SCREEN (Real Update & New Features)
  if (osPowerState === 'updating') {
    const progress = updateStepInfo?.progress ?? 0;
    const step = updateStepInfo?.step ?? 1;
    const total = updateStepInfo?.totalSteps ?? 4;
    const msg = updateStepInfo?.message ?? 'Installing Pluto OS System Update...';

    return (
      <div className="fixed inset-0 z-[99999] bg-gradient-to-b from-slate-950 via-[#060a14] to-[#0d1222] flex flex-col items-center justify-between p-10 select-none text-slate-100 font-sans">
        {/* Top Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800/60 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Pluto OS Kernel Upgrade in Progress</span>
        </div>

        {/* Center: Amazing Brand Logo & Live Update Progress */}
        <div className="flex flex-col items-center space-y-6 max-w-md w-full text-center">
          <div className="relative">
            <div className="scale-125 transform transition-transform duration-500">
              <PlutoLogo size={80} />
            </div>
            {/* Spinning orbital halo */}
            <div className="absolute -inset-4 rounded-full border-2 border-dashed border-purple-400/50 animate-[spin_6s_linear_infinite] pointer-events-none" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Pluto OS is Updating
            </h2>
            <p className="text-xs text-purple-300 font-mono">
              Do not turn off or unplug your computer.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <div className="w-full h-2.5 bg-slate-900 border border-purple-900/80 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
              />
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="text-purple-400">Step {step} of {total}</span>
              <span className="text-cyan-400 font-bold">{progress}%</span>
            </div>
          </div>

          {/* Current Action Pill */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-left w-full space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Operation</span>
            <p className="text-xs text-slate-200 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span>{msg}</span>
            </p>
          </div>

          {/* Unlocked Features Badge */}
          <div className="pt-2 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Installing Features:</span>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700">Dark/Light Mode Engine</span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-indigo-300 border border-slate-700">Clipboard Paste/Copy/Delete</span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-purple-300 border border-slate-700">Factory Recovery Enclave</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-500 font-mono text-center">
          Kernel 6.12.3-pluto-rt · Cryptographic Package Verified · Secure Boot
        </div>
      </div>
    );
  }

  // STANDARD BOOT / RESTART SCREEN
  if (osPowerState === 'restarting' || osPowerState === 'booting') {
    return (
      <div className="fixed inset-0 z-[99999] bg-gradient-to-b from-slate-950 via-slate-900 to-[#070b14] flex flex-col items-center justify-between p-10 select-none text-slate-100 font-sans">
        {/* Top bar */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Pluto Hardware Enclave · Secure Unified Bootloader</span>
        </div>

        {/* Center: Amazing Brand Logo & Boot Animation */}
        <div className="flex flex-col items-center space-y-6 max-w-sm w-full text-center">
          <div className="relative">
            <div className="transform hover:scale-105 transition-transform duration-500">
              <PlutoLogo size={80} />
            </div>
            <div className="absolute -inset-4 rounded-full border border-cyan-500/20 animate-pulse pointer-events-none" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              PLUTO <span className="text-cyan-400 font-mono text-lg">OS</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {systemVersion}
            </p>
          </div>

          {/* Boot Progress Bar */}
          <div className="w-full space-y-2">
            <div className="w-full h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${bootProgress}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>Booting System Core</span>
              <span className="text-cyan-400 font-bold">{bootProgress}%</span>
            </div>
          </div>

          {/* Live Diagnostic Logs */}
          <div className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-xl text-left w-full h-28 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1 shadow-inner">
            {bootLogs.map((log, i) => (
              <div key={i} className="leading-tight flex items-start gap-1.5">
                <span className="text-cyan-400 shrink-0">›</span>
                <span className={log.includes('[OK]') ? 'text-emerald-400' : 'text-slate-300'}>{log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-500 font-mono text-center">
          Press ESC for Diagnostic Setup · UEFI 2.10 · 256-Bit Hardware Enclave
        </div>
      </div>
    );
  }

  return null;
};
