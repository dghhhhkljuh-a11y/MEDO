import React, { useState } from 'react';
import {
  Cloud,
  Shield,
  RefreshCw,
  HardDrive,
  Upload,
  Trash2,
  Lock,
  Smartphone,
  Laptop,
  Monitor,
  Key,
  CheckCircle,
  FileArchive,
  FileText,
  Music,
  Plus,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const CloudStorageApp: React.FC = () => {
  const {
    cloudFiles,
    totalQuotaBytes,
    usedQuotaBytes,
    e2eeEnabled,
    e2eeMasterKey,
    setE2eeEnabled,
    regenerateE2EEKey,
    addCloudFile,
    deleteCloudFile,
    syncAllCloudFiles,
    isSyncing,
    backupSnapshots,
    createBackupSnapshot,
  } = useOS();

  const [activeTab, setActiveTab] = useState<'files' | 'snapshots' | 'cross_platform' | 'crypto_vault'>('files');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSizeMb, setNewFileSizeMb] = useState('250');
  const [newFileCategory, setNewFileCategory] = useState<'Documents' | 'System Backup' | 'Media' | 'Archives' | 'Keys'>('System Backup');
  const [newFileEncrypted, setNewFileEncrypted] = useState(true);

  // Quota calculation
  const usedGb = (usedQuotaBytes / (1024 * 1024 * 1024)).toFixed(1);
  const totalGb = (totalQuotaBytes / (1024 * 1024 * 1024)).toFixed(0);
  const quotaPercent = ((usedQuotaBytes / totalQuotaBytes) * 100).toFixed(1);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const sizeBytes = parseFloat(newFileSizeMb) * 1024 * 1024;
    addCloudFile({
      name: newFileName.trim(),
      sizeBytes,
      category: newFileCategory,
      isEncrypted: newFileEncrypted,
    });
    setNewFileName('');
    setShowUploadModal(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Banner: 1TB Integrated Cloud Quota */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border-b border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Pluto 1TB Integrated Cloud Vault</h3>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Tier: 1,024 GB Included
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-knowledge end-to-end encrypted backup storage synchronized across all nodes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={syncAllCloudFiles}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              {isSyncing ? 'Synchronizing...' : 'Sync All Nodes'}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Backup
            </button>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="max-w-5xl mx-auto mt-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>
              Used: <strong className="text-slate-200">{usedGb} GB</strong> / {totalGb} GB ({quotaPercent}%)
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> E2EE Active (AES-256-GCM)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${quotaPercent}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'files' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cloud Files & Backups ({cloudFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'snapshots' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          System Restore Snapshots ({backupSnapshots.length})
        </button>
        <button
          onClick={() => setActiveTab('cross_platform')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'cross_platform' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cross-Platform Sync Nodes
        </button>
        <button
          onClick={() => setActiveTab('crypto_vault')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'crypto_vault' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          E2EE Zero-Knowledge Key Vault
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'files' && (
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">File / Backup Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Size</th>
                    <th className="py-2.5 px-3">Encryption</th>
                    <th className="py-2.5 px-3">Sync Status</th>
                    <th className="py-2.5 px-3">Platforms</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cloudFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans text-slate-200 font-medium flex items-center gap-2">
                        {file.category === 'Media' ? (
                          <Music className="w-4 h-4 text-pink-400 shrink-0" />
                        ) : file.category === 'Archives' ? (
                          <FileArchive className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <span className="truncate max-w-xs">{file.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{file.category}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                        {formatBytes(file.sizeBytes)}
                      </td>
                      <td className="py-2.5 px-3">
                        {file.isEncrypted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            <Lock className="w-2.5 h-2.5" /> AES-256-GCM
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Standard</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> Synced
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                        {file.platforms.join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deleteCloudFile(file.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete from Cloud"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'snapshots' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">System Backup Snapshots</h4>
                <p className="text-xs text-slate-400">
                  Full image restore points archived to your 1TB cloud storage.
                </p>
              </div>
              <button
                onClick={createBackupSnapshot}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Restore Point Now
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {backupSnapshots.map((snap) => (
                <div key={snap.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400">{snap.type}</span>
                    <span className="text-xs font-mono text-slate-400">{snap.size}</span>
                  </div>
                  <h5 className="text-xs font-semibold text-slate-100">{snap.name}</h5>
                  <span className="text-[11px] text-slate-400 block font-mono">Created: {snap.date}</span>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => alert(`Restoring from ${snap.name}... System state verified intact.`)}
                      className="w-full py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                    >
                      Rollback to this point
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cross_platform' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <h4 className="text-xs font-semibold text-slate-200 mb-2">Connected Cross-Platform Sync Clients</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">Pluto OS Workstation (Local Node)</h5>
                    <span className="text-[11px] text-emerald-400 font-mono">● Primary Gateway · Online</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">10 Gbps LAN</span>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">Android Subsystem & Mobile Node</h5>
                    <span className="text-[11px] text-emerald-400 font-mono">● Synchronized · Auto-Backup ON</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">Wi-Fi 6E</span>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">macOS & Windows Sync Clients</h5>
                    <span className="text-[11px] text-emerald-400 font-mono">● Synchronized · E2EE Enclave</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">Cloud Mesh</span>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">Linux Offsite Replica Node</h5>
                    <span className="text-[11px] text-emerald-400 font-mono">● Synced · Immutable Snapshots</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">Geo-Redundant</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crypto_vault' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-5 bg-slate-900 border border-purple-800/40 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/30">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-300">End-to-End Encryption Configuration</h4>
                    <p className="text-xs text-slate-400">
                      Zero-knowledge encryption ensures neither the cloud host nor any third party can read your data.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setE2eeEnabled(!e2eeEnabled)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    e2eeEnabled
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {e2eeEnabled ? 'E2EE Armed' : 'E2EE Disabled'}
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Master Recovery Seed (Hardware AES-256):</span>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-cyan-400 select-all tracking-wider">
                    {e2eeMasterKey}
                  </span>
                  <button
                    onClick={regenerateE2EEKey}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors shrink-0"
                  >
                    Rotate Key
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>• Cipher: AES-256-GCM authenticated encryption with random 96-bit initialization vectors.</p>
                <p>• Key Derivation: PBKDF2 with HMAC-SHA-256 and 100,000 hashing rounds.</p>
                <p>• Zero Server-Side Keys: All encryption is performed in the local browser runtime before transmission.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Backup Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUploadSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Upload Backup to 1TB Cloud
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">File / Archive Name</label>
              <input
                type="text"
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. Workspace_Snapshot_2026.tar.zst"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Size (MB)</label>
                <input
                  type="number"
                  required
                  value={newFileSizeMb}
                  onChange={(e) => setNewFileSizeMb(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="System Backup">System Backup</option>
                  <option value="Documents">Documents</option>
                  <option value="Archives">Archives</option>
                  <option value="Media">Media</option>
                  <option value="Keys">Keys</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="e2ee-check"
                checked={newFileEncrypted}
                onChange={(e) => setNewFileEncrypted(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-0"
              />
              <label htmlFor="e2ee-check" className="text-xs text-slate-300">
                Encrypt file with 256-bit AES-GCM before uploading
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors"
              >
                Upload to Cloud
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
