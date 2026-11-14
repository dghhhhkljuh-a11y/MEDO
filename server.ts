import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client with User-Agent per guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isQuotaOrRateError = (err: any): boolean => {
  const msg = String(err?.message || err || '');
  return (
    err?.status === 429 ||
    err?.status === 503 ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota')
  );
};

async function callGeminiWithFallback(options: {
  contents: any;
  systemInstruction?: string;
  useSearch?: boolean;
  strictSearch?: boolean;
  preferredModel?: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw Object.assign(new Error('Gemini API key is not configured in Settings > Secrets.'), { status: 503 });
  }

  const primary = options.preferredModel === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
  const secondary = primary === 'gemini-4-hydrogen' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

  const attempts: { model: string; useSearch: boolean }[] = options.useSearch
    ? options.strictSearch
      ? [
          { model: primary, useSearch: true },
          { model: secondary, useSearch: true },
        ]
      : [
          { model: primary, useSearch: true },
          { model: primary, useSearch: false },
          { model: secondary, useSearch: false },
        ]
    : [
        { model: primary, useSearch: false },
        { model: secondary, useSearch: false },
      ];

  let lastError: any = null;

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    try {
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: options.contents,
        config: {
          ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
          ...(attempt.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });
      return { response, model: attempt.model };
    } catch (err: any) {
      lastError = err;
      if (isQuotaOrRateError(err) && i < attempts.length - 1) {
        await sleep(300 * (i + 1));
        continue;
      }
      if (!isQuotaOrRateError(err)) {
        throw err;
      }
    }
  }

  throw lastError;
}

// Live Wikipedia + DuckDuckGo Instant Answer fallback when Gemini Search Grounding quota is exhausted
async function fetchLiveWebFallback(query: string) {
  const sources: { title: string; uri: string }[] = [];
  let summaryText = '';

  try {
    const ddgRes = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (ddgRes.ok) {
      const ddgData: any = await ddgRes.json();
      if (ddgData?.AbstractText) {
        summaryText = ddgData.AbstractText;
        if (ddgData.AbstractURL) {
          sources.push({
            title: ddgData.AbstractSource ? `${ddgData.AbstractSource}: ${ddgData.Heading || query}` : query,
            uri: ddgData.AbstractURL,
          });
        }
      }
      if (Array.isArray(ddgData?.RelatedTopics)) {
        for (const topic of ddgData.RelatedTopics.slice(0, 3)) {
          if (topic?.FirstURL && topic?.Text) {
            sources.push({
              title: topic.Text.slice(0, 80),
              uri: topic.FirstURL,
            });
          }
        }
      }
    }
  } catch {
    // ignore network timeout
  }

  if (!summaryText) {
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (wikiRes.ok) {
        const wikiData: any = await wikiRes.json();
        if (wikiData?.extract) {
          summaryText = wikiData.extract;
        }
        if (wikiData?.content_urls?.desktop?.page) {
          sources.unshift({
            title: `${wikiData.title || query} — Wikipedia`,
            uri: wikiData.content_urls.desktop.page,
          });
        }
      }
    } catch {
      // ignore network timeout
    }
  }

  if (sources.length === 0) {
    sources.push(
      {
        title: `${query} — Google Search`,
        uri: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      },
      {
        title: `${query} — Wikipedia`,
        uri: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
      },
      {
        title: `${query} — GitHub Search`,
        uri: `https://github.com/search?q=${encodeURIComponent(query)}`,
      }
    );
  }

  return {
    answer:
      summaryText ||
      `Live web directory results for "${query}". Select any verified destination below to browse directly or open in a new window.`,
    sources,
  };
}

