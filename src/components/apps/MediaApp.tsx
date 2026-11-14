import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Film,
  Music,
  Image as ImageIcon,
  Search,
  Download,
  Upload,
  Play,
  Volume2,
  Maximize2,
  ExternalLink,
  Trash2,
  FolderOpen,
  Sparkles,
  Check,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { WALLPAPER_ASSETS } from '../../assets/wallpapers';
import { WallpaperPreset } from '../../types/os';

export interface MediaLibraryItem {
  id: string;
  title: string;
  mediaType: 'image' | 'audio' | 'video';
  mime: string;
  url: string;
  thumbUrl: string | null;
  sizeBytes: number;
  author: string;
  license: string;
  sourceKind: 'local_studio' | 'uploaded' | 'wikimedia';
  wallpaperKey?: WallpaperPreset;
  pageUrl?: string;
}

// Generate a real, playable & downloadable 16-bit PCM WAV Blob in memory (zero network failures)
function buildSynthesizedWavUrl(mode: 'ambient_pad' | 'crystal_pulse'): { url: string; sizeBytes: number } {
  const sampleRate = 22050;
  const durationSec = 6;
  const numSamples = sampleRate * durationSec;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, t / 0.35);
    const fadeOut = Math.min(1, (durationSec - t) / 0.45);
    const env = fadeIn * fadeOut;

    let sample = 0;
    if (mode === 'ambient_pad') {
      const f1 = 220;
      const f2 = 277.18;
      const f3 = 329.63;
      const lfo = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.45 * t);
      sample = (Math.sin(2 * Math.PI * f1 * t) * 0.4 + Math.sin(2 * Math.PI * f2 * t) * 0.3 + Math.sin(2 * Math.PI * f3 * t) * 0.25) * lfo;
    } else {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25];
      const step = Math.floor(t * 2) % notes.length;
      const localT = (t * 2) % 1;
      const pluck = Math.exp(-localT * 5.2);
      const freq = notes[step];
      sample = (Math.sin(2 * Math.PI * freq * t) * 0.55 + Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.3) * pluck;
    }

    const clamped = Math.max(-1, Math.min(1, sample * env * 0.65));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return { url: URL.createObjectURL(blob), sizeBytes: buffer.byteLength };
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Stream';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const MediaApp: React.FC = () => {
  const { addDownload, addNotification, setWallpaper, launchBrowserSearch } = useOS();

  const [activeTab, setActiveTab] = useState<'library' | 'discover' | 'downloads'>('library');
  const [typeFilter, setTypeFilter] = useState<'all' | 'audio' | 'video' | 'image'>('all');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [zoomFull, setZoomFull] = useState<boolean>(false);
  const [wallpaperAppliedId, setWallpaperAppliedId] = useState<string | null>(null);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});

  // Discover Open Media (Wikimedia Commons API)
  const [searchQuery, setSearchQuery] = useState('Apollo space');
  const [discoverType, setDiscoverType] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [discoverResults, setDiscoverResults] = useState<MediaLibraryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);

  // User uploaded / saved items
  const [savedMedia, setSavedMedia] = useState<MediaLibraryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Built-in studio audio WAV & crisp local artwork library
  const studioBuiltins = useMemo<MediaLibraryItem[]>(() => {
    const padWav = buildSynthesizedWavUrl('ambient_pad');
    const pulseWav = buildSynthesizedWavUrl('crystal_pulse');
    return [
      {
        id: 'studio-wav-ambient',
        title: 'Orbital Horizon Ambient Pad.wav',
        mediaType: 'audio',
        mime: 'audio/wav',
        url: padWav.url,
        thumbUrl: WALLPAPER_ASSETS.deep_space,
        sizeBytes: padWav.sizeBytes,
        author: 'Pluto Audio Engine',
        license: 'CC0 Studio',
        sourceKind: 'local_studio',
      },
      {
        id: 'studio-wav-crystal',
        title: 'Crystal Synth Arpeggio Loop.wav',
        mediaType: 'audio',
        mime: 'audio/wav',
        url: pulseWav.url,
        thumbUrl: WALLPAPER_ASSETS.bioluminescent_tides,
        sizeBytes: pulseWav.sizeBytes,
        author: 'Pluto Audio Engine',
        license: 'CC0 Studio',
        sourceKind: 'local_studio',
      },
      {
        id: 'art-deep-space',
        title: 'Deep Space Pluto Orbit Artwork.jpg',
        mediaType: 'image',
        mime: 'image/jpeg',
        url: WALLPAPER_ASSETS.deep_space,
        thumbUrl: WALLPAPER_ASSETS.deep_space,
        sizeBytes: 420 * 1024,
        author: 'Pluto Visual Studio',
        license: 'Built-in Asset',
        sourceKind: 'local_studio',
        wallpaperKey: 'deep_space',
      },
      {
        id: 'art-solar-horizon',
        title: 'Solar Horizon Atmospheric Vista.jpg',
        mediaType: 'image',
        mime: 'image/jpeg',
        url: WALLPAPER_ASSETS.solar_horizon,
        thumbUrl: WALLPAPER_ASSETS.solar_horizon,
        sizeBytes: 390 * 1024,
        author: 'Pluto Visual Studio',
        license: 'Built-in Asset',
        sourceKind: 'local_studio',
        wallpaperKey: 'solar_horizon',
      },
      {
        id: 'art-bioluminescent',
        title: 'Bioluminescent Tides Panorama.jpg',
        mediaType: 'image',
        mime: 'image/jpeg',
        url: WALLPAPER_ASSETS.bioluminescent_tides,
        thumbUrl: WALLPAPER_ASSETS.bioluminescent_tides,
        sizeBytes: 410 * 1024,
        author: 'Pluto Visual Studio',
        license: 'Built-in Asset',
        sourceKind: 'local_studio',
        wallpaperKey: 'bioluminescent_tides',
      },
      {
        id: 'art-daylight-frost',
        title: 'Daylight Alpine Frost Glass.jpg',
        mediaType: 'image',
        mime: 'image/jpeg',
        url: WALLPAPER_ASSETS.daylight_frost,
        thumbUrl: WALLPAPER_ASSETS.daylight_frost,
        sizeBytes: 380 * 1024,
        author: 'Pluto Visual Studio',
        license: 'Built-in Asset',
        sourceKind: 'local_studio',
        wallpaperKey: 'daylight_frost',
      },
    ];
  }, []);

  const combinedLibrary = useMemo(() => [...savedMedia, ...studioBuiltins], [savedMedia, studioBuiltins]);
  const [selectedMedia, setSelectedMedia] = useState<MediaLibraryItem | null>(studioBuiltins[0]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, selectedMedia]);

  const handleSearchOpenMedia = async (queryOverride?: string, typeOverride?: 'all' | 'image' | 'audio' | 'video') => {
    const q = (queryOverride ?? searchQuery).trim() || 'Apollo space';
    const t = typeOverride ?? discoverType;
    setIsSearching(true);
    setSearchNotice(null);

    try {
      const res = await fetch(`/api/media/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(t)}`);
      const data = await res.json();
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const mapped: MediaLibraryItem[] = rawItems.map((it: any) => ({
        id: it.id,
        title: it.title,
        mediaType: it.mediaType,
        mime: it.mime,
        url: it.url,
        thumbUrl: it.thumbUrl || null,
        sizeBytes: it.sizeBytes || 0,
        author: it.author || 'Wikimedia Commons',
        license: it.license || 'Open License',
        sourceKind: 'wikimedia',
        pageUrl: it.pageUrl,
      }));
      setDiscoverResults(mapped);
      if (data.notice) setSearchNotice(data.notice);
      else if (mapped.length === 0) setSearchNotice(`No open-license ${t === 'all' ? 'media' : t} matches found for "${q}".`);
    } catch {
      setSearchNotice('Unable to reach Wikimedia Commons right now. Try local media or file upload.');
      setDiscoverResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discover' && discoverResults.length === 0 && !isSearching) {
      handleSearchOpenMedia(searchQuery, discoverType);
    }
  }, [activeTab]);

  const handleImportLocalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imported: MediaLibraryItem[] = [];
    for (const file of Array.from(files)) {
      const mime = file.type || '';
      const mediaType: MediaLibraryItem['mediaType'] = mime.startsWith('video/')
        ? 'video'
        : mime.startsWith('audio/')
        ? 'audio'
        : 'image';
      const objUrl = URL.createObjectURL(file);
      imported.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: file.name,
        mediaType,
        mime: mime || 'application/octet-stream',
        url: objUrl,
        thumbUrl: mediaType === 'image' ? objUrl : null,
        sizeBytes: file.size,
        author: 'Local File',
        license: 'User Device',
        sourceKind: 'uploaded',
      });
    }

    setSavedMedia((prev) => [...imported, ...prev]);
    if (imported[0]) {
      setSelectedMedia(imported[0]);
      setActiveTab('library');
    }
    addNotification({
      title: 'Local Media Loaded',
      message: `Added ${imported.length} file(s) to Pluto Media Hub.`,
      app: 'Pluto Media Hub',
    });
    e.target.value = '';
  };

  const triggerDownloadFile = (item: MediaLibraryItem) => {
    const cleanFilename = item.title.replace(/[^a-zA-Z0-9._-]/g, '_');
    const isRemote = item.url.startsWith('http://') || item.url.startsWith('https://');
    const href = isRemote
      ? `/api/media/download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(cleanFilename)}`
      : item.url;

    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = cleanFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    addDownload({
      name: cleanFilename,
      totalBytes: item.sizeBytes > 0 ? item.sizeBytes : 2 * 1024 * 1024,
      category: 'media',
      url: item.url,
    });

    if (item.sourceKind === 'wikimedia') {
      setSavedMedia((prev) => (prev.some((m) => m.id === item.id) ? prev : [item, ...prev]));
    }
  };

  const handleApplyWallpaper = (item: MediaLibraryItem) => {
    if (!item.wallpaperKey) return;
    setWallpaper(item.wallpaperKey);
    setWallpaperAppliedId(item.id);
    setTimeout(() => setWallpaperAppliedId(null), 2000);
    addNotification({
      title: 'Wallpaper Updated',
      message: `Applied "${item.title}" to Desktop.`,
      app: 'Pluto Media Hub',
    });
  };

  const filteredLibrary = combinedLibrary.filter((item) =>
    typeFilter === 'all' ? true : item.mediaType === typeFilter
  );

  const renderMediaIcon = (mediaType: MediaLibraryItem['mediaType'], className = 'w-4 h-4') => {
    if (mediaType === 'audio') return <Music className={className} />;
    if (mediaType === 'video') return <Film className={className} />;
    return <ImageIcon className={className} />;
  };

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Top Bar Contract */}
      <div className="px-5 py-3 dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center dark:text-cyan-400 text-cyan-600 shrink-0">
            <Film className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900 truncate">
              Pluto Media Hub
            </h3>
            <div className="flex items-center gap-1.5 text-xs dark:text-slate-400 text-slate-500">
              <span>Audio, Video &amp; Visual Studio</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{combinedLibrary.length} library items</span>
            </div>
          </div>
        </div>

        {/* Navigation Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-200 rounded-lg shrink-0">
          {[
            { id: 'library', label: 'Player & Library' },
            { id: 'discover', label: 'Discover Media' },
            { id: 'downloads', label: `Saved (${savedMedia.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Primary Action: Upload Local Media */}
        <div className="shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*,image/*"
            multiple
            onChange={handleImportLocalFiles}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Media
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* PLAYER STAGE (Visible whenever an item is selected in Library or Saved tab, or user plays from Discover) */}
        {selectedMedia && activeTab !== 'discover' && (
          <div className="max-w-5xl mx-auto border dark:border-slate-800 border-slate-200 dark:bg-slate-900/90 bg-white rounded-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Viewport */}
              <div className="lg:w-3/5 bg-slate-950 flex items-center justify-center min-h-[240px] max-h-[340px] relative overflow-hidden">
                {selectedMedia.mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    key={selectedMedia.url}
                    src={selectedMedia.url}
                    controls
                    className="w-full h-full max-h-[340px] object-contain"
                  />
                ) : selectedMedia.mediaType === 'audio' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4 text-slate-100 relative">
                    {selectedMedia.thumbUrl && !brokenThumbs[selectedMedia.id] && (
                      <img
                        src={selectedMedia.thumbUrl}
                        alt={selectedMedia.title}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenThumbs((p) => ({ ...p, [selectedMedia.id]: true }))}
                        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                      />
                    )}
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                      <Volume2 className="w-8 h-8" />
                    </div>
                    <div className="relative z-10 text-center max-w-md">
                      <h4 className="text-sm font-bold text-white truncate">{selectedMedia.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {selectedMedia.author} · {selectedMedia.mime}
                      </p>
                    </div>
                    <audio
                      ref={audioRef}
                      key={selectedMedia.url}
                      src={selectedMedia.url}
                      controls
                      className="relative z-10 w-full max-w-md"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950 overflow-auto">
                    {!brokenThumbs[selectedMedia.id] ? (
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.title}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenThumbs((p) => ({ ...p, [selectedMedia.id]: true }))}
                        className={
                          zoomFull
                            ? 'max-w-none h-auto'
                            : 'w-full h-full max-h-[340px] object-contain'
                        }
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs">{selectedMedia.title}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Inspector & Controls */}
              <div className="lg:w-2/5 p-5 flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-l dark:border-slate-800 border-slate-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs dark:text-slate-400 text-slate-500 font-mono">
                    {renderMediaIcon(selectedMedia.mediaType, 'w-3.5 h-3.5 text-cyan-500')}
                    <span className="uppercase">{selectedMedia.mediaType}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatBytes(selectedMedia.sizeBytes)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedMedia.license}</span>
                  </div>

                  <h4 className="text-base font-bold dark:text-slate-100 text-slate-900 break-words">
                    {selectedMedia.title}
                  </h4>
                  <p className="text-xs dark:text-slate-400 text-slate-600">
                    Source: {selectedMedia.author} ({selectedMedia.mime})
                  </p>

                  {(selectedMedia.mediaType === 'audio' || selectedMedia.mediaType === 'video') && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-xs font-medium dark:text-slate-400 text-slate-600 block">
                        Playback Speed
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[0.75, 1, 1.25, 1.5].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => setPlaybackSpeed(spd)}
                            className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md border transition-colors cursor-pointer ${
                              playbackSpeed === spd
                                ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-semibold'
                                : 'dark:bg-slate-950 bg-slate-100 dark:border-slate-700 border-slate-300 dark:text-slate-300 text-slate-700'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMedia.mediaType === 'image' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => setZoomFull((z) => !z)}
                        className="px-3 py-1.5 text-xs font-medium dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        {zoomFull ? 'Fit to Frame' : 'Actual Size'}
                      </button>

                      {selectedMedia.wallpaperKey && (
                        <button
                          onClick={() => handleApplyWallpaper(selectedMedia)}
                          className="px-3 py-1.5 text-xs font-medium dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          {wallpaperAppliedId === selectedMedia.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              Applied
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                              Set Desktop Wallpaper
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t dark:border-slate-800 border-slate-200">
                  <button
                    onClick={() => triggerDownloadFile(selectedMedia)}
                    className="flex-1 px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Media File
                  </button>

                  {selectedMedia.pageUrl && (
                    <button
                      onClick={() => launchBrowserSearch(selectedMedia.pageUrl!)}
                      title="Open Source Page"
                      className="px-3 py-2 text-xs font-medium dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: PLAYER & LIBRARY */}
        {activeTab === 'library' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Media' },
                  { id: 'audio', label: 'Audio' },
                  { id: 'video', label: 'Video' },
                  { id: 'image', label: 'Images' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTypeFilter(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      typeFilter === f.id
                        ? 'bg-cyan-500 text-slate-950'
                        : 'dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('discover')}
                className="text-xs font-semibold text-cyan-500 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Browse Open Wikimedia Media
              </button>
            </div>

            {filteredLibrary.length === 0 ? (
              <div className="p-8 text-center border dark:border-slate-800 border-slate-200 dark:bg-slate-900/50 bg-white rounded-xl space-y-3">
                <FolderOpen className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs dark:text-slate-400 text-slate-600">
                  No {typeFilter === 'all' ? '' : `${typeFilter} `}items in your local library yet.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setDiscoverType(typeFilter);
                      setActiveTab('discover');
                      handleSearchOpenMedia(searchQuery, typeFilter);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg cursor-pointer"
                  >
                    Search Open Media
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg cursor-pointer"
                  >
                    Import Local File
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredLibrary.map((item) => {
                  const isActive = selectedMedia?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      className={`border rounded-xl overflow-hidden flex flex-col justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'border-cyan-500 dark:bg-slate-900 bg-white'
                          : 'dark:border-slate-800 border-slate-200 dark:bg-slate-900/60 bg-white hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="h-32 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                        {item.thumbUrl && !brokenThumbs[item.id] ? (
                          <img
                            src={item.thumbUrl}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            onError={() => setBrokenThumbs((p) => ({ ...p, [item.id]: true }))}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                            {renderMediaIcon(item.mediaType, 'w-7 h-7 text-cyan-400')}
                            <span className="text-[11px] font-mono uppercase">{item.mediaType}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white font-mono">
                          <span className="uppercase">{item.mediaType}</span>
                          <span className="tabular-nums">{formatBytes(item.sizeBytes)}</span>
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2">
                        <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <div className="text-[11px] dark:text-slate-400 text-slate-500 truncate">
                          {item.author} · {item.license}
                        </div>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-2 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between gap-2"
                        >
                          <button
                            onClick={() => setSelectedMedia(item)}
                            className="px-2.5 py-1 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:text-cyan-400 text-cyan-600 rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            Play
                          </button>
                          <button
                            onClick={() => triggerDownloadFile(item)}
                            className="px-2.5 py-1 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISCOVER LIVE OPEN MEDIA (Wikimedia Commons) */}
        {activeTab === 'discover' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchOpenMedia();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search open-license images, audio, and video (e.g. Apollo space, synthesizer, orchestra, aurora)..."
                  className="w-full pl-9 pr-3 py-2 text-xs dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-lg shrink-0">
                {(['all', 'image', 'audio', 'video'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setDiscoverType(t);
                      handleSearchOpenMedia(searchQuery, t);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-colors cursor-pointer ${
                      discoverType === t
                        ? 'bg-cyan-500 text-slate-950'
                        : 'dark:text-slate-400 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Search Media'}
              </button>
            </form>

            {/* Quick Suggested Queries */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="dark:text-slate-400 text-slate-500">Suggested:</span>
              {[
                { label: 'Apollo Space', q: 'Apollo space', t: 'all' as const },
                { label: 'Classical Audio', q: 'Bach orchestra', t: 'audio' as const },
                { label: 'ISS Earth Video', q: 'International Space Station timelapse', t: 'video' as const },
                { label: 'Aurora Borealis', q: 'Aurora borealis', t: 'image' as const },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setSearchQuery(preset.q);
                    setDiscoverType(preset.t);
                    handleSearchOpenMedia(preset.q, preset.t);
                  }}
                  className="px-2.5 py-1 dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 hover:border-cyan-500 rounded-md text-xs dark:text-slate-300 text-slate-700 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {searchNotice && (
              <div className="p-3 rounded-lg border dark:border-slate-800 border-slate-200 dark:bg-slate-900/60 bg-white text-xs dark:text-slate-300 text-slate-700">
                {searchNotice}
              </div>
            )}

            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-56 rounded-xl border dark:border-slate-800 border-slate-200 dark:bg-slate-900/40 bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {discoverResults.map((item) => (
                  <div
                    key={item.id}
                    className="border dark:border-slate-800 border-slate-200 dark:bg-slate-900/80 bg-white rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-36 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      {item.thumbUrl && !brokenThumbs[item.id] ? (
                        <img
                          src={item.thumbUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          onError={() => setBrokenThumbs((p) => ({ ...p, [item.id]: true }))}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                          {renderMediaIcon(item.mediaType, 'w-7 h-7 text-cyan-400')}
                          <span className="text-[11px] font-mono uppercase">{item.mime}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white font-mono">
                        <span className="uppercase">{item.mediaType}</span>
                        <span className="tabular-nums">{formatBytes(item.sizeBytes)}</span>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      <div>
                        <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] dark:text-slate-400 text-slate-500 truncate mt-0.5">
                          {item.author} · {item.license}
                        </p>
                      </div>

                      <div className="pt-2 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSavedMedia((prev) => (prev.some((m) => m.id === item.id) ? prev : [item, ...prev]));
                            setSelectedMedia(item);
                            setActiveTab('library');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:text-cyan-400 text-cyan-600 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          Play
                        </button>

                        <button
                          onClick={() => triggerDownloadFile(item)}
                          className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED / UPLOADED DOWNLOADS */}
        {activeTab === 'downloads' && (
          <div className="max-w-5xl mx-auto space-y-3">
            {savedMedia.length === 0 ? (
              <div className="p-8 text-center border dark:border-slate-800 border-slate-200 dark:bg-slate-900/50 bg-white rounded-xl space-y-3">
                <Download className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs dark:text-slate-400 text-slate-600">
                  Downloaded media from Wikimedia Commons or imported local files will appear here.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg cursor-pointer"
                  >
                    Discover Open Media
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg cursor-pointer"
                  >
                    Import Local Media
                  </button>
                </div>
              </div>
            ) : (
              <div className="border dark:border-slate-800 border-slate-200 rounded-xl overflow-hidden dark:bg-slate-900/70 bg-white divide-y dark:divide-slate-800 divide-slate-200">
                {savedMedia.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg dark:bg-slate-800 bg-slate-100 flex items-center justify-center text-cyan-500 shrink-0">
                        {renderMediaIcon(item.mediaType, 'w-4 h-4')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold dark:text-slate-100 text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-mono dark:text-slate-400 text-slate-500">
                          {item.mediaType.toUpperCase()} · {formatBytes(item.sizeBytes)} · {item.author}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedMedia(item);
                          setActiveTab('library');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:text-cyan-400 text-cyan-600 rounded-md cursor-pointer"
                      >
                        Play
                      </button>
                      <button
                        onClick={() => triggerDownloadFile(item)}
                        className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md cursor-pointer"
                      >
                        Save File
                      </button>
                      <button
                        onClick={() => setSavedMedia((prev) => prev.filter((m) => m.id !== item.id))}
                        title="Remove from list"
                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
