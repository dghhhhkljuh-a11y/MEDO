import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Download,
  Star,
  Gamepad2,
  Cpu,
  Trash2,
  ExternalLink,
  Shield,
  Music,
  Sparkles,
  CheckCircle2,
  X,
  Package,
  Filter,
  Terminal,
  FileText,
  Calculator,
  Globe,
  Film,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { AppId, StoreApp } from '../../types/os';

interface NpmRegistryPkg {
  name: string;
  version: string;
  description: string;
  publisher: string;
  date: string;
  npmUrl: string;
  homepage: string;
  repository: string;
  keywords: string[];
  score: number;
}

export const PlutoStoreApp: React.FC = () => {
  const {
    storeApps,
    installStoreApp,
    uninstallStoreApp,
    openApp,
    pinnedRegistryApps,
    pinRegistryPackage,
    unpinRegistryPackage,
    launchBrowserSearch,
  } = useOS();

  const [storeMode, setStoreMode] = useState<'native' | 'registry'>('native');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<StoreApp | null>(null);

  // Live npm registry search state
  const [registryQuery, setRegistryQuery] = useState('react');
  const [registryResults, setRegistryResults] = useState<NpmRegistryPkg[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);

  const searchLiveRegistry = async (q: string) => {
    const clean = q.trim() || 'react';
    setIsLoadingRegistry(true);
    setRegistryError(null);
    try {
      const res = await fetch(`/api/store/packages?q=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setRegistryError(data.error || 'Failed to query live package registry.');
        setRegistryResults([]);
      } else {
        setRegistryResults(Array.isArray(data.packages) ? data.packages : []);
      }
    } catch {
      setRegistryError('Network error reaching live package registry.');
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  useEffect(() => {
    if (storeMode === 'registry' && registryResults.length === 0 && !isLoadingRegistry) {
      searchLiveRegistry(registryQuery);
    }
  }, [storeMode]);

  const resolveTargetAppId = (app: StoreApp): AppId => {
    if (app.targetAppId) return app.targetAppId;
    if (app.category === 'Gaming') return 'games';
    if (app.category === 'Audio/Media') return 'audio_studio';
    if (app.category === 'Security') return 'security';
    return 'browser';
  };

  const renderAppIcon = (app: StoreApp) => {
    if (app.targetAppId === 'media') return <Film className="w-5 h-5" />;
    if (app.targetAppId === 'terminal') return <Terminal className="w-5 h-5" />;
    if (app.targetAppId === 'notes') return <FileText className="w-5 h-5" />;
    if (app.targetAppId === 'calculator') return <Calculator className="w-5 h-5" />;
    if (app.targetAppId === 'ai_assistant') return <Sparkles className="w-5 h-5" />;
    if (app.category === 'Gaming') return <Gamepad2 className="w-5 h-5" />;
    if (app.category === 'Audio/Media') return <Music className="w-5 h-5" />;
    if (app.category === 'Security') return <Shield className="w-5 h-5" />;
    return <Cpu className="w-5 h-5" />;
  };

  const filteredApps = storeApps.filter((app) => {
    const matchesCat =
      filterCategory === 'all'
        ? true
        : filterCategory === 'games'
        ? app.category === 'Gaming'
        : app.category.toLowerCase() === filterCategory.toLowerCase();

    const matchesInstalled = installedOnly ? app.installed : true;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      app.name.toLowerCase().includes(q) ||
      app.tagline.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q);

    return matchesCat && matchesInstalled && matchesSearch;
  });

  const installedCount = storeApps.filter((a) => a.installed).length;

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans relative">
      {/* Store Header */}
      <div className="p-5 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/70 bg-gradient-to-r from-white via-slate-50 to-cyan-50/70 border-b dark:border-slate-800 border-slate-200 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center dark:text-cyan-400 text-cyan-600 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900">Pluto Store & Live Package Hub</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full dark:bg-emerald-950/60 bg-emerald-100 dark:text-emerald-300 text-emerald-700 border dark:border-emerald-800/60 border-emerald-200">
                  {installedCount} Modules · {pinnedRegistryApps.length} Pinned
                </span>
              </div>
              <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
                Install real interactive Desktop modules or search the live npm open-source software registry.
              </p>
            </div>
          </div>

          {/* Store Mode Switch */}
          <div className="flex items-center gap-1 p-1 dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-200 rounded-xl shrink-0">
            <button
              onClick={() => setStoreMode('native')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                storeMode === 'native'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
              }`}
            >
              OS Modules ({storeApps.length})
            </button>
            <button
              onClick={() => setStoreMode('registry')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                storeMode === 'registry'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Live npm Registry
            </button>
          </div>
        </div>
      </div>

      {storeMode === 'native' ? (
        <>
          {/* Categories & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 dark:bg-slate-900/60 bg-white border-b dark:border-slate-800 border-slate-200 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Modules' },
                { id: 'Utilities', label: 'Tools & CLI' },
                { id: 'Productivity', label: 'Productivity & AI' },
                { id: 'games', label: 'Arcade' },
                { id: 'Audio/Media', label: 'Media & Audio' },
                { id: 'Security', label: 'Security' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filterCategory === cat.id
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900 dark:hover:bg-slate-800/70 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter modules..."
                  className="w-full pl-8 pr-6 py-1 text-xs dark:bg-slate-950 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setInstalledOnly(!installedOnly)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  installedOnly
                    ? 'bg-emerald-500/15 border-emerald-500/40 dark:text-emerald-300 text-emerald-700'
                    : 'dark:bg-slate-900 bg-slate-100 dark:border-slate-700 border-slate-300 dark:text-slate-400 text-slate-600'
                }`}
              >
                <Filter className="w-3 h-3" />
                Installed
              </button>
            </div>
          </div>

          {/* Native Store App Grid */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {filteredApps.length === 0 ? (
              <div className="max-w-md mx-auto my-8 p-6 text-center rounded-2xl border dark:border-slate-800 border-slate-200 dark:bg-slate-900/60 bg-white space-y-3">
                <Package className="w-8 h-8 mx-auto text-slate-400" />
                <h4 className="text-sm font-bold">No matching modules found</h4>
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setInstalledOnly(false);
                    setSearchQuery('');
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="p-4 dark:bg-slate-900/80 bg-white border dark:border-slate-800 border-slate-200 dark:hover:border-cyan-500/40 hover:border-cyan-400 rounded-xl flex flex-col justify-between transition-all cursor-pointer shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.iconBg} flex items-center justify-center text-white font-bold shadow-md shrink-0`}>
                          {renderAppIcon(app)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {app.installed && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Installed
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-[11px] font-mono dark:text-amber-400 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{app.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 truncate">{app.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">{app.category}</span>
                      </div>

                      <p className="text-xs dark:text-slate-400 text-slate-600 line-clamp-2 mb-3">
                        {app.tagline}
                      </p>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pt-3 border-t dark:border-slate-800/80 border-slate-100 flex items-center justify-between"
                    >
                      <div className="text-[11px] font-mono text-slate-500">
                        <span>{app.size}</span> · <span>v{app.version}</span>
                      </div>

                      {app.installed ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openApp(resolveTargetAppId(app))}
                            className="px-2.5 py-1 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-cyan-400 text-cyan-600 rounded-lg border dark:border-slate-700 border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open
                          </button>
                          <button
                            onClick={() => uninstallStoreApp(app.id)}
                            title="Uninstall Module"
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => installStoreApp(app.id)}
                          className="px-3 py-1 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          Download &amp; Install
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pinned Open-Source Packages Section */}
            {pinnedRegistryApps.length > 0 && (
              <div className="max-w-5xl mx-auto space-y-2.5 pt-2 border-t dark:border-slate-800 border-slate-200">
                <h4 className="text-xs font-bold dark:text-slate-300 text-slate-700">
                  Saved Live Registry Packages ({pinnedRegistryApps.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pinnedRegistryApps.map((pkg) => (
                    <div
                      key={pkg.name}
                      className="p-3.5 dark:bg-slate-900/70 bg-white border dark:border-slate-800 border-slate-200 rounded-xl flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-cyan-500 truncate">{pkg.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">v{pkg.version}</span>
                        </div>
                        <p className="text-[11px] dark:text-slate-400 text-slate-600 line-clamp-2 mt-1">
                          {pkg.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t dark:border-slate-800 border-slate-100">
                        <button
                          onClick={() => launchBrowserSearch(pkg.homepage || pkg.npmUrl)}
                          className="text-[11px] font-semibold text-cyan-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Open Docs
                        </button>
                        <button
                          onClick={() => unpinRegistryPackage(pkg.name)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Remove from Library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* LIVE NPM REGISTRY SEARCH TAB */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-3 dark:bg-slate-900/60 bg-white border-b dark:border-slate-800 border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                searchLiveRegistry(registryQuery);
              }}
              className="max-w-3xl mx-auto flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={registryQuery}
                  onChange={(e) => setRegistryQuery(e.target.value)}
                  placeholder="Search live npm registry (e.g. vite, three, typescript, tailwindcss)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs dark:bg-slate-950 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingRegistry}
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
              >
                {isLoadingRegistry ? 'Querying...' : 'Search Live Registry'}
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {isLoadingRegistry ? (
              <div className="max-w-4xl mx-auto p-8 text-xs font-mono text-cyan-500 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                <span>Querying registry.npmjs.org live package index...</span>
              </div>
            ) : registryError ? (
              <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {registryError}
              </div>
            ) : (
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {registryResults.map((pkg) => {
                  const isPinned = pinnedRegistryApps.some((p) => p.name === pkg.name);
                  return (
                    <div
                      key={pkg.name}
                      className="p-4 dark:bg-slate-900/80 bg-white border dark:border-slate-800 border-slate-200 rounded-xl flex flex-col justify-between space-y-3 shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 truncate">
                            {pkg.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
                            v{pkg.version}
                          </span>
                        </div>
                        <p className="text-xs dark:text-slate-400 text-slate-600 line-clamp-2">
                          {pkg.description}
                        </p>
                        <div className="text-[10px] font-mono text-slate-500">
                          by {pkg.publisher} {pkg.date ? `· ${pkg.date}` : ''} · Score {pkg.score}%
                        </div>
                      </div>

                      <div className="pt-2.5 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => launchBrowserSearch(pkg.homepage || pkg.npmUrl)}
                          className="text-[11px] font-semibold text-cyan-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Read Docs
                        </button>

                        {isPinned ? (
                          <button
                            onClick={() => unpinRegistryPackage(pkg.name)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-lg cursor-pointer"
                          >
                            Saved ✓
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              pinRegistryPackage({
                                name: pkg.name,
                                version: pkg.version,
                                description: pkg.description,
                                homepage: pkg.homepage,
                                npmUrl: pkg.npmUrl,
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Save
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Details Modal */}
      {selectedApp && (
        <div
          onClick={() => setSelectedApp(null)}
          className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedApp.iconBg} flex items-center justify-center text-white shadow-md shrink-0`}>
                  {renderAppIcon(selectedApp)}
                </div>
                <div>
                  <h4 className="text-sm font-bold dark:text-slate-100 text-slate-900">{selectedApp.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] font-mono dark:text-slate-400 text-slate-500 mt-0.5">
                    <span>{selectedApp.category}</span>
                    <span>·</span>
                    <span>v{selectedApp.version}</span>
                    <span>·</span>
                    <span>{selectedApp.size}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 dark:hover:bg-slate-800 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs dark:text-slate-300 text-slate-700 leading-relaxed">
              {selectedApp.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-slate-800 border-slate-200">
              {storeApps.find((a) => a.id === selectedApp.id)?.installed ? (
                <>
                  <button
                    onClick={() => {
                      uninstallStoreApp(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    Uninstall
                  </button>
                  <button
                    onClick={() => {
                      openApp(resolveTargetAppId(selectedApp));
                      setSelectedApp(null);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Launch App
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    installStoreApp(selectedApp.id);
                    setSelectedApp(null);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download &amp; Install
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