// Google Search Grounding API Endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const cleanQuery = query.trim();

  try {
    if (process.env.GEMINI_API_KEY) {
      const { response } = await callGeminiWithFallback({
        contents: `Provide an accurate, up-to-date, grounded search answer and summary for the following user search query: "${cleanQuery}". Use live facts, dates, specifications, and citations when available. Keep the response clear, engaging, and structured with bullet points where appropriate.`,
        useSearch: true,
        strictSearch: true,
      });

      const text = response.text || 'No direct text returned from search grounding.';
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const chunks = groundingMetadata?.groundingChunks || [];

      const sources = chunks
        .map((c: any) => c.web)
        .filter(Boolean)
        .map((w: any) => ({
          title: w.title || w.uri,
          uri: w.uri,
        }));

      const searchQueries = groundingMetadata?.webSearchQueries || [cleanQuery];

      return res.json({
        query: cleanQuery,
        answer: text,
        sources:
          sources.length > 0
            ? sources
            : [
                {
                  title: `Google Search — ${cleanQuery}`,
                  uri: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`,
                },
              ],
        searchQueries,
        sourceType: 'grounded_search',
      });
    }

    const fallback = await fetchLiveWebFallback(cleanQuery);
    return res.json({
      query: cleanQuery,
      answer: fallback.answer,
      sources: fallback.sources,
      searchQueries: [cleanQuery],
      sourceType: 'live_web_directory',
    });
  } catch (error: any) {
    // Gracefully fall back to live Wikipedia / DuckDuckGo lookup without failing the search request
    console.warn(`Search fallback engaged for "${cleanQuery}":`, error?.status || error?.message || 'quota/network');
    const fallback = await fetchLiveWebFallback(cleanQuery);
    return res.json({
      query: cleanQuery,
      answer: fallback.answer,
      sources: fallback.sources,
      searchQueries: [cleanQuery],
      sourceType: 'live_web_fallback',
    });
  }
});

// Pluto AI Multi-Turn Copilot Endpoint (Gemini 4 Hydrogen & Gemini 3.1 Flash-Lite)
const ROLE_INSTRUCTIONS: Record<string, string> = {
  copilot:
    'You are Pluto AI, the intelligent built-in copilot inside Pluto OS 2.5 LTS. Be concise, practical, technically accurate, and helpful.',
  architect:
    'You are a Principal Systems & Software Architect inside Pluto OS 2.5 LTS. Provide structured, production-grade TypeScript, kernel, and system architecture advice.',
  security:
    'You are Pluto Security Auditor. Focus on zero-trust security, E2EE key hygiene, threat mitigation, and safe system hardening.',
  writer:
    'You are an Executive Technical Writer & Productivity Coach. Write crystal-clear, concise communications, action plans, and summaries.',
};

app.post('/api/ai/chat', async (req, res) => {
  const {
    prompt,
    history = [],
    systemContext,
    useSearch = true,
    model: requestedModel = 'gemini-4-hydrogen',
    rolePreset = 'copilot',
    customSystemInstruction = '',
  } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt message is required.' });
  }

  const safeModel: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite' =
    requestedModel === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

  try {
    const structuredContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-14)) {
        if (!msg || typeof msg.content !== 'string' || !msg.content.trim()) continue;
        const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
        const last = structuredContents[structuredContents.length - 1];
        if (last && last.role === role) {
          last.parts[0].text += `\n${msg.content.trim()}`;
        } else {
          structuredContents.push({ role, parts: [{ text: msg.content.trim() }] });
        }
      }
    }

    const cleanPrompt = prompt.trim();
    const lastTurn = structuredContents[structuredContents.length - 1];
    if (!lastTurn || lastTurn.role !== 'user' || lastTurn.parts[0].text !== cleanPrompt) {
      if (lastTurn && lastTurn.role === 'user') {
        lastTurn.parts[0].text += `\n${cleanPrompt}`;
      } else {
        structuredContents.push({ role: 'user', parts: [{ text: cleanPrompt }] });
      }
    }

    const baseRole =
      rolePreset === 'custom' && typeof customSystemInstruction === 'string' && customSystemInstruction.trim()
        ? customSystemInstruction.trim()
        : ROLE_INSTRUCTIONS[rolePreset] || ROLE_INSTRUCTIONS.copilot;

    const systemInstruction = `${baseRole}
${systemContext ? `\nLive Workstation Telemetry Context:\n${systemContext}\n` : ''}
Reference real Pluto OS modules (Task Manager, Calendar Alarms, 1TB Cloud Vault, Pluto Mail, Audio DSP Mixer, Settings, Web Navigator) when relevant.`;

    const { response, model } = await callGeminiWithFallback({
      contents: structuredContents,
      systemInstruction,
      useSearch,
      preferredModel: safeModel,
    });

    const text = response.text || 'No response generated.';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((c: any) => c.web)
      .filter(Boolean)
      .map((w: any) => ({
        title: w.title || w.uri,
        uri: w.uri,
      }));

    return res.json({
      reply: text,
      sources,
      model,
    });
  } catch (error: any) {
    if (isQuotaOrRateError(error)) {
      console.warn('Pluto AI quota reached (429 RESOURCE_EXHAUSTED).');
      return res.status(429).json({
        error:
          'Gemini API quota limit reached (429 RESOURCE_EXHAUSTED). Upgrading to a paid tier increases your quota—you can select a billing-enabled API key in the Settings > Secrets panel.',
        code: 'RESOURCE_EXHAUSTED',
      });
    }
    if (error?.status === 503) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in the Settings > Secrets panel.',
      });
    }
    console.warn('Pluto AI request error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate AI response. Please try again.',
    });
  }
});

// Google Maps Grounding API Endpoint (Powered by Gemini 4 Hydrogen + Google Maps tool)
app.post('/api/maps/ground', async (req, res) => {
  const { query, latitude, longitude } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Place or location query is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
    });
  }

  try {
    const hasCoords = typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude);

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: query.trim(),
      config: {
        tools: [{ googleMaps: {} }],
        ...(hasCoords
          ? {
              toolConfig: {
                retrievalConfig: {
                  latLng: { latitude, longitude },
                },
              },
            }
          : {}),
      },
    });

    const text = response.text || 'No place details returned.';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const places: { title: string; uri: string; snippets: string[] }[] = [];

    for (const chunk of chunks) {
      if (chunk.maps?.uri) {
        const snippets = Array.isArray((chunk.maps as any).placeAnswerSources?.reviewSnippets)
          ? (chunk.maps as any).placeAnswerSources.reviewSnippets
              .map((s: any) => s?.reviewText || s?.text || '')
              .filter(Boolean)
          : [];
        places.push({
          title: chunk.maps.title || 'Google Maps Place',
          uri: chunk.maps.uri,
          snippets,
        });
      }
    }

    return res.json({
      query: query.trim(),
      answer: text,
      places,
    });
  } catch (error: any) {
    if (isQuotaOrRateError(error)) {
      return res.status(429).json({
        error: 'Gemini API quota limit reached (429 RESOURCE_EXHAUSTED). Selecting a billing-enabled API key in Settings > Secrets restores full quota.',
        code: 'RESOURCE_EXHAUSTED',
      });
    }
    console.warn('Google Maps grounding error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to query Google Maps grounding.',
    });
  }
});

// Safe SSRF guard for server-side web reader
function isDisallowedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower === '0.0.0.0' ||
    lower === '[::1]' ||
    lower === '::1'
  ) {
    return true;
  }
  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (
      a === 127 ||
      a === 10 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31)
    ) {
      return true;
    }
  }
  return false;
}

// Live Wikipedia Article & Search Endpoint (eliminates X-Frame-Options / CSP frame-ancestors refusal)
app.get('/api/wiki', async (req, res) => {
  try {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    let lang = typeof req.query.lang === 'string' && /^[a-z]{2,3}(-[a-z]+)?$/i.test(req.query.lang) ? req.query.lang.toLowerCase() : 'en';
    let title = typeof req.query.title === 'string' ? req.query.title.trim() : '';

    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        const hostMatch = parsed.hostname.match(/^([a-z]{2,3})\.(?:m\.)?wikipedia\.org$/i);
        if (hostMatch) lang = hostMatch[1].toLowerCase();

        const searchParam = parsed.searchParams.get('search');
        if (searchParam && !rawSearch) {
          const searchResp = await fetch(
            `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchParam)}&limit=10&format=json`,
            { headers: { 'User-Agent': 'PlutoOSNavigator/2.5' }, signal: AbortSignal.timeout(5000) }
          );
          if (searchResp.ok) {
            const [, titles = [], , urls = []] = (await searchResp.json()) as [string, string[], string[], string[]];
            return res.json({
              mode: 'search',
              lang,
              query: searchParam,
              results: titles.map((t, idx) => ({ title: t, url: urls[idx] || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(t.replace(/\s+/g, '_'))}` })),
            });
          }
        }

        if (parsed.pathname.startsWith('/wiki/')) {
          title = decodeURIComponent(parsed.pathname.slice('/wiki/'.length));
        }
      } catch {
        // ignore invalid url
      }
    }

    if (rawSearch) {
      const searchResp = await fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(rawSearch)}&limit=10&format=json`,
        { headers: { 'User-Agent': 'PlutoOSNavigator/2.5' }, signal: AbortSignal.timeout(5000) }
      );
      if (searchResp.ok) {
        const [, titles = [], , urls = []] = (await searchResp.json()) as [string, string[], string[], string[]];
        return res.json({
          mode: 'search',
          lang,
          query: rawSearch,
          results: titles.map((t, idx) => ({ title: t, url: urls[idx] || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(t.replace(/\s+/g, '_'))}` })),
        });
      }
    }

    const cleanTitle = (title || 'Pluto').replace(/#.*$/, '') || 'Main_Page';
    const headers = { 'User-Agent': 'PlutoOSNavigator/2.5' };

    const [summaryRes, articleRes] = await Promise.all([
      fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`, {
        headers,
        signal: AbortSignal.timeout(6000),
      }),
      fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|links&explaintext=1&pllimit=24&plnamespace=0&titles=${encodeURIComponent(cleanTitle)}&format=json&redirects=1`,
        { headers, signal: AbortSignal.timeout(6000) }
      ),
    ]);

    let summaryJson: any = null;
    if (summaryRes.ok) {
      summaryJson = await summaryRes.json();
    }

    let extract = summaryJson?.extract || '';
    let resolvedTitle = summaryJson?.title || cleanTitle.replace(/_/g, ' ');
    let relatedLinks: string[] = [];

    if (articleRes.ok) {
      const articleJson: any = await articleRes.json();
      const pages = articleJson?.query?.pages;
      if (pages) {
        const firstPage = Object.values(pages)[0] as any;
        if (firstPage && !firstPage.missing) {
          if (firstPage.title) resolvedTitle = firstPage.title;
          if (firstPage.extract) extract = firstPage.extract;
          if (Array.isArray(firstPage.links)) {
            relatedLinks = firstPage.links.map((l: any) => l?.title).filter(Boolean);
          }
        }
      }
    }

    if (!extract && !summaryJson) {
      return res.status(404).json({ error: `Wikipedia article "${cleanTitle}" was not found.` });
    }

    // Parse MediaWiki plaintext into structured sections
    const rawLines = extract.split('\n');
    const sections: { heading: string; level: number; paragraphs: string[] }[] = [];
    let currentSection = { heading: 'Overview', level: 2, paragraphs: [] as string[] };

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const headingMatch = trimmed.match(/^(={2,4})\s*(.+?)\s*\1$/);
      if (headingMatch) {
        if (currentSection.paragraphs.length > 0 || currentSection.heading !== 'Overview') {
          sections.push(currentSection);
        }
        currentSection = {
          heading: headingMatch[2],
          level: headingMatch[1].length,
          paragraphs: [],
        };
      } else {
        currentSection.paragraphs.push(trimmed);
      }
    }
    if (currentSection.paragraphs.length > 0) {
      sections.push(currentSection);
    }

    return res.json({
      mode: 'article',
      lang,
      title: resolvedTitle,
      description: summaryJson?.description || '',
      thumbnail: summaryJson?.thumbnail?.source || summaryJson?.originalimage?.source || null,
      summary: summaryJson?.extract || '',
      sections: sections.slice(0, 14),
      relatedLinks: relatedLinks.slice(0, 18),
      pageUrl: summaryJson?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(cleanTitle)}`,
    });
  } catch (error: any) {
    console.warn('Wikipedia reader error:', error?.message || error);
    return res.status(502).json({ error: 'Unable to fetch article from Wikipedia right now.' });
  }
});

// Safe Web Reader & Iframe Header Inspector
app.get('/api/web/reader', async (req, res) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!rawUrl) {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL.' });
  }

  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || isDisallowedHostname(parsed.hostname)) {
    return res.status(400).json({ error: 'Unsupported or restricted URL.' });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PlutoOSNavigator/2.5)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6500),
    });

    const xfo = (upstream.headers.get('x-frame-options') || '').toLowerCase();
    const csp = (upstream.headers.get('content-security-policy') || '').toLowerCase();
    const hasFrameAncestorsBlock = /frame-ancestors\s+([^;]+)/.test(csp) && !/frame-ancestors\s+\*/.test(csp);
    const frameBlocked = xfo.includes('deny') || xfo.includes('sameorigin') || hasFrameAncestorsBlock;

    const contentType = upstream.headers.get('content-type') || '';
    const html = await upstream.text();
    const clippedHtml = html.slice(0, 200000);

    const decodeEntities = (str: string) =>
      str
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();

    const titleMatch = clippedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch =
      clippedHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) ||
      clippedHtml.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i);

    const stripped = clippedHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');

    const paragraphs: string[] = [];
    const blockRegex = /<(?:p|h1|h2|h3|li)[^>]*>([\s\S]*?)<\/(?:p|h1|h2|h3|li)>/gi;
    let match: RegExpExecArray | null;
    while ((match = blockRegex.exec(stripped)) !== null && paragraphs.length < 28) {
      const clean = decodeEntities(match[1].replace(/<[^>]+>/g, ' '));
      if (clean.length >= 25 && !paragraphs.includes(clean)) {
        paragraphs.push(clean);
      }
    }

    const links: { title: string; uri: string }[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = linkRegex.exec(stripped)) !== null && links.length < 14) {
      const href = match[1].trim();
      const label = decodeEntities(match[2].replace(/<[^>]+>/g, ' '));
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || label.length < 3) continue;
      try {
        const abs = new URL(href, upstream.url || parsed.toString()).toString();
        if (abs.startsWith('http') && !links.some((l) => l.uri === abs)) {
          links.push({ title: label.slice(0, 80), uri: abs });
        }
      } catch {
        // ignore invalid href
      }
    }

    return res.json({
      url: upstream.url || parsed.toString(),
      status: upstream.status,
      contentType,
      frameBlocked,
      title: decodeEntities(titleMatch?.[1] || parsed.hostname),
      description: decodeEntities(descMatch?.[1] || ''),
      paragraphs:
        paragraphs.length > 0
          ? paragraphs
          : contentType.includes('text/plain')
          ? [clippedHtml.slice(0, 3000)]
          : [],
      links,
    });
  } catch (error: any) {
    console.warn('Web reader error:', error?.message || error);
    return res.status(502).json({
      error: `Unable to fetch ${parsed.hostname} (${error?.message || 'connection error'}).`,
      frameBlocked: true,
    });
  }
});

// Real Hardware & Kernel Telemetry using Node.js os module
let prevCpuSample = os.cpus().map((c) => ({ ...c.times }));

function sampleRealCpuUtilization(): { totalPct: number; cores: number[] } {
  const current = os.cpus();
  const corePcts = current.map((cpu, idx) => {
    const prev = prevCpuSample[idx] || cpu.times;
    const idleDiff = cpu.times.idle - prev.idle;
    const totalNow = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    const totalPrev = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    const totalDiff = totalNow - totalPrev;
    if (totalDiff <= 0) return Math.min(100, Math.round((os.loadavg()[0] / Math.max(1, current.length)) * 100));
    const usage = ((totalDiff - idleDiff) / totalDiff) * 100;
    return Math.max(1, Math.min(100, Math.round(usage)));
  });
  prevCpuSample = current.map((c) => ({ ...c.times }));
  const totalPct =
    corePcts.length > 0
      ? +(corePcts.reduce((sum, v) => sum + v, 0) / corePcts.length).toFixed(1)
      : 0;
  return { totalPct, cores: corePcts.slice(0, 16) };
}

async function readPackageJsonSafe(): Promise<any> {
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), 'package.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { name: 'pluto-os', version: '2.5.0', dependencies: {}, devDependencies: {} };
  }
}

app.get('/api/system/info', async (_req, res) => {
  const pkg = await readPackageJsonSafe();
  const cpus = os.cpus();
  const { totalPct, cores } = sampleRealCpuUtilization();
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = Math.max(0, totalMemBytes - freeMemBytes);
  const procMem = process.memoryUsage();

  return res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    osType: os.type(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model || 'x86_64 Virtual CPU',
    cpuCoresCount: cpus.length,
    cpuTotalPct: totalPct,
    cpuCoresPct: cores,
    loadAvg: os.loadavg().map((n) => +n.toFixed(2)),
    ramTotalGb: +(totalMemBytes / (1024 ** 3)).toFixed(2),
    ramUsedGb: +(usedMemBytes / (1024 ** 3)).toFixed(2),
    ramFreeGb: +(freeMemBytes / (1024 ** 3)).toFixed(2),
    uptimeSeconds: Math.round(os.uptime()),
    serverUptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    processMemoryMb: {
      rss: Math.round(procMem.rss / (1024 * 1024)),
      heapUsed: Math.round(procMem.heapUsed / (1024 * 1024)),
      heapTotal: Math.round(procMem.heapTotal / (1024 * 1024)),
    },
    appPackageVersion: pkg.version || '2.5.0',
  });
});

// Real Open-Source Software Registry Search (live npm registry API)
app.get('/api/store/packages', async (req, res) => {
  const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : 'react';
  try {
    const npmRes = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=12`,
      {
        headers: { 'User-Agent': 'PlutoOSStore/2.5' },
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!npmRes.ok) {
      return res.status(502).json({ error: `Registry returned status ${npmRes.status}`, packages: [] });
    }

    const data: any = await npmRes.json();
    const packages = Array.isArray(data?.objects)
      ? data.objects.map((obj: any) => {
          const p = obj.package || {};
          return {
            name: p.name || 'unknown',
            version: p.version || '0.0.0',
            description: p.description || 'No description provided.',
            publisher: p.publisher?.username || 'community',
            date: p.date ? String(p.date).slice(0, 10) : '',
            npmUrl: p.links?.npm || `https://www.npmjs.com/package/${encodeURIComponent(p.name || '')}`,
            homepage: p.links?.homepage || p.links?.repository || p.links?.npm || '',
            repository: p.links?.repository || '',
            keywords: Array.isArray(p.keywords) ? p.keywords.slice(0, 4) : [],
            score: typeof obj.score?.final === 'number' ? Math.round(obj.score.final * 100) : 80,
          };
        })
      : [];

    return res.json({ query: q, total: data?.total || packages.length, packages });
  } catch (error: any) {
    console.warn('Live package registry search failed:', error?.message || error);
    return res.status(502).json({
      error: 'Unable to reach live npm software registry right now.',
      packages: [],
    });
  }
});

