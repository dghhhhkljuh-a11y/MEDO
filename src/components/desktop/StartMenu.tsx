import React, { useState } from 'react';
import {
  Search,
  Activity,
  Cloud,
  ShoppingBag,
  Globe,
  Download,
  Calendar,
  Shield,
  Gamepad2,
  CloudSun,
  Settings,
  RefreshCw,
  Power,
  RotateCcw,
  Lock,
  ChevronRight,
  Mail,
  SlidersVertical,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Terminal,
  FileText,
  Calculator,
  Film,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppId } from '../../types/os';
import { PlutoLogo } from '../common/PlutoLogo';
import { UserAvatar } from '../common/UserAvatar';
import { playSystemSound } from '../../utils/sound';

interface MenuItem {
  id: AppId;
  name: string;
  category: 'system' | 'productivity' | 'media' | 'security';
  icon: React.ReactNode;
  tagline: string;
}

export const StartMenu: React.FC = () => {
  const {
    startMenuOpen,
    setStartMenuOpen,
    openApp,
    recentApps,
    user,
    lockOS,
    shutDownOS,
    restartOS,
    processes,
    systemVersion,
    theme,
    toggleTheme,
    storeApps,
  } = useOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState<'pinned' | 'recent' | 'all' | 'services'>('pinned');
  const [showPowerMenu, setShowPowerMenu] = useState(false);

  if (!startMenuOpen) return null;

  const installedIds = new Set(storeApps.filter((a) => a.installed && a.targetAppId).map((a) => a.targetAppId!));

  const allMenuItems: MenuItem[] = [
    { id: 'ai_assistant', name: 'Pluto AI Copilot', category: 'productivity', icon: <Sparkles className="w-5 h-5 text-cyan-400" />, tagline: 'Gemini intelligence, OS telemetry & grounded search' },
    { id: 'task_manager', name: 'Task Manager & Priority Hub', category: 'system', icon: <Activity className="w-5 h-5 text-cyan-400" />, tagline: 'Live host CPU/RAM telemetry & P0-P3 tasks' },
    { id: 'mail', name: 'Pluto Secure Mail', category: 'productivity', icon: <Mail className="w-5 h-5 text-cyan-300" />, tagline: 'Encrypted inbox, composing & messages' },
    { id: 'browser', name: 'Pluto Web Navigator (Google)', category: 'productivity', icon: <Globe className="w-5 h-5 text-emerald-400" />, tagline: 'Google Search Grounding & live Wikipedia Reader' },
    { id: 'cloud_vault', name: '1TB Cloud Vault & Sync', category: 'productivity', icon: <Cloud className="w-5 h-5 text-blue-400" />, tagline: 'AES-GCM-256 encrypted storage & snapshots' },
    { id: 'audio_studio', name: 'Audio DSP & Process Mixer', category: 'media', icon: <SlidersVertical className="w-5 h-5 text-purple-400" />, tagline: 'WebAudio synthesizer, 5-band EQ & mixer' },
    { id: 'calendar', name: 'Calendar, Date & Time Hub', category: 'productivity', icon: <Calendar className="w-5 h-5 text-cyan-400" />, tagline: 'Monthly planner, world clocks & recurring alarms' },
    { id: 'store', name: 'Pluto Store', category: 'productivity', icon: <ShoppingBag className="w-5 h-5 text-pink-400" />, tagline: 'Install OS modules & live npm registry' },
    { id: 'security', name: 'Pluto Security Center', category: 'security', icon: <Shield className="w-5 h-5 text-rose-400" />, tagline: 'Security shields & memory scanner' },
    { id: 'downloads', name: 'Download Manager', category: 'productivity', icon: <Download className="w-5 h-5 text-indigo-400" />, tagline: 'Accelerated queues and transfer tracking' },
    { id: 'scheduler', name: 'Task Scheduler', category: 'system', icon: <Calendar className="w-5 h-5 text-amber-400" />, tagline: 'Background cron automation & maintenance' },
    { id: 'games', name: 'Pluto Arcade & Entertainment', category: 'media', icon: <Gamepad2 className="w-5 h-5 text-yellow-400" />, tagline: 'Pluto Lander & Neon 2048' },
    { id: 'weather', name: 'Weather & Satellite Radar', category: 'productivity', icon: <CloudSun className="w-5 h-5 text-sky-400" />, tagline: 'GPS location detection & live forecast' },
    { id: 'settings', name: 'System Settings & Account Center', category: 'system', icon: <Settings className="w-5 h-5 text-slate-300" />, tagline: 'Wallpapers, Themes, Host Audits & Recovery' },
    { id: 'system_updates', name: 'System Updates & Diagnostics', category: 'system', icon: <RefreshCw className="w-5 h-5 text-cyan-300" />, tagline: 'Live dependency audit & service health' },
    ...(installedIds.has('media')
      ? [{ id: 'media' as AppId, name: 'Pluto Media Hub', category: 'media' as const, icon: <Film className="w-5 h-5 text-cyan-400" />, tagline: 'Audio, video, image player & Wikimedia media downloader' }]
      : []),
    ...(installedIds.has('terminal')
      ? [{ id: 'terminal' as AppId, name: 'Pluto Shell & Inspector', category: 'system' as const, icon: <Terminal className="w-5 h-5 text-emerald-400" />, tagline: 'Live host CLI, npm & wiki inspector' }]
      : []),
    ...(installedIds.has('notes')
      ? [{ id: 'notes' as AppId, name: 'Pluto Notes & Code Pad', category: 'productivity' as const, icon: <FileText className="w-5 h-5 text-amber-400" />, tagline: 'Persistent markdown editor & .md export' }]
      : []),
    ...(installedIds.has('calculator')
      ? [{ id: 'calculator' as AppId, name: 'Scientific Calculator', category: 'productivity' as const, icon: <Calculator className="w-5 h-5 text-cyan-400" />, tagline: 'Trig, logarithms & calculation tape' }]
      : []),
  ];

  const filteredItems = allMenuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const recentMenuItems = recentApps
    .map((appId) => allMenuItems.find((m) => m.id === appId))
    .filter(Boolean) as MenuItem[];

  const handleLaunch = (id: AppId) => {
    openApp(id);
    setStartMenuOpen(false);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-14 left-3 z-[9000] w-96 max-h-[620px] dark:bg-slate-950/95 bg-white/95 border dark:border-slate-700/80 border-slate-200 rounded-2xl shadow-2xl backdrop-blur-2xl dark:text-slate-100 text-slate-900 select-none flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Brand Header Banner with Official Logo */}
      <div className="px-4 py-3 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/70 bg-gradient-to-r from-slate-50 to-cyan-50/60 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between">
        <PlutoLogo size={28} showWordmark={true} versionBadge="v2.5.0 LTS" />

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 dark:bg-emerald-950/60 bg-emerald-50 border dark:border-emerald-800/60 border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Verified RT</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b dark:border-slate-800/80 border-slate-200">
        <div className="flex items-center gap-2 dark:bg-slate-900 bg-slate-100 border dark:border-slate-700 border-slate-200 rounded-xl px-3 py-2 focus-within:border-cyan-500 transition-colors shadow-inner">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search apps, settings, services..."
            className="w-full bg-transparent text-xs dark:text-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Recently Used Apps Strip (Horizontal Quick Access) */}
      <div className="px-3 pt-2.5 pb-2 dark:bg-slate-950/60 bg-slate-50/80 border-b dark:border-slate-800/60 border-slate-200">
        <div className="flex items-center justify-between text-[11px] font-semibold dark:text-slate-400 text-slate-500 mb-2 px-1">
          <span className="flex items-center gap-1.5 dark:text-cyan-400 text-cyan-600">
            <Clock className="w-3 h-3" />
            Recent Applications
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Last accessed</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {recentMenuItems.slice(0, 5).map((app) => (
            <button
              key={app.id}
              onClick={() => handleLaunch(app.id)}
              className="flex flex-col items-center p-2 rounded-xl dark:bg-slate-900/80 bg-white dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200 hover:border-cyan-500/40 transition-all shrink-0 w-[66px] text-center group cursor-pointer"
              title={app.name}
            >
              <div className="p-1.5 rounded-lg dark:bg-slate-800 bg-slate-100 group-hover:scale-105 transition-transform">
                {app.icon}
              </div>
              <span className="text-[10px] dark:text-slate-300 text-slate-700 dark:group-hover:text-cyan-300 group-hover:text-cyan-600 font-medium truncate w-full mt-1">
                {app.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-b dark:border-slate-800/80 border-slate-200 text-xs shrink-0 overflow-x-auto">
        <button
          onClick={() => {
            playSystemSound('click');
            setViewTab('pinned');
          }}
          className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            viewTab === 'pinned' ? 'bg-cyan-500 text-slate-950' : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
          }`}
        >
          Pinned
        </button>
        <button
          onClick={() => {
            playSystemSound('click');
            setViewTab('recent');
          }}
          className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            viewTab === 'recent' ? 'bg-cyan-500 text-slate-950' : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
          }`}
        >
          Recent ({recentMenuItems.length})
        </button>
        <button
          onClick={() => {
            playSystemSound('click');
            setViewTab('all');
          }}
          className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            viewTab === 'all' ? 'bg-cyan-500 text-slate-950' : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
          }`}
        >
          All Software ({allMenuItems.length})
        </button>
        <button
          onClick={() => {
            playSystemSound('click');
            setViewTab('services');
          }}
          className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            viewTab === 'services' ? 'bg-cyan-500 text-slate-950' : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
          }`}
        >
          Services ({processes.length})
        </button>
      </div>

      {/* Main App Grid or Services List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[300px]">
        {viewTab === 'services' ? (
          <div className="space-y-1 font-mono text-xs">
            {processes.map((p) => (
              <div key={p.id} className="p-2 dark:bg-slate-900/60 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.status === 'running' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className="font-sans font-medium dark:text-slate-200 text-slate-800">{p.name}</span>
                </div>
                <div className="text-[11px] dark:text-slate-400 text-slate-500">
                  <span className="dark:text-cyan-400 text-cyan-600">{p.cpuPct}% CPU</span> · <span>{p.ramMb} MB</span>
                </div>
              </div>
            ))}
          </div>
        ) : viewTab === 'recent' ? (
          recentMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleLaunch(item.id)}
              className="flex items-center gap-3 p-2.5 rounded-xl dark:hover:bg-slate-800/80 hover:bg-slate-100 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-xl dark:bg-slate-800/90 bg-slate-100 border dark:border-slate-700/60 border-slate-200 group-hover:border-cyan-500/50 group-hover:scale-105 transition-all shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold dark:text-slate-100 text-slate-900 truncate dark:group-hover:text-cyan-300 group-hover:text-cyan-600 transition-colors">
                  {item.name}
                </h4>
                <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate mt-0.5">
                  {item.tagline}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors shrink-0" />
            </div>
          ))
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleLaunch(item.id)}
              className="flex items-center gap-3 p-2.5 rounded-xl dark:hover:bg-slate-800/80 hover:bg-slate-100 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-xl dark:bg-slate-800/90 bg-slate-100 border dark:border-slate-700/60 border-slate-200 group-hover:border-cyan-500/50 group-hover:scale-105 transition-all shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold dark:text-slate-100 text-slate-900 truncate dark:group-hover:text-cyan-300 group-hover:text-cyan-600 transition-colors">
                  {item.name}
                </h4>
                <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate mt-0.5">
                  {item.tagline}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* Footer Profile & Real Power Controls */}
      <div className="p-3 dark:bg-slate-950 bg-slate-50 border-t dark:border-slate-800 border-slate-200 flex items-center justify-between relative">
        <div
          onClick={() => {
            setStartMenuOpen(false);
            openApp('settings');
          }}
          className="flex items-center gap-2.5 p-1 rounded-lg dark:hover:bg-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
        >
          <UserAvatar displayName={user.displayName} size="md" showStatusBadge />
          <div className="text-left">
            <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block leading-tight">{user.displayName}</span>
            <span className="text-[10px] dark:text-slate-400 text-slate-500 font-mono">admin · {systemVersion.split(' ')[0]} {systemVersion.split(' ')[1]}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            className="p-2 dark:text-amber-300 text-indigo-600 dark:hover:bg-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              playSystemSound('click');
              lockOS();
            }}
            title="Lock Pluto OS"
            className="p-2 dark:text-slate-400 text-slate-600 dark:hover:text-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              playSystemSound('click');
              setShowPowerMenu(!showPowerMenu);
            }}
            title="Power Options (Restart, Shut Down)"
            className="p-2 dark:text-slate-400 text-slate-600 hover:text-rose-500 dark:hover:bg-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        {/* Real Power Menu Flyout */}
        {showPowerMenu && (
          <div className="absolute right-3 bottom-14 w-44 dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 rounded-xl p-1.5 shadow-2xl space-y-1 text-xs">
            <button
              onClick={() => {
                setShowPowerMenu(false);
                restartOS();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-100 text-amber-500 text-left transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart System</span>
            </button>
            <button
              onClick={() => {
                setShowPowerMenu(false);
                shutDownOS();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-100 text-rose-500 text-left transition-colors cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Shut Down OS</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
