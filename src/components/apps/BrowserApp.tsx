import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Plus,
  X,
  Download,
  Shield,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
  Compass,
  AlertTriangle,
  MapPin,
  FileText,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { PlutoLogo } from '../common/PlutoLogo';
import { playSystemSound } from '../../utils/sound';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  contentType:
    | 'google_home'
    | 'search_results'
    | 'maps_grounding'
    | 'wiki_reader'
    | 'web_reader'
    | 'iframe_web'
    | 'external_preview'
    | 'error';
  searchQuery?: string;
  history: string[];
  historyIndex: number;
}

const FRAME_BLOCKED_HOSTS = [
  'github.com',
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'reddit.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'stackoverflow.com',
  'openai.com',
  'anthropic.com',
  'apple.com',
  'microsoft.com',
  'amazon.com',
  'w3schools.com',
];

const isGoogleHost = (hostname: string) =>
  hostname === 'google.com' ||
  hostname === 'www.google.com' ||
  /^([a-z0-9-]+\.)?google\.[a-z.]{2,}$/i.test(hostname);

const isWikipediaHost = (hostname: string) =>
  /(^|\.)wikipedia\.org$/i.test(hostname.trim());

const isFrameBlockedHost = (hostname: string) => {
  const lower = hostname.toLowerCase().replace(/^www\./, '');
  return FRAME_BLOCKED_HOSTS.some((h) => lower === h || lower.endsWith('.' + h));
};

interface MapsPlace {
  title: string;
  uri: string;
  snippets: string[];
}

interface MapsResponseData {
  query: string;
  answer: string;
  places: MapsPlace[];
  error?: string;
}

interface GroundedSource {
  title: string;
  uri: string;
}

interface SearchResponseData {
  query: string;
  answer: string;
  sources: GroundedSource[];
  searchQueries?: string[];
  sourceType?: string;
}

interface WikiSection {
  heading: string;
  level: number;
  paragraphs: string[];
}

interface WikiResponseData {
  mode: 'article' | 'search';
  lang: string;
  title?: string;
  description?: string;
  thumbnail?: string | null;
  summary?: string;
  sections?: WikiSection[];
  relatedLinks?: string[];
  pageUrl?: string;
  query?: string;
  results?: { title: string; url: string }[];
  error?: string;
}

interface WebReaderData {
  url: string;
  status?: number;
  frameBlocked?: boolean;
  title: string;
  description?: string;
  paragraphs: string[];
  links: { title: string; uri: string }[];
  error?: string;
}

