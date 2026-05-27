import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { parseICalFeed } from '@/lib/ical-parser';

export interface SyncResult {
  connectionId: string;
  channel: string;
  apartmentId: string;
  imported: number;
  deleted: number;
  error?: string;
}

async function syncConnection(connectionId: string): Promise<SyncResult> {
  const supabase = createSupabaseAdminClient();

  const { data: conn } = await supabase
    .from('channel_connections')
    .select('id, apartment_id, channel, ical_url')
    .eq('id', connectionId)
    .maybeSingle();

  if (!conn) {
    return { connectionId, channel: '', apartmentId: '', imported: 0, deleted: 0, error: 'Connection not found' };
  }

  let feedText: string;
  try {
    const res = await fetch(conn.ical_url, {
      headers: { 'User-Agent': 'PZN-Booking/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    feedText = await res.text();
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await supabase
      .from('channel_connections')
      .update({ last_sync_error: error, updated_at: new Date().toISOString() })
      .eq('id', connectionId);
    return { connectionId, channel: conn.channel, apartmentId: conn.apartment_id, imported: 0, deleted: 0, error };
  }

  const events = parseICalFeed(feedText);
  const today = new Date().toISOString().slice(0, 10);

  // Only future/ongoing events
  const futureEvents = events.filter((e) => e.endDate > today);

  // Upsert blocks
  let imported = 0;
  for (const ev of futureEvents) {
    // iCal DTEND is exclusive (day after last night), convert to inclusive for our schema
    const endDateInclusive = new Date(ev.endDate);
    endDateInclusive.setDate(endDateInclusive.getDate() - 1);
    const endDateStr = endDateInclusive.toISOString().slice(0, 10);

    if (endDateStr < ev.startDate) continue; // single-day non-event, skip

    const { error } = await supabase.from('blocked_dates').upsert(
      {
        apartment_id: conn.apartment_id,
        owner_id: null,
        source: conn.channel as 'booking_com' | 'airbnb' | 'other',
        start_date: ev.startDate,
        end_date: endDateStr,
        reason: ev.summary || conn.channel,
        external_uid: ev.uid,
        channel_connection_id: conn.id,
      },
      { onConflict: 'channel_connection_id,external_uid', ignoreDuplicates: false }
    );
    if (!error) imported++;
  }

  // Delete stale blocks from this connection that are no longer in the feed
  const activeUids = futureEvents.map((e) => e.uid);
  let deleted = 0;
  if (activeUids.length > 0) {
    const { data: stale } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('channel_connection_id', conn.id)
      .not('external_uid', 'in', `(${activeUids.map((u) => `"${u}"`).join(',')})`)
      .gt('end_date', today);

    if (stale && stale.length > 0) {
      await supabase
        .from('blocked_dates')
        .delete()
        .in('id', stale.map((r) => r.id));
      deleted = stale.length;
    }
  }

  await supabase
    .from('channel_connections')
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_count: imported,
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conn.id);

  console.log(`[ical-sync] ${conn.channel} / ${conn.apartment_id}: +${imported} blocks, -${deleted} stale`);
  return { connectionId, channel: conn.channel, apartmentId: conn.apartment_id, imported, deleted };
}

export async function syncAllConnections(): Promise<SyncResult[]> {
  const supabase = createSupabaseAdminClient();

  const { data: connections } = await supabase
    .from('channel_connections')
    .select('id')
    .eq('sync_enabled', true);

  if (!connections || connections.length === 0) return [];

  const results = await Promise.all(connections.map((c) => syncConnection(c.id)));
  return results;
}

export async function syncApartmentConnections(apartmentId: string): Promise<SyncResult[]> {
  const supabase = createSupabaseAdminClient();

  const { data: connections } = await supabase
    .from('channel_connections')
    .select('id')
    .eq('apartment_id', apartmentId)
    .eq('sync_enabled', true);

  if (!connections || connections.length === 0) return [];

  const results = await Promise.all(connections.map((c) => syncConnection(c.id)));
  return results;
}

export { syncConnection };