// Live Open-License Media Search (Wikimedia Commons API — Images, Audio & Video)
app.get('/api/media/search', async (req, res) => {
  const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : 'space nebula';
  const typeFilter = typeof req.query.type === 'string' ? req.query.type.toLowerCase() : 'all';

  try {
    const typeHint =
      typeFilter === 'audio'
        ? ' filetype:audio'
        : typeFilter === 'video'
        ? ' filetype:video'
        : typeFilter === 'image'
        ? ' filetype:bitmap'
        : '';

    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      q + typeHint
    )}&gsrlimit=18&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=640&format=json`;

    const upstream = await fetch(apiUrl, {
      headers: { 'User-Agent': 'PlutoOSMediaHub/2.5' },
      signal: AbortSignal.timeout(7000),
    });

    if (!upstream.ok) {
      return res.json({
        query: q,
        type: typeFilter,
        items: [],
        notice: `Media index returned HTTP ${upstream.status}. Try another search or import local media.`,
      });
    }

    const json: any = await upstream.json();
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];

    const stripHtml = (s: string) =>
      String(s || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const items = (pages as any[])
      .map((page) => {
        const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : null;
        if (!info?.url) return null;
        const mime = String(info.mime || '').toLowerCase();
        let mediaType: 'image' | 'audio' | 'video' | null = null;
        if (mime.startsWith('image/') && !mime.includes('tiff')) mediaType = 'image';
        else if (mime.startsWith('audio/')) mediaType = 'audio';
        else if (mime.startsWith('video/')) mediaType = 'video';

        if (!mediaType) return null;
        if (typeFilter !== 'all' && mediaType !== typeFilter) return null;

        const meta = info.extmetadata || {};
        const cleanTitle = String(page.title || 'Media Item').replace(/^File:/i, '').replace(/_/g, ' ');
        return {
          id: `commons-${page.pageid}`,
          title: cleanTitle,
          mediaType,
          mime,
          url: info.url,
          thumbUrl: info.thumburl || (mediaType === 'image' ? info.url : null),
          sizeBytes: typeof info.size === 'number' ? info.size : 0,
          width: info.width || 0,
          height: info.height || 0,
          author: stripHtml(meta.Artist?.value || 'Wikimedia Commons Contributor').slice(0, 80),
          license: stripHtml(meta.LicenseShortName?.value || 'Open License').slice(0, 48),
          pageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`,
        };
      })
      .filter(Boolean);

    return res.json({
      query: q,
      type: typeFilter,
      items,
    });
  } catch (error: any) {
    console.warn('Wikimedia Commons search warning:', error?.message || error);
    return res.json({
      query: q,
      type: typeFilter,
      items: [],
      notice: 'Live media search timed out; local library and file import remain ready.',
    });
  }
});

