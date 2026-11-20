import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';
import { ProfilForm } from './profil-form';

export default async function ProfilPage() {
  const user = await getServerUser();
  if (!user) redirect('/portal/login');

  const admin = createSupabaseAdminClient();
  const { data: owner } = await admin
    .from('owners')
    .select('id, name, phone, bank_account, company_name, company_id, company_vat_id, company_address')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!owner) redirect('/portal/login?error=no_access');

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">Můj profil</h1>
      </div>

      <div className="bg-white border border-[#0B1626]/10 rounded-sm p-6 max-w-lg">
        <h2 className="text-[#0B1626] font-light text-lg mb-5 pb-3 border-b border-[#0B1626]/10">
          Kontaktní a platební údaje
        </h2>
        <ProfilForm
          name={owner.name ?? ''}
          phone={owner.phone ?? ''}
          bank_account={owner.bank_account ?? ''}
        />
      </div>

      {/* Firma, která apartmán vlastní — vede správce (migrace 028) */}
      {owner.company_name && (
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-6 max-w-lg mt-6">
          <h2 className="text-[#0B1626] font-light text-lg mb-4 pb-3 border-b border-[#0B1626]/10">
            Vlastník apartmánu
          </h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-[#0B1626]/50 text-xs">Společnost</dt><dd className="text-[#0B1626]">{owner.company_name}</dd></div>
            {owner.company_id && <div><dt className="text-[#0B1626]/50 text-xs">IČO</dt><dd className="text-[#0B1626]">{owner.company_id}</dd></div>}
            {owner.company_vat_id && <div><dt className="text-[#0B1626]/50 text-xs">DIČ</dt><dd className="text-[#0B1626]">{owner.company_vat_id}</dd></div>}
            {owner.company_address && <div><dt className="text-[#0B1626]/50 text-xs">Sídlo</dt><dd className="text-[#0B1626]">{owner.company_address}</dd></div>}
          </dl>
          <p className="text-xs text-[#0B1626]/40 mt-4">Změnu údajů firmy nahlaste správci.</p>
        </div>
      )}
    </div>
  );
}
