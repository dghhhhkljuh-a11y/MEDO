import React, { useState } from 'react';
import {
  Mail,
  Inbox,
  Send,
  FileEdit,
  Trash2,
  AlertOctagon,
  Search,
  Lock,
  Plus,
  ArrowLeft,
  Reply,
  Archive,
  CheckCircle,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { PlutoEmail } from '../../types/os';

export const PlutoMailApp: React.FC = () => {
  const { emails, sendEmail, deleteEmail, markEmailRead, user } = useOS();

  const [activeFolder, setActiveFolder] = useState<PlutoEmail['folder']>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(emails[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [toInput, setToInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [encryptMail, setEncryptMail] = useState(true);

  const folderEmails = emails.filter((e) => {
    const matchesFolder = e.folder === activeFolder;
    const matchesSearch =
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  const handleSelectEmail = (email: PlutoEmail) => {
    setSelectedEmailId(email.id);
    if (!email.read) {
      markEmailRead(email.id);
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toInput.trim() || !subjectInput.trim()) return;
    sendEmail(toInput.trim(), subjectInput.trim(), bodyInput.trim(), encryptMail);
    setToInput('');
    setSubjectInput('');
    setBodyInput('');
    setShowCompose(false);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-950 text-slate-100 font-sans">
      {/* Folder Navigation Sidebar */}
      <div className="w-full md:w-56 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-3 space-y-4 shrink-0 flex md:flex-col justify-between">
        <div className="space-y-3 w-full">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Compose Mail
          </button>

          <div className="space-y-0.5">
            {[
              { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-3.5 h-3.5 text-cyan-400" />, count: emails.filter((m) => m.folder === 'inbox' && !m.read).length },
              { id: 'sent', label: 'Sent Messages', icon: <Send className="w-3.5 h-3.5 text-emerald-400" /> },
              { id: 'drafts', label: 'Drafts', icon: <FileEdit className="w-3.5 h-3.5 text-amber-400" /> },
              { id: 'trash', label: 'Trash', icon: <Trash2 className="w-3.5 h-3.5 text-slate-400" /> },
              { id: 'spam', label: 'Spam Filter', icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFolder(f.id as any);
                  setSelectedEmailId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeFolder === f.id
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {f.icon}
                  <span>{f.label}</span>
                </div>
                {f.count !== undefined && f.count > 0 && (
                  <span className="text-[10px] font-mono bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono block">CLIENT IDENTITY</span>
          <span className="text-xs font-semibold text-slate-300 block truncate">{user.email}</span>
          <span className="text-[10px] text-purple-400 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3" /> PGP/E2EE Ready
          </span>
        </div>
      </div>

      {/* Message List Pane */}
      <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus-within:border-cyan-500 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {folderEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Folder is empty.
            </div>
          ) : (
            folderEmails.map((email) => {
              const isSelected = selectedEmailId === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/80 border-l-2 border-l-cyan-400'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className={`font-semibold truncate max-w-[140px] ${!email.read ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
                      {email.sender}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{email.timestamp}</span>
                  </div>

                  <h5 className={`text-xs truncate mb-1 ${!email.read ? 'font-bold text-white' : 'text-slate-200'}`}>
                    {email.subject}
                  </h5>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {email.preview}
                  </p>

                  {email.isEncrypted && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                      <Lock className="w-2.5 h-2.5" /> Encrypted
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reading / Detail View Pane */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        {selectedEmail ? (
          <div className="max-w-3xl space-y-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setToInput(selectedEmail.senderEmail);
                    setSubjectInput(`Re: ${selectedEmail.subject}`);
                    setShowCompose(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Reply
                </button>
                <button
                  onClick={() => deleteEmail(selectedEmail.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 hover:border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>

              {selectedEmail.isEncrypted && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800/40">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-Bit PGP E2EE Verified</span>
                </div>
              )}
            </div>

            {/* Email Header */}
            <div>
              <h2 className="text-base font-bold text-slate-100">{selectedEmail.subject}</h2>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <div>
                  <span className="font-semibold text-slate-200">{selectedEmail.sender}</span>
                  <span className="text-slate-500 font-mono ml-2">&lt;{selectedEmail.senderEmail}&gt;</span>
                </div>
                <span className="font-mono text-slate-500">{selectedEmail.timestamp}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
              {selectedEmail.body}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Mail className="w-12 h-12 text-slate-700 mb-2" />
            Select an email message from the list to preview details.
          </div>
        )}
      </div>

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSendSubmit}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                Compose Encrypted Pluto Message
              </h3>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Recipient Email</label>
              <input
                type="email"
                required
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                placeholder="evelyn.vance@pluto-os.internal"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Subject</label>
              <input
                type="text"
                required
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="Subject directive..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Message Body</label>
              <textarea
                required
                rows={6}
                value={bodyInput}
                onChange={(e) => setBodyInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={encryptMail}
                  onChange={(e) => setEncryptMail(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-0"
                />
                <span className="flex items-center gap-1 text-purple-400">
                  <Lock className="w-3 h-3" /> End-to-End Encrypted (AES-GCM-256)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Message
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