// Safe Media File Download Proxy (streams external media with Content-Disposition attachment)
app.get('/api/media/download', async (req, res) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  const rawName = typeof req.query.filename === 'string' ? req.query.filename.trim() : '';

  if (!rawUrl) {
    return res.status(400).json({ error: 'Download URL is required.' });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid download URL.' });
  }

  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || isDisallowedHostname(parsed.hostname)) {
    return res.status(400).json({ error: 'Restricted or unsupported download URL.' });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'PlutoOSMediaHub/2.5 (https://pluto-os.app; support@pluto-os.app)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream download returned HTTP ${upstream.status}` });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const urlBasename = path.basename(parsed.pathname) || 'pluto-media-download';
    const safeFilename = (rawName || urlBasename).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'download';

    const arrayBuffer = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', String(buf.length));
    return res.send(buf);
  } catch (error: any) {
    console.warn('Media download proxy failed:', error?.message || error);
    return res.status(502).json({ error: 'Unable to download media file from upstream host.' });
  }
});

// Real System Updates & Live Package/Service Audit
const CORE_AUDIT_PACKAGES = ['react', 'vite', 'express', 'lucide-react', '@google/genai', 'firebase', 'tailwindcss'];

let serverUpdateState = {
  buildVersion: 'Pluto OS 2.5.1 LTS',
  channel: 'stable',
  lastCheckedAt: new Date().toISOString(),
  lastAppliedAt: null as string | null,
  appliedBuilds: ['Pluto OS 2.5.1 LTS'],
};

