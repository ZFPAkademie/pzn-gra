/**
 * Přehled volných družstevních podílů — pro asistentku, chráněno PINem.
 * /sprava-podilu — od 11/2026 jen zobrazení: počet se počítá z evidence v admin
 * sekci Družstvo (Rezervace + Vlastník), ručně se už nemění.
 */

import { getCoopShareSummary } from '@/lib/coop';
import { hasPodilAccess } from './auth';
import { PinForm, SharesStatus } from './sprava-client';

export const dynamic = 'force-dynamic';

const TOTAL_SHARES = 50;

export const metadata = {
  title: 'Správa podílů — Pod Zlatým návrším',
  robots: { index: false, follow: false },
};

export default async function SpravaPodiluPage() {
  const authorized = hasPodilAccess();

  let summary: { available: number; owned: number; reserved: number } | null = null;
  let loadError = false;

  if (authorized) {
    try {
      summary = await getCoopShareSummary();
    } catch {
      loadError = true;
    }
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
            <SharesStatus summary={summary} total={TOTAL_SHARES} loadError={loadError} />
          ) : (
            <PinForm />
          )}
        </div>

        <p className="text-white/30 text-xs text-center mt-6">
          Stejné číslo je na stránce /podil.
        </p>
      </div>
    </div>
  );
}
