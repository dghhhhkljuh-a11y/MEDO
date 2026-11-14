export type AppId =
  | 'task_manager'
  | 'sys_monitor'
  | 'cloud_vault'
  | 'store'
  | 'browser'
  | 'downloads'
  | 'scheduler'
  | 'security'
  | 'audio_studio'
  | 'games'
  | 'weather'
  | 'settings'
  | 'system_updates'
  | 'mail'
  | 'calendar'
  | 'ai_assistant'
  | 'terminal'
  | 'notes'
  | 'calculator'
  | 'media';

export type AlarmSoundType = 'crystal_chime' | 'digital_pulse' | 'orbital_bell' | 'gentle_synth' | 'silent';

export interface CalendarAlarm {
  id: string;
  time: string; // HH:MM (24-hour format)
  label: string;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat. Empty = Once
  enabled: boolean;
  sound: AlarmSoundType;
  volume: number; // 0-100
  lastTriggeredMinute?: string;
}

export type TaskPriority = 'P0 Critical' | 'P1 High' | 'P2 Normal' | 'P3 Low';

export interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  category: 'System' | 'Development' | 'Security' | 'Personal';
  dueDate: string;
  completed: boolean;
  isEncrypted: boolean;
  encryptedContent?: string;
  notes?: string;
}

export interface OSProcess {
  id: number;
  name: string;
  category: 'system' | 'user' | 'service';
  cpuPct: number;
  ramMb: number;
  diskIoMbps: number;
  status: 'running' | 'sleeping' | 'suspended';
  priority: 'critical' | 'high' | 'normal' | 'low';
  threads: number;
}

export interface CloudFile {
  id: string;
  name: string;
  sizeBytes: number;
  modified: string;
  isEncrypted: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  platforms: Array<'windows' | 'macos' | 'linux' | 'ios'>;
  category: 'Documents' | 'System Backup' | 'Media' | 'Archives' | 'Keys';
}

export interface DownloadItem {
  id: string;
  name: string;
  totalBytes: number;
  downloadedBytes: number;
  speedMbps: number;
  status: 'downloading' | 'completed' | 'paused' | 'failed';
  category: 'app' | 'media' | 'doc' | 'package';
  sourceUrl: string;
  startedAt: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  trigger: 'Daily at 02:00' | 'Hourly' | 'On System Idle' | 'Every 12 Hours' | 'Weekly';
  action: 'E2EE Cloud Backup Snapshot' | 'Memory Defrag & Cache Clean' | 'Pluto Security Deep Scan' | 'Cross-Device File Sync';
  lastRun: string;
  nextRun: string;
  enabled: boolean;
  status: 'idle' | 'running' | 'success' | 'warning';
}

export interface StoreApp {
  id: string;
  name: string;
  tagline: string;
  category: 'Productivity' | 'Utilities' | 'Audio/Media' | 'Gaming' | 'Security';
  version: string;
  size: string;
  rating: number;
  installed: boolean;
  iconBg: string;
  description: string;
  targetAppId?: AppId;
}

export interface WifiNetwork {
  ssid: string;
  signalStrength: number; // 1-4
  isSecured: boolean;
  connected: boolean;
  frequency: '2.4 GHz' | '5 GHz' | '6 GHz (Wi-Fi 6E)';
}

export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'headphones' | 'keyboard' | 'mouse' | 'gamepad';
  connected: boolean;
  batteryPct?: number;
}

export interface SystemUpdateLog {
  version: string;
  releaseDate: string;
  title: string;
  type: 'major' | 'security' | 'feature' | 'patch';
  highlights: string[];
  securityPatches: string[];
}

export interface WindowState {
  id: AppId;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type ThemeMode = 'dark' | 'light' | 'oled';

export type WallpaperPreset =
  | 'deep_space'
  | 'aurora_cyber'
  | 'obsidian_minimal'
  | 'solar_horizon'
  | 'bioluminescent_tides'
  | 'daylight_frost'
  | 'animated_nebula'
  | 'carbon';

export interface PlutoEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';
  isEncrypted?: boolean;
}

export interface AudioMixerChannel {
  id: string;
  name: string;
  appId?: AppId;
  volume: number; // 0-100
  muted: boolean;
  peakDb: number;
}
