import React, { useState } from 'react';
import {
  Download,
  Pause,
  Play,
  X,
  CheckCircle2,
  FileText,
  Package,
  Plus,
  ArrowDownCircle,
  Film,
  ExternalLink,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const DownloadManagerApp: React.FC = () => {
  const {
    downloads,
    addDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    storeApps,
    installStoreApp,
    openApp,
  } = useOS();

  const [filter, setFilter] = useState<'all' | 'downloading' | 'completed' | 'paused'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputCategory, setInputCategory] = useState<'media' | 'app' | 'package' | 'doc'>('media');

  const isMediaInstalled = storeApps.some((a) => a.targetAppId === 'media' && a.installed);

  const handleAddDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !inputUrl.trim()) return;
    const cleanUrl = inputUrl.trim();
    const cleanName = inputName.trim();

    addDownload({
      name: cleanName,
      totalBytes: 24 * 1024 * 1024,
      category: inputCategory,
      url: cleanUrl,
    });

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      const a = document.createElement('a');
      a.href = `/api/media/download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanName)}`;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setInputName('');
    setInputUrl('');
    setShowAddModal(false);
  };

  const handleSaveToDevice = (url: string, name: string) => {
    const isRemote = url.startsWith('http://') || url.startsWith('https://');
    const href = isRemote
      ? `/api/media/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(name)}`
      : url;
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDownloads = downloads.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const totalSpeed = downloads
    .filter((d) => d.status === 'downloading')
    .reduce((acc, d) => acc + d.speedMbps, 0)
    .toFixed(1);

  const formatMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans">
      {/* Top Banner */}
      <div className="p-5 dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center dark:text-cyan-400 text-cyan-600 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900">
                Download Manager &amp; App Transfers
              </h3>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                Track store app installs, open-media file downloads, and direct HTTP transfers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isMediaInstalled ? (
              <button
                onClick={() => {
                  installStoreApp('app-pluto-media');
                  openApp('media');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 border dark:border-slate-700 border-slate-300 dark:text-cyan-400 text-cyan-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                Install Media Hub
              </button>
            ) : (
              <button
                onClick={() => openApp('media')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 border dark:border-slate-700 border-slate-300 dark:text-cyan-400 text-cyan-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                Open Media Hub
              </button>
            )}

            <div className="hidden md:block text-right px-2">
              <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 block">Transfer Rate</span>
              <span className="text-xs font-bold font-mono text-cyan-500 tabular-nums">
                {totalSpeed} MB/s
              </span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Download URL
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 px-5 py-2 dark:bg-slate-900/60 bg-white border-b dark:border-slate-800 border-slate-200 shrink-0">
        {[
          { id: 'all', label: `All (${downloads.length})` },
          { id: 'downloading', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'paused', label: 'Paused' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === tab.id
                ? 'bg-cyan-500 text-slate-950'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Download Items List */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-5xl mx-auto space-y-3">
          {filteredDownloads.length === 0 ? (
            <div className="text-center py-16 dark:text-slate-500 text-slate-500 text-xs">
              No downloads in this queue. Install an app from Pluto Store or download media from Pluto Media Hub.
            </div>
          ) : (
            filteredDownloads.map((dl) => {
              const progressPct = Math.min(100, Math.round((dl.downloadedBytes / Math.max(1, dl.totalBytes)) * 100));
              const isHttp = dl.sourceUrl.startsWith('http://') || dl.sourceUrl.startsWith('https://');
              const isBlobOrData = dl.sourceUrl.startsWith('blob:') || dl.sourceUrl.startsWith('data:');

              return (
                <div
                  key={dl.id}
                  className="p-4 dark:bg-slate-900/80 bg-white border dark:border-slate-800 border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 dark:bg-slate-800/80 bg-slate-100 rounded-lg border dark:border-slate-700 border-slate-200 text-cyan-500 shrink-0 mt-0.5">
                        {dl.category === 'media' ? (
                          <Film className="w-4 h-4" />
                        ) : dl.category === 'package' ? (
                          <Package className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 truncate">{dl.name}</h4>
                        <span className="text-[11px] font-mono dark:text-slate-500 text-slate-500 block truncate">
                          {dl.sourceUrl}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(isHttp || isBlobOrData) && (
                        <button
                          onClick={() => handleSaveToDevice(dl.sourceUrl, dl.name)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          Save File
                        </button>
                      )}
                      {dl.category === 'media' && isMediaInstalled && (
                        <button
                          onClick={() => openApp('media')}
                          className="px-2.5 py-1 text-[11px] font-semibold dark:bg-slate-800 bg-slate-100 dark:text-cyan-400 text-cyan-600 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Media
                        </button>
                      )}
                      {dl.status === 'downloading' && (
                        <button
                          onClick={() => pauseDownload(dl.id)}
                          title="Pause"
                          className="p-1.5 dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-300 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {dl.status === 'paused' && (
                        <button
                          onClick={() => resumeDownload(dl.id)}
                          title="Resume"
                          className="p-1.5 dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 text-cyan-500 rounded-md transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => cancelDownload(dl.id)}
                        title="Remove"
                        className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Stats */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono dark:text-slate-400 text-slate-500 mb-1.5">
                      <span className="tabular-nums">
                        {formatMb(dl.downloadedBytes)} MB / {formatMb(dl.totalBytes)} MB ({progressPct}%)
                      </span>
                      <span className="flex items-center gap-1">
                        {dl.status === 'downloading' && (
                          <span className="text-cyan-500 tabular-nums">{dl.speedMbps} MB/s</span>
                        )}
                        {dl.status === 'completed' && (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                        {dl.status === 'paused' && <span className="text-amber-500">Paused</span>}
                      </span>
                    </div>

                    <div className="w-full h-2 dark:bg-slate-950 bg-slate-200 rounded-full overflow-hidden border dark:border-slate-800 border-slate-300">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          dl.status === 'completed'
                            ? 'bg-emerald-500'
                            : dl.status === 'paused'
                            ? 'bg-amber-400'
                            : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Download Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddDownload}
            className="w-full max-w-md dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 rounded-xl p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-semibold dark:text-slate-100 text-slate-900 flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-cyan-500" />
              Download Media or Package URL
            </h3>

            <div>
              <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">Direct File URL (HTTP/HTTPS)</label>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://upload.wikimedia.org/..."
                className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">Target Filename</label>
              <input
                type="text"
                required
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="e.g. apollo-mission.jpg"
                className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs dark:text-slate-400 text-slate-600 block mb-1">Category</label>
              <select
                value={inputCategory}
                onChange={(e) => setInputCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="media">Media (Audio / Video / Image)</option>
                <option value="app">Application Bundle</option>
                <option value="package">Software Package</option>
                <option value="doc">Document</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs dark:text-slate-400 text-slate-600 hover:underline cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
              >
                Download File
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
