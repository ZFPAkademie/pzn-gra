import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';
import { PortalNav } from './portal-nav';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect('/portal/login');

  // Načti owner record + apartmány
  const admin = createSupabaseAdminClient();
  const { data: owner } = await admin
    .from('owners')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!owner) redirect('/portal/login?error=no_access');

  const { data: apartments } = await admin
    .from('apartments')
    .select('id, slug, unit, building, in_rental_program')
    .eq('owner_id', owner.id)
    .order('unit');

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex">
      <PortalNav
        ownerName={owner.name}
        apartments={apartments || []}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 ml-64">
        <div className="max-w-4xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
