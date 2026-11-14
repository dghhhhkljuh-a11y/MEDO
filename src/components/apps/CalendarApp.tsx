import React, { useState, useEffect } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Trash2,
  Repeat,
  Check,
  AlarmClock,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AlarmSoundType, CalendarAlarm } from '../../types/os';
import { playAlarmTone, playSystemSound } from '../../utils/sound';

const WEEKDAYS = [
  { index: 0, short: 'Sun' },
  { index: 1, short: 'Mon' },
  { index: 2, short: 'Tue' },
  { index: 3, short: 'Wed' },
  { index: 4, short: 'Thu' },
  { index: 5, short: 'Fri' },
  { index: 6, short: 'Sat' },
];

const SOUND_OPTIONS: { id: AlarmSoundType; label: string; desc: string }[] = [
  { id: 'crystal_chime', label: 'Crystal Chime', desc: 'Harmonic ascending chime' },
  { id: 'digital_pulse', label: 'Digital Pulse', desc: 'Crisp electronic beep' },
  { id: 'orbital_bell', label: 'Orbital Bell', desc: 'Warm resonant bell' },
  { id: 'gentle_synth', label: 'Gentle Synth', desc: 'Soft ambient wake chord' },
  { id: 'silent', label: 'Silent (Visual Only)', desc: 'Notification banner without audio' },
];

const DEFAULT_ALARMS: CalendarAlarm[] = [
  {
    id: 'alarm-1',
    time: '08:30',
    label: 'Morning Standup & Priority Sync',
    days: [1, 2, 3, 4, 5],
    enabled: true,
    sound: 'crystal_chime',
    volume: 85,
  },
  {
    id: 'alarm-2',
    time: '18:00',
    label: 'E2EE Vault Daily Snapshot Check',
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    sound: 'orbital_bell',
    volume: 70,
  },
];

