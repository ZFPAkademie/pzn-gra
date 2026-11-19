'use client';

/**
 * Contact Form - Design Checklist 2030
 * Diskrétní, minimalistický
 */

import { useState } from 'react';
import { trackConversion } from '@/components/features/site-analytics';
import { useAntispam } from '@/lib/forms/antispam';
import { EmailSuggestion } from '@/lib/forms/email-suggestion';
import { validateEmail, validateMessage, validateName, validatePhone } from '@/lib/forms/validation';

interface ContactFormProps {
  locale: string;
}

export function ContactForm({ locale }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const antispam = useAntispam();

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
    success: 'Thank you for your message. We will be in touch as soon as possible.',
    error: 'Something went wrong. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const field = (k: string) => String(formData.get(k) ?? '');

    // Stejné kontroly jako na serveru — člověk hned ví, co opravit
    const invalid = [
      validateName(field('name'), { required: true, locale }),
      validateEmail(field('email'), { required: true, locale }),
      validatePhone(field('phone'), { locale }),
      validateMessage(field('message'), { required: true, locale, max: 4000 }),
    ].find((c) => !c.ok);
    if (invalid) {
      setErrorText(invalid.error ?? null);
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorText(null);
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          message: formData.get('message'),
          ...antispam.payload(),
        }),
      });

      if (res.ok) {
        trackConversion('contact_submit');
        setStatus('success');
      } else {
        const data = await res.json().catch(() => null);
        setErrorText(typeof data?.error === 'string' ? data.error : null);
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
      {antispam.fields}
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
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-navy/20 text-navy focus:border-gold focus:ring-0 outline-none transition-colors"
        />
        <EmailSuggestion email={email} locale={locale} onAccept={setEmail} />
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
        <p className="text-red-600 text-sm" role="alert">{errorText ?? t.error}</p>
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
