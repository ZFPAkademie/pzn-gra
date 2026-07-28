/**
 * Správa počtu volných družstevních podílů — pro asistentku, chráněno PINem.
 * /sprava-podilu — hodnota se propíše na veřejnou stránku /podil.
 */

import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { hasPodilAccess } from './auth';
import { PinForm, SharesEditor } from './sprava-client';

export const dynamic = 'force-dynamic';

const TOTAL_SHARES = 50;

export const metadata = {
  title: 'Správa podílů — Pod Zlatým návrším',
  robots: { index: false, follow: false },
};

export default async function SpravaPodiluPage() {
  const authorized = hasPodilAccess();

  let current = TOTAL_SHARES;
  let updatedAt: string | null = null;

  if (authorized) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value, updated_at')
      .eq('key', 'podil_available')
      .maybeSingle();
    const parsed = parseInt(data?.value ?? '', 10);
    if (!Number.isNaN(parsed)) current = Math.min(Math.max(parsed, 0), TOTAL_SHARES);
    updatedAt = data?.updated_at ?? null;
  }

  return (
    <div className="min-h-screen bg-[#0B1626] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-2">
            Pod Zlatým návrším
          </p>
          <h1 className="text-white font-light text-2xl">Správa podílů</h1>
        </div>

        <div className="bg-white rounded-sm p-8">
          {authorized ? (
            <SharesEditor current={current} total={TOTAL_SHARES} updatedAt={updatedAt} />
          ) : (
            <PinForm />
          )}
        </div>

        <p className="text-white/30 text-xs text-center mt-6">
          Změna se ihned projeví na stránce /podil.
        </p>
      </div>
    </div>
  );
}