export const CalendarApp: React.FC = () => {
  const { addNotification } = useOS();

  const [activeTab, setActiveTab] = useState<'calendar' | 'alarms' | 'world_clocks' | 'timer'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Interactive monthly view
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  // Alarms state (persisted to localStorage)
  const [alarms, setAlarms] = useState<CalendarAlarm[]>(() => {
    try {
      const saved = localStorage.getItem('pluto_os_alarms');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return DEFAULT_ALARMS;
  });

  const [newAlarmTime, setNewAlarmTime] = useState('09:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [newAlarmDays, setNewAlarmDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newAlarmSound, setNewAlarmSound] = useState<AlarmSoundType>('crystal_chime');
  const [newAlarmVolume, setNewAlarmVolume] = useState<number>(80);

  const [ringingAlarm, setRingingAlarm] = useState<CalendarAlarm | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('pluto_os_alarms', JSON.stringify(alarms));
    } catch {
      // ignore
    }
  }, [alarms]);

  // Clock ticker + live recurring alarm evaluator
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const hhmm = `${hh}:${mm}`;
      const minuteKey = `${now.toDateString()}-${hhmm}`;
      const todayDay = now.getDay();

      setAlarms((prevAlarms) => {
        let changed = false;
        const updated = prevAlarms.map((alarm) => {
          if (!alarm.enabled) return alarm;
          if (alarm.time !== hhmm) return alarm;
          if (alarm.lastTriggeredMinute === minuteKey) return alarm;

          const dayMatches = alarm.days.length === 0 || alarm.days.includes(todayDay);
          if (!dayMatches) return alarm;

          changed = true;
          playAlarmTone(alarm.sound, alarm.volume);
          setRingingAlarm(alarm);
          addNotification({
            title: `Alarm: ${alarm.label || 'Scheduled Alarm'}`,
            message: `${alarm.time} (${SOUND_OPTIONS.find((s) => s.id === alarm.sound)?.label || 'Chime'})`,
            app: 'Calendar & Alarms',
          });

          // If one-time alarm (days empty), disable after ringing
          return {
            ...alarm,
            enabled: alarm.days.length === 0 ? false : true,
            lastTriggeredMinute: minuteKey,
          };
        });
        return changed ? updated : prevAlarms;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [addNotification]);

  useEffect(() => {
    let interval: any;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const toggleNewAlarmDay = (dayIdx: number) => {
    setNewAlarmDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlarmTime) return;
    playSystemSound('click');

    const created: CalendarAlarm = {
      id: 'alarm-' + Date.now(),
      time: newAlarmTime,
      label: newAlarmLabel.trim() || 'Pluto Alarm',
      days: [...newAlarmDays],
      enabled: true,
      sound: newAlarmSound,
      volume: newAlarmVolume,
    };

    setAlarms((prev) => [created, ...prev].sort((a, b) => a.time.localeCompare(b.time)));
    setNewAlarmLabel('');
    addNotification({
      title: 'Alarm Created',
      message: `${created.label} set for ${created.time}.`,
      app: 'Calendar & Alarms',
    });
  };

  const toggleAlarmEnabled = (id: string) => {
    playSystemSound('click');
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const updateAlarmSound = (id: string, sound: AlarmSoundType) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, sound } : a)));
  };

  const deleteAlarm = (id: string) => {
    playSystemSound('click');
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    if (ringingAlarm?.id === id) setRingingAlarm(null);
  };

  const snoozeRingingAlarm = () => {
    if (!ringingAlarm) return;
    playSystemSound('click');
    const [h, m] = ringingAlarm.time.split(':').map(Number);
    const snoozeDate = new Date();
    snoozeDate.setHours(h, m + 5, 0, 0);
    const nextTime = `${String(snoozeDate.getHours()).padStart(2, '0')}:${String(snoozeDate.getMinutes()).padStart(2, '0')}`;

    const snoozedAlarm: CalendarAlarm = {
      id: 'snooze-' + Date.now(),
      time: nextTime,
      label: `${ringingAlarm.label} (Snoozed +5m)`,
      days: [],
      enabled: true,
      sound: ringingAlarm.sound,
      volume: ringingAlarm.volume,
    };

    setAlarms((prev) => [snoozedAlarm, ...prev]);
    setRingingAlarm(null);
  };

  const formatDaysSummary = (days: number[]) => {
    if (days.length === 0) return 'Once';
    if (days.length === 7) return 'Every day';
    if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays';
    if (JSON.stringify(days) === JSON.stringify([0, 6])) return 'Weekends';
    return days.map((d) => WEEKDAYS.find((w) => w.index === d)?.short).join(', ');
  };

  const worldClocks = [
    { city: 'Local Time (Workstation)', timezone: 'Local', time: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), diff: 'Current' },
    { city: 'UTC Coordinated Universal', timezone: 'UTC', time: new Date().toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit' }), diff: 'UTC+0' },
    { city: 'Tokyo, Japan', timezone: 'Asia/Tokyo', time: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit' }), diff: '+17 hrs' },
    { city: 'London, United Kingdom', timezone: 'Europe/London', time: new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit' }), diff: '+8 hrs' },
  ];

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeAlarmCount = alarms.filter((a) => a.enabled).length;

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans">
      {/* Top Banner */}
      <div className="p-4 dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold">Date, Time, Calendar & Alarms Hub</h3>
            <span className="text-[11px] dark:text-slate-400 text-slate-500 font-mono">
              {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} ·{' '}
              {currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 dark:bg-slate-950 bg-slate-100 p-1 rounded-xl border dark:border-slate-800 border-slate-200">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'calendar'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('alarms')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'alarms'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            <AlarmClock className="w-3.5 h-3.5" />
            <span>Alarms</span>
            {activeAlarmCount > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === 'alarms' ? 'bg-slate-950/20 text-slate-950' : 'bg-cyan-500/20 text-cyan-500'
                }`}
              >
                {activeAlarmCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('world_clocks')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'world_clocks'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            World Clocks
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'timer'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            Stopwatch
          </button>
        </div>
      </div>

      {/* Live Ringing Alarm Alert Banner */}
      {ringingAlarm && (
        <div className="px-5 py-3 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-b border-amber-500/40 flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-amber-400 animate-bounce shrink-0" />
            <div>
              <h4 className="text-xs font-bold dark:text-amber-200 text-amber-900">
                Alarm Triggered: {ringingAlarm.label} ({ringingAlarm.time})
              </h4>
              <span className="text-[11px] font-mono dark:text-amber-300/80 text-amber-800">
                Sound: {SOUND_OPTIONS.find((s) => s.id === ringingAlarm.sound)?.label} · Vol {ringingAlarm.volume}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={snoozeRingingAlarm}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
            >
              Snooze +5m
            </button>
            <button
              onClick={() => setRingingAlarm(null)}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'calendar' && (
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-3 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl shadow-sm">
              <h4 className="text-sm font-bold">
                {monthNames[viewMonth]} {viewYear}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 dark:hover:bg-slate-800 hover:bg-slate-100 rounded-lg dark:text-slate-300 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setViewMonth(new Date().getMonth());
                    setViewYear(new Date().getFullYear());
                  }}
                  className="px-2.5 py-1 text-xs font-mono dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 text-cyan-500 rounded-lg font-semibold"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 dark:hover:bg-slate-800 hover:bg-slate-100 rounded-lg dark:text-slate-300 text-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl shadow-sm">
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs dark:text-slate-500 text-slate-400 mb-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14 rounded-lg dark:bg-slate-950/30 bg-slate-100/50" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday =
                    day === new Date().getDate() &&
                    viewMonth === new Date().getMonth() &&
                    viewYear === new Date().getFullYear();

                  return (
                    <div
                      key={day}
                      className={`h-14 p-1.5 rounded-lg border flex flex-col justify-between font-mono text-xs transition-colors ${
                        isToday
                          ? 'bg-cyan-500/15 border-cyan-500/60 dark:text-cyan-300 text-cyan-700 font-bold'
                          : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800/80 border-slate-200 dark:hover:border-slate-700 hover:border-slate-300 dark:text-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="text-right">{day}</span>
                      {isToday && (
                        <span className="text-[9px] text-cyan-500 dark:bg-cyan-950 bg-cyan-100 px-1 py-0.2 rounded truncate text-center">
                          Today
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ALARMS TAB */}
        {activeTab === 'alarms' && (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Create Recurring Alarm Form */}
            <form
              onSubmit={handleAddAlarm}
              className="p-5 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Create Recurring Alarm</h4>
                </div>
                <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500">
                  Real-Time Audio & Notification Trigger
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1 font-medium">
                    Alarm Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newAlarmTime}
                    onChange={(e) => setNewAlarmTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-xl dark:text-cyan-400 text-cyan-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1 font-medium">
                    Custom Alarm Label
                  </label>
                  <input
                    type="text"
                    value={newAlarmLabel}
                    onChange={(e) => setNewAlarmLabel(e.target.value)}
                    placeholder="e.g., Daily Focus Block, Cloud Backup Check, Wake Up..."
                    className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Recurring Schedule Selector */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] dark:text-slate-400 text-slate-500 font-medium flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-cyan-500" />
                    Recurring Days ({formatDaysSummary(newAlarmDays)})
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setNewAlarmDays([0, 1, 2, 3, 4, 5, 6])}
                      className="px-2 py-0.5 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700"
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAlarmDays([1, 2, 3, 4, 5])}
                      className="px-2 py-0.5 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700"
                    >
                      Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAlarmDays([0, 6])}
                      className="px-2 py-0.5 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700"
                    >
                      Weekends
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAlarmDays([])}
                      className="px-2 py-0.5 rounded dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700"
                    >
                      Once
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((day) => {
                    const selected = newAlarmDays.includes(day.index);
                    return (
                      <button
                        key={day.index}
                        type="button"
                        onClick={() => toggleNewAlarmDay(day.index)}
                        className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                            : 'dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600 dark:hover:border-slate-700'
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Settings & Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] dark:text-slate-400 text-slate-500 block mb-1 font-medium">
                    Alarm Sound Tone
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={newAlarmSound}
                      onChange={(e) => setNewAlarmSound(e.target.value as AlarmSoundType)}
                      className="flex-1 px-3 py-2 text-xs dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-xl dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500"
                    >
                      {SOUND_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label} — {opt.desc}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => playAlarmTone(newAlarmSound, newAlarmVolume)}
                      disabled={newAlarmSound === 'silent'}
                      className="px-3 py-2 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-cyan-400 text-cyan-600 rounded-xl border dark:border-slate-700 border-slate-300 disabled:opacity-40 shrink-0 flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Test
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="dark:text-slate-400 text-slate-500 font-medium">Alarm Volume</label>
                    <span className="font-mono text-cyan-500 font-bold">{newAlarmVolume}%</span>
                  </div>
                  <div className="flex items-center gap-2.5 h-9 px-3 dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-300 rounded-xl">
                    {newAlarmSound === 'silent' ? (
                      <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-cyan-500 shrink-0" />
                    )}
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      disabled={newAlarmSound === 'silent'}
                      value={newAlarmVolume}
                      onChange={(e) => setNewAlarmVolume(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Recurring Alarm
                </button>
              </div>
            </form>

            {/* Scheduled Alarms List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700">
                  Configured Alarms ({alarms.length})
                </h4>
                <span className="text-[11px] font-mono dark:text-slate-500 text-slate-500">
                  {activeAlarmCount} Armed
                </span>
              </div>

              {alarms.length === 0 ? (
                <div className="p-8 text-center dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl text-xs dark:text-slate-500 text-slate-400">
                  No alarms configured. Add your first recurring alarm above.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alarms.map((alarm) => {
                    const soundLabel = SOUND_OPTIONS.find((s) => s.id === alarm.sound)?.label || alarm.sound;
                    return (
                      <div
                        key={alarm.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                          alarm.enabled
                            ? 'dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 shadow-sm'
                            : 'dark:bg-slate-950/60 bg-slate-100/70 dark:border-slate-800/60 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="text-2xl font-extrabold font-mono tabular-nums text-cyan-500">
                            {alarm.time}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h5 className="text-xs font-bold truncate">{alarm.label}</h5>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                              <span className="px-2 py-0.5 rounded-md dark:bg-slate-800 bg-slate-100 dark:text-cyan-300 text-cyan-700 border dark:border-slate-700 border-slate-300 flex items-center gap-1">
                                <Repeat className="w-2.5 h-2.5" />
                                {formatDaysSummary(alarm.days)}
                              </span>
                              <select
                                value={alarm.sound}
                                onChange={(e) => updateAlarmSound(alarm.id, e.target.value as AlarmSoundType)}
                                className="px-2 py-0.5 rounded-md dark:bg-slate-950 bg-slate-50 dark:text-slate-300 text-slate-700 border dark:border-slate-700 border-slate-300 focus:outline-none"
                                title="Change Alarm Sound"
                              >
                                {SOUND_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <span className="dark:text-slate-400 text-slate-500">
                                {alarm.sound === 'silent' ? 'Muted' : `${alarm.volume}% vol`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => playAlarmTone(alarm.sound, alarm.volume)}
                            title={`Preview ${soundLabel}`}
                            className="p-2 rounded-lg dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-600 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleAlarmEnabled(alarm.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                              alarm.enabled
                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                : 'dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-600 dark:border-slate-700 border-slate-300'
                            }`}
                          >
                            {alarm.enabled && <Check className="w-3 h-3" />}
                            {alarm.enabled ? 'On' : 'Off'}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteAlarm(alarm.id)}
                            title="Delete Alarm"
                            className="p-2 rounded-lg dark:hover:bg-slate-800 hover:bg-rose-50 dark:text-slate-400 text-slate-500 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'world_clocks' && (
          <div className="max-w-3xl mx-auto space-y-3">
            <h4 className="text-xs font-bold mb-2">Synchronized Global Timezones</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {worldClocks.map((clock, i) => (
                <div key={i} className="p-4 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-xs dark:text-slate-400 text-slate-500 font-mono">
                    <span>{clock.diff}</span>
                    <span>{clock.timezone}</span>
                  </div>
                  <h5 className="text-sm font-bold">{clock.city}</h5>
                  <div className="text-2xl font-extrabold font-mono text-cyan-500 pt-1 tabular-nums">
                    {clock.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="max-w-md mx-auto py-8 text-center space-y-6">
            <div className="text-6xl font-extrabold font-mono text-cyan-500 tabular-nums">
              {formatStopwatch(stopwatchSeconds)}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                className={`px-5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors ${
                  isStopwatchRunning
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                }`}
              >
                {isStopwatchRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isStopwatchRunning ? 'Pause' : 'Start'}
              </button>

              <button
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                className="px-4 py-2 text-xs font-semibold dark:bg-slate-800 bg-slate-200 dark:hover:bg-slate-700 hover:bg-slate-300 dark:text-slate-200 text-slate-800 rounded-xl border dark:border-slate-700 border-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
