'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCheckinInfo } from './actions';

interface CheckinInfo {
  door_code?: string;
  wifi_name?: string;
  wifi_password?: string;
  parking?: string;
  note?: string;
}

interface CheckinFormProps {
  bookingId: string;
  initialData: CheckinInfo;
}

export function CheckinForm({ bookingId, initialData }: CheckinFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CheckinInfo>({
    door_code: initialData.door_code || '',
    wifi_name: initialData.wifi_name || '',
    wifi_password: initialData.wifi_password || '',
    parking: initialData.parking || '',
    note: initialData.note || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (field: keyof CheckinInfo, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await updateCheckinInfo(bookingId, form);
    if (result.ok) {
      setMessage({ type: 'success', text: 'Uloženo' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Chyba při ukládání' });
    }
    setSaving(false);
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Kód ke dveřím</label>
          <input
            type="text"
            value={form.door_code}
            onChange={(e) => handleChange('door_code', e.target.value)}
            className={inputClass}
            placeholder="např. 1234"
          />
        </div>
        <div>
          <label className={labelClass}>Wi-Fi název</label>
          <input
            type="text"
            value={form.wifi_name}
            onChange={(e) => handleChange('wifi_name', e.target.value)}
            className={inputClass}
            placeholder="název sítě"
          />
        </div>
        <div>
          <label className={labelClass}>Wi-Fi heslo</label>
          <input
            type="text"
            value={form.wifi_password}
            onChange={(e) => handleChange('wifi_password', e.target.value)}
            className={inputClass}
            placeholder="heslo k Wi-Fi"
          />
        </div>
        <div>
          <label className={labelClass}>Parkování</label>
          <input
            type="text"
            value={form.parking}
            onChange={(e) => handleChange('parking', e.target.value)}
            className={inputClass}
            placeholder="instrukce k parkování"
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Pokyny k příjezdu</label>
        <textarea
          value={form.note}
          onChange={(e) => handleChange('note', e.target.value)}
          rows={4}
          className={inputClass + ' resize-none'}
          placeholder="Uvítací zpráva, instrukce k příjezdu..."
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-navy text-white text-sm font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Ukládám...' : 'Uložit pokyny'}
        </button>
        {message && (
          <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
