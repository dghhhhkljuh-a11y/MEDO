import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Circle,
  Cpu,
  HardDrive,
  Filter,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { TaskPriority, OSProcess } from '../../types/os';

export const TaskManagerApp: React.FC = () => {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    encryptTaskWithUserKey,
    decryptTaskWithUserKey,
    processes,
    killProcess,
    setProcessPriority,
    hardwareMetrics,
    realSystemInfo,
  } = useOS();

  const [activeTab, setActiveTab] = useState<'tasks' | 'processes' | 'resources'>('tasks');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('P1 High');
  const [newCategory, setNewCategory] = useState<'System' | 'Development' | 'Security' | 'Personal'>('System');
  const [newDueDate, setNewDueDate] = useState('Today');
  const [newNotes, setNewNotes] = useState('');

  // Decryption modal state
  const [decryptModalTaskId, setDecryptModalTaskId] = useState<string | null>(null);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Encryption modal state
  const [encryptModalTaskId, setEncryptModalTaskId] = useState<string | null>(null);
  const [encryptPassInput, setEncryptPassInput] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate,
      notes: newNotes,
    });
    setNewTitle('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleDecrypt = async () => {
    if (!decryptModalTaskId || !passphraseInput) return;
    setDecryptError(null);
    try {
      const plain = await decryptTaskWithUserKey(decryptModalTaskId, passphraseInput);
      setDecryptedResult(plain);
    } catch {
      setDecryptError('Decryption failed. Incorrect passphrase or corrupted payload.');
    }
  };

  const handleEncryptConfirm = async () => {
    if (!encryptModalTaskId || !encryptPassInput) return;
    await encryptTaskWithUserKey(encryptModalTaskId, encryptPassInput);
    setEncryptModalTaskId(null);
    setEncryptPassInput('');
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const getPriorityBadgeColor = (p: TaskPriority) => {
    switch (p) {
      case 'P0 Critical':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'P1 High':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'P2 Normal':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'P3 Low':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/80 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'tasks'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prioritized Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('processes')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'processes'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Processes ({processes.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'resources'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Telemetry
          </button>
        </div>

        {/* Live Status Strip */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tabular-nums">CPU: {hardwareMetrics.cpuTotal}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="tabular-nums">RAM: {hardwareMetrics.ramUsedGb} GB / {hardwareMetrics.ramTotalGb} GB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>E2EE Active</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'tasks' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks, categories..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="bg-transparent text-xs text-slate-300 pr-2 py-1 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="P0 Critical">P0 Critical</option>
                    <option value="P1 High">P1 High</option>
                    <option value="P2 Normal">P2 Normal</option>
                    <option value="P3 Low">P3 Low</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Prioritized Task
              </button>
            </div>

            {/* Task Cards Matrix */}
            <div className="grid grid-cols-1 gap-2.5">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No matching tasks found. Create one to organize system priorities.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border transition-all ${
                      task.completed
                        ? 'bg-slate-900/30 border-slate-800/40 opacity-70'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-0.5 text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getPriorityBadgeColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-400">{task.category}</span>
                          <span className="text-xs text-slate-600">·</span>
                          <span className="text-xs text-slate-400 font-mono">{task.dueDate}</span>
                          {task.isEncrypted && (
                            <span className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              <Lock className="w-2.5 h-2.5" /> E2EE Encrypted
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs font-medium text-slate-200 ${
                            task.completed ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </p>

                        {task.notes && (
                          <p className="mt-1 text-xs text-slate-400 font-mono line-clamp-2">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.isEncrypted ? (
                        <button
                          onClick={() => {
                            setDecryptModalTaskId(task.id);
                            setPassphraseInput('');
                            setDecryptedResult(null);
                            setDecryptError(null);
                          }}
                          title="Decrypt Task Note"
                          className="px-2 py-1 text-xs bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50 text-purple-300 rounded flex items-center gap-1 transition-colors"
                        >
                          <Unlock className="w-3 h-3" />
                          Decrypt
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEncryptModalTaskId(task.id);
                            setEncryptPassInput('');
                          }}
                          title="Encrypt with AES-GCM"
                          className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <select
                        value={task.priority}
                        onChange={(e) => updateTaskPriority(task.id, e.target.value as TaskPriority)}
                        className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded px-1.5 py-1 focus:outline-none"
                      >
                        <option value="P0 Critical">P0</option>
                        <option value="P1 High">P1</option>
                        <option value="P2 Normal">P2</option>
                        <option value="P3 Low">P3</option>
                      </select>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Processes View */}
        {activeTab === 'processes' && (
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2 px-3">
              <span>Active Processes ({processes.length})</span>
              <span>Sorted by memory & CPU impact</span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">PID</th>
                    <th className="py-2.5 px-3">Process Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">CPU</th>
                    <th className="py-2.5 px-3 text-right">RAM</th>
                    <th className="py-2.5 px-3 text-right">Disk I/O</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {processes.map((proc) => (
                    <tr key={proc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-slate-500 tabular-nums">#{proc.id}</td>
                      <td className="py-2 px-3 text-slate-200 font-sans font-medium flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${proc.status === 'running' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {proc.name}
                      </td>
                      <td className="py-2 px-3 text-slate-400 capitalize">{proc.category}</td>
                      <td className="py-2 px-3 text-right text-cyan-400 tabular-nums">{proc.cpuPct}%</td>
                      <td className="py-2 px-3 text-right text-slate-300 tabular-nums">{proc.ramMb} MB</td>
                      <td className="py-2 px-3 text-right text-slate-400 tabular-nums">{proc.diskIoMbps} MB/s</td>
                      <td className="py-2 px-3">
                        <select
                          value={proc.priority}
                          onChange={(e) => setProcessPriority(proc.id, e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 px-1 py-0.5 focus:outline-none"
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="normal">Normal</option>
                          <option value="low">Low</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => killProcess(proc.id)}
                          className="px-2 py-0.5 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition-colors"
                        >
                          Kill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resources & Telemetry View */}
        {activeTab === 'resources' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Host CPU Utilization</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                  {hardwareMetrics.cpuTotal}%
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 truncate" title={realSystemInfo.cpuModel}>
                  {realSystemInfo.cpuCoresCount} Cores · {realSystemInfo.cpuModel}
                </span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Host Physical RAM</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {hardwareMetrics.ramUsedGb} GB
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Host Total: {hardwareMetrics.ramTotalGb} GB · RSS {realSystemInfo.processMemoryMb.rss} MB
                </span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Load Avg (1m / 5m)</span>
                <span className="text-2xl font-bold font-mono text-purple-400 tabular-nums">
                  {realSystemInfo.loadAvg[0]?.toFixed(2) ?? '0.00'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {realSystemInfo.osType} {realSystemInfo.release} ({realSystemInfo.arch})
                </span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Node Runtime</span>
                <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                  {realSystemInfo.nodeVersion}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                  Heap: {realSystemInfo.processMemoryMb.heapUsed}/{realSystemInfo.processMemoryMb.heapTotal} MB
                </span>
              </div>
            </div>

            {/* Core Load Meters */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
              <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center justify-between">
                <span>Live Per-Core CPU Utilization ({realSystemInfo.hostname})</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {hardwareMetrics.cpuCores.length} Active Logical Cores
                </span>
              </h4>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {hardwareMetrics.cpuCores.map((coreLoad, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono mb-2">Core {idx}</span>
                    <div className="w-full h-24 bg-slate-900 rounded overflow-hidden flex flex-col justify-end p-0.5">
                      <div
                        style={{ height: `${coreLoad}%` }}
                        className={`w-full rounded transition-all duration-500 ${
                          coreLoad > 75
                            ? 'bg-rose-500'
                            : coreLoad > 50
                            ? 'bg-amber-400'
                            : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono mt-1.5 tabular-nums">
                      {coreLoad}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host & Process Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-cyan-400" /> Process Memory Breakdown
                  </span>
                  <span className="text-xs font-mono text-slate-400">v{realSystemInfo.appPackageVersion}</span>
                </div>
                <div className="space-y-2 mt-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Resident Set Size (RSS):</span>
                    <span className="text-cyan-400 tabular-nums">{realSystemInfo.processMemoryMb.rss} MB</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>V8 Heap Allocated:</span>
                    <span className="text-emerald-400 tabular-nums">
                      {realSystemInfo.processMemoryMb.heapUsed} / {realSystemInfo.processMemoryMb.heapTotal} MB
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400" /> System & Server Uptime
                  </span>
                  <span className="text-xs font-mono text-slate-400">{realSystemInfo.platform}</span>
                </div>
                <div className="space-y-2 mt-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Host Uptime:</span>
                    <span className="text-purple-400 tabular-nums">
                      {Math.floor(hardwareMetrics.uptimeSeconds / 3600)}h {Math.floor((hardwareMetrics.uptimeSeconds % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>API Server Uptime:</span>
                    <span className="text-sky-400 tabular-nums">
                      {Math.floor(realSystemInfo.serverUptimeSeconds / 60)}m {realSystemInfo.serverUptimeSeconds % 60}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Create Prioritized Task
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Task Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Audit kernel memory allocation pool"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="P0 Critical">P0 Critical (Immediate)</option>
                  <option value="P1 High">P1 High</option>
                  <option value="P2 Normal">P2 Normal</option>
                  <option value="P3 Low">P3 Low</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="System">System</option>
                  <option value="Security">Security</option>
                  <option value="Development">Development</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Due Schedule</label>
              <input
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="e.g. Today 20:00 or Friday"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Notes / Sensitive Data</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Details, technical commands, or encrypted tokens..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
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
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Decrypt Task Modal */}
      {decryptModalTaskId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-purple-800/80 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
              <Unlock className="w-4 h-4 text-purple-400" />
              Unlock E2EE Encrypted Note
            </h3>
            <p className="text-xs text-slate-400">
              This task note is encrypted using 256-bit AES-GCM with PBKDF2 key derivation.
              Enter your decryption passphrase.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Passphrase</label>
              <input
                type="password"
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                placeholder="Enter passphrase used during encryption"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {decryptError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {decryptError}
              </div>
            )}

            {decryptedResult && (
              <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-lg">
                <span className="text-[10px] text-emerald-400 font-mono block mb-1">DECRYPTED PAYLOAD:</span>
                <p className="text-xs text-slate-100 font-mono whitespace-pre-wrap">{decryptedResult}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecryptModalTaskId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDecrypt}
                className="px-4 py-1.5 text-xs font-semibold bg-purple-500 hover:bg-purple-400 text-white rounded-lg transition-colors"
              >
                Decrypt Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encrypt Task Modal */}
      {encryptModalTaskId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-purple-800/80 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              Encrypt Task with End-to-End Encryption
            </h3>
            <p className="text-xs text-slate-400">
              Encrypt this task's sensitive notes with browser-hardware AES-GCM-256.
              Only holders of this passphrase can read it.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Encryption Passphrase</label>
              <input
                type="password"
                value={encryptPassInput}
                onChange={(e) => setEncryptPassInput(e.target.value)}
                placeholder="Choose a strong private passphrase"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEncryptModalTaskId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEncryptConfirm}
                className="px-4 py-1.5 text-xs font-semibold bg-purple-500 hover:bg-purple-400 text-white rounded-lg transition-colors"
              >
                Lock & Encrypt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
