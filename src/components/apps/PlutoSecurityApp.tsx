import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Radio,
  RefreshCw,
  Trash2,
  Lock,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const PlutoSecurityApp: React.FC = () => {
  const {
    securityShields,
    toggleSecurityShield,
    isThreatScanRunning,
    threatScanProgress,
    startSecurityScan,
    threats,
    clearThreats,
  } = useOS();

  const [activeTab, setActiveTab] = useState<'overview' | 'shields' | 'quarantine' | 'logs'>('overview');

  const allShieldsActive = Object.values(securityShields).every(Boolean);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Security Status Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border-b border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
              allShieldsActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {allShieldsActive ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Pluto Security & Threat Defense</h3>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  allShieldsActive
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                    : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                }`}>
                  {allShieldsActive ? 'SYSTEM FORTIFIED' : 'ATTENTION REQUIRED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time kernel memory defense, network packet firewall, and zero-day heuristic detection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startSecurityScan('quick')}
              disabled={isThreatScanRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              {isThreatScanRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Radio className="w-3.5 h-3.5 text-cyan-400" />}
              Quick Scan
            </button>
            <button
              onClick={() => startSecurityScan('deep')}
              disabled={isThreatScanRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg shadow-sm transition-colors"
            >
              {isThreatScanRunning ? 'Scanning Memory...' : 'Deep Kernel Scan'}
            </button>
          </div>
        </div>

        {/* Scan in Progress Bar */}
        {isThreatScanRunning && (
          <div className="max-w-5xl mx-auto mt-4 p-3 bg-slate-950/80 rounded-lg border border-cyan-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Scanning active RAM pages, process descriptors, and loaded kernel modules...
              </span>
              <span>{threatScanProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                style={{ width: `${threatScanProgress}%` }}
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'overview' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Security Overview
        </button>
        <button
          onClick={() => setActiveTab('shields')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'shields' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Shields (4/4)
        </button>
        <button
          onClick={() => setActiveTab('quarantine')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'quarantine' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Quarantine Vault ({threats.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'logs' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Threat Logs
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs text-slate-400">Total Files Inspected</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 block tabular-nums">482,190</span>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Real-time watch active
                </span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs text-slate-400">Blocked Exploits (30d)</span>
                <span className="text-2xl font-bold font-mono text-purple-400 block tabular-nums">14</span>
                <span className="text-[11px] text-slate-400 font-mono">0 breaches occurred</span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs text-slate-400">Threat Signatures Database</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 block tabular-nums">v2026.11.06</span>
                <span className="text-[11px] text-slate-400 font-mono">Updated today via Cloud</span>
              </div>
            </div>

            {/* Shield Grid */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-200">Pluto Real-Time Protection Matrix</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'filesystem', title: 'Filesystem Shield', desc: 'Inspects executable binary writes and mounts in real-time.' },
                  { key: 'firewall', title: 'Network Firewall', desc: 'Stateful packet inspection blocking unauthorized outbound ports.' },
                  { key: 'sandbox', title: 'Memory Sandbox', desc: 'Restricts Android container and browser process memory pages.' },
                  { key: 'heuristics', title: 'Behavioral AI Engine', desc: 'Interceptors for anomalous syscall cascades and crypto ransom patterns.' },
                ].map((s) => (
                  <div key={s.key} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{s.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleSecurityShield(s.key as any)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors shrink-0 ml-3 ${
                        (securityShields as any)[s.key]
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {(securityShields as any)[s.key] ? 'Armed' : 'Paused'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shields' && (
          <div className="max-w-5xl mx-auto space-y-3">
            <h4 className="text-xs font-bold text-slate-200 mb-2">Detailed Shield Configuration</h4>
            {Object.entries(securityShields).map(([key, active]) => (
              <div key={key} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-200 capitalize">{key} Engine</h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuously scans system interrupts and enforces least privilege boundaries.
                  </p>
                </div>
                <button
                  onClick={() => toggleSecurityShield(key as any)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {active ? 'Active & Enforcing' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quarantine' && (
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Quarantine Isolation Vault</h4>
                <p className="text-xs text-slate-400">Suspicious blobs safely isolated from the kernel.</p>
              </div>
              {threats.length > 0 && (
                <button
                  onClick={clearThreats}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge All Quarantined Items
                </button>
              )}
            </div>

            {threats.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-xs">
                Quarantine vault is empty. No malicious artifacts detected.
              </div>
            ) : (
              threats.map((threat) => (
                <div key={threat.id} className="p-4 bg-slate-900 border border-rose-900/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/30 shrink-0">
                      <FileWarning className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-100">{threat.name}</h5>
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                          {threat.severity}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block mt-1">{threat.path}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/40">
                    {threat.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="max-w-5xl mx-auto space-y-2 font-mono text-xs">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="text-slate-400 border-b border-slate-800 pb-2">Kernel Security Event Log (Live Stream):</div>
              <p className="text-emerald-400">[2026-11-06 23:48:12] Kernel page table isolation (KPTI) verified valid.</p>
              <p className="text-slate-300">[2026-11-06 23:44:02] Outbound connection to unknown host 185.220.101.4:8080 intercepted & blocked by Firewall.</p>
              <p className="text-cyan-400">[2026-11-06 23:30:19] E2EE backup snapshot completed without cryptographic integrity divergence.</p>
              <p className="text-slate-400">[2026-11-06 23:15:00] Scheduled background memory defragmentation cycle concluded nominal.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
