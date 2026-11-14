import React, { useState } from 'react';
import {
  User,
  Palette,
  Wifi,
  Bluetooth,
  Bell,
  RefreshCw,
  Lock,
  CheckCircle,
  Trash2,
  Power,
  RotateCcw,
  QrCode,
  Monitor,
  Laptop,
  Smartphone,
  Sun,
  Moon,
  AlertTriangle,
  Sliders,
  Keyboard,
  Volume2,
  VolumeX,
  Clock,
  StickyNote,
  Sparkles,
  Link2,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useFirebase } from '../../context/FirebaseContext';
import { PlutoLogo } from '../common/PlutoLogo';
import { UserAvatar } from '../common/UserAvatar';
import { WallpaperPreset, BluetoothDevice } from '../../types/os';
import { WALLPAPER_ASSETS } from '../../assets/wallpapers';

export const SettingsApp: React.FC = () => {
  const {
    theme,
    setTheme,
    toggleTheme,
    wallpaper,
    setWallpaper,
    brightness,
    setBrightness,
    volume,
    setVolume,
    dndEnabled,
    setDndEnabled,
    wifiEnabled,
    setWifiEnabled,
    wifiNetworks,
    connectWifi,
    forgetWifiNetwork,
    bluetoothEnabled,
    setBluetoothEnabled,
    bluetoothDevices,
    toggleBluetoothDevice,
    unpairBluetoothDevice,
    pairNewDevice,
    user,
    setUserPassword,
    toggleTwoFactor,
    updateUserDisplayName,
    updateUserAvatar,
    resetUserAvatar,
    shutDownOS,
    restartOS,
    factoryResetOS,
    lockOS,
    systemVersion,
    realSystemInfo,
    realUpdateAudit,
    updateLogs,
    availableUpdate,
    isCheckingUpdate,
    isApplyingUpdate,
    updateProgressPct,
    checkSystemUpdates,
    applySystemUpdate,
    desktopPrefs,
    updateDesktopPrefs,
  } = useOS();

  const {
    firebaseUser,
    isSigningIn,
    authError,
    signInWithGoogle,
    signOutGoogle,
    syncPreferences,
  } = useFirebase();

  const [activeSection, setActiveSection] = useState<
    'account' | 'personalization' | 'desktop' | 'shortcuts' | 'updates' | 'wifi' | 'bluetooth' | 'notifications'
  >('account');

  // Account editing
  const [displayNameInput, setDisplayNameInput] = useState(user.displayName);
  const [avatarUrlInput, setAvatarUrlInput] = useState(user.avatar);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Factory reset modal
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmWord, setResetConfirmWord] = useState('');

  // Custom wallpaper URL draft
  const [customWallpaperInput, setCustomWallpaperInput] = useState(desktopPrefs.customWallpaperUrl || '');
  const [wallpaperSavedToast, setWallpaperSavedToast] = useState(false);

  // Active user sessions (can be deleted/terminated)
  const [sessions, setSessions] = useState([
    { id: 'sess-1', name: 'Pluto OS Workstation (Current Device)', ip: '192.168.1.140', active: true, icon: <Monitor className="w-4 h-4 text-cyan-400" /> },
    { id: 'sess-2', name: 'Mobile Sync Node (iOS Client)', ip: '10.0.4.12', active: false, icon: <Smartphone className="w-4 h-4 text-emerald-400" /> },
    { id: 'sess-3', name: 'Secondary Laptop (macOS Enclave)', ip: '10.0.4.88', active: false, icon: <Laptop className="w-4 h-4 text-blue-400" /> },
  ]);

  // Wi-Fi connect modal
  const [selectedSsid, setSelectedSsid] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState('');

  // Bluetooth pair modal
  const [showPairModal, setShowPairModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('Studio Pro Headphones');
  const [newDeviceType, setNewDeviceType] = useState<BluetoothDevice['type']>('headphones');

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = displayNameInput.trim() || user.displayName;
    if (displayNameInput.trim()) {
      updateUserDisplayName(nextName);
    }
    if (avatarUrlInput.trim()) {
      updateUserAvatar(avatarUrlInput.trim());
    }
    syncPreferences({
      displayName: nextName,
      theme: theme === 'light' ? 'light' : 'dark',
      wallpaper,
    }).catch(() => {});
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    await setUserPassword(newPassword.trim());
    setPasswordSuccess(true);
    setNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleConnectWifi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSsid) return;
    connectWifi(selectedSsid);
    setSelectedSsid(null);
    setWifiPassword('');
  };

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    pairNewDevice(newDeviceName.trim(), newDeviceType);
    setShowPairModal(false);
  };

  const terminateSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 dark:bg-slate-900 bg-white border-b md:border-b-0 md:border-r dark:border-slate-800 border-slate-200 p-3 space-y-1 shrink-0 overflow-x-auto md:overflow-visible flex md:flex-col">
        <div className="hidden md:flex items-center justify-between px-3 py-2 mb-2 pb-3 border-b dark:border-slate-800 border-slate-200">
          <PlutoLogo size={24} showWordmark={true} versionBadge="v2.5.0 LTS" />
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            className="p-1.5 rounded-lg dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-amber-300 text-indigo-600 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
        {[
          { id: 'account', label: 'Account Center & Security', icon: <User className="w-4 h-4 text-cyan-400" /> },
          { id: 'personalization', label: 'Backgrounds & Themes', icon: <Palette className="w-4 h-4 text-pink-400" /> },
          { id: 'desktop', label: 'Desktop & Sound', icon: <Sliders className="w-4 h-4 text-sky-400" /> },
          { id: 'shortcuts', label: 'Shortcuts & Power', icon: <Keyboard className="w-4 h-4 text-indigo-400" /> },
          { id: 'updates', label: 'Updates & Factory Reset', icon: <RefreshCw className="w-4 h-4 text-purple-400" /> },
          { id: 'wifi', label: 'Wi-Fi & Networks', icon: <Wifi className="w-4 h-4 text-emerald-400" /> },
          { id: 'bluetooth', label: 'Bluetooth & Peripherals', icon: <Bluetooth className="w-4 h-4 text-blue-400" /> },
          { id: 'notifications', label: 'Notifications & Focus', icon: <Bell className="w-4 h-4 text-amber-400" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
              activeSection === item.id
                ? 'dark:bg-slate-800 bg-cyan-500/10 dark:text-slate-100 text-cyan-700 shadow-sm'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900 dark:hover:bg-slate-800/40 hover:bg-slate-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <div className="hidden md:block pt-6 mt-6 border-t dark:border-slate-800 border-slate-200 space-y-1">
          <span className="text-[10px] font-mono dark:text-slate-500 text-slate-400 uppercase px-3 block">Power & Recovery</span>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold dark:text-cyan-400 text-cyan-700 dark:hover:bg-cyan-500/10 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
          </button>
          <button
            onClick={restartOS}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Pluto OS</span>
          </button>
          <button
            onClick={shutDownOS}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>Shut Down Workstation</span>
          </button>
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto p-6 dark:bg-slate-950 bg-slate-50">
        <div className="max-w-3xl space-y-6">
          {/* ACCOUNT CENTER */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">Account Center & Privacy Enclave</h3>
                <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                  Manage user identity credentials, two-factor authentication, active login sessions, and password security.
                </p>
              </div>

              {/* User Profile Editor Form (System Monogram - No Profile Photos) */}
              <form onSubmit={handleProfileSave} className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <UserAvatar displayName={user.displayName} size="lg" showStatusBadge />
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold dark:text-slate-100 text-slate-900">{user.displayName}</h4>
                      <span className="text-xs dark:text-slate-400 text-slate-500 block font-mono">{user.email}</span>
                      <span className="text-[10px] font-mono text-cyan-500 dark:bg-cyan-950/60 bg-cyan-50 px-2 py-0.5 rounded border dark:border-cyan-800/40 border-cyan-200 inline-block">
                        Root Administrator (UID #0)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetUserAvatar();
                      setAvatarUrlInput('');
                      setProfileSuccess(true);
                      setTimeout(() => setProfileSuccess(false), 2500);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Profile Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div>
                    <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">Display Name (Updates System Monogram)</label>
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {profileSuccess ? (
                    <span className="text-xs text-emerald-500 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" /> Profile identity updated!
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>

              {/* Firebase Cloud Account & Google Sign-In */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900">
                      Pluto Cloud Identity (Google Sign-In)
                    </h4>
                    <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                      {firebaseUser
                        ? `Signed in as ${firebaseUser.email || firebaseUser.displayName} — cross-device Firestore sync enabled.`
                        : 'Sign in with Google to synchronize tasks, preferences, and workstation settings across devices.'}
                    </p>
                  </div>

                  {firebaseUser ? (
                    <button
                      type="button"
                      onClick={() => signOutGoogle()}
                      className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSigningIn}
                      onClick={() => signInWithGoogle()}
                      className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-xl shadow transition-colors cursor-pointer"
                    >
                      {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                    </button>
                  )}
                </div>

                {authError && (
                  <p className="text-[11px] text-rose-400 font-mono">{authError}</p>
                )}
              </div>

              {/* Password Protection */}
              <form onSubmit={handlePasswordSubmit} className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-500" />
                  <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900">Master Password Protection</h4>
                </div>
                <p className="text-xs dark:text-slate-400 text-slate-600">
                  Secures the lockscreen, root terminal authorization, and cryptographic recovery seeds.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new master password"
                    className="flex-1 px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
                {passwordSuccess && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1 font-mono">
                    <CheckCircle className="w-3.5 h-3.5" /> Master password updated and encrypted!
                  </span>
                )}
              </form>

              {/* Two-Factor Authentication (2FA) Setup */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-purple-800/40 border-purple-200 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/30">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold dark:text-purple-300 text-purple-700">Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs dark:text-slate-400 text-slate-600">TOTP Authenticator Protection (Google Authenticator, YubiKey)</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleTwoFactor(!user.twoFactorEnabled)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      user.twoFactorEnabled
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                    }`}
                  >
                    {user.twoFactorEnabled ? '2FA Active' : '2FA Disabled'}
                  </button>
                </div>

                {user.twoFactorEnabled && (
                  <div className="p-3 dark:bg-slate-950 bg-slate-50 rounded-xl border dark:border-slate-800 border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="dark:text-slate-400 text-slate-600">Hardware Secret Key:</span>
                      <span className="text-cyan-500 select-all font-bold tracking-wider">{user.twoFactorSecret}</span>
                    </div>
                    <span className="text-[11px] dark:text-slate-500 text-slate-500 block">
                      Emergency recovery codes: 8201-9402, 1144-8831, 5521-0094
                    </span>
                  </div>
                )}
              </div>

              {/* Active Sessions List (Can Delete / Terminate) */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Active Authorized Sessions</h4>
                  <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500">{sessions.length} Connected Nodes</span>
                </div>

                <div className="divide-y dark:divide-slate-800 divide-slate-200">
                  {sessions.map((sess) => (
                    <div key={sess.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {sess.icon}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold dark:text-slate-200 text-slate-900">{sess.name}</span>
                            {sess.active && (
                              <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] dark:text-slate-500 text-slate-500 font-mono">IP: {sess.ip}</span>
                        </div>
                      </div>

                      {!sess.active && (
                        <button
                          onClick={() => terminateSession(sess.id)}
                          className="px-2.5 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Session
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BACKGROUNDS & THEMES */}
          {activeSection === 'personalization' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">Backgrounds & Personalization Themes</h3>
                <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                  Select cosmic wallpapers, animated gradients, toggle Dark or Daylight mode, and customize display luminance.
                </p>
              </div>

              {/* Dark Mode / Light Mode Global Toggle */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block">Global Appearance Mode</span>
                    <span className="text-[11px] dark:text-slate-400 text-slate-500">
                      Active class on root document: <code className="text-cyan-500 font-mono">.{theme === 'light' ? 'light' : 'dark'}</code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>Toggle to {theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'dark:bg-slate-800 bg-slate-900 text-white border-cyan-400 ring-2 ring-cyan-500/30'
                        : 'dark:bg-slate-950 bg-slate-100 dark:border-slate-800 border-slate-200 dark:hover:bg-slate-800/40 hover:bg-slate-200'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <div className="text-left">
                      <span className="text-xs font-bold block">Dark Mode</span>
                      <span className="text-[10px] opacity-70 block">Default Slate</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('oled')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      theme === 'oled'
                        ? 'dark:bg-slate-800 bg-slate-900 text-white border-cyan-400 ring-2 ring-cyan-500/30'
                        : 'dark:bg-slate-950 bg-slate-100 dark:border-slate-800 border-slate-200 dark:hover:bg-slate-800/40 hover:bg-slate-200'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-black border border-slate-700" />
                    <div className="text-left">
                      <span className="text-xs font-bold block">OLED Black</span>
                      <span className="text-[10px] opacity-70 block">Pure Contrast</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('light')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-amber-50 text-slate-900 border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'dark:bg-slate-950 bg-slate-100 dark:border-slate-800 border-slate-200 dark:hover:bg-slate-800/40 hover:bg-slate-200'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" />
                    <div className="text-left">
                      <span className="text-xs font-bold block">Daylight Mode</span>
                      <span className="text-[10px] opacity-70 block">Crisp Light</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* All 8 Desktop Wallpaper Presets */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block">Desktop Wallpapers & Dynamic Backgrounds</span>
                  {desktopPrefs.customWallpaperUrl && (
                    <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">
                      Custom URL Override Active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'deep_space', name: 'Deep Space Pluto', sub: 'Sci-Fi Dwarf Planet', img: WALLPAPER_ASSETS.deep_space, grad: 'from-blue-900 via-indigo-950 to-slate-950' },
                    { id: 'aurora_cyber', name: 'Cyber Aurora Mountain', sub: 'Indigo & Emerald Glow', img: WALLPAPER_ASSETS.aurora_cyber, grad: 'from-purple-900 via-indigo-950 to-emerald-950' },
                    { id: 'obsidian_minimal', name: 'Obsidian Minimalist', sub: 'Matte Geometric Dark', img: WALLPAPER_ASSETS.obsidian_minimal, grad: 'from-slate-800 via-slate-900 to-black' },
                    { id: 'solar_horizon', name: 'Solar Ridge Horizon', sub: 'Golden Amber & Mist', img: WALLPAPER_ASSETS.solar_horizon, grad: 'from-amber-600 via-slate-800 to-cyan-950' },
                    { id: 'bioluminescent_tides', name: 'Bioluminescent Tides', sub: 'Glowing Twilight Surf', img: WALLPAPER_ASSETS.bioluminescent_tides, grad: 'from-cyan-700 via-blue-900 to-indigo-950' },
                    { id: 'daylight_frost', name: 'Daylight Glass Frost', sub: 'Airy Light Wave Silk', img: WALLPAPER_ASSETS.daylight_frost, grad: 'from-sky-100 via-slate-200 to-indigo-100' },
                    { id: 'animated_nebula', name: 'Animated Nebula Live', sub: 'Drifting Cosmic Plasma', img: null, grad: 'from-cyan-700 via-fuchsia-900 to-indigo-950' },
                    { id: 'carbon', name: 'Carbon Precision Grid', sub: 'Machined Aerospace Mesh', img: null, grad: 'from-zinc-900 via-slate-950 to-cyan-950' },
                  ].map((wp) => {
                    const isActive = !desktopPrefs.customWallpaperUrl && wallpaper === wp.id;
                    return (
                      <button
                        key={wp.id}
                        onClick={() => {
                          if (desktopPrefs.customWallpaperUrl) {
                            updateDesktopPrefs({ customWallpaperUrl: '' });
                            setCustomWallpaperInput('');
                          }
                          setWallpaper(wp.id as WallpaperPreset);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg'
                            : 'dark:border-slate-800 border-slate-200 dark:hover:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className={`h-20 w-full rounded-lg bg-gradient-to-r ${wp.grad} mb-2 flex items-center justify-center relative overflow-hidden`}>
                          {wp.img && (
                            <img
                              src={wp.img}
                              alt={wp.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          {wp.id === 'animated_nebula' && (
                            <Sparkles className="w-5 h-5 text-cyan-300/80 absolute top-2 right-2 animate-pulse" />
                          )}
                          {isActive && (
                            <span className="relative z-10 bg-slate-950/85 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block truncate">{wp.name}</span>
                        <span className="text-[10px] dark:text-slate-400 text-slate-500 block truncate">{wp.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brightness Control */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold dark:text-slate-200 text-slate-900">Display Brightness</span>
                  <span className="font-mono text-cyan-500">{Math.round(brightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* DESKTOP & SOUND */}
          {activeSection === 'desktop' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">Desktop Layout & Sound Engine</h3>
                <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                  Customize desktop icon scale, frosted glass translucency, ambient widgets, custom wallpaper URLs, and system audio cues.
                </p>
              </div>

              {/* Desktop Icon Size */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block">Desktop Icon Grid Scale</span>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'compact', label: 'Compact', desc: 'Dense 72px tiles' },
                    { id: 'standard', label: 'Standard', desc: 'Balanced 88px tiles' },
                    { id: 'large', label: 'Large', desc: 'Crisp 104px tiles' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateDesktopPrefs({ iconSize: opt.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        desktopPrefs.iconSize === opt.id
                          ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-500/20'
                          : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold dark:text-slate-100 text-slate-900 block">{opt.label}</span>
                      <span className="text-[10px] dark:text-slate-400 text-slate-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Translucency */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block">Compositor Glass Surface Opacity</span>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'subtle', label: 'Crystal Clear', desc: 'Light tint & high depth' },
                    { id: 'balanced', label: 'Balanced Blur', desc: 'Default frosted glass' },
                    { id: 'frosted', label: 'High Contrast', desc: 'Solid readability' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateDesktopPrefs({ glassOpacity: opt.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        desktopPrefs.glassOpacity === opt.id
                          ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-500/20'
                          : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold dark:text-slate-100 text-slate-900 block">{opt.label}</span>
                      <span className="text-[10px] dark:text-slate-400 text-slate-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles: Sound Effects, Clock Pill, Desktop Sticky Notes */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl divide-y dark:divide-slate-800 divide-slate-200 shadow-sm">
                <div className="pb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                      {desktopPrefs.soundEffectsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">System UI Sound Effects</h4>
                      <p className="text-xs dark:text-slate-400 text-slate-500">Play Web Audio feedback on boot, window open/close, and notifications.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDesktopPrefs({ soundEffectsEnabled: !desktopPrefs.soundEffectsEnabled })}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      desktopPrefs.soundEffectsEnabled
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                    }`}
                  >
                    {desktopPrefs.soundEffectsEnabled ? 'Enabled' : 'Muted'}
                  </button>
                </div>

                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold dark:text-slate-200 text-slate-900">Master System Volume</span>
                    <span className="font-mono text-cyan-500">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Desktop Ambient Clock & Focus Timer</h4>
                      <p className="text-xs dark:text-slate-400 text-slate-500">Show top-center live clock and built-in 25-minute Pomodoro timer pill.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDesktopPrefs({ showDesktopClock: !desktopPrefs.showDesktopClock })}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      desktopPrefs.showDesktopClock
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                    }`}
                  >
                    {desktopPrefs.showDesktopClock ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <StickyNote className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Pinned Desktop Sticky Notes</h4>
                      <p className="text-xs dark:text-slate-400 text-slate-500">Display interactive sticky notes created via right-click or clipboard paste.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDesktopPrefs({ showDesktopNotes: !desktopPrefs.showDesktopNotes })}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      desktopPrefs.showDesktopNotes
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                    }`}
                  >
                    {desktopPrefs.showDesktopNotes ? 'Shown' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Custom Wallpaper URL Override */}
              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-pink-500" />
                  <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Custom Wallpaper Image URL</h4>
                </div>
                <p className="text-xs dark:text-slate-400 text-slate-500">
                  Paste any HTTPS image URL to override preset wallpapers. Leave blank to use selected preset.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customWallpaperInput}
                    onChange={(e) => setCustomWallpaperInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateDesktopPrefs({ customWallpaperUrl: customWallpaperInput.trim() });
                      setWallpaperSavedToast(true);
                      setTimeout(() => setWallpaperSavedToast(false), 2200);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
                  >
                    Apply URL
                  </button>
                  {desktopPrefs.customWallpaperUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomWallpaperInput('');
                        updateDesktopPrefs({ customWallpaperUrl: '' });
                      }}
                      className="px-3 py-2 text-xs font-semibold dark:bg-slate-800 bg-slate-200 dark:text-slate-300 text-slate-700 rounded-lg hover:bg-rose-500/20 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {wallpaperSavedToast && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1 font-mono">
                    <CheckCircle className="w-3.5 h-3.5" /> Desktop background preference saved.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SHORTCUTS & POWER */}
          {activeSection === 'shortcuts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">Keyboard Shortcuts & Power Control</h3>
                <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                  Configure global workstation hotkeys and rapid power states.
                </p>
              </div>

              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Global OS Keyboard Shortcuts</h4>
                  <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
                    Enable instant Alt-key navigation across apps and lockscreen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateDesktopPrefs({ keyboardShortcutsEnabled: !desktopPrefs.keyboardShortcutsEnabled })}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    desktopPrefs.keyboardShortcutsEnabled
                      ? 'bg-indigo-500 text-white border-indigo-400'
                      : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                  }`}
                >
                  {desktopPrefs.keyboardShortcutsEnabled ? 'Shortcuts Active' : 'Disabled'}
                </button>
              </div>

              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Active Workstation Bindings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    { keys: 'Alt + Space', action: 'Open Pluto AI Copilot' },
                    { keys: 'Alt + T', action: 'Open Task Manager' },
                    { keys: 'Alt + B', action: 'Open Web Navigator Browser' },
                    { keys: 'Alt + S', action: 'Open System Settings' },
                    { keys: 'Alt + L', action: 'Lock Workstation Immediately' },
                    { keys: 'Right Click', action: 'Workspace Context Menu' },
                  ].map((sc) => (
                    <div
                      key={sc.keys}
                      className="flex items-center justify-between p-3 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200"
                    >
                      <span className="dark:text-slate-300 text-slate-700 font-medium">{sc.action}</span>
                      <kbd className="px-2 py-0.5 text-[11px] font-mono dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-300 rounded text-cyan-500 font-semibold">
                        {sc.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Workstation Power Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={lockOS}
                    className="p-3 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 hover:border-cyan-500/50 flex items-center gap-2.5 text-xs font-semibold dark:text-slate-200 text-slate-800 transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-cyan-500" />
                    <span>Lock Workstation</span>
                  </button>
                  <button
                    type="button"
                    onClick={restartOS}
                    className="p-3 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 hover:border-amber-500/50 flex items-center gap-2.5 text-xs font-semibold text-amber-500 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart Kernel</span>
                  </button>
                  <button
                    type="button"
                    onClick={shutDownOS}
                    className="p-3 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 hover:border-rose-500/50 flex items-center gap-2.5 text-xs font-semibold text-rose-500 transition-colors cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                    <span>Shut Down</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REAL SYSTEM UPDATES, HOST RUNTIME & LIVE DEPENDENCY AUDIT */}
          {activeSection === 'updates' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">{systemVersion}</h3>
                  <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5 font-mono">
                    {realSystemInfo.osType} {realSystemInfo.release} ({realSystemInfo.arch}) · Node {realSystemInfo.nodeVersion} · {realSystemInfo.cpuCoresCount} Cores
                  </p>
                </div>

                <button
                  onClick={checkSystemUpdates}
                  disabled={isCheckingUpdate || isApplyingUpdate}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold dark:bg-slate-800 bg-white dark:hover:bg-slate-700 hover:bg-slate-100 dark:text-slate-200 text-slate-800 rounded-xl border dark:border-slate-700 border-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin text-cyan-400' : ''}`} />
                  {isCheckingUpdate ? 'Auditing Live Registry...' : 'Check Live Updates & Audits'}
                </button>
              </div>

              {/* Real Host Hardware Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 block">HOST CPU</span>
                  <span className="font-bold dark:text-slate-100 text-slate-900 truncate block mt-0.5">{realSystemInfo.cpuModel}</span>
                </div>
                <div className="p-3 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 block">HOST ARCH / NODE</span>
                  <span className="font-bold font-mono text-cyan-500 block mt-0.5">{realSystemInfo.arch} · {realSystemInfo.nodeVersion}</span>
                </div>
                <div className="p-3 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 block">SERVER RSS / HEAP</span>
                  <span className="font-bold font-mono text-emerald-500 block mt-0.5">
                    {realSystemInfo.processMemoryMb.rss} MB / {realSystemInfo.processMemoryMb.heapUsed} MB
                  </span>
                </div>
                <div className="p-3 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 block">LOAD AVG (1/5/15M)</span>
                  <span className="font-bold font-mono dark:text-slate-200 text-slate-800 block mt-0.5">
                    {realSystemInfo.loadAvg.join(' · ')}
                  </span>
                </div>
              </div>

              {/* Available Release Update Card */}
              {availableUpdate ? (
                <div className="p-5 dark:bg-gradient-to-r dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 bg-white border dark:border-purple-800/60 border-purple-200 rounded-2xl space-y-4 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-purple-500 uppercase tracking-wider block">
                        LIVE RELEASE VERIFIED ON HOST
                      </span>
                      <h4 className="text-base font-bold dark:text-slate-100 text-slate-900 mt-0.5">{availableUpdate.version}</h4>
                      <span className="text-xs dark:text-slate-400 text-slate-600 font-mono">
                        Target: {realSystemInfo.osType} {realSystemInfo.release} · {availableUpdate.size}
                      </span>
                    </div>

                    <button
                      onClick={applySystemUpdate}
                      disabled={isApplyingUpdate}
                      className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl shadow-lg transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      {isApplyingUpdate ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Verifying ({updateProgressPct}%)...
                        </>
                      ) : (
                        'Verify & Apply Update'
                      )}
                    </button>
                  </div>

                  <div className="pt-2 border-t dark:border-purple-900/40 border-purple-100 space-y-1.5 text-xs dark:text-slate-300 text-slate-700">
                    <span className="dark:text-slate-400 text-slate-500 font-semibold block">Included Real Capabilities:</span>
                    {availableUpdate.notes.map((n, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>{n}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 dark:bg-slate-900 bg-emerald-50 border dark:border-emerald-900/40 border-emerald-200 rounded-xl flex items-center gap-2 text-xs dark:text-emerald-400 text-emerald-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>
                    System channel is verified and active ({systemVersion}). Last audited{' '}
                    {realUpdateAudit?.lastCheckedAt ? new Date(realUpdateAudit.lastCheckedAt).toLocaleTimeString() : 'just now'}.
                  </span>
                </div>
              )}

              {/* Live Backend Services & Live npm Dependency Audit */}
              {realUpdateAudit && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-2.5 shadow-sm">
                    <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Live Host Services</h4>
                    <div className="space-y-1.5">
                      {realUpdateAudit.services.map((svc) => (
                        <div key={svc.name} className="flex items-center justify-between text-xs p-2 rounded-lg dark:bg-slate-950/70 bg-slate-50 border dark:border-slate-800/70 border-slate-200">
                          <div>
                            <span className="font-semibold dark:text-slate-200 text-slate-800 block">{svc.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">{svc.detail}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                              svc.status === 'healthy'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}
                          >
                            {svc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-2.5 shadow-sm">
                    <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">
                      Core Runtime Package Audit (package.json vs npm)
                    </h4>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {realUpdateAudit.packages.map((pkg) => (
                        <div key={pkg.name} className="flex items-center justify-between p-2 rounded-lg dark:bg-slate-950/70 bg-slate-50 border dark:border-slate-800/70 border-slate-200">
                          <span className="font-semibold dark:text-slate-200 text-slate-800">{pkg.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{pkg.installed}</span>
                            <span className="text-slate-400">→</span>
                            <span className={pkg.updateAvailable ? 'text-amber-500 font-bold' : 'text-emerald-500'}>
                              {pkg.latest}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* System Changelog History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold dark:text-slate-200 text-slate-800">Installed System Changelog History</h4>
                {updateLogs.map((log) => (
                  <div key={log.version} className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-cyan-500">{log.version}</span>
                      <span className="text-[11px] font-mono dark:text-slate-500 text-slate-400">{log.releaseDate}</span>
                    </div>
                    <h5 className="text-xs font-semibold dark:text-slate-200 text-slate-900">{log.title}</h5>

                    <ul className="text-xs dark:text-slate-400 text-slate-600 space-y-1 list-disc list-inside">
                      {log.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Factory Reset & Kernel Recovery Enclave */}
              <div className="p-5 dark:bg-rose-950/20 bg-rose-50 border dark:border-rose-900/50 border-rose-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold dark:text-rose-300 text-rose-800">Factory Reset Pluto OS</h4>
                      <p className="text-xs dark:text-slate-400 text-rose-700/80 mt-0.5">
                        Wipes custom personalization, clears saved alarms and user tasks, and restores the clean factory OS image.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetConfirmWord('');
                      setShowFactoryResetModal(true);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-colors shrink-0 cursor-pointer"
                  >
                    Reset to Factory Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WI-FI & NETWORKS */}
          {activeSection === 'wifi' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">Wi-Fi & Wireless Networks</h3>
                  <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                    Connect, disconnect, and delete saved wireless network credentials.
                  </p>
                </div>
                <button
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    wifiEnabled
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                  }`}
                >
                  {wifiEnabled ? 'Wi-Fi On' : 'Wi-Fi Off'}
                </button>
              </div>

              {wifiEnabled ? (
                <div className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                  <span className="text-xs font-semibold dark:text-slate-300 text-slate-700 block">Available Networks</span>
                  <div className="divide-y dark:divide-slate-800 divide-slate-200">
                    {wifiNetworks.map((net) => (
                      <div key={net.ssid} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Wifi className={`w-4 h-4 ${net.connected ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold dark:text-slate-200 text-slate-900">{net.ssid}</span>
                              {net.connected && (
                                <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  Connected
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] dark:text-slate-500 text-slate-500 font-mono">
                              {net.frequency} · {net.isSecured ? 'WPA3 Enterprise' : 'Open'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {net.connected ? (
                            <span className="text-xs text-emerald-500 font-medium">Active</span>
                          ) : (
                            <button
                              onClick={() => setSelectedSsid(net.ssid)}
                              className="px-3 py-1 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-200 text-slate-800 rounded-lg border dark:border-slate-700 border-slate-300 transition-colors cursor-pointer"
                            >
                              Connect
                            </button>
                          )}
                          <button
                            onClick={() => forgetWifiNetwork(net.ssid)}
                            title="Forget / Delete Network"
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center dark:bg-slate-900/40 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl dark:text-slate-500 text-slate-500 text-xs">
                  Wi-Fi adapter is turned off.
                </div>
              )}
            </div>
          )}

          {/* BLUETOOTH */}
          {activeSection === 'bluetooth' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">Bluetooth & Peripherals</h3>
                  <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                    Pair, disconnect, and delete wireless accessories.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPairModal(true)}
                    className="px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors cursor-pointer"
                  >
                    Pair New Device
                  </button>
                  <button
                    onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      bluetoothEnabled
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                        : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                    }`}
                  >
                    {bluetoothEnabled ? 'Bluetooth On' : 'Bluetooth Off'}
                  </button>
                </div>
              </div>

              {bluetoothEnabled ? (
                <div className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3 shadow-sm">
                  <span className="text-xs font-semibold dark:text-slate-300 text-slate-700 block">Paired Accessories</span>
                  <div className="divide-y dark:divide-slate-800 divide-slate-200">
                    {bluetoothDevices.map((dev) => (
                      <div key={dev.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bluetooth className={`w-4 h-4 ${dev.connected ? 'text-blue-500' : 'text-slate-400'}`} />
                          <div>
                            <span className="text-xs font-bold dark:text-slate-200 text-slate-900 block">{dev.name}</span>
                            <span className="text-[11px] dark:text-slate-500 text-slate-500 capitalize font-mono">
                              {dev.type} {dev.batteryPct !== undefined && `· ${dev.batteryPct}% battery`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBluetoothDevice(dev.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                              dev.connected
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                            }`}
                          >
                            {dev.connected ? 'Disconnect' : 'Connect'}
                          </button>
                          <button
                            onClick={() => unpairBluetoothDevice(dev.id)}
                            title="Unpair & Delete Device"
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center dark:bg-slate-900/40 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl dark:text-slate-500 text-slate-500 text-xs">
                  Bluetooth radio is disabled.
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold dark:text-slate-100 text-slate-900">Notifications & Focus Settings</h3>
                <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                  Configure Do Not Disturb mode and application alert permissions.
                </p>
              </div>

              <div className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold dark:text-slate-200 text-slate-900">Do Not Disturb (DND)</h4>
                  <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">Mutes all auditory alert sounds and tray toasts.</p>
                </div>
                <button
                  onClick={() => setDndEnabled(!dndEnabled)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    dndEnabled
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                  }`}
                >
                  {dndEnabled ? 'DND Active' : 'DND Inactive'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connect Wi-Fi Modal */}
      {selectedSsid && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConnectWifi}
            className="w-full max-w-sm dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-semibold dark:text-slate-100 text-slate-900 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-500" />
              Connect to {selectedSsid}
            </h3>

            <div>
              <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">Network Security Key</label>
              <input
                type="password"
                required
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Enter WPA3 password"
                className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSsid(null)}
                className="px-3.5 py-1.5 text-xs dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors"
              >
                Join Network
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pair Bluetooth Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePairSubmit}
            className="w-full max-w-sm dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-semibold dark:text-slate-100 text-slate-900 flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-blue-500" />
              Pair Bluetooth Accessory
            </h3>

            <div>
              <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">Device Name</label>
              <input
                type="text"
                required
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">Device Type</label>
              <select
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500"
              >
                <option value="headphones">Wireless Headphones</option>
                <option value="keyboard">Mechanical Keyboard</option>
                <option value="mouse">Precision Mouse</option>
                <option value="gamepad">Game Controller</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPairModal(false)}
                className="px-3.5 py-1.5 text-xs dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors"
              >
                Pair & Connect
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Factory Reset Confirmation Modal */}
      {showFactoryResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md dark:bg-slate-900 bg-white border dark:border-rose-800/60 border-rose-300 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900">Confirm Factory Reset</h3>
                <p className="text-[11px] dark:text-slate-400 text-slate-500">This action restores Pluto OS to clean factory state.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl dark:bg-slate-950 bg-rose-50 border dark:border-slate-800 border-rose-200 text-xs dark:text-slate-300 text-rose-900 space-y-1">
              <p>• Resets theme, wallpaper, and audio levels to defaults</p>
              <p>• Clears custom alarms, clipboard, and user tasks</p>
              <p>• Reboots Workstation Kernel cleanly</p>
            </div>

            <div>
              <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">
                Type <span className="font-mono font-bold text-rose-500">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmWord}
                onChange={(e) => setResetConfirmWord(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 text-xs font-mono dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowFactoryResetModal(false)}
                className="px-3.5 py-1.5 text-xs dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmWord.trim().toUpperCase() !== 'RESET' || isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  setShowFactoryResetModal(false);
                  await factoryResetOS();
                  setIsResetting(false);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
              >
                {isResetting ? 'Resetting System...' : 'Erase & Factory Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
