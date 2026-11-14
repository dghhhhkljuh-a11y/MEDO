import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Play,
  CheckCircle,
  Plus,
  RefreshCw,
  Cpu,
  Shield,
  HardDrive,
  FolderSync,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { ScheduledTask } from '../../types/os';

export const TaskSchedulerApp: React.FC = () => {
  const { scheduledTasks, toggleScheduledTask, runScheduledTaskNow, addScheduledTask } = useOS();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState<ScheduledTask['trigger']>('Daily at 02:00');
  const [newAction, setNewAction] = useState<ScheduledTask['action']>('E2EE Cloud Backup Snapshot');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addScheduledTask({
      name: newName.trim(),
      trigger: newTrigger,
      action: newAction,
      nextRun: 'Scheduled according to rule',
      enabled: true,
    });
    setNewName('');
    setShowAddModal(false);
  };

  const getActionIcon = (action: ScheduledTask['action']) => {
    switch (action) {
      case 'E2EE Cloud Backup Snapshot':
        return <HardDrive className="w-4 h-4 text-cyan-400" />;
      case 'Memory Defrag & Cache Clean':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'Pluto Security Deep Scan':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'Cross-Device File Sync':
        return <FolderSync className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border-b border-slate-800 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Task Scheduler & Process Automation</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automate cron jobs, memory defragmentation, and zero-knowledge cloud backups.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Scheduled Job
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-5xl mx-auto space-y-3">
          {scheduledTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all ${
                task.enabled
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/40 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 shrink-0 mt-0.5">
                    {getActionIcon(task.action)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{task.name}</h4>
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {task.trigger}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Action: {task.action}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500">
                      <span>Last execution: {task.lastRun}</span>
                      <span>·</span>
                      <span>Next trigger: {task.nextRun}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => runScheduledTaskNow(task.id)}
                    disabled={task.status === 'running'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors"
                  >
                    {task.status === 'running' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Run Now
                  </button>

                  <button
                    onClick={() => toggleScheduledTask(task.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      task.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {task.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Scheduled Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Schedule Automated Process
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Job Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Weekly SSD TRIM & Cache Purge"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Trigger Cadence</label>
              <select
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Daily at 02:00">Daily at 02:00 (Off-peak)</option>
                <option value="Hourly">Hourly</option>
                <option value="On System Idle">On System Idle (Power saving)</option>
                <option value="Every 12 Hours">Every 12 Hours</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Automated System Action</label>
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="E2EE Cloud Backup Snapshot">E2EE Cloud Backup Snapshot</option>
                <option value="Memory Defrag & Cache Clean">Memory Defrag & Cache Clean</option>
                <option value="Pluto Security Deep Scan">Pluto Security Deep Scan</option>
                <option value="Cross-Device File Sync">Cross-Device File Sync</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors"
              >
                Schedule Job
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
