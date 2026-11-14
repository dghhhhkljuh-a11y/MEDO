import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Copy, Download, Search, Check } from 'lucide-react';
import { useOS } from '../../context/OSContext';

interface NoteDoc {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const NOTES_STORAGE_KEY = 'pluto_os_notes_v1';

const DEFAULT_NOTES: NoteDoc[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to Pluto Notes.md',
    content:
      '# Pluto Notes & Code Pad\n\nAll notes written here persist automatically in your browser storage.\n\n- Create unlimited markdown or plain-text notes\n- Export any note directly as a .md file\n- Copy notes straight into the OS clipboard',
    updatedAt: 'Today',
  },
];

export const NotesApp: React.FC = () => {
  const { copyToClipboard, addNotification } = useOS();
  const [notes, setNotes] = useState<NoteDoc[]>(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_NOTES;
  });
  const [activeId, setActiveId] = useState<string>(notes[0]?.id || 'note-welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeId) || notes[0];

  const handleNewNote = () => {
    const doc: NoteDoc = {
      id: `note-${Date.now()}`,
      title: `Untitled Note ${notes.length + 1}.md`,
      content: '',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotes((prev) => [doc, ...prev]);
    setActiveId(doc.id);
  };

  const handleDeleteNote = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    if (remaining.length === 0) {
      const fresh: NoteDoc = {
        id: `note-${Date.now()}`,
        title: 'Scratchpad.md',
        content: '',
        updatedAt: 'Just now',
      };
      setNotes([fresh]);
      setActiveId(fresh.id);
    } else {
      setNotes(remaining);
      if (activeId === id) setActiveId(remaining[0].id);
    }
  };

  const updateActive = (patch: Partial<NoteDoc>) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id
          ? {
              ...n,
              ...patch,
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : n
      )
    );
  };

  const handleExport = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeNote.title.endsWith('.md') ? activeNote.title : `${activeNote.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({ title: 'Note Exported', message: `Saved ${a.download}`, app: 'Pluto Notes' });
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordCount = activeNote?.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex-1 flex h-full dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 dark:bg-slate-900 bg-white border-r dark:border-slate-800 border-slate-200 flex flex-col shrink-0">
        <div className="p-3 border-b dark:border-slate-800 border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-500">
              <FileText className="w-4 h-4" />
              Pluto Notes
            </span>
            <button
              onClick={handleNewNote}
              title="New Note"
              className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notes..."
              className="w-full pl-7 pr-2 py-1 text-xs dark:bg-slate-950 bg-slate-100 border dark:border-slate-800 border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.map((n) => (
            <div
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={`group p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                activeNote?.id === n.id
                  ? 'dark:bg-slate-800 bg-cyan-50 border border-cyan-500/30'
                  : 'dark:hover:bg-slate-800/60 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold block truncate">{n.title || 'Untitled'}</span>
                <span className="text-[10px] font-mono text-slate-500 block">{n.updatedAt}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNote(n.id);
                }}
                title="Delete Note"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      {activeNote && (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2.5 dark:bg-slate-900/60 bg-white border-b dark:border-slate-800 border-slate-200 flex items-center justify-between gap-3">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => updateActive({ title: e.target.value })}
              className="flex-1 bg-transparent text-sm font-bold focus:outline-none dark:text-slate-100 text-slate-900"
              placeholder="Note title..."
            />

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-500">
                {wordCount} words · {activeNote.content.length} chars
              </span>
              <button
                onClick={() => {
                  copyToClipboard({ type: 'text', label: activeNote.title, data: activeNote.content });
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="px-2.5 py-1 text-xs font-semibold dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 rounded-lg border dark:border-slate-700 border-slate-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleExport}
                className="px-2.5 py-1 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          <textarea
            value={activeNote.content}
            onChange={(e) => updateActive({ content: e.target.value })}
            placeholder="Start typing notes, code snippets, or markdown..."
            className="flex-1 w-full p-5 bg-transparent resize-none focus:outline-none text-xs sm:text-sm font-mono leading-relaxed dark:text-slate-200 text-slate-800"
          />
        </div>
      )}
    </div>
  );
};
