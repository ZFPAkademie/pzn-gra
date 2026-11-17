import { NextRequest, NextResponse } from 'next/server';
import { withCronRun } from '@/lib/cron-run';
import { syncAllConnections } from '@/lib/ical-sync';

// Build nemá routu renderovat staticky (DynamicServerError → falešný řádek v cron_runs, Vibekodex SHIP-04)
export const dynamic = "force-dynamic";

// Called by Vercel Cron — secured via CRON_SECRET header
async function handler(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await syncAllConnections();
    const totalImported = results.reduce((s, r) => s + r.imported, 0);
    console.log(`[cron/ical-sync] Done. ${results.length} connections, ${totalImported} blocks imported.`);
    return NextResponse.json({ ok: true, connections: results.length, totalImported });
  } catch (err) {
    console.error('[cron/ical-sync] error:', err);
    return NextResponse.json({ error: 'Sync selhal' }, { status: 500 });
  }
}

// Evidence běhu do cron_runs (Vibekodex SHIP-04) — čte ji týdenní kontrola produkce.
export const GET = withCronRun('ical-sync', handler);
