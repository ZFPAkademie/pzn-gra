import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { syncAllConnections, syncConnection } from '@/lib/ical-sync';

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const connectionId = body?.connectionId as string | undefined;

    const results = connectionId
      ? [await syncConnection(connectionId)]
      : await syncAllConnections();

    const totalImported = results.reduce((s, r) => s + r.imported, 0);
    const errors = results.filter((r) => r.error);

    return NextResponse.json({ ok: true, results, totalImported, errors: errors.length });
  } catch (err) {
    console.error('[ical/sync] error:', err);
    return NextResponse.json({ error: 'Sync selhal' }, { status: 500 });
  }
}
