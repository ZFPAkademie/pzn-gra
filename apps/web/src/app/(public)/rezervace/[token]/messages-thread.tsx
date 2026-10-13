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
  locale?: 'cs' | 'en';
}

const TEXTS = {
  cs: {
    title: 'Zprávy',
    subtitle: 'Komunikace s recepčním týmem',
    loading: 'Načítám...',
    emptyLine1: 'Máte dotaz k rezervaci nebo příjezdu?',
    emptyLine2: 'Napište nám — odpovíme do pár hodin.',
    team: 'Tým Pod Zlatým návrším',
    placeholder: 'Napište zprávu...',
    send: 'Odeslat',
    justNow: 'Právě teď',
    minAgo: (n: number) => `Před ${n} min`,
    hoursAgo: (n: number) => `Před ${n} hod`,
  },
  en: {
    title: 'Messages',
    subtitle: 'Conversation with our reception team',
    loading: 'Loading...',
    emptyLine1: 'Do you have a question about your reservation or arrival?',
    emptyLine2: 'Write to us — we will reply within a few hours.',
    team: 'Pod Zlatým návrším team',
    placeholder: 'Write a message...',
    send: 'Send',
    justNow: 'Just now',
    minAgo: (n: number) => `${n} min ago`,
    hoursAgo: (n: number) => `${n} h ago`,
  },
};

function timeAgo(dateStr: string, locale: 'cs' | 'en'): string {
  const t = TEXTS[locale];
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return t.justNow;
  if (diff < 3600) return t.minAgo(Math.floor(diff / 60));
  if (diff < 86400) return t.hoursAgo(Math.floor(diff / 3600));
  return d.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MessagesThread({ token, guestName, locale = 'cs' }: Props) {
  const t = TEXTS[locale];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

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

  // Roluje jen vnitřní box vlákna, ne celou stránku (scrollIntoView posouval
  // stránku na zprávy hned po načtení i po příchodu z odkazu).
  useEffect(() => {
    const el = threadRef.current;
    if (loaded && el) el.scrollTop = el.scrollHeight;
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
          <p className="text-sm font-medium text-[#0B1626]">{t.title}</p>
          <p className="text-[11px] text-[#0B1626]/40">{t.subtitle}</p>
        </div>
      </div>

      {/* Thread */}
      <div ref={threadRef} className="px-4 py-4 space-y-3 min-h-[120px] max-h-[320px] overflow-y-auto">
        {!loaded && (
          <p className="text-center text-[11px] text-[#0B1626]/30 py-4">{t.loading}</p>
        )}
        {loaded && messages.length === 0 && (
          <p className="text-center text-[12px] text-[#0B1626]/35 py-6 leading-relaxed">
            {t.emptyLine1}<br />{t.emptyLine2}
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
                  {isAdmin ? t.team : (msg.sender_name ?? guestName)} · {timeAgo(msg.created_at, locale)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={send} className="border-t border-[#0B1626]/8 flex items-end gap-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as unknown as React.FormEvent); } }}
          placeholder={t.placeholder}
          rows={1}
          className="flex-1 px-4 py-3.5 text-sm text-[#0B1626] placeholder:text-[#0B1626]/30 resize-none focus:outline-none bg-transparent"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-3.5 text-[#C9A24D] hover:text-[#b8913c] disabled:opacity-30 transition-colors flex-shrink-0"
          aria-label={t.send}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
