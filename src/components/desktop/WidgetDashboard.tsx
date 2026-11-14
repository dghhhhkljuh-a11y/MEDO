import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Activity,
  HardDrive,
  CheckCircle2,
  Circle,
  X,
  LayoutGrid,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const WidgetDashboard: React.FC = () => {
  const {
    widgetDashboardOpen,
    setWidgetDashboardOpen,
    hardwareMetrics,
    totalQuotaBytes,
    usedQuotaBytes,
    tasks,
    toggleTask,
    openApp,
  } = useOS();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!widgetDashboardOpen) return null;

  const usedGb = (usedQuotaBytes / (1024 * 1024 * 1024)).toFixed(1);
  const totalGb = (totalQuotaBytes / (1024 * 1024 * 1024)).toFixed(0);
  const quotaPercent = Math.round((usedQuotaBytes / totalQuotaBytes) * 100);

  const p0p1Tasks = tasks.filter((t) => t.priority === 'P0 Critical' || t.priority === 'P1 High').slice(0, 3);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed top-3 right-3 bottom-14 z-[8500] w-88 dark:bg-slate-950/92 bg-white/92 border dark:border-slate-700/80 border-slate-200 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl dark:text-slate-100 text-slate-900 select-none flex flex-col space-y-4 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-cyan-500" />
          <h3 className="text-xs font-bold dark:text-slate-200 text-slate-800">Pluto Glance Dashboard</h3>
        </div>
        <button
          onClick={() => setWidgetDashboardOpen(false)}
          className="p-1 text-slate-400 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Widget 1: Live Date & Time */}
      <div
        onClick={() => openApp('calendar')}
        title="Open Date, Time & Calendar Hub"
        className="p-4 dark:bg-slate-900/80 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:hover:border-slate-700 hover:border-cyan-400 rounded-xl cursor-pointer transition-all space-y-1"
      >
        <span className="text-[11px] font-mono dark:text-cyan-400 text-cyan-600 block uppercase tracking-wider">
          {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="text-3xl font-extrabold font-mono dark:text-slate-100 text-slate-900 tabular-nums">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <span className="text-[10px] text-slate-500 font-mono block">Click to open Calendar & Clocks</span>
      </div>

      {/* Widget 2: Weather Quick Glance */}
      <div
        onClick={() => openApp('weather')}
        title="Open Weather Radar"
        className="p-4 dark:bg-slate-900/80 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:hover:border-slate-700 hover:border-cyan-400 rounded-xl cursor-pointer transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <CloudSun className="w-8 h-8 text-cyan-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold dark:text-slate-200 text-slate-800">Local Radar</h4>
            <span className="text-[11px] dark:text-slate-400 text-slate-500">Mild Breeze · 68% Humidity</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold font-mono dark:text-slate-100 text-slate-900">18°C</span>
          <span className="text-[10px] text-slate-500 font-mono block">64°F</span>
        </div>
      </div>

      {/* Widget 3: Live Hardware Telemetry */}
      <div
        onClick={() => openApp('sys_monitor')}
        title="Open System Monitor"
        className="p-4 dark:bg-slate-900/80 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:hover:border-slate-700 hover:border-cyan-400 rounded-xl cursor-pointer transition-all space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold dark:text-slate-200 text-slate-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" /> System Telemetry
          </span>
          <span className="text-[10px] font-mono dark:text-cyan-400 text-cyan-600">Live 1.5s</span>
        </div>

        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[11px] font-mono dark:text-slate-400 text-slate-600 mb-1">
              <span>CPU Load</span>
              <span className="dark:text-cyan-400 text-cyan-600 tabular-nums">{hardwareMetrics.cpuTotal}%</span>
            </div>
            <div className="w-full h-1.5 dark:bg-slate-950 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${hardwareMetrics.cpuTotal}%` }}
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono dark:text-slate-400 text-slate-600 mb-1">
              <span>RAM Allocation</span>
              <span className="dark:text-emerald-400 text-emerald-600 tabular-nums">{hardwareMetrics.ramUsedGb} GB / 32 GB</span>
            </div>
            <div className="w-full h-1.5 dark:bg-slate-950 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${(hardwareMetrics.ramUsedGb / 32) * 100}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Widget 4: 1TB Integrated Cloud Quota */}
      <div
        onClick={() => openApp('cloud_vault')}
        title="Open 1TB Cloud Vault"
        className="p-4 dark:bg-slate-900/80 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:hover:border-slate-700 hover:border-cyan-400 rounded-xl cursor-pointer transition-all space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold dark:text-slate-200 text-slate-800 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" /> 1TB Cloud Vault
          </span>
          <span className="text-[10px] font-mono text-purple-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> E2EE
          </span>
        </div>

        <div className="flex items-baseline justify-between font-mono text-xs dark:text-slate-400 text-slate-600">
          <span>{usedGb} GB used</span>
          <span className="dark:text-slate-200 text-slate-800">{totalGb} GB</span>
        </div>

        <div className="w-full h-2 dark:bg-slate-950 bg-slate-200 rounded-full overflow-hidden border dark:border-slate-800 border-slate-300">
          <div
            style={{ width: `${quotaPercent}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
          />
        </div>
      </div>

      {/* Widget 5: P0-P1 Priority Tasks */}
      <div
        onClick={() => openApp('task_manager')}
        title="Open Task Manager"
        className="p-4 dark:bg-slate-900/80 bg-slate-50 border dark:border-slate-800 border-slate-200 dark:hover:border-slate-700 hover:border-cyan-400 rounded-xl cursor-pointer transition-all space-y-2 flex-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold dark:text-slate-200 text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Critical Priorities
          </span>
          <span className="text-[10px] font-mono text-slate-500">P0 / P1</span>
        </div>

        <div className="space-y-1.5 pt-1">
          {p0p1Tasks.map((t) => (
            <div
              key={t.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleTask(t.id);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg dark:bg-slate-950/70 bg-white dark:hover:bg-slate-950 hover:bg-slate-100 border dark:border-slate-800/80 border-slate-200 transition-colors"
            >
              {t.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className={`text-[11px] truncate flex-1 ${t.completed ? 'line-through text-slate-400' : 'dark:text-slate-200 text-slate-800'}`}>
                {t.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
