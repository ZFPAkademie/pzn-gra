/**
 * Admin Channel Manager
 * /admin/channel-manager
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { SyncAllButton, AddConnectionButton, ConnectionActions } from './channel-manager-client';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://pzn-gra.vercel.app';

const channelLabels: Record<string, string> = {
  booking_com: 'Booking.com',
  airbnb: 'Airbnb',
  other: 'Jiný',
};

export default async function AdminChannelManagerPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const { data: apartments } = await supabase
    .from('apartments')
    .select('id, slug, title, for_rent, ical_export_token')
    .eq('for_rent', true)
    .order('slug');

  const { data: connections } = await supabase
    .from('channel_connections')
    .select('*')
    .order('created_at', { ascending: false });

  const connectionsByApartment: Record<string, typeof connections> = {};
  for (const conn of connections ?? []) {
    if (!connectionsByApartment[conn.apartment_id]) {
      connectionsByApartment[conn.apartment_id] = [];
    }
    connectionsByApartment[conn.apartment_id]!.push(conn);
  }

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light text-navy">Channel Manager</h1>
          <SyncAllButton />
        </div>

        <div className="space-y-6">
          {(apartments ?? []).map((apt) => {
            const conns = connectionsByApartment[apt.id] ?? [];
            const exportUrl = `${BASE_URL}/api/v1/ical/${apt.ical_export_token}`;

            return (
              <div key={apt.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Apartment header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{apt.title ?? apt.slug}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Export URL (pro Booking.com/Airbnb):</p>
                    <p className="text-xs font-mono text-slate-500 mt-0.5 break-all">{exportUrl}</p>
                  </div>
                  <AddConnectionButton apartmentId={apt.id} apartmentTitle={apt.title ?? apt.slug} />
                </div>

                {/* Connections list */}
                {conns.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-slate-400">
                    Žádné napojení. Přidej iCal URL z Booking.com nebo Airbnb.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead>
                      <tr className="bg-stone/50">
                        <th className="px-5 py-2 text-left text-xs text-slate-500 uppercase tracking-wider">Kanál</th>
                        <th className="px-5 py-2 text-left text-xs text-slate-500 uppercase tracking-wider">iCal URL</th>
                        <th className="px-5 py-2 text-left text-xs text-slate-500 uppercase tracking-wider">Poslední sync</th>
                        <th className="px-5 py-2 text-left text-xs text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-2 text-right text-xs text-slate-500 uppercase tracking-wider">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {conns.map((conn) => (
                        <tr key={conn.id} className="hover:bg-stone/30 transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-navy whitespace-nowrap">
                            {channelLabels[conn.channel] ?? conn.channel}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 font-mono max-w-xs truncate">
                            {conn.ical_url}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {conn.last_synced_at
                              ? new Date(conn.last_synced_at).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                            {conn.last_sync_count != null && conn.last_synced_at && (
                              <span className="ml-1 text-slate-400">({conn.last_sync_count} bloků)</span>
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {conn.last_sync_error ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-red-50 text-red-700">
                                Chyba
                              </span>
                            ) : conn.sync_enabled ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-green-50 text-green-700">
                                Aktivní
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-500">
                                Vypnuto
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <ConnectionActions connectionId={conn.id} syncEnabled={conn.sync_enabled} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
