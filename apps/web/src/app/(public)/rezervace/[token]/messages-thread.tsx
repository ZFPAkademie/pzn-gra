'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  sender_role: 'guest' | 'admin' | 'system';
  sender_name: string | null;
  content: string;
  created_at: string;
}

interface Props {
  token: string;
  guestName: string;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Právě teď';
  if (diff < 3600) return `Před ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Před ${Math.floor(diff / 3600)} hod`;
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MessagesThread({ token, guestName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await fetch(`/api/v1/rezervace/${token}/messages`);
      if (!r.ok) return;
      const j = await r.json();
      setMessages(j.messages ?? []);
      setLoaded(true);
    } catch { /* */ }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000); // poll každých 30s
    return () => clearInterval(timer);
  }, [token]);

  useEffect(() => {
    if (loaded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loaded]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const r = await fetch(`/api/v1/rezervace/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (r.ok) {
        setInput('');
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white border border-[#0B1626]/10 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#0B1626]/8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0B1626] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#C9A24D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-[#0B1626]">Zprávy</p>
          <p className="text-[11px] text-[#0B1626]/40">Komunikace s recepčním týmem</p>
        </div>
      </div>

      {/* Thread */}
      <div className="px-4 py-4 space-y-3 min-h-[120px] max-h-[320px] overflow-y-auto">
        {!loaded && (
          <p className="text-center text-[11px] text-[#0B1626]/30 py-4">Načítám...</p>
        )}
        {loaded && messages.length === 0 && (
          <p className="text-center text-[12px] text-[#0B1626]/35 py-6 leading-relaxed">
            Máte dotaz k rezervaci nebo příjezdu?<br />Napište nám — odpovíme do pár hodin.
          </p>
        )}

        {messages.map((msg) => {
          const isAdmin = msg.sender_role === 'admin';
          const isSystem = msg.sender_role === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-[10px] text-[#0B1626]/30 bg-[#0B1626]/5 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] ${isAdmin ? 'order-2' : ''}`}>
                <div className={`
                  px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isAdmin
                    ? 'bg-[#0B1626] text-white rounded-tl-sm'
                    : 'bg-[#C9A24D]/15 text-[#0B1626] rounded-tr-sm'
                  }
                `}>
                  {msg.content}
                </div>
                <p className={`text-[10px] text-[#0B1626]/30 mt-1 ${isAdmin ? 'text-left' : 'text-right'}`}>
                  {isAdmin ? 'Tým Pod Zlatým návrším' : (msg.sender_name ?? guestName)} · {timeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="border-t border-[#0B1626]/8 flex items-end gap-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as unknown as React.FormEvent); } }}
          placeholder="Napište zprávu..."
          rows={1}
          className="flex-1 px-4 py-3.5 text-sm text-[#0B1626] placeholder:text-[#0B1626]/30 resize-none focus:outline-none bg-transparent"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-3.5 text-[#C9A24D] hover:text-[#b8913c] disabled:opacity-30 transition-colors flex-shrink-0"
          aria-label="Odeslat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