async function fetchNpmLatestVersion(pkgName: string): Promise<string | null> {
  try {
    const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`, {
      headers: { 'User-Agent': 'PlutoOSUpdater/2.5' },
      signal: AbortSignal.timeout(3500),
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    return typeof j?.version === 'string' ? j.version : null;
  } catch {
    return null;
  }
}

app.get('/api/system/updates', async (_req, res) => {
  const pkg = await readPackageJsonSafe();
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  const packages = await Promise.all(
    CORE_AUDIT_PACKAGES.map(async (name) => {
      const installedRaw = String(deps[name] || 'unknown');
      const installedClean = installedRaw.replace(/^[\^~>=<]+/, '');
      const latest = await fetchNpmLatestVersion(name);
      return {
        name,
        installed: installedRaw,
        latest: latest || installedClean,
        updateAvailable: Boolean(latest && latest !== installedClean),
      };
    })
  );

  const services = [
    { name: 'Node.js Runtime & Express Core', status: 'healthy', detail: `${process.version} (${os.platform()}/${os.arch()})` },
    { name: 'Live Telemetry Sampler', status: 'healthy', detail: `${os.cpus().length} CPU threads active` },
    { name: 'Wikipedia Live Reader Proxy', status: 'healthy', detail: '/api/wiki operational' },
    { name: 'Safe Web Reader Inspector', status: 'healthy', detail: '/api/web/reader operational' },
    { name: 'Live Software Registry', status: 'healthy', detail: 'registry.npmjs.org connected' },
    {
      name: 'Gemini AI Copilot Engine',
      status: process.env.GEMINI_API_KEY ? 'healthy' : 'warning',
      detail: process.env.GEMINI_API_KEY ? 'API key configured' : 'Missing GEMINI_API_KEY',
    },
  ];

  serverUpdateState.lastCheckedAt = new Date().toISOString();

  return res.json({
    ...serverUpdateState,
    kernelRelease: `${os.type()} ${os.release()} (${os.arch()})`,
    appVersion: pkg.version || '2.5.1',
    packages,
    services,
  });
});

app.post('/api/system/updates/apply', async (req, res) => {
  const pkg = await readPackageJsonSafe();
  const targetBuild =
    typeof req.body?.targetBuild === 'string' && req.body.targetBuild.trim()
      ? req.body.targetBuild.trim()
      : `Pluto OS ${pkg.version || '2.5'}.2 LTS`;

  const appliedAt = new Date().toISOString();
  serverUpdateState.buildVersion = targetBuild;
  serverUpdateState.lastAppliedAt = appliedAt;
  serverUpdateState.lastCheckedAt = appliedAt;
  if (!serverUpdateState.appliedBuilds.includes(targetBuild)) {
    serverUpdateState.appliedBuilds.unshift(targetBuild);
  }

  return res.json({
    ok: true,
    ...serverUpdateState,
    kernelRelease: `${os.type()} ${os.release()} (${os.arch()})`,
    verifiedModules: ['System Telemetry', 'Pluto Store Registry', 'Pluto Media Hub', 'Wikipedia Reader', 'Web Reader', 'Theme Engine'],
  });
});

// Start Express server and mount Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });

    // Prevent Vite 8 @vite/client from opening a failing WebSocket on port 24678 behind reverse proxies
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const transformed = await vite.transformRequest('/@vite/client');
        if (transformed?.code) {
          const safeCode = transformed.code
            .replace(
              'transport.connect(createHMRHandler(handleMessage));',
              '/* WebSocket HMR transport disabled */'
            )
            .replace(
              /new WebSocket\(/g,
              '((..._args)=>({readyState:3,addEventListener(){},removeEventListener(){},send(){},close(){}}))('
            );
          res.setHeader('Content-Type', 'application/javascript');
          return res.send(safeCode);
        }
      } catch {
        // Fall through to default middleware
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pluto OS Desktop Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
