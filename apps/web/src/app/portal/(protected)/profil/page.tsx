import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';
import { ProfilForm } from './profil-form';

export default async function ProfilPage() {
  const user = await getServerUser();
  if (!user) redirect('/portal/login');

  const admin = createSupabaseAdminClient();
  const { data: owner } = await admin
    .from('owners')
    .select('id, name, phone, bank_account')
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
    </div>
  );
}
