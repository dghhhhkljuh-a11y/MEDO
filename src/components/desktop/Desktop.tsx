import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cloud,
  ShoppingBag,
  Globe,
  Download,
  Calendar,
  Shield,
  SlidersVertical,
  Gamepad2,
  CloudSun,
  Settings,
  RefreshCw,
  Mail,
  Power,
  RotateCcw,
  Search,
  Sparkles,
  Copy,
  Clipboard,
  Trash2,
  FilePlus,
  StickyNote,
  Sun,
  Moon,
  X,
  Check,
  Clock,
  Timer,
  Play,
  Pause,
  Terminal,
  FileText,
  Calculator,
  Film,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppId } from '../../types/os';
import { WindowFrame } from './WindowFrame';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { QuickSettings } from './QuickSettings';
import { WidgetDashboard } from './WidgetDashboard';
import { NotificationsPanel } from './NotificationsPanel';
import { LockScreen } from './LockScreen';
import { BootScreen } from './BootScreen';
import { PlutoLogo } from '../common/PlutoLogo';
import { playSystemSound } from '../../utils/sound';

// Applications
import { TaskManagerApp } from '../apps/TaskManagerApp';
import { CloudStorageApp } from '../apps/CloudStorageApp';
import { PlutoStoreApp } from '../apps/PlutoStoreApp';
import { BrowserApp } from '../apps/BrowserApp';
import { DownloadManagerApp } from '../apps/DownloadManagerApp';
import { TaskSchedulerApp } from '../apps/TaskSchedulerApp';
import { PlutoSecurityApp } from '../apps/PlutoSecurityApp';
import { AudioStudioApp } from '../apps/AudioStudioApp';
import { GamesHubApp } from '../apps/GamesHubApp';
import { WeatherApp } from '../apps/WeatherApp';
import { SettingsApp } from '../apps/SettingsApp';
import { PlutoMailApp } from '../apps/PlutoMailApp';
import { CalendarApp } from '../apps/CalendarApp';
import { PlutoAIApp } from '../apps/PlutoAIApp';
import { TerminalApp } from '../apps/TerminalApp';
import { NotesApp } from '../apps/NotesApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { MediaApp } from '../apps/MediaApp';
import { WALLPAPER_ASSETS } from '../../assets/wallpapers';

interface DesktopIcon {
  id: AppId;
  name: string;
  icon: React.ReactNode;
  bgGrad: string;
}

interface DesktopNote {
  id: string;
  text: string;
  created: string;
  color: string;
}

