import { NextRequest, NextResponse } from 'next/server';
import { syncFdmCalendar } from '@/lib/fdm/sync';

export const maxDuration = 60;

// Vercel Cron — chráněno CRON_SECRET (stejně jako ical-sync)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncFdmCalendar();
    console.log(`[cron/fdm-sync] ok=${result.ok} apartments=${result.apartments} days=${result.days} ${result.error ?? ''}`);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    console.error('[cron/fdm-sync] error:', err);
    return NextResponse.json({ error: 'Sync selhal' }, { status: 500 });
  }
}