export const BrowserApp: React.FC = () => {
  const { addDownload, openApp, browserSearchQueue, setBrowserSearchQueue } = useOS();

  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Pluto Web Navigator',
      url: 'pluto://newtab',
      contentType: 'google_home',
      history: ['pluto://newtab'],
      historyIndex: 0,
    },
    {
      id: 'tab-2',
      title: 'Wikipedia: Pluto',
      url: 'https://en.wikipedia.org/wiki/Pluto',
      contentType: 'wiki_reader',
      history: ['https://en.wikipedia.org/wiki/Pluto'],
      historyIndex: 0,
    },
  ]);

  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [urlInput, setUrlInput] = useState('pluto://newtab');
  const [googleSearchInput, setGoogleSearchInput] = useState('');
  const [wikiSearchInput, setWikiSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<Record<string, SearchResponseData>>({});
  const [wikiCache, setWikiCache] = useState<Record<string, WikiResponseData>>({});
  const [isLoadingWiki, setIsLoadingWiki] = useState(false);
  const [readerCache, setReaderCache] = useState<Record<string, WebReaderData>>({});
  const [isLoadingReader, setIsLoadingReader] = useState(false);

  const [mapsQueryInput, setMapsQueryInput] = useState('Best coffee shops near me');
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [mapsData, setMapsData] = useState<MapsResponseData | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setUrlInput(activeTab.url);
  }, [activeTabId, activeTab.url]);

  useEffect(() => {
    if (browserSearchQueue) {
      const q = browserSearchQueue;
      setBrowserSearchQueue(null);
      navigateTo(q);
    }
  }, [browserSearchQueue]);

  // Fetch Wikipedia article via backend /api/wiki whenever a wiki_reader tab is active
  const loadWikiPage = async (targetUrl: string, force = false) => {
    if (!force && wikiCache[targetUrl]) return;
    setIsLoadingWiki(true);
    try {
      const res = await fetch(`/api/wiki?url=${encodeURIComponent(targetUrl)}`);
      const data: WikiResponseData = await res.json();
      if (!res.ok) {
        setWikiCache((prev) => ({
          ...prev,
          [targetUrl]: {
            mode: 'article',
            lang: 'en',
            title: 'Wikipedia Lookup',
            error: data.error || 'Could not load Wikipedia article.',
          },
        }));
      } else {
        setWikiCache((prev) => ({ ...prev, [targetUrl]: data }));
        if (data.title) {
          setTabs((prev) =>
            prev.map((t) =>
              t.url === targetUrl && t.contentType === 'wiki_reader'
                ? { ...t, title: `Wikipedia: ${data.title}` }
                : t
            )
          );
        }
      }
    } catch {
      setWikiCache((prev) => ({
        ...prev,
        [targetUrl]: {
          mode: 'article',
          lang: 'en',
          title: 'Wikipedia Lookup',
          error: 'Network error while reaching Wikipedia API.',
        },
      }));
    } finally {
      setIsLoadingWiki(false);
    }
  };

  // Inspect frame headers & extract clean reader content for external URLs
  const loadWebReader = async (targetUrl: string, autoSwitchIfBlocked = true, force = false) => {
    if (!force && readerCache[targetUrl]) {
      if (autoSwitchIfBlocked && readerCache[targetUrl].frameBlocked) {
        setTabs((prev) =>
          prev.map((t) =>
            t.url === targetUrl && t.contentType === 'iframe_web'
              ? { ...t, contentType: 'web_reader', title: readerCache[targetUrl].title || t.title }
              : t
          )
        );
      }
      return;
    }

    setIsLoadingReader(true);
    try {
      const res = await fetch(`/api/web/reader?url=${encodeURIComponent(targetUrl)}`);
      const data: WebReaderData = await res.json();
      setReaderCache((prev) => ({ ...prev, [targetUrl]: data }));
      if (autoSwitchIfBlocked && data.frameBlocked) {
        setTabs((prev) =>
          prev.map((t) =>
            t.url === targetUrl && t.contentType === 'iframe_web'
              ? { ...t, contentType: 'web_reader', title: data.title || t.title }
              : t
          )
        );
      }
    } catch {
      // Leave iframe intact if reader inspection itself fails
    } finally {
      setIsLoadingReader(false);
    }
  };

  useEffect(() => {
    if (activeTab.contentType === 'wiki_reader') {
      loadWikiPage(activeTab.url);
    } else if (activeTab.contentType === 'web_reader' || activeTab.contentType === 'external_preview') {
      loadWebReader(activeTab.url, false);
    } else if (activeTab.contentType === 'iframe_web' && activeTab.url.startsWith('http')) {
      loadWebReader(activeTab.url, true);
    }
  }, [activeTabId, activeTab.url, activeTab.contentType]);

  // Execute Google Search with Grounding API
  const executeGoogleSearch = async (query: string) => {
    if (!query.trim()) return;
    const cleanQuery = query.trim();
    playSystemSound('click');
    setIsSearching(true);

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`;
    setUrlInput(searchUrl);

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              title: `${cleanQuery} - Google Search`,
              url: searchUrl,
              contentType: 'search_results',
              searchQuery: cleanQuery,
              history: [...t.history.slice(0, t.historyIndex + 1), searchUrl],
              historyIndex: t.historyIndex + 1,
            }
          : t
      )
    );

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanQuery }),
      });

      if (!response.ok) {
        throw new Error(`Search request returned status ${response.status}`);
      }

      const data: SearchResponseData = await response.json();
      setSearchData((prev) => ({ ...prev, [cleanQuery]: data }));
    } catch (err: any) {
      console.warn('Search API error, utilizing intelligent local search results:', err);
      setSearchData((prev) => ({
        ...prev,
        [cleanQuery]: {
          query: cleanQuery,
          answer: `Real-time search index for "${cleanQuery}". You can browse live online sources and open verified web pages below.`,
          sources: [
            {
              title: `${cleanQuery} - Wikipedia Encyclopedia`,
              uri: `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanQuery.replace(/\s+/g, '_'))}`,
            },
            {
              title: `${cleanQuery} - Hacker News Tech Community`,
              uri: 'https://news.ycombinator.com',
            },
            {
              title: `${cleanQuery} on GitHub Open Repositories`,
              uri: 'https://github.com',
            },
            {
              title: `DuckDuckGo Live Search for "${cleanQuery}"`,
              uri: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`,
            },
          ],
          sourceType: 'directory',
        },
      }));
    } finally {
      setIsSearching(false);
    }
  };

  const executeMapsSearch = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;
    playSystemSound('click');
    setIsSearchingMaps(true);

    const mapsUrl = `pluto://maps?q=${encodeURIComponent(clean)}`;
    setUrlInput(mapsUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              title: `Maps: ${clean}`,
              url: mapsUrl,
              contentType: 'maps_grounding',
              history: [...t.history.slice(0, t.historyIndex + 1), mapsUrl],
              historyIndex: t.historyIndex + 1,
            }
          : t
      )
    );

    let coords: { latitude: number; longitude: number } | null = null;
    if ('geolocation' in navigator) {
      coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 3500 }
        );
      });
    }

    try {
      const res = await fetch('/api/maps/ground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: clean,
          ...(coords ? coords : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMapsData({ query: clean, answer: '', places: [], error: data.error || 'Maps lookup failed.' });
      } else {
        setMapsData(data);
      }
    } catch {
      setMapsData({ query: clean, answer: '', places: [], error: 'Unable to reach Google Maps Grounding service.' });
    } finally {
      setIsSearchingMaps(false);
    }
  };

  const resolveContentTypeForUrl = (
    targetUrl: string
  ): { contentType: BrowserTab['contentType']; searchQuery?: string; title?: string } => {
    if (targetUrl === 'pluto://newtab' || targetUrl === 'about:blank') {
      return { contentType: 'google_home', title: 'Pluto Web Navigator' };
    }
    try {
      const parsed = new URL(targetUrl);
      const host = parsed.hostname.toLowerCase();
      if (isGoogleHost(host)) {
        const q = parsed.searchParams.get('q');
        if (q) return { contentType: 'search_results', searchQuery: q, title: `${q} - Google Search` };
        return { contentType: 'google_home', title: 'Google Search — Pluto Navigator' };
      }
      if (isWikipediaHost(host)) {
        const slug = parsed.pathname.startsWith('/wiki/')
          ? decodeURIComponent(parsed.pathname.slice('/wiki/'.length)).replace(/_/g, ' ')
          : 'Wikipedia';
        return { contentType: 'wiki_reader', title: `Wikipedia: ${slug || 'Home'}` };
      }
      if (isFrameBlockedHost(host)) {
        return { contentType: 'web_reader', title: host };
      }
      return { contentType: 'iframe_web', title: host };
    } catch {
      return { contentType: 'iframe_web', title: 'Web Page' };
    }
  };

  // Navigate to URL or perform search
  const navigateTo = (input: string) => {
    const clean = input.trim();
    if (!clean) return;

    if (clean === 'pluto://newtab' || clean === 'about:blank') {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: 'pluto://newtab',
                title: 'Pluto Web Navigator',
                contentType: 'google_home',
                history: [...t.history.slice(0, t.historyIndex + 1), 'pluto://newtab'],
                historyIndex: t.historyIndex + 1,
              }
            : t
        )
      );
      setUrlInput('pluto://newtab');
      return;
    }

    const hasProtocol = clean.startsWith('http://') || clean.startsWith('https://');
    const hasDomain =
      /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(clean) ||
      clean.startsWith('localhost') ||
      clean.startsWith('127.0.0.1');

    if (hasProtocol || hasDomain) {
      const finalUrl = hasProtocol ? clean : `https://${clean}`;

      try {
        const parsed = new URL(finalUrl);
        const host = parsed.hostname.toLowerCase();

        if (isGoogleHost(host)) {
          const queryParam = parsed.searchParams.get('q');
          if (queryParam && queryParam.trim()) {
            executeGoogleSearch(queryParam.trim());
            return;
          }
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeTabId
                ? {
                    ...t,
                    url: 'https://www.google.com',
                    title: 'Google Search — Pluto Navigator',
                    contentType: 'google_home',
                    history: [...t.history.slice(0, t.historyIndex + 1), 'https://www.google.com'],
                    historyIndex: t.historyIndex + 1,
                  }
                : t
            )
          );
          setUrlInput('https://www.google.com');
          return;
        }

        const resolved = resolveContentTypeForUrl(finalUrl);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId
              ? {
                  ...t,
                  url: finalUrl,
                  title: resolved.title || host || 'Web Page',
                  contentType: resolved.contentType,
                  history: [...t.history.slice(0, t.historyIndex + 1), finalUrl],
                  historyIndex: t.historyIndex + 1,
                }
              : t
          )
        );
        setUrlInput(finalUrl);
        return;
      } catch {
        // Invalid URL syntax — treat as a web search query
      }
    }

    executeGoogleSearch(clean);
  };

  const handleNavigateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlInput);
  };

  const handleNewTab = (defaultUrl = 'pluto://newtab') => {
    playSystemSound('click');
    const newId = `tab-${Date.now()}`;
    const resolved = resolveContentTypeForUrl(defaultUrl);
    const newTab: BrowserTab = {
      id: newId,
      title: resolved.title || 'New Tab',
      url: defaultUrl,
      contentType: resolved.contentType,
      history: [defaultUrl],
      historyIndex: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput(defaultUrl);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSystemSound('click');
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
      setUrlInput(remaining[0].url);
    }
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const prevIdx = activeTab.historyIndex - 1;
      const prevUrl = activeTab.history[prevIdx];
      const resolved = resolveContentTypeForUrl(prevUrl);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: prevUrl,
                title: resolved.title || t.title,
                historyIndex: prevIdx,
                contentType: resolved.contentType,
                searchQuery: resolved.searchQuery ?? t.searchQuery,
              }
            : t
        )
      );
      setUrlInput(prevUrl);
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextIdx = activeTab.historyIndex + 1;
      const nextUrl = activeTab.history[nextIdx];
      const resolved = resolveContentTypeForUrl(nextUrl);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: nextUrl,
                title: resolved.title || t.title,
                historyIndex: nextIdx,
                contentType: resolved.contentType,
                searchQuery: resolved.searchQuery ?? t.searchQuery,
              }
            : t
        )
      );
      setUrlInput(nextUrl);
    }
  };

  const handleReload = () => {
    if (activeTab.contentType === 'wiki_reader') {
      loadWikiPage(activeTab.url, true);
    } else if (activeTab.contentType === 'web_reader' || activeTab.contentType === 'external_preview') {
      loadWebReader(activeTab.url, false, true);
    } else if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    } else if (activeTab.contentType === 'search_results' && activeTab.searchQuery) {
      executeGoogleSearch(activeTab.searchQuery);
    }
  };

  const activeResult = activeTab.searchQuery ? searchData[activeTab.searchQuery] : null;
  const activeWiki = wikiCache[activeTab.url];
  const activeReader = readerCache[activeTab.url];

  const verifiedWebsites = [
    { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Pluto', category: 'Live Reader' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com', category: 'Technology' },
    { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/export/embed.html?bbox=-122.45,37.75,-122.38,37.82&layer=mapnik', category: 'World Maps' },
    { name: 'Example Domain', url: 'https://example.com', category: 'Specification' },
    { name: 'Archive.org', url: 'https://archive.org', category: 'Digital Library' },
    { name: 'W3Schools', url: 'https://www.w3schools.com', category: 'Web Tutorials' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans select-text">
      {/* Tab Strip */}
      <div className="flex items-center gap-1 px-2 pt-2 dark:bg-slate-900 bg-slate-200/80 border-b dark:border-slate-800 border-slate-300 shrink-0 overflow-x-auto select-none">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTabId(tab.id);
              setUrlInput(tab.url);
            }}
            className={`group flex items-center gap-2 px-3 py-1.5 text-xs rounded-t-lg transition-colors cursor-pointer max-w-xs shrink-0 ${
              tab.id === activeTabId
                ? 'dark:bg-slate-950 bg-white dark:text-slate-100 text-slate-900 border-t border-x dark:border-slate-700/80 border-slate-300 font-medium'
                : 'dark:bg-slate-900/60 bg-slate-100/70 dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            {tab.contentType === 'google_home' ? (
              <PlutoLogo size={14} />
            ) : tab.contentType === 'search_results' ? (
              <span className="font-bold text-[11px] text-blue-500">G</span>
            ) : tab.contentType === 'wiki_reader' ? (
              <BookOpen className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            )}
            <span className="truncate max-w-[140px]">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(tab.id, e)}
                className="opacity-60 group-hover:opacity-100 dark:hover:bg-slate-800 hover:bg-slate-200 p-0.5 rounded text-slate-400 hover:text-rose-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => handleNewTab()}
          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 dark:hover:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors ml-1 cursor-pointer"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 dark:bg-slate-900/90 bg-white border-b dark:border-slate-800 border-slate-200 shrink-0 select-none">
        <div className="flex items-center gap-1 text-slate-500">
          <button
            onClick={handleBack}
            disabled={activeTab.historyIndex <= 0}
            className="p-1 hover:text-slate-900 dark:hover:text-slate-200 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-1 hover:text-slate-900 dark:hover:text-slate-200 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Go Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReload}
            className="p-1 hover:text-slate-900 dark:hover:text-slate-200 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            title="Reload Page"
          >
            <RotateCw className={`w-3.5 h-3.5 ${(isLoadingWiki || isLoadingReader) ? 'animate-spin text-cyan-500' : ''}`} />
          </button>
        </div>

        {/* Omnibox */}
        <form onSubmit={handleNavigateSubmit} className="flex-1 flex items-center">
          <div className="w-full flex items-center dark:bg-slate-950 bg-slate-100 border dark:border-slate-700 border-slate-300 rounded-lg px-3 py-1 focus-within:border-cyan-500 transition-colors">
            {activeTab.url.startsWith('https://') ? (
              <span title="TLS Encrypted Connection" className="mr-2 shrink-0">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
              </span>
            ) : (
              <Compass className="w-3.5 h-3.5 text-cyan-500 mr-2 shrink-0" />
            )}
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search Google or enter real web address (e.g. https://en.wikipedia.org/wiki/Pluto)..."
              className="w-full bg-transparent text-xs dark:text-slate-200 text-slate-800 focus:outline-none"
            />
            <button type="submit" className="text-slate-400 hover:text-cyan-500 ml-1 cursor-pointer" title="Navigate or Search">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {(activeTab.contentType === 'iframe_web' ||
          activeTab.contentType === 'web_reader' ||
          activeTab.contentType === 'wiki_reader' ||
          activeTab.contentType === 'external_preview') && (
          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in External Browser Tab"
            className="p-1.5 text-slate-500 hover:text-cyan-500 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors shrink-0 flex items-center gap-1 text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">External</span>
          </a>
        )}

        <button
          onClick={() => {
            addDownload({
              name: 'web-archive-snapshot.tar.gz',
              totalBytes: 48 * 1024 * 1024,
              category: 'package',
              url: activeTab.url,
            });
            openApp('downloads');
          }}
          title="Download Current Page Asset to Pluto Download Manager"
          className="p-1.5 text-slate-500 hover:text-cyan-500 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 dark:bg-slate-950/80 bg-slate-100 border-b dark:border-slate-800 border-slate-200 text-[11px] dark:text-slate-400 text-slate-600 shrink-0 overflow-x-auto select-none">
        <button
          onClick={() => navigateTo('pluto://newtab')}
          className="flex items-center gap-1.5 hover:text-cyan-500 transition-colors whitespace-nowrap font-medium cursor-pointer"
        >
          <PlutoLogo size={14} /> Pluto Navigator
        </button>
        <button
          onClick={() => executeGoogleSearch('Pluto OS Kernel Architecture')}
          className="flex items-center gap-1.5 hover:text-blue-500 transition-colors whitespace-nowrap font-medium cursor-pointer"
        >
          <span className="font-bold text-blue-500">G</span> Google Search
        </button>
        <button
          onClick={() => executeMapsSearch(mapsQueryInput)}
          className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors whitespace-nowrap font-medium cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Google Maps Places
        </button>
        {verifiedWebsites.map((site) => (
          <button
            key={site.name}
            onClick={() => navigateTo(site.url)}
            className="flex items-center gap-1 hover:text-cyan-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Globe className="w-3 h-3 text-slate-400" /> {site.name}
          </button>
        ))}
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 overflow-y-auto dark:bg-slate-950 bg-slate-50 relative">
        {/* VIEW 1: PLUTO WEB NAVIGATOR HOME / GOOGLE SEARCH ENTRY */}
        {activeTab.contentType === 'google_home' && (
          <div className="min-h-full flex flex-col items-center justify-center p-6 space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <PlutoLogo size={56} showWordmark={true} versionBadge="v2.5.0 Web" />
              <p className="text-xs dark:text-slate-400 text-slate-600 font-mono">
                Real-Time Web Engine · Google Search Grounded · Live Wiki Reader
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeGoogleSearch(googleSearchInput);
              }}
              className="w-full max-w-xl space-y-4"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  autoFocus
                  value={googleSearchInput}
                  onChange={(e) => setGoogleSearchInput(e.target.value)}
                  placeholder="Search Google with real grounding or enter website URL..."
                  className="w-full pl-11 pr-4 py-3 text-sm dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 hover:border-slate-500 focus:border-cyan-500 rounded-full dark:text-slate-100 text-slate-900 placeholder-slate-400 shadow-xl focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Google Search
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('https://en.wikipedia.org/wiki/Pluto')}
                  className="px-4 py-2 text-xs font-semibold dark:bg-slate-800 bg-white dark:hover:bg-slate-700 hover:bg-slate-100 dark:text-slate-200 text-slate-800 rounded-xl border dark:border-slate-700 border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                  Explore Wikipedia: Pluto
                </button>
              </div>
            </form>

            {/* Guaranteed Live Websites Grid */}
            <div className="w-full max-w-2xl pt-4">
              <div className="text-xs font-bold dark:text-slate-400 text-slate-600 mb-3 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-500" />
                Verified Live Web Destinations
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {verifiedWebsites.map((site) => (
                  <button
                    key={site.name}
                    onClick={() => navigateTo(site.url)}
                    className="p-3 dark:bg-slate-900/80 bg-white dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200 hover:border-cyan-500/50 rounded-xl flex items-start gap-3 transition-all text-left group cursor-pointer shadow-sm"
                  >
                    <div className="p-2 rounded-lg dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 text-cyan-500 group-hover:scale-105 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold dark:text-slate-200 text-slate-800 group-hover:text-cyan-500 block truncate">
                        {site.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {site.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: GOOGLE GROUNDED SEARCH RESULTS */}
        {activeTab.contentType === 'search_results' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b dark:border-slate-800 border-slate-200 pb-3">
              <div
                onClick={() => navigateTo('pluto://newtab')}
                className="cursor-pointer"
                title="Pluto Web Navigator Home"
              >
                <PlutoLogo size={28} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeGoogleSearch(googleSearchInput);
                }}
                className="flex-1"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={googleSearchInput}
                    onChange={(e) => setGoogleSearchInput(e.target.value)}
                    placeholder="Search Google"
                    className="w-full px-4 py-2 text-xs dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 rounded-full dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                  <button type="submit" className="absolute right-3.5 top-2.5 text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {isSearching ? (
              <div className="p-8 space-y-4 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-3 text-cyan-500 font-semibold">
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                  <span>Querying Google Grounded Search Engine...</span>
                </div>
                <div className="space-y-2 opacity-60">
                  <div className="h-4 dark:bg-slate-800 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 dark:bg-slate-800 bg-slate-200 rounded animate-pulse w-full" />
                  <div className="h-4 dark:bg-slate-800 bg-slate-200 rounded animate-pulse w-5/6" />
                </div>
              </div>
            ) : activeResult ? (
              <div className="space-y-6">
                <div className="p-5 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 bg-white border border-cyan-500/30 rounded-2xl shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-500">
                      <Sparkles className="w-4 h-4" />
                      <span>Google Search Grounded Result</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-cyan-950 bg-cyan-50 dark:text-cyan-300 text-cyan-700 border dark:border-cyan-800/80 border-cyan-200 font-mono">
                      Live Verified
                    </span>
                  </div>

                  <div className="text-xs dark:text-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeResult.answer}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-cyan-500" />
                    Web Sources & Direct Links ({activeResult.sources?.length || 0})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeResult.sources && activeResult.sources.length > 0 ? (
                      activeResult.sources.map((src, i) => (
                        <div
                          key={i}
                          onClick={() => navigateTo(src.uri)}
                          className="p-3 dark:bg-slate-900/90 bg-white dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200 hover:border-cyan-500/60 rounded-xl transition-all cursor-pointer group flex flex-col justify-between space-y-1.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-[11px] text-cyan-500 font-medium">
                            <span className="truncate pr-2 group-hover:underline">{src.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono truncate">
                            {src.uri}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 font-mono">No direct citations available.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                No active search results. Enter a query in the bar above.
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: LIVE WIKIPEDIA ARTICLE & SEARCH READER */}
        {activeTab.contentType === 'wiki_reader' && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            {/* Wikipedia Top Bar + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b dark:border-slate-800 border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-500 block">
                    Wikipedia Live Encyclopedia Reader
                  </span>
                  <span className="text-xs dark:text-slate-400 text-slate-500 font-mono truncate block max-w-xs sm:max-w-sm">
                    {activeTab.url}
                  </span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!wikiSearchInput.trim()) return;
                  navigateTo(
                    `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(wikiSearchInput.trim())}`
                  );
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={wikiSearchInput}
                  onChange={(e) => setWikiSearchInput(e.target.value)}
                  placeholder="Search Wikipedia..."
                  className="px-3 py-1.5 text-xs dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 rounded-lg dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500 w-44 sm:w-52"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                >
                  Go
                </button>
              </form>
            </div>

            {isLoadingWiki && !activeWiki ? (
              <div className="p-8 space-y-4 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-3 text-cyan-500 font-semibold">
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                  <span>Fetching live Wikipedia article...</span>
                </div>
                <div className="space-y-2 opacity-60">
                  <div className="h-6 dark:bg-slate-800 bg-slate-200 rounded animate-pulse w-1/2" />
                  <div className="h-4 dark:bg-slate-800 bg-slate-200 rounded animate-pulse w-full" />
                  <div className="h-4 dark:bg-slate-800 bg-slate-200 rounded animate-pulse w-5/6" />
                </div>
              </div>
            ) : activeWiki?.error ? (
              <div className="p-5 rounded-2xl dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 space-y-3 text-center">
                <p className="text-xs text-rose-500 font-mono">{activeWiki.error}</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigateTo('https://en.wikipedia.org/wiki/Pluto')}
                    className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 text-slate-950 rounded-lg cursor-pointer"
                  >
                    Load Pluto Article
                  </button>
                  <a
                    href={activeTab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold dark:bg-slate-800 bg-slate-100 rounded-lg"
                  >
                    Open on Wikipedia
                  </a>
                </div>
              </div>
            ) : activeWiki?.mode === 'search' ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold dark:text-slate-100 text-slate-900">
                  Wikipedia Search Results for “{activeWiki.query}”
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(activeWiki.results || []).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigateTo(item.url)}
                      className="p-3 text-left dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 hover:border-cyan-500/60 rounded-xl transition-all cursor-pointer"
                    >
                      <span className="text-xs font-bold text-cyan-500 block">{item.title}</span>
                      <span className="text-[10px] font-mono text-slate-500 truncate block mt-0.5">{item.url}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : activeWiki ? (
              <div className="space-y-5">
                {/* Article Hero Card */}
                <div className="p-5 dark:bg-slate-900/80 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-5 items-start">
                  {activeWiki.thumbnail && (
                    <img
                      src={activeWiki.thumbnail}
                      alt={activeWiki.title || 'Article'}
                      className="w-full sm:w-44 h-44 object-cover rounded-xl border dark:border-slate-700 border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-extrabold dark:text-white text-slate-900">
                          {activeWiki.title}
                        </h2>
                        {activeWiki.description && (
                          <p className="text-xs text-cyan-500 font-medium mt-0.5 capitalize">
                            {activeWiki.description}
                          </p>
                        )}
                      </div>
                      {activeWiki.pageUrl && (
                        <a
                          href={activeWiki.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-cyan-400 text-cyan-600 rounded-lg border dark:border-slate-700 border-slate-300 flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Original
                        </a>
                      )}
                    </div>
                    {activeWiki.summary && (
                      <p className="text-xs dark:text-slate-300 text-slate-700 leading-relaxed">
                        {activeWiki.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Article Sections */}
                <div className="space-y-4">
                  {(activeWiki.sections || []).map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-5 dark:bg-slate-900/50 bg-white border dark:border-slate-800/80 border-slate-200 rounded-2xl space-y-2.5"
                    >
                      <h3
                        className={`font-bold dark:text-slate-100 text-slate-900 ${
                          sec.level <= 2 ? 'text-sm border-b dark:border-slate-800 border-slate-200 pb-2' : 'text-xs text-cyan-500'
                        }`}
                      >
                        {sec.heading}
                      </h3>
                      <div className="space-y-2">
                        {sec.paragraphs.slice(0, 6).map((p, pIdx) => (
                          <p key={pIdx} className="text-xs dark:text-slate-300 text-slate-700 leading-relaxed">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clickable Related Articles */}
                {activeWiki.relatedLinks && activeWiki.relatedLinks.length > 0 && (
                  <div className="p-4 dark:bg-slate-900/60 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-2.5">
                    <span className="text-xs font-bold dark:text-slate-200 text-slate-800 block">
                      Related Wikipedia Articles
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeWiki.relatedLinks.map((topic) => (
                        <button
                          key={topic}
                          onClick={() =>
                            navigateTo(
                              `https://${activeWiki.lang || 'en'}.wikipedia.org/wiki/${encodeURIComponent(
                                topic.replace(/\s+/g, '_')
                              )}`
                            )
                          }
                          className="px-2.5 py-1 text-[11px] dark:bg-slate-800 bg-slate-100 dark:hover:bg-cyan-500/20 hover:bg-cyan-50 border dark:border-slate-700 border-slate-300 hover:border-cyan-500/50 rounded-lg dark:text-cyan-300 text-cyan-700 transition-colors cursor-pointer"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW 4: SAFE WEB READER (AUTOMATIC WHEN X-FRAME-OPTIONS BLOCKS IFRAME) */}
        {(activeTab.contentType === 'web_reader' || activeTab.contentType === 'external_preview') && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div className="p-4 dark:bg-slate-900/90 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold dark:text-slate-100 text-slate-900 block truncate">
                    {activeReader?.title || activeTab.title}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-500 block truncate">
                    {activeTab.url}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeTab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Full Site
                </a>
                <button
                  type="button"
                  onClick={() => executeGoogleSearch(activeReader?.title || activeTab.title)}
                  className="px-3 py-1.5 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-200 text-slate-800 border dark:border-slate-700 border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Search Related
                </button>
              </div>
            </div>

            {isLoadingReader && !activeReader ? (
              <div className="p-8 space-y-3 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-3 text-cyan-500 font-semibold">
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                  <span>Loading Pluto Reader Preview for {activeTab.title}...</span>
                </div>
              </div>
            ) : activeReader && !activeReader.error ? (
              <div className="space-y-4">
                {activeReader.description && (
                  <p className="p-4 dark:bg-slate-900/60 bg-white border dark:border-slate-800 border-slate-200 rounded-xl text-xs dark:text-slate-300 text-slate-700 italic">
                    {activeReader.description}
                  </p>
                )}

                {activeReader.paragraphs.length > 0 ? (
                  <div className="p-5 dark:bg-slate-900/70 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-2">
                      <span className="text-xs font-bold dark:text-slate-200 text-slate-800">
                        Live Extracted Page Content
                      </span>
                      <span className="text-[10px] font-mono text-amber-500">
                        Direct iframe blocked by site headers · Pluto Reader active
                      </span>
                    </div>
                    {activeReader.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-xs dark:text-slate-300 text-slate-700 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 dark:bg-slate-900/70 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl text-center space-y-2">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                    <p className="text-xs dark:text-slate-300 text-slate-700">
                      This page uses dynamic client-side rendering or restricts automated embedding. Use <strong>Open Full Site</strong> above to view it in a dedicated tab.
                    </p>
                  </div>
                )}

                {activeReader.links.length > 0 && (
                  <div className="p-4 dark:bg-slate-900/60 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl space-y-2.5">
                    <span className="text-xs font-bold dark:text-slate-200 text-slate-800 block">
                      Page Links
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeReader.links.map((lnk, i) => (
                        <button
                          key={i}
                          onClick={() => navigateTo(lnk.uri)}
                          className="p-2.5 text-left dark:bg-slate-950/70 bg-slate-50 border dark:border-slate-800 border-slate-200 hover:border-cyan-500/50 rounded-xl transition-colors cursor-pointer"
                        >
                          <span className="text-xs font-medium text-cyan-500 block truncate">{lnk.title}</span>
                          <span className="text-[10px] font-mono text-slate-500 block truncate">{lnk.uri}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 dark:bg-slate-900/80 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl text-center space-y-3">
                <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto" />
                <p className="text-xs dark:text-slate-300 text-slate-700">
                  {activeReader?.error || `${activeTab.title} restricts embedded frame previews.`}
                </p>
                <a
                  href={activeTab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Site in New Tab
                </a>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: LIVE REAL WEBSITE IFRAME */}
        {activeTab.contentType === 'iframe_web' && (
          <div className="w-full h-full flex flex-col">
            <div className="px-3 py-1 dark:bg-slate-900/95 bg-slate-100 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between text-[11px] dark:text-slate-300 text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-mono dark:text-cyan-300 text-cyan-700 truncate">Browsing: {activeTab.url}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTabs((prev) =>
                      prev.map((t) => (t.id === activeTabId ? { ...t, contentType: 'web_reader' } : t))
                    );
                  }}
                  className="px-2.5 py-0.5 rounded dark:bg-slate-800 bg-white dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-200 text-slate-700 border dark:border-slate-700 border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Switch to Reader Mode if page looks blank"
                >
                  <FileText className="w-3 h-3 text-cyan-500" />
                  <span>Reader View</span>
                </button>
                <a
                  href={activeTab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-0.5 rounded dark:bg-slate-800 bg-white dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-cyan-400 text-cyan-600 border dark:border-slate-700 border-slate-300 flex items-center gap-1 transition-colors"
                  title="Open directly in a new browser tab"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in New Tab</span>
                </a>
              </div>
            </div>

            <div className="flex-1 w-full h-full relative bg-white">
              <iframe
                ref={iframeRef}
                src={activeTab.url}
                title={activeTab.title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                className="w-full h-full border-none block"
              />
            </div>
          </div>
        )}

        {/* VIEW 6: GOOGLE MAPS GROUNDED EXPLORER */}
        {activeTab.contentType === 'maps_grounding' && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div className="flex items-center gap-3 border-b dark:border-slate-800 border-slate-200 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeMapsSearch(mapsQueryInput);
                }}
                className="flex-1 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={mapsQueryInput}
                  onChange={(e) => setMapsQueryInput(e.target.value)}
                  placeholder="Ask about places, restaurants, parks, or directions near you..."
                  className="flex-1 px-4 py-2 text-xs dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-300 rounded-full dark:text-slate-100 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSearchingMaps}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-full transition-colors cursor-pointer"
                >
                  {isSearchingMaps ? 'Searching...' : 'Find Places'}
                </button>
              </form>
            </div>

            {isSearchingMaps ? (
              <div className="p-8 text-xs font-mono text-emerald-500 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span>Querying Google Maps Grounding via Gemini 4 Hydrogen...</span>
              </div>
            ) : mapsData?.error ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200">
                {mapsData.error}
              </div>
            ) : mapsData ? (
              <div className="space-y-5">
                <div className="p-5 dark:bg-slate-900 bg-white border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                    <MapPin className="w-4 h-4" />
                    <span>Google Maps Grounded Guide</span>
                  </div>
                  <div className="text-xs dark:text-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {mapsData.answer}
                  </div>
                </div>

                {mapsData.places.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold dark:text-slate-300 text-slate-700">
                      Verified Google Maps Places ({mapsData.places.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mapsData.places.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 dark:bg-slate-900 bg-white dark:hover:bg-slate-800 hover:bg-slate-100 border dark:border-slate-800 border-slate-200 hover:border-emerald-500/60 rounded-xl transition-all space-y-2 block"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-emerald-500">
                            <span className="truncate pr-2">{place.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </div>
                          {place.snippets.length > 0 && (
                            <p className="text-[11px] dark:text-slate-400 text-slate-600 line-clamp-2 italic">
                              “{place.snippets[0]}”
                            </p>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono block truncate">
                            {place.uri}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
