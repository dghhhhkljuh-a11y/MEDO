import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Volume2,
  VolumeX,
  Battery,
  LayoutGrid,
  Bell,
  Activity,
  Cloud,
  Globe,
  ShoppingBag,
  Shield,
  Sliders,
  Gamepad2,
  Settings,
  Calendar,
  Download,
  CloudSun,
  Mail,
  Sparkles,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppId } from '../../types/os';
import { PlutoLogo } from '../common/PlutoLogo';
import { playSystemSound } from '../../utils/sound';

export const Taskbar: React.FC = () => {
  const {
    startMenuOpen,
    setStartMenuOpen,
    quickSettingsOpen,
    setQuickSettingsOpen,
    widgetDashboardOpen,
    setWidgetDashboardOpen,
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    windows,
    activeAppId,
    focusApp,
    minimizeApp,
    wifiEnabled,
    bluetoothEnabled,
    volume,
    isMuted,
    batteryPct,
    isCharging,
    openApp,
  } = useOS();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const getAppIcon = (id: AppId) => {
    switch (id) {
      case 'task_manager':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'cloud_vault':
        return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'store':
        return <ShoppingBag className="w-4 h-4 text-pink-400" />;
      case 'browser':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'downloads':
        return <Download className="w-4 h-4 text-indigo-400" />;
      case 'scheduler':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'security':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'audio_studio':
        return <Sliders className="w-4 h-4 text-purple-400" />;
      case 'mail':
        return <Mail className="w-4 h-4 text-cyan-300" />;
      case 'games':
        return <Gamepad2 className="w-4 h-4 text-yellow-400" />;
      case 'weather':
        return <CloudSun className="w-4 h-4 text-sky-400" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-cyan-400" />;
      case 'settings':
        return <Settings className="w-4 h-4 text-slate-400" />;
      case 'ai_assistant':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      default:
        return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-0 left-0 right-0 h-12 z-[8000] dark:bg-slate-950/95 bg-white/95 border-t dark:border-slate-800/90 border-slate-200 backdrop-blur-xl px-2.5 flex items-center justify-between select-none dark:text-slate-100 text-slate-900"
    >
      {/* Left zone: Start Button & Widgets */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Pluto OS Start Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playSystemSound('click');
            setStartMenuOpen((prev) => !prev);
            setQuickSettingsOpen(false);
            setNotificationsOpen(false);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
            startMenuOpen
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'dark:bg-slate-800/80 bg-slate-100 dark:hover:bg-slate-700/80 hover:bg-slate-200 dark:text-slate-100 text-slate-900'
          }`}
          title="Pluto OS Application Menu"
        >
          <PlutoLogo size={20} />
          <span className="text-xs font-bold tracking-tight">Pluto</span>
        </button>

        {/* Widgets Dashboard Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setWidgetDashboardOpen((prev) => !prev);
            setQuickSettingsOpen(false);
          }}
          title="Widgets & System Telemetry Dashboard"
          className={`p-2 rounded-xl transition-colors ${
            widgetDashboardOpen
              ? 'dark:bg-slate-800 bg-slate-200 text-cyan-500'
              : 'dark:hover:bg-slate-800/70 hover:bg-slate-100 dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Pluto AI Copilot Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openApp('ai_assistant');
          }}
          title="Open Pluto AI Copilot (Gemini)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeAppId === 'ai_assistant'
              ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-500 border border-cyan-500/40'
              : 'dark:hover:bg-slate-800/70 hover:bg-slate-100 dark:text-cyan-400 text-cyan-600'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">AI</span>
        </button>

        <div className="h-4 w-px dark:bg-slate-800 bg-slate-200 mx-1" />
      </div>

      {/* Center zone: Running Applications */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto px-2 max-w-3xl">
        {windows.map((win) => {
          const isActive = activeAppId === win.id && !win.isMinimized;
          return (
            <button
              key={win.id}
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) {
                  minimizeApp(win.id);
                } else {
                  focusApp(win.id);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all max-w-[180px] shrink-0 border relative ${
                isActive
                  ? 'dark:bg-slate-800/90 bg-slate-100 dark:border-slate-700 border-slate-300 dark:text-slate-100 text-slate-900 shadow-sm'
                  : win.isMinimized
                  ? 'bg-transparent border-transparent dark:text-slate-500 text-slate-400 dark:hover:bg-slate-800/40 hover:bg-slate-100 dark:hover:text-slate-300 hover:text-slate-700'
                  : 'dark:bg-slate-900/60 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900 dark:hover:bg-slate-800/60 hover:bg-slate-100'
              }`}
            >
              {getAppIcon(win.id)}
              <span className="truncate">{win.title.split(' ')[0]}</span>

              <div
                className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all ${
                  isActive ? 'w-4 bg-cyan-400' : 'w-1.5 bg-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right zone: System Tray & Clock */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Settings Action Pill */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setQuickSettingsOpen((prev) => !prev);
            setStartMenuOpen(false);
            setNotificationsOpen(false);
          }}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border ${
            quickSettingsOpen
              ? 'bg-slate-800 border-slate-700 text-cyan-400'
              : 'hover:bg-slate-800/70 border-transparent text-slate-300'
          }`}
        >
          {wifiEnabled ? (
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
          )}

          {bluetoothEnabled && <Bluetooth className="w-3.5 h-3.5 text-blue-400" />}

          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-slate-300" />
          )}

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>{batteryPct}%</span>
          </div>
        </div>

        {/* Date & Time Pill (OPENS CALENDAR & ALARMS APP, NOT WEATHER!) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            openApp('calendar');
          }}
          title="Open Date, Time, Calendar & Alarms Hub"
          className="flex flex-col items-end px-2.5 py-1 rounded-xl dark:hover:bg-slate-800/70 hover:bg-slate-100 cursor-pointer transition-colors text-right font-mono"
        >
          <span className="text-xs font-bold dark:text-slate-200 text-slate-800">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] dark:text-slate-400 text-slate-500">
            {currentTime.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })}
          </span>
        </div>

        {/* Notification Bell Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNotificationsOpen((prev) => !prev);
            setQuickSettingsOpen(false);
          }}
          title="Notifications"
          className="relative p-2 rounded-xl hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
          )}
        </button>
      </div>
    </div>
  );
};
