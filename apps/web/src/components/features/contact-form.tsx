'use client';

/**
 * Contact Form - Design Checklist 2030
 * Diskrétní, minimalistický
 */

import { useState } from 'react';

interface ContactFormProps {
  locale: string;
}

export function ContactForm({ locale }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const t = locale === 'cs' ? {
    name: 'Jméno',
    email: 'E-mail',
    phone: 'Telefon',
    message: 'Zpráva',
    submit: 'Odeslat',
    sending: 'Odesílám...',
    success: 'Děkujeme za zprávu. Ozveme se vám co nejdříve.',
    error: 'Něco se pokazilo. Zkuste to prosím znovu.',
  } : {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    message: 'Message',
    submit: 'Send',
    sending: 'Sending...',
    success: 'Thank you for your message. We will get back to you soon.',
    error: 'Something went wrong. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          message: formData.get('message'),
        }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="py-12 text-center">
        <p className="text-navy/70">{t.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="block text-sm text-navy/40 mb-3">{t.name}</label>
        <input
          type="text"
          name="name"
          required
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-navy/20 text-navy focus:border-gold focus:ring-0 outline-none transition-colors"
        />
      </div>
      
      <div>
        <label className="block text-sm text-navy/40 mb-3">{t.email}</label>
        <input
          type="email"
          name="email"
          required
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-navy/20 text-navy focus:border-gold focus:ring-0 outline-none transition-colors"
        />
      </div>
      
      <div>
        <label className="block text-sm text-navy/40 mb-3">{t.phone}</label>
        <input
          type="tel"
          name="phone"
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-navy/20 text-navy focus:border-gold focus:ring-0 outline-none transition-colors"
        />
      </div>
      
      <div>
        <label className="block text-sm text-navy/40 mb-3">{t.message}</label>
        <textarea
          name="message"
          rows={4}
          required
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-navy/20 text-navy focus:border-gold focus:ring-0 outline-none transition-colors resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">{t.error}</p>
      )}
      
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-10 py-4 bg-navy text-white text-sm tracking-widest uppercase hover:bg-navy-700 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? t.sending : t.submit}
      </button>
    </form>
  );
}
