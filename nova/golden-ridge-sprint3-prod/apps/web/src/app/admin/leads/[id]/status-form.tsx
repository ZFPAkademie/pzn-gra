/**
 * Lead Status Form
 * Client component for updating lead status
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LeadStatusFormProps {
  leadId: string;
  currentStatus: string;
  currentNotes: string;
}

export function LeadStatusForm({ leadId, currentStatus, currentNotes }: LeadStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
        setSaving(false);
        return;
      }

      setMessage({ type: 'success', text: 'Uloženo' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'new', label: 'Nový', color: 'bg-blue-100 text-blue-800 border-blue-300' },
            { value: 'in_progress', label: 'V řešení', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
            { value: 'closed', label: 'Uzavřeno', color: 'bg-green-100 text-green-800 border-green-300' },
            { value: 'spam', label: 'Spam', color: 'bg-stone text-stone-700 border-stone-400' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`px-4 py-2 rounded-md border-2 font-medium transition-all ${
                status === option.value
                  ? `${option.color} border-current`
                  : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
          Interní poznámky
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-stone-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
          placeholder="Poznámky pro interní použití..."
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-sky-600 text-white font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Ukládám...' : 'Uložit změny'}
        </button>

        {message && (
          <span
            className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
