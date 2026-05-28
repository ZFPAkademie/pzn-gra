'use client';

/**
 * Contact Form Component
 * Sprint 1: Sale inquiry form per SPRINT_1_PLAN.md §5.2
 */

import { useState } from 'react';
import { Button, Input, Textarea } from '@/components/ui';
import { useLanguage } from '@/components/providers/language-provider';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function ContactForm() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('common.error');
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('common.error');
    }
    if (!formData.message.trim()) {
      newErrors.message = t('common.error');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'sale',
        }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <svg
          className="w-12 h-12 text-green-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-green-800 font-medium">{t('contact.formSuccess')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t('contact.formName')}
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <Input
        label={t('contact.formEmail')}
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <Input
        label={t('contact.formPhone')}
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
      />

      <Textarea
        label={t('contact.formMessage')}
        name="message"
        value={formData.message}
        onChange={handleChange}
        error={errors.message}
        rows={5}
        required
      />

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {t('contact.formError')}
        </div>
      )}

      <Button type="submit" disabled={status === 'loading'} className="w-full">
        {status === 'loading' ? t('common.loading') : t('contact.formSubmit')}
      </Button>
    </form>
  );
}
