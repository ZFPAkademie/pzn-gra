import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function PortalHomePage() {
  const user = await getServerUser();
  if (!user) redirect('/portal/login');

  const admin = createSupabaseAdminClient();

  const { data: owner } = await admin
    .from('owners')
    .select('id, name, email, phone, bank_account, commission_rate')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!owner) redirect('/portal/login?error=no_access');

  const { data: apartments } = await admin
    .from('apartments')
    .select('id, slug, unit, building, layout, area_m2, floor, features, in_rental_program')
    .eq('owner_id', owner.id)
    .order('unit');

  const apts = apartments ?? [];

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">
          {apts.length > 1 ? 'Moje apartmány' : 'Můj apartmán'}
        </h1>
      </div>

      {apts.length > 0 ? (
        <div className="space-y-6">
          {/* Základní info — karta pro každý apartmán */}
          {apts.map((apt) => (
            <div key={apt.id} className="bg-white border border-[#0B1626]/10 rounded-sm p-6">
              <h2 className="text-[#0B1626] font-light text-lg mb-5 pb-3 border-b border-[#0B1626]/10">
                {apts.length > 1 ? `${apt.building} — ${apt.unit}` : 'Základní informace'}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Chata</dt>
                  <dd className="text-[#0B1626] font-light">{apt.building || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Jednotka</dt>
                  <dd className="text-[#0B1626] font-light">{apt.unit || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Dispozice</dt>
                  <dd className="text-[#0B1626] font-light">{apt.layout || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Plocha</dt>
                  <dd className="text-[#0B1626] font-light">{apt.area_m2 ? `${apt.area_m2} m²` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Patro</dt>
                  <dd className="text-[#0B1626] font-light">{apt.floor ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Program pronájmu</dt>
                  <dd className="text-[#0B1626] font-light">
                    {apt.in_rental_program ? (
                      <span className="text-green-700">Aktivní</span>
                    ) : (
                      <span className="text-[#0B1626]/40">Neaktivní</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          ))}

          {/* Kontakt a finance */}
          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-6">
            <h2 className="text-[#0B1626] font-light text-lg mb-5 pb-3 border-b border-[#0B1626]/10">
              Váš profil
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Jméno</dt>
                <dd className="text-[#0B1626] font-light">{owner.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Email</dt>
                <dd className="text-[#0B1626] font-light">{owner.email || user.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Telefon</dt>
                <dd className="text-[#0B1626] font-light">{owner.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Bankovní účet</dt>
                <dd className="text-[#0B1626] font-light">{owner.bank_account || '—'}</dd>
              </div>
              {owner.commission_rate && (
                <div>
                  <dt className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Provize</dt>
                  <dd className="text-[#0B1626] font-light">{Math.round(owner.commission_rate * 100)} %</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 pt-4 border-t border-[#0B1626]/10">
              <a
                href="/portal/profil"
                className="text-[#C9A24D] text-sm hover:underline underline-offset-2"
              >
                Upravit profil
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light">K vašemu účtu není přiřazen žádný apartmán.</p>
          <p className="text-[#0B1626]/30 text-sm mt-2">Kontaktujte správce pro nastavení přístupu.</p>
        </div>
      )}
    </div>
  );
}
