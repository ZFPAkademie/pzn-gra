'use client';

/**
 * MessageForm Component
 * Allows guests to send messages to the manager from token page
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MessageFormProps {
  token: string;
  guestEmail?: string;
  locale?: 'cs' | 'en';
  className?: string;
}

export function MessageForm({
  token,
  guestEmail = '',
  locale = 'cs',
  className,
}: MessageFormProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(guestEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    title: locale === 'cs' ? 'Napište nám' : 'Contact Us',
    description: locale === 'cs' 
      ? 'Máte dotaz nebo požadavek? Napište nám zprávu.'
      : 'Have a question or request? Send us a message.',
    email: locale === 'cs' ? 'Váš e-mail' : 'Your Email',
    message: locale === 'cs' ? 'Zpráva' : 'Message',
    messagePlaceholder: locale === 'cs' 
      ? 'Napište svůj dotaz nebo požadavek...'
      : 'Type your question or request...',
    send: locale === 'cs' ? 'Odeslat zprávu' : 'Send Message',
    sending: locale === 'cs' ? 'Odesílám...' : 'Sending...',
    success: locale === 'cs' 
      ? 'Zpráva byla odeslána. Odpovíme vám co nejdříve.'
      : 'Message sent. We will respond as soon as possible.',
    error: locale === 'cs' 
      ? 'Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.'
      : 'Failed to send message. Please try again.',
    minLength: locale === 'cs' 
      ? 'Zpráva musí mít alespoň 5 znaků.'
      : 'Message must be at least 5 characters.',
    sendAnother: locale === 'cs' ? 'Odeslat další zprávu' : 'Send another message',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim().length < 5) {
      setError(labels.minLength);
      return;
    }
    
    setSending(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/bookings/${token}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          guestEmail: email,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || labels.error);
      }
      
      setSent(true);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setSending(false);
    }
  };

  const handleSendAnother = () => {
    setSent(false);
    setMessage('');
    setError(null);
  };

  // Success state
  if (sent) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 mb-4">{labels.success}</p>
          <button
            onClick={handleSendAnother}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {labels.sendAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {labels.title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{labels.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Email field (if not pre-filled) */}
        {!guestEmail && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.email}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        )}

        {/* Message field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            {labels.message}
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError(null);
            }}
            rows={4}
            placeholder={labels.messagePlaceholder}
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
            )}
            required
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={sending || message.trim().length < 5}
          className={cn(
            'w-full py-2 px-4 rounded-md font-medium text-white transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            sending || message.trim().length < 5
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {sending ? labels.sending : labels.send}
        </button>
      </form>
    </div>
  );
}

export default MessageForm;
