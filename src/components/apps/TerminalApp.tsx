import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2 } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppId } from '../../types/os';

interface TermEntry {
  id: string;
  command: string;
  output: string;
  isError?: boolean;
}

export const TerminalApp: React.FC = () => {
  const { processes, user, openApp, launchBrowserSearch, hardwareMetrics } = useOS();
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [entries, setEntries] = useState<TermEntry[]>([
    {
      id: 'init',
      command: 'welcome',
      output:
        'Pluto Interactive Shell — connected to live Express/Node host & Web APIs.\nType `help` to list real commands (`sysinfo`, `free`, `ps`, `npm <pkg>`, `wiki <topic>`, `calc <expr>`, `open <app>`).',
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const appendEntry = (command: string, output: string, isError = false) => {
    setEntries((prev) => [
      ...prev,
      { id: `cmd-${Date.now()}-${Math.random()}`, command, output, isError },
    ]);
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw || running) return;
    setInput('');

    const [cmdRaw, ...rest] = raw.split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const arg = rest.join(' ');

    if (cmd === 'clear' || cmd === 'cls') {
      setEntries([]);
      return;
    }

    if (cmd === 'help') {
      appendEntry(
        raw,
        [
          'Available live commands:',
          '  sysinfo          Fetch real OS, CPU model, kernel & memory stats from host',
          '  uname -a         Print host kernel & architecture string',
          '  free             Show real host RAM & process memory usage',
          '  ps               List active Pluto OS window/system processes',
          '  npm <query>      Query live npm registry packages (e.g. npm react)',
          '  wiki <topic>     Fetch live Wikipedia summary (e.g. wiki Pluto)',
          '  fetch <url>      Inspect live HTTP status & frame headers (e.g. fetch https://example.com)',
          '  calc <expr>      Evaluate arithmetic expression (e.g. calc (12*8)/4)',
          '  open <app>       Launch app (browser, store, notes, calculator, settings, ai_assistant)',
          '  whoami / date    Show signed-in operator or current timestamp',
          '  clear            Clear terminal output',
        ].join('\n')
      );
      return;
    }

    if (cmd === 'whoami') {
      appendEntry(raw, `${user.username} (${user.displayName}) · ${user.email}`);
      return;
    }

    if (cmd === 'date') {
      appendEntry(raw, new Date().toString());
      return;
    }

    if (cmd === 'ps') {
      const lines = processes.map(
        (p) => `${String(p.id).padEnd(6)} ${p.status.padEnd(10)} ${String(p.cpuPct + '%').padEnd(8)} ${String(p.ramMb + 'MB').padEnd(8)} ${p.name}`
      );
      appendEntry(raw, ['PID    STATUS     CPU      MEM      PROCESS', ...lines].join('\n'));
      return;
    }

    if (cmd === 'calc') {
      if (!arg) {
        appendEntry(raw, 'Usage: calc <expression>', true);
        return;
      }
      if (!/^[0-9+\-*/().%\s]+$/.test(arg)) {
        appendEntry(raw, 'Invalid expression. Only numbers and + - * / ( ) % are permitted.', true);
        return;
      }
      try {
        // Safe numeric expression evaluation after strict whitelist validation
        const result = Function(`"use strict"; return (${arg});`)();
        appendEntry(raw, `= ${String(result)}`);
      } catch {
        appendEntry(raw, 'Syntax error in expression.', true);
      }
      return;
    }

    if (cmd === 'open') {
      const validApps: AppId[] = [
        'browser',
        'store',
        'settings',
        'task_manager',
        'calendar',
        'ai_assistant',
        'notes',
        'calculator',
        'terminal',
        'mail',
        'weather',
        'games',
        'security',
        'cloud_vault',
      ];
      if (!arg || !validApps.includes(arg as AppId)) {
        appendEntry(raw, `Usage: open <${validApps.join(' | ')}>`, true);
        return;
      }
      openApp(arg as AppId);
      appendEntry(raw, `Launched ${arg}.`);
      return;
    }

    if (cmd === 'sysinfo' || cmd === 'uname' || cmd === 'free' || cmd === 'uptime') {
      setRunning(true);
      try {
        const res = await fetch('/api/system/info');
        const info = await res.json();
        if (cmd === 'uname') {
          appendEntry(raw, `${info.osType} ${info.hostname} ${info.release} ${info.arch} Node/${info.nodeVersion}`);
        } else if (cmd === 'free') {
          appendEntry(
            raw,
            `Host Memory : ${info.ramUsedGb} GB used / ${info.ramTotalGb} GB total (${info.ramFreeGb} GB free)\nNode Process: RSS ${info.processMemoryMb?.rss} MB | Heap ${info.processMemoryMb?.heapUsed}/${info.processMemoryMb?.heapTotal} MB`
          );
        } else if (cmd === 'uptime') {
          appendEntry(raw, `Host Uptime: ${Math.floor(info.uptimeSeconds / 60)}m | Server Uptime: ${info.serverUptimeSeconds}s | Load Avg: ${(info.loadAvg || []).join(', ')}`);
        } else {
          appendEntry(
            raw,
            [
              `Host      : ${info.hostname} (${info.osType} ${info.release} · ${info.arch})`,
              `CPU       : ${info.cpuModel} (${info.cpuCoresCount} logical cores)`,
              `CPU Load  : ${info.cpuTotalPct}% (Load Avg: ${(info.loadAvg || []).join(', ')})`,
              `Memory    : ${info.ramUsedGb} GB / ${info.ramTotalGb} GB`,
              `Runtime   : Node ${info.nodeVersion} · Package v${info.appPackageVersion}`,
              `Browser   : ${navigator.hardwareConcurrency || '?'} threads · Live UI CPU ${hardwareMetrics.cpuTotal}%`,
            ].join('\n')
          );
        }
      } catch {
        appendEntry(raw, 'Failed to query /api/system/info.', true);
      } finally {
        setRunning(false);
      }
      return;
    }

    if (cmd === 'npm') {
      if (!arg) {
        appendEntry(raw, 'Usage: npm <package-name>', true);
        return;
      }
      setRunning(true);
      try {
        const res = await fetch(`/api/store/packages?q=${encodeURIComponent(arg)}`);
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.packages)) {
          appendEntry(raw, data.error || 'Registry lookup failed.', true);
        } else {
          const lines = data.packages.slice(0, 6).map(
            (p: any) => `${p.name}@${p.version} — ${p.description.slice(0, 72)}`
          );
          appendEntry(raw, lines.length ? lines.join('\n') : 'No matching packages found.');
        }
      } catch {
        appendEntry(raw, 'Unable to reach live npm registry.', true);
      } finally {
        setRunning(false);
      }
      return;
    }

    if (cmd === 'wiki') {
      if (!arg) {
        appendEntry(raw, 'Usage: wiki <topic>', true);
        return;
      }
      setRunning(true);
      try {
        const res = await fetch(`/api/wiki?title=${encodeURIComponent(arg)}`);
        const data = await res.json();
        if (!res.ok) {
          appendEntry(raw, data.error || 'Article not found.', true);
        } else {
          appendEntry(raw, `[${data.title}] ${data.description ? `(${data.description})\n` : '\n'}${data.summary}`);
        }
      } catch {
        appendEntry(raw, 'Unable to reach Wikipedia endpoint.', true);
      } finally {
        setRunning(false);
      }
      return;
    }

    if (cmd === 'fetch') {
      if (!arg) {
        appendEntry(raw, 'Usage: fetch <https://...>', true);
        return;
      }
      setRunning(true);
      try {
        const res = await fetch(`/api/web/reader?url=${encodeURIComponent(arg)}`);
        const data = await res.json();
        if (!res.ok) {
          appendEntry(raw, data.error || 'Fetch failed.', true);
        } else {
          appendEntry(
            raw,
            `HTTP ${data.status} · ${data.title}\nFrame Blocked: ${data.frameBlocked ? 'YES (Reader active)' : 'NO (Iframe ready)'}\nExtracted Paragraphs: ${data.paragraphs?.length || 0}`
          );
        }
      } catch {
        appendEntry(raw, 'Request failed.', true);
      } finally {
        setRunning(false);
      }
      return;
    }

    if (cmd === 'search') {
      if (arg) launchBrowserSearch(arg);
      appendEntry(raw, arg ? `Opened Web Navigator search for "${arg}".` : 'Usage: search <query>', !arg);
      return;
    }

    appendEntry(raw, `Command not found: ${cmd}. Type \`help\` for available commands.`, true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-mono text-xs">
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <TerminalIcon className="w-4 h-4" />
          <span>Pluto Shell (Live Host & API CLI)</span>
        </div>
        <button
          onClick={() => setEntries([])}
          className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 select-text">
        {entries.map((entry) => (
          <div key={entry.id} className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="text-emerald-400">{user.username}@pluto:~$</span>
              <span>{entry.command}</span>
            </div>
            <pre
              className={`whitespace-pre-wrap leading-relaxed pl-2 border-l-2 ${
                entry.isError ? 'text-rose-400 border-rose-500/40' : 'text-slate-300 border-slate-800'
              }`}
            >
              {entry.output}
            </pre>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleRun} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <span className="text-emerald-400 font-bold shrink-0">{user.username}@pluto:~$</span>
        <input
          type="text"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={running}
          placeholder="Type command (e.g. sysinfo, npm vite, wiki Earth, help)..."
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
        />
      </form>
    </div>
  );
};
