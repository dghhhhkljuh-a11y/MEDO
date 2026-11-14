import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Globe,
  Cpu,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Zap,
  ShieldCheck,
  Mail,
  ListTodo,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { playSystemSound } from '../../utils/sound';

type ChatbotModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
type RolePreset = 'copilot' | 'architect' | 'security' | 'writer' | 'custom';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { title: string; uri: string }[];
  modelUsed?: string;
  isError?: boolean;
}

export const PlutoAIApp: React.FC = () => {
  const {
    hardwareMetrics,
    tasks,
    processes,
    systemVersion,
    wifiEnabled,
    bluetoothEnabled,
    theme,
    aiPromptQueue,
    setAiPromptQueue,
    copyToClipboard,
    addNotification,
  } = useOS();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am Pluto AI Copilot powered by Gemini. Ask me anything—search live web information, inspect your system telemetry, prioritize tasks, draft emails, or generate code.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [shareTelemetry, setShareTelemetry] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ChatbotModel>('gemini-4-hydrogen');
  const [rolePreset, setRolePreset] = useState<RolePreset>('copilot');
  const [customSystemInstruction, setCustomSystemInstruction] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  const buildSystemContextString = () => {
    if (!shareTelemetry) return '';
    const pendingTasks = tasks.filter((t) => !t.completed).map((t) => `[${t.priority}] ${t.title}`);
    return [
      `OS Version: ${systemVersion}`,
      `Appearance Theme: ${theme}`,
      `CPU Load: ${hardwareMetrics.cpuTotal}%, RAM: ${hardwareMetrics.ramUsedGb}/${hardwareMetrics.ramTotalGb} GB, Temp: ${hardwareMetrics.temperatureC}°C`,
      `Active Processes (${processes.length}): ${processes.slice(0, 6).map((p) => `${p.name} (${p.cpuPct}% CPU)`).join(', ')}`,
      `Network: Wi-Fi ${wifiEnabled ? 'Connected' : 'Off'}, Bluetooth ${bluetoothEnabled ? 'On' : 'Off'}`,
      `Pending Priority Tasks (${pendingTasks.length}): ${pendingTasks.join('; ') || 'None'}`,
    ].join('\n');
  };

  const sendMessage = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean || isLoading) return;

    playSystemSound('click');
    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError)
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: clean,
          history: historyPayload,
          systemContext: buildSystemContextString(),
          useSearch: useWebSearch,
          model: selectedModel,
          rolePreset,
          customSystemInstruction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const quotaMsg =
          res.status === 429 || data?.code === 'RESOURCE_EXHAUSTED'
            ? `${data.error}\n\nLocal System Snapshot (${systemVersion}):\n• CPU: ${hardwareMetrics.cpuTotal}% | RAM: ${hardwareMetrics.ramUsedGb}/${hardwareMetrics.ramTotalGb} GB | Temp: ${hardwareMetrics.temperatureC}°C\n• Pending Tasks: ${tasks.filter((t) => !t.completed).length} active`
            : data.error || 'AI service returned an error.';
        throw new Error(quotaMsg);
      }

      const aiMsg: ChatMessage = {
        id: 'a-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'No response received.',
        sources: Array.isArray(data.sources) ? data.sources : [],
        modelUsed: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      playSystemSound('chime');
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: 'e-' + Date.now(),
        role: 'assistant',
        content: err?.message || 'Unable to connect to Pluto AI backend service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      playSystemSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-consume prompt handoff from Desktop search bar / Quick launch
  useEffect(() => {
    if (aiPromptQueue) {
      const q = aiPromptQueue;
      setAiPromptQueue(null);
      sendMessage(q);
    }
  }, [aiPromptQueue]);

  const handleCopy = (msg: ChatMessage) => {
    copyToClipboard({ type: 'text', label: 'AI Response', data: msg.content });
    navigator.clipboard?.writeText(msg.content).catch(() => {});
    setCopiedId(msg.id);
    playSystemSound('click');
    addNotification({ title: 'Copied to Clipboard', message: 'AI response copied.', app: 'Pluto AI' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      label: 'Analyze System Health',
      icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
      prompt: 'Analyze my current Pluto OS CPU, RAM, and active processes telemetry. Any optimization tips?',
    },
    {
      label: 'Prioritize My Tasks',
      icon: <ListTodo className="w-3.5 h-3.5 text-emerald-400" />,
      prompt: 'Look at my pending tasks and recommend an action plan in priority order.',
    },
    {
      label: 'Draft Security Email',
      icon: <Mail className="w-3.5 h-3.5 text-indigo-400" />,
      prompt: 'Draft a concise, professional security status update email confirming our 1TB E2EE Cloud Vault backup completed cleanly.',
    },
    {
      label: 'Latest Tech Headlines',
      icon: <Globe className="w-3.5 h-3.5 text-purple-400" />,
      prompt: 'Give me a brief summary of today’s top technology and cybersecurity headlines.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans">
      {/* Header Bar */}
      <div className="p-4 dark:bg-slate-900 bg-white border-b dark:border-slate-800 border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold">Pluto AI Copilot</h3>
            </div>
            <span className="text-[11px] dark:text-slate-400 text-slate-500 font-mono">
              Multi-Turn Role Assistant & Grounded Web Search
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ChatbotModel)}
            title="Select Gemini model"
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold dark:bg-slate-950 bg-slate-100 border dark:border-slate-700 border-slate-300 dark:text-cyan-400 text-cyan-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="gemini-4-hydrogen">Gemini 4 Hydrogen</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option>
          </select>

          <select
            value={rolePreset}
            onChange={(e) => setRolePreset(e.target.value as RolePreset)}
            title="Select system instruction persona"
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold dark:bg-slate-950 bg-slate-100 border dark:border-slate-700 border-slate-300 dark:text-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="copilot">Role: OS Copilot</option>
            <option value="architect">Role: Systems Architect</option>
            <option value="security">Role: Security Auditor</option>
            <option value="writer">Role: Executive Writer</option>
            <option value="custom">Role: Custom System Prompt</option>
          </select>

          <button
            onClick={() => setShareTelemetry(!shareTelemetry)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
              shareTelemetry
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500 dark:border-slate-700 border-slate-300'
            }`}
            title="Allow Pluto AI to see live CPU, RAM, processes, and task priorities"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OS Context {shareTelemetry ? 'On' : 'Off'}</span>
          </button>

          <button
            onClick={() => setUseWebSearch(!useWebSearch)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
              useWebSearch
                ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500 dark:border-slate-700 border-slate-300'
            }`}
            title="Enable live Google Search grounding"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Grounding {useWebSearch ? 'On' : 'Off'}</span>
          </button>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'welcome-clear',
                  role: 'assistant',
                  content: 'Conversation cleared. Ready for your next question or system command!',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            title="Clear Conversation"
            className="p-1.5 rounded-lg dark:hover:bg-slate-800 hover:bg-slate-200 dark:text-slate-400 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {rolePreset === 'custom' && (
        <div className="px-4 py-2 dark:bg-slate-900/80 bg-slate-100 border-b dark:border-slate-800 border-slate-200 shrink-0">
          <input
            type="text"
            value={customSystemInstruction}
            onChange={(e) => setCustomSystemInstruction(e.target.value)}
            placeholder="Enter custom systemInstruction persona (e.g., 'Respond strictly in concise bullet points for DevOps teams')..."
            className="w-full px-3 py-1.5 rounded-lg text-xs dark:bg-slate-950 bg-white border dark:border-slate-700 border-slate-300 dark:text-slate-100 text-slate-900 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Quick Action Prompts Strip */}
      <div className="px-4 py-2.5 dark:bg-slate-900/50 bg-slate-100/80 border-b dark:border-slate-800 border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] font-mono uppercase dark:text-slate-500 text-slate-500 shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Quick Actions:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(qp.prompt)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 dark:hover:border-cyan-500/50 hover:border-cyan-500 dark:text-slate-300 text-slate-700 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {qp.icon}
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm border ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400/50'
                  : msg.isError
                  ? 'dark:bg-rose-950/40 bg-rose-50 dark:text-rose-200 text-rose-800 dark:border-rose-800/60 border-rose-200'
                  : 'dark:bg-slate-900 bg-white dark:text-slate-100 text-slate-800 dark:border-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1.5 opacity-75 text-[10px] font-mono">
                <span className="flex items-center gap-1 font-bold">
                  {msg.role === 'assistant' &&
                    (msg.isError ? (
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                    ))}
                  {msg.role === 'user' ? 'You' : 'Pluto AI'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="whitespace-pre-wrap select-text">{msg.content}</div>

              {/* Grounded Web Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t dark:border-slate-800 border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase dark:text-slate-400 text-slate-500 block">
                    Verified Web Sources
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.slice(0, 5).map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-300 dark:text-cyan-400 text-cyan-700 hover:border-cyan-500 transition-colors max-w-[220px] truncate"
                      >
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && !msg.isError && (
                <div className="mt-2 pt-1 flex justify-end">
                  <button
                    onClick={() => handleCopy(msg)}
                    className="flex items-center gap-1 text-[10px] dark:text-slate-400 text-slate-500 hover:text-cyan-500 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-xs dark:text-slate-300 text-slate-600 shadow-sm">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="font-mono">Pluto AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-4 dark:bg-slate-900 bg-white border-t dark:border-slate-800 border-slate-200 shrink-0"
      >
        <div className="flex items-center gap-2 dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-300 rounded-xl px-3 py-2 focus-within:border-cyan-500 transition-colors">
          <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pluto AI anything, analyze OS performance, or search the web..."
            className="flex-1 bg-transparent text-xs dark:text-slate-100 text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