export const Desktop: React.FC = () => {
  const {
    wallpaper,
    brightness,
    isLocked,
    windows,
    openApp,
    setStartMenuOpen,
    setQuickSettingsOpen,
    setNotificationsOpen,
    lockOS,
    shutDownOS,
    restartOS,
    osPowerState,
    hardwareMetrics,
    systemVersion,
    theme,
    toggleTheme,
    clipboard,
    copyToClipboard,
    pasteFromClipboard,
    addNotification,
    launchAIWithPrompt,
    launchBrowserSearch,
    desktopPrefs,
    storeApps,
  } = useOS();

  const [desktopSearchQuery, setDesktopSearchQuery] = useState('');
  const [launcherMode, setLauncherMode] = useState<'ai' | 'web'>('ai');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [customWallpaperBroken, setCustomWallpaperBroken] = useState(false);

  // Ambient Desktop Clock & 25-Min Focus Timer
  const [now, setNow] = useState(() => new Date());
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);

  useEffect(() => {
    setCustomWallpaperBroken(false);
  }, [desktopPrefs.customWallpaperUrl]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!focusRunning) return;
    const interval = setInterval(() => {
      setFocusSeconds((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          playSystemSound('notification');
          addNotification({
            title: 'Focus Session Complete',
            message: 'Your 25-minute deep focus sprint finished. Take a quick break!',
            app: 'Focus Timer',
          });
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [focusRunning, addNotification]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (isLocked || osPowerState !== 'running' || !desktopPrefs.keyboardShortcutsEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        openApp('ai_assistant');
      } else if (key === 't') {
        e.preventDefault();
        openApp('task_manager');
      } else if (key === 'b') {
        e.preventDefault();
        openApp('browser');
      } else if (key === 's') {
        e.preventDefault();
        openApp('settings');
      } else if (key === 'l') {
        e.preventDefault();
        lockOS();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLocked, osPowerState, desktopPrefs.keyboardShortcutsEnabled, openApp, lockOS]);

  // Desktop quick notes (created via Right-click -> New Note or Paste)
  const [desktopNotes, setDesktopNotes] = useState<DesktopNote[]>([
    {
      id: 'note-1',
      text: 'Pluto OS 2.5: Gemini AI Copilot, Recurring Alarms, Unified Dark/Light Theme, and Encrypted Clipboard active.',
      created: 'Today',
      color: 'border-cyan-500/50 dark:bg-slate-900/80 bg-white/90',
    },
  ]);

  const storeInstalledIds = new Set(storeApps.filter((a) => a.installed && a.targetAppId).map((a) => a.targetAppId!));

  const baseDesktopIcons: DesktopIcon[] = [
    { id: 'ai_assistant', name: 'Pluto AI', icon: <Sparkles className="w-6 h-6 text-cyan-300" />, bgGrad: 'from-cyan-900/90 via-indigo-950 to-slate-900/90' },
    { id: 'task_manager', name: 'Task Manager', icon: <Activity className="w-6 h-6 text-cyan-400" />, bgGrad: 'from-cyan-950/80 to-slate-900/90' },
    { id: 'mail', name: 'Pluto Mail', icon: <Mail className="w-6 h-6 text-cyan-300" />, bgGrad: 'from-sky-950/80 to-slate-900/90' },
    { id: 'browser', name: 'Web Browser', icon: <Globe className="w-6 h-6 text-emerald-400" />, bgGrad: 'from-emerald-950/80 to-slate-900/90' },
    { id: 'cloud_vault', name: '1TB Cloud Vault', icon: <Cloud className="w-6 h-6 text-blue-400" />, bgGrad: 'from-blue-950/80 to-slate-900/90' },
    { id: 'audio_studio', name: 'Audio DSP Mixer', icon: <SlidersVertical className="w-6 h-6 text-purple-400" />, bgGrad: 'from-purple-950/80 to-slate-900/90' },
    { id: 'calendar', name: 'Calendar & Alarms', icon: <Calendar className="w-6 h-6 text-cyan-400" />, bgGrad: 'from-indigo-950/80 to-slate-900/90' },
    { id: 'store', name: 'Pluto Store', icon: <ShoppingBag className="w-6 h-6 text-pink-400" />, bgGrad: 'from-pink-950/80 to-slate-900/90' },
    { id: 'security', name: 'Pluto Security', icon: <Shield className="w-6 h-6 text-rose-400" />, bgGrad: 'from-rose-950/80 to-slate-900/90' },
    { id: 'games', name: 'Pluto Arcade', icon: <Gamepad2 className="w-6 h-6 text-amber-400" />, bgGrad: 'from-amber-950/80 to-slate-900/90' },
    { id: 'downloads', name: 'Downloads', icon: <Download className="w-6 h-6 text-indigo-400" />, bgGrad: 'from-indigo-950/80 to-slate-900/90' },
    { id: 'weather', name: 'Weather Radar', icon: <CloudSun className="w-6 h-6 text-sky-300" />, bgGrad: 'from-cyan-950/80 to-slate-900/90' },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-6 h-6 text-slate-300" />, bgGrad: 'from-slate-800 to-slate-900' },
  ];

  const installableDesktopIcons: DesktopIcon[] = [
    ...(storeInstalledIds.has('media')
      ? [{ id: 'media' as AppId, name: 'Media Hub', icon: <Film className="w-6 h-6 text-cyan-300" />, bgGrad: 'from-cyan-950/90 to-slate-900/90' }]
      : []),
    ...(storeInstalledIds.has('terminal')
      ? [{ id: 'terminal' as AppId, name: 'Pluto Shell', icon: <Terminal className="w-6 h-6 text-emerald-400" />, bgGrad: 'from-emerald-950/90 to-slate-900/90' }]
      : []),
    ...(storeInstalledIds.has('notes')
      ? [{ id: 'notes' as AppId, name: 'Pluto Notes', icon: <FileText className="w-6 h-6 text-amber-300" />, bgGrad: 'from-amber-950/90 to-slate-900/90' }]
      : []),
    ...(storeInstalledIds.has('calculator')
      ? [{ id: 'calculator' as AppId, name: 'Calculator', icon: <Calculator className="w-6 h-6 text-cyan-300" />, bgGrad: 'from-cyan-950/90 to-slate-900/90' }]
      : []),
  ];

  const desktopIcons: DesktopIcon[] = [...baseDesktopIcons, ...installableDesktopIcons];

  const handleDesktopClick = () => {
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setNotificationsOpen(false);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const renderAppContent = (id: AppId) => {
    switch (id) {
      case 'task_manager':
      case 'sys_monitor':
        return <TaskManagerApp />;
      case 'mail':
        return <PlutoMailApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'cloud_vault':
        return <CloudStorageApp />;
      case 'store':
        return <PlutoStoreApp />;
      case 'browser':
        return <BrowserApp />;
      case 'downloads':
        return <DownloadManagerApp />;
      case 'scheduler':
        return <TaskSchedulerApp />;
      case 'security':
        return <PlutoSecurityApp />;
      case 'audio_studio':
        return <AudioStudioApp />;
      case 'games':
        return <GamesHubApp />;
      case 'weather':
        return <WeatherApp />;
      case 'settings':
      case 'system_updates':
        return <SettingsApp />;
      case 'ai_assistant':
        return <PlutoAIApp />;
      case 'terminal':
        return <TerminalApp />;
      case 'notes':
        return <NotesApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'media':
        return <MediaApp />;
      default:
        return <TaskManagerApp />;
    }
  };

  const getWindowIcon = (id: AppId) => {
    const target = desktopIcons.find((i) => i.id === id);
    return target ? target.icon : <Activity className="w-4 h-4 text-cyan-400" />;
  };

  const activeCustomUrl = desktopPrefs.customWallpaperUrl?.trim();
  const hasValidCustomWallpaper = Boolean(activeCustomUrl && !customWallpaperBroken);

  const currentWallpaperUrl = hasValidCustomWallpaper
    ? activeCustomUrl
    : wallpaper in WALLPAPER_ASSETS
    ? WALLPAPER_ASSETS[wallpaper as keyof typeof WALLPAPER_ASSETS]
    : WALLPAPER_ASSETS.deep_space;

  const iconTileSizeClass =
    desktopPrefs.iconSize === 'compact'
      ? 'w-18 h-18 p-1.5'
      : desktopPrefs.iconSize === 'large'
      ? 'w-26 h-26 p-2.5'
      : 'w-22 h-22 p-2';

  const iconBoxSizeClass =
    desktopPrefs.iconSize === 'compact'
      ? 'w-10 h-10 rounded-xl'
      : desktopPrefs.iconSize === 'large'
      ? 'w-14 h-14 rounded-2xl'
      : 'w-12 h-12 rounded-2xl';

  const glassSurfaceClass =
    desktopPrefs.glassOpacity === 'subtle'
      ? 'dark:bg-slate-900/45 bg-white/70 backdrop-blur-lg'
      : desktopPrefs.glassOpacity === 'frosted'
      ? 'dark:bg-slate-900/92 bg-white/95 backdrop-blur-3xl'
      : 'dark:bg-slate-900/68 bg-white/85 backdrop-blur-2xl';

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Unified Boot / Shutdown / Updating / Restarting Screen
  if (osPowerState !== 'running') {
    return <BootScreen />;
  }

  return (
    <div
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
      className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 text-slate-100"
    >
      {/* Dynamic Wallpaper Layer with CSS gradient / animated nebula / carbon grid */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden">
        {hasValidCustomWallpaper || (wallpaper !== 'animated_nebula' && wallpaper !== 'carbon') ? (
          <img
            src={currentWallpaperUrl}
            alt="Pluto OS Desktop Wallpaper"
            referrerPolicy="no-referrer"
            onError={() => setCustomWallpaperBroken(true)}
            className="w-full h-full object-cover opacity-90 transition-opacity duration-700 pointer-events-none"
          />
        ) : wallpaper === 'animated_nebula' ? (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -inset-24 bg-[radial-gradient(circle_at_25%_30%,rgba(6,182,212,0.45),transparent_48%),radial-gradient(circle_at_75%_25%,rgba(168,85,247,0.42),transparent_45%),radial-gradient(circle_at_55%_80%,rgba(59,130,246,0.38),transparent_50%)] animate-nebula-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(2,6,23,0.75)_100%)]" />
          </div>
        ) : (
          <div
            className="absolute inset-0 pointer-events-none opacity-90"
            style={{
              backgroundColor: '#090d16',
              backgroundImage:
                'radial-gradient(rgba(34,211,238,0.18) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)',
              backgroundSize: '28px 28px, 28px 28px, 28px 28px',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 pointer-events-none" />
      </div>

      {/* Screen Brightness Dimmer Overlay */}
      <div
        style={{ opacity: Math.max(0, 1 - brightness) }}
        className="pointer-events-none fixed inset-0 bg-black z-[7900] transition-opacity duration-200"
      />

      {/* Ambient Top-Center Clock & 25-Min Focus Timer Pill */}
      {desktopPrefs.showDesktopClock && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full fixed top-4 left-1/2 -translate-x-1/2 z-[5] border dark:border-white/10 border-slate-300/80 shadow-xl dark:text-slate-100 text-slate-900 ${glassSurfaceClass}`}
        >
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="opacity-40">·</span>
            <span className="text-[11px] font-sans dark:text-slate-300 text-slate-600">
              {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <span className="h-3.5 w-px dark:bg-slate-700 bg-slate-300" />

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Timer className={`w-3.5 h-3.5 ${focusRunning ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
            <span className="font-bold">{formatTimer(focusSeconds)}</span>
            <button
              type="button"
              onClick={() => setFocusRunning((prev) => !prev)}
              title={focusRunning ? 'Pause Focus Timer' : 'Start 25m Focus Sprint'}
              className="p-1 rounded-md dark:hover:bg-slate-800 hover:bg-slate-200 text-cyan-500 transition-colors cursor-pointer"
            >
              {focusRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            {focusSeconds !== 25 * 60 && (
              <button
                type="button"
                onClick={() => {
                  setFocusRunning(false);
                  setFocusSeconds(25 * 60);
                }}
                title="Reset Focus Timer"
                className="p-1 rounded-md dark:hover:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Grid Icons (Single Click or Double Click to Open) */}
      <div className="relative z-10 p-6 grid grid-flow-col grid-rows-6 gap-4 w-fit h-[calc(100vh-60px)]">
        {desktopIcons.map((item) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              openApp(item.id);
            }}
            className={`flex flex-col items-center justify-center ${iconTileSizeClass} rounded-2xl hover:bg-white/10 active:bg-white/20 transition-all duration-150 group text-center cursor-pointer`}
          >
            <div
              className={`${iconBoxSizeClass} bg-gradient-to-br ${item.bgGrad} border border-white/10 group-hover:border-cyan-400/50 shadow-lg flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-cyan-500/20`}
            >
              {item.icon}
            </div>
            <span className="text-[11px] font-semibold text-slate-200 group-hover:text-cyan-200 mt-1.5 leading-tight truncate max-w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop Workspace Ambient Companion Widget (Top Right) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-6 right-6 z-[5] hidden lg:flex flex-col gap-3 w-88 select-none pointer-events-auto"
      >
        {/* Brand, AI & Telemetry Glass Card */}
        <div className={`p-4 rounded-2xl ${glassSurfaceClass} dark:hover:bg-slate-900/85 hover:bg-white/95 border dark:border-white/10 border-slate-300/70 hover:border-cyan-500/40 shadow-2xl transition-all space-y-3 dark:text-slate-100 text-slate-900`}>
          <div className="flex items-center justify-between">
            <PlutoLogo size={26} showWordmark={true} versionBadge="v2.5.0" />
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                className="p-1.5 rounded-lg dark:bg-slate-950/70 bg-slate-100 border dark:border-slate-800 border-slate-300 dark:text-amber-300 text-indigo-600 hover:border-cyan-500 transition-colors cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[10px] font-mono text-emerald-500 dark:bg-emerald-950/80 bg-emerald-50 border dark:border-emerald-800/80 border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                E2EE
              </span>
            </div>
          </div>

          {/* Quick Real-Time Telemetry Bar */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div
              onClick={() => openApp('task_manager')}
              className="p-2 rounded-xl dark:bg-slate-950/60 bg-slate-100/90 border dark:border-slate-800/80 border-slate-200 hover:border-cyan-500/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] dark:text-slate-400 text-slate-500 mb-1">
                <span>CPU Load</span>
                <span className="text-cyan-500 font-bold">{hardwareMetrics.cpuTotal}%</span>
              </div>
              <div className="w-full h-1 dark:bg-slate-800 bg-slate-300 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, hardwareMetrics.cpuTotal)}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>

            <div
              onClick={() => openApp('task_manager')}
              className="p-2 rounded-xl dark:bg-slate-950/60 bg-slate-100/90 border dark:border-slate-800/80 border-slate-200 hover:border-indigo-500/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] dark:text-slate-400 text-slate-500 mb-1">
                <span>RAM Used</span>
                <span className="text-indigo-500 font-bold">{hardwareMetrics.ramUsedGb} GB</span>
              </div>
              <div className="w-full h-1 dark:bg-slate-800 bg-slate-300 rounded-full overflow-hidden">
                <div
                  style={{ width: `${(hardwareMetrics.ramUsedGb / hardwareMetrics.ramTotalGb) * 100}%` }}
                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Desktop AI & Web Search Switchable Launcher */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setLauncherMode('ai')}
                className={`flex-1 py-1 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  launcherMode === 'ai'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'dark:bg-slate-950/60 bg-slate-100 dark:text-slate-400 text-slate-600'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Ask Pluto AI
              </button>
              <button
                type="button"
                onClick={() => setLauncherMode('web')}
                className={`flex-1 py-1 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  launcherMode === 'web'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'dark:bg-slate-950/60 bg-slate-100 dark:text-slate-400 text-slate-600'
                }`}
              >
                <Globe className="w-3 h-3" /> Web Browser
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!desktopSearchQuery.trim()) {
                  openApp(launcherMode === 'ai' ? 'ai_assistant' : 'browser');
                  return;
                }
                if (launcherMode === 'ai') {
                  launchAIWithPrompt(desktopSearchQuery);
                } else {
                  launchBrowserSearch(desktopSearchQuery);
                }
                setDesktopSearchQuery('');
              }}
              className="flex items-center dark:bg-slate-950/90 bg-slate-100 border dark:border-slate-800 border-slate-300 hover:border-cyan-500/60 rounded-xl px-3 py-1.5 focus-within:border-cyan-500 transition-colors"
            >
              {launcherMode === 'ai' ? (
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 mr-2 shrink-0" />
              ) : (
                <Search className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0" />
              )}
              <input
                type="text"
                value={desktopSearchQuery}
                onChange={(e) => setDesktopSearchQuery(e.target.value)}
                placeholder={launcherMode === 'ai' ? 'Ask Pluto AI anything...' : 'Quick search web & files...'}
                className="w-full bg-transparent text-xs dark:text-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 hover:text-cyan-400 text-slate-500 text-[10px] font-mono transition-colors"
              >
                ↵
              </button>
            </form>

            {/* Quick AI Prompt Chips */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <button
                type="button"
                onClick={() => launchAIWithPrompt('Analyze my current Pluto OS CPU, RAM, and active tasks.')}
                className="px-2 py-0.5 rounded-md text-[10px] dark:bg-slate-950/80 bg-slate-100 border dark:border-slate-800 border-slate-300 dark:text-cyan-300 text-cyan-700 hover:border-cyan-500 transition-colors cursor-pointer"
              >
                ✦ System Audit
              </button>
              <button
                type="button"
                onClick={() => openApp('calendar')}
                className="px-2 py-0.5 rounded-md text-[10px] dark:bg-slate-950/80 bg-slate-100 border dark:border-slate-800 border-slate-300 dark:text-indigo-300 text-indigo-700 hover:border-indigo-500 transition-colors cursor-pointer"
              >
                ⏰ Alarms
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Windows Layer */}
      {windows.map((win) => (
        <WindowFrame key={win.id} window={win} icon={getWindowIcon(win.id)}>
          {renderAppContent(win.id)}
        </WindowFrame>
      ))}

      {/* Interactive Pinned Desktop Notes (Created via New Note or Paste) */}
      {desktopPrefs.showDesktopNotes && (
        <div className="absolute bottom-16 right-6 z-[6] flex flex-col gap-3 max-w-xs pointer-events-auto">
          {desktopNotes.map((note) => (
            <div
              key={note.id}
              onClick={(e) => e.stopPropagation()}
              className={`p-3.5 rounded-2xl border ${note.color} backdrop-blur-xl shadow-xl text-xs space-y-2 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between text-[10px] dark:text-slate-400 text-slate-500 border-b dark:border-white/10 border-slate-200 pb-1.5">
                <span className="flex items-center gap-1 text-cyan-500 font-semibold">
                  <StickyNote className="w-3 h-3" />
                  Desktop Note
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      copyToClipboard({ type: 'text', label: 'Desktop Note', data: note.text });
                      playSystemSound('click');
                      addNotification({ title: 'Copied to Clipboard', message: 'Desktop note copied.', app: 'Clipboard' });
                    }}
                    title="Copy Note Text"
                    className="p-1 hover:text-cyan-400 dark:text-slate-400 text-slate-500 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setDesktopNotes((prev) => prev.filter((n) => n.id !== note.id));
                      playSystemSound('click');
                    }}
                    title="Delete Note"
                    className="p-1 hover:text-rose-400 dark:text-slate-400 text-slate-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="dark:text-slate-200 text-slate-800 text-xs leading-relaxed font-sans">{note.text}</p>
              <span className="text-[9px] font-mono dark:text-slate-400 text-slate-500 block text-right">{note.created}</span>
            </div>
          ))}
        </div>
      )}

      {/* Desktop Right-Click Context Menu (Copy, Paste, Delete, New Note, Refresh) */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ left: `${Math.min(window.innerWidth - 240, contextMenu.x)}px`, top: `${Math.min(window.innerHeight - 380, contextMenu.y)}px` }}
          className="fixed z-[9990] w-60 dark:bg-slate-900/95 bg-white/95 border dark:border-slate-700/80 border-slate-300/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl text-xs space-y-0.5 select-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono dark:text-slate-400 text-slate-500 uppercase tracking-wider">
              Pluto Workspace
            </span>
            <span className="text-[10px] font-mono text-cyan-500 font-semibold">{systemVersion.split(' ')[0]} {systemVersion.split(' ')[1]}</span>
          </div>

          {/* Copy Option */}
          <button
            onClick={() => {
              copyToClipboard({
                type: 'text',
                label: 'System Diagnostic Status',
                data: `Pluto OS Diagnostic: CPU ${hardwareMetrics.cpuTotal}% | RAM ${hardwareMetrics.ramUsedGb}GB/${hardwareMetrics.ramTotalGb}GB | Active Windows: ${windows.length}`,
              });
              playSystemSound('click');
              setCopiedFeedback(true);
              setTimeout(() => setCopiedFeedback(false), 2000);
              addNotification({ title: 'Diagnostics Copied', message: 'System status copied to clipboard.', app: 'Clipboard' });
              setContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-200 text-slate-700 hover:text-cyan-500 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-cyan-500" />
              <span>Copy System Status</span>
            </div>
            {copiedFeedback ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <span className="text-[10px] font-mono text-slate-400">Ctrl+C</span>
            )}
          </button>

          {/* Paste Option */}
          <button
            onClick={() => {
              const item = pasteFromClipboard();
              if (item) {
                const newNote: DesktopNote = {
                  id: 'note-' + Date.now(),
                  text: typeof item.data === 'string' ? item.data : JSON.stringify(item.data),
                  created: 'Pasted just now',
                  color: 'border-purple-500/50 dark:bg-slate-900/90 bg-white/95',
                };
                setDesktopNotes((prev) => [newNote, ...prev]);
                playSystemSound('click');
                addNotification({ title: 'Pasted to Desktop', message: `Pasted: ${item.label}`, app: 'Clipboard' });
              }
              setContextMenu(null);
            }}
            disabled={!clipboard}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-left ${
              clipboard
                ? 'dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-200 text-slate-700 hover:text-indigo-400 cursor-pointer'
                : 'opacity-40 cursor-not-allowed dark:text-slate-500 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Paste to Desktop</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {clipboard ? clipboard.label.slice(0, 10) : 'Empty'}
            </span>
          </button>

          {/* Delete Option */}
          <button
            onClick={() => {
              if (desktopNotes.length > 0) {
                setDesktopNotes((prev) => prev.slice(1));
                playSystemSound('click');
                addNotification({ title: 'Item Deleted', message: 'Removed top desktop note.', app: 'System' });
              }
              setContextMenu(null);
            }}
            disabled={desktopNotes.length === 0}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-left ${
              desktopNotes.length > 0
                ? 'dark:hover:bg-slate-800 hover:bg-slate-100 text-rose-400 hover:text-rose-300 cursor-pointer'
                : 'opacity-40 cursor-not-allowed dark:text-slate-500 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Desktop Item</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Del</span>
          </button>

          {/* New Item / Note */}
          <button
            onClick={() => {
              const newNote: DesktopNote = {
                id: 'note-' + Date.now(),
                text: 'Quick Workspace Note: Encrypted in memory & pinned to desktop canvas.',
                created: 'Created just now',
                color: 'border-cyan-500/50 dark:bg-slate-900/90 bg-white/95',
              };
              setDesktopNotes((prev) => [newNote, ...prev]);
              playSystemSound('click');
              addNotification({ title: 'New Note Created', message: 'Sticky note pinned to desktop.', app: 'Notes' });
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-200 text-slate-700 hover:text-cyan-400 transition-colors text-left"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Sticky Note</span>
          </button>

          {/* Refresh Desktop Option */}
          <button
            onClick={() => {
              setIsRefreshing(true);
              playSystemSound('click');
              setTimeout(() => setIsRefreshing(false), 500);
              addNotification({ title: 'Desktop Refreshed', message: 'Compositor and workspace refreshed.', app: 'System' });
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-200 text-slate-700 hover:text-emerald-400 transition-colors text-left"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Workspace</span>
          </button>

          <div className="h-px dark:bg-slate-800 bg-slate-200 my-1" />

          {/* Quick Launchers */}
          <button
            onClick={() => {
              openApp('task_manager');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-200 text-slate-700 hover:text-cyan-400 transition-colors text-left"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Task Manager</span>
          </button>
          <button
            onClick={() => {
              openApp('cloud_vault');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-200 text-slate-700 hover:text-blue-400 transition-colors text-left"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>1TB Cloud Vault & Sync</span>
          </button>
          <button
            onClick={() => {
              openApp('settings');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 dark:text-slate-200 text-slate-700 hover:text-pink-400 transition-colors text-left"
          >
            <Settings className="w-3.5 h-3.5 text-pink-400" />
            <span>Personalize & Appearance</span>
          </button>

          <div className="h-px dark:bg-slate-800 bg-slate-200 my-1" />

          {/* System Power Controls */}
          <button
            onClick={() => {
              restartOS();
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 text-amber-500 hover:text-amber-400 transition-colors text-left font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Pluto OS</span>
          </button>
          <button
            onClick={() => {
              shutDownOS();
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl dark:hover:bg-slate-800 hover:bg-slate-100 text-rose-500 hover:text-rose-400 transition-colors text-left font-medium"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Shut Down Workstation</span>
          </button>
        </div>
      )}

      {/* Flyouts & Shell Components */}
      <StartMenu />
      <QuickSettings />
      <WidgetDashboard />
      <NotificationsPanel />
      <Taskbar />

      {/* Lockscreen Modal */}
      {isLocked && <LockScreen />}
    </div>
  );
};
