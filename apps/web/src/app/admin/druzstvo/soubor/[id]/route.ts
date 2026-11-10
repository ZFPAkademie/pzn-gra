/**
 * Admin — Družstvo: otevření / stažení přílohy
 * GET /admin/druzstvo/soubor/[id]            → 302 na signed URL (5 min), zobrazit v prohlížeči
 * GET /admin/druzstvo/soubor/[id]?download=1 → 302 na signed URL se stažením
 *
 * Obyčejný odkaz místo window.open po server action — ten Safari blokuje jako pop-up
 * a okno zůstávalo prázdné. Cookie adminu má path /admin, takže sem dorazí.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { fileExtension } from '@/lib/coop-shared';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function downloadName(title: string, ext: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'priloha';
  return `${base}.${ext}`;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (!UUID_RE.test(params.id)) return new NextResponse('Příloha neexistuje', { status: 404 });

  const supabase = createSupabaseAdminClient();
  const { data: file } = await supabase
    .from('coop_contact_files')
    .select('file_path, title')
    .eq('id', params.id)
    .maybeSingle();
  if (!file) return new NextResponse('Příloha neexistuje', { status: 404 });

  const download = request.nextUrl.searchParams.get('download') === '1';
  const { data, error } = await supabase.storage
    .from('dokumenty')
    .createSignedUrl(file.file_path, 300, download ? { download: downloadName(file.title, fileExtension(file.file_path)) } : undefined);

  if (error || !data?.signedUrl) return new NextResponse('Odkaz se nepodařilo vytvořit', { status: 502 });

  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}
