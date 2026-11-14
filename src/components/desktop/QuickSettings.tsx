import React from 'react';
import {
  Wifi,
  Bluetooth,
  Sun,
  Volume2,
  VolumeX,
  Moon,
  BellOff,
  Battery,
  Lock,
  Settings,
  Power,
  RotateCcw,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const QuickSettings: React.FC = () => {
  const {
    quickSettingsOpen,
    setQuickSettingsOpen,
    wifiEnabled,
    setWifiEnabled,
    wifiNetworks,
    bluetoothEnabled,
    setBluetoothEnabled,
    bluetoothDevices,
    brightness,
    setBrightness,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    theme,
    toggleTheme,
    dndEnabled,
    setDndEnabled,
    batteryPct,
    isCharging,
    lockOS,
    shutDownOS,
    restartOS,
    openApp,
  } = useOS();

  if (!quickSettingsOpen) return null;

  const connectedWifi = wifiNetworks.find((n) => n.connected);
  const connectedBt = bluetoothDevices.find((d) => d.connected);
  const isDarkOrOled = theme === 'dark' || theme === 'oled';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-14 right-3 z-[9000] w-88 dark:bg-slate-950/95 bg-white/95 border dark:border-slate-700/80 border-slate-200 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl dark:text-slate-100 text-slate-900 select-none space-y-4"
    >
      {/* Quick Tiles Grid (2 columns) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Wi-Fi Tile */}
        <div
          onClick={() => setWifiEnabled(!wifiEnabled)}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            wifiEnabled
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold shadow-sm'
              : 'dark:bg-slate-800/60 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700/80 border-slate-200 dark:hover:bg-slate-800 hover:bg-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Wifi className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs block leading-tight">Wi-Fi</span>
              <span className="text-[10px] opacity-80 block truncate font-mono">
                {wifiEnabled ? connectedWifi?.ssid || 'Active' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Bluetooth Tile */}
        <div
          onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            bluetoothEnabled
              ? 'bg-blue-500 text-white border-blue-400 font-semibold shadow-sm'
              : 'dark:bg-slate-800/60 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700/80 border-slate-200 dark:hover:bg-slate-800 hover:bg-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Bluetooth className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs block leading-tight">Bluetooth</span>
              <span className="text-[10px] opacity-80 block truncate font-mono">
                {bluetoothEnabled ? connectedBt?.name?.split(' ')[0] || 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Theme Tile */}
        <div
          onClick={toggleTheme}
          className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
            isDarkOrOled
              ? 'bg-indigo-600/90 text-white border-indigo-500 font-semibold shadow-sm'
              : 'bg-amber-100 text-amber-950 border-amber-300 font-semibold shadow-sm'
          }`}
        >
          {isDarkOrOled ? <Moon className="w-4 h-4 shrink-0" /> : <Sun className="w-4 h-4 shrink-0 text-amber-600" />}
          <div>
            <span className="text-xs block leading-tight">Appearance</span>
            <span className="text-[10px] opacity-80 block font-mono">
              {theme === 'oled' ? 'OLED Pitch' : isDarkOrOled ? 'Dark Mode' : 'Daylight Mode'}
            </span>
          </div>
        </div>

        {/* Do Not Disturb Tile */}
        <div
          onClick={() => setDndEnabled(!dndEnabled)}
          className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
            dndEnabled
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-sm'
              : 'dark:bg-slate-800/60 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700/80 border-slate-200 dark:hover:bg-slate-800 hover:bg-slate-200/80'
          }`}
        >
          <BellOff className="w-4 h-4 shrink-0" />
          <div>
            <span className="text-xs block leading-tight">Do Not Disturb</span>
            <span className="text-[10px] opacity-80 block font-mono">{dndEnabled ? 'Silenced' : 'Off'}</span>
          </div>
        </div>
      </div>

      {/* Sliders: Brightness & Volume */}
      <div className="space-y-3 pt-1">
        {/* Brightness */}
        <div className="flex items-center gap-3 dark:bg-slate-800/60 bg-slate-100 p-2.5 rounded-xl border dark:border-slate-700/60 border-slate-200">
          <Sun className="w-4 h-4 text-cyan-500 shrink-0" />
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <span className="text-xs font-mono dark:text-slate-300 text-slate-700 w-9 text-right shrink-0">
            {Math.round(brightness * 100)}%
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 dark:bg-slate-800/60 bg-slate-100 p-2.5 rounded-xl border dark:border-slate-700/60 border-slate-200">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-cyan-500 hover:text-cyan-400 transition-colors shrink-0 cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <span className="text-xs font-mono dark:text-slate-300 text-slate-700 w-10 text-right shrink-0">
            {isMuted ? 'Muted' : `${volume}%`}
          </span>
        </div>
      </div>

      {/* Footer System Status & Power Options */}
      <div className="pt-2 border-t dark:border-slate-800/80 border-slate-200 flex items-center justify-between text-xs dark:text-slate-400 text-slate-600">
        <div className="flex items-center gap-1.5 font-mono">
          <Battery className="w-4 h-4 text-emerald-500" />
          <span>{batteryPct}% {isCharging ? '(AC)' : ''}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setQuickSettingsOpen(false);
              openApp('settings');
            }}
            title="Open System Settings"
            className="p-1.5 dark:hover:text-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setQuickSettingsOpen(false);
              lockOS();
            }}
            title="Lock Pluto OS"
            className="p-1.5 hover:text-cyan-500 dark:hover:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setQuickSettingsOpen(false);
              restartOS();
            }}
            title="Restart Pluto OS"
            className="p-1.5 hover:text-amber-500 dark:hover:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setQuickSettingsOpen(false);
              shutDownOS();
            }}
            title="Shut Down OS"
            className="p-1.5 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
