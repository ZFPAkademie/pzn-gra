'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendAdminMessage } from './actions';

interface Message {
  id: string;
  sender_role: string;
  sender_name: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface MessageThreadProps {
  bookingId: string;
  messages: Message[];
}

function formatMsgDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageThread({ bookingId, messages }: MessageThreadProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError(null);
    const result = await sendAdminMessage(bookingId, content);
    if (result.ok) {
      setContent('');
      router.refresh();
    } else {
      setError(result.error || 'Chyba při odesílání');
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      {/* Message list */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">Žádné zprávy</p>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_role === 'admin';
            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 ${
                    isAdmin
                      ? 'bg-navy text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className={`text-xs mb-1 ${isAdmin ? 'text-white/60' : 'text-slate-400'}`}>
                    {msg.sender_name || msg.sender_role} · {formatMsgDate(msg.created_at)}
                    {msg.sender_role === 'guest' && !msg.read_at && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white rounded text-xs">nová</span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply form */}
      <form onSubmit={handleSend} className="border-t border-slate-200 pt-4 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Napište odpověď..."
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="px-5 py-2 bg-navy text-white text-sm font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Odesílám...' : 'Odeslat'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </form>
    </div>
  );
}
