/**
 * Admin Lead Detail Page
 * /admin/leads/[id]
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getLeadById } from '@/lib/leads-service';
import { LeadStatusForm } from './status-form';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Type labels
const typeLabels: Record<string, string> = {
  rent_inquiry: 'Poptávka pronájmu',
  sale_inquiry: 'Poptávka prodeje',
  investment_inquiry: 'Investiční poptávka',
  investment_share_request: 'Poptávka podílů',
  general_inquiry: 'Obecný dotaz',
};

export default async function AdminLeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Check authentication
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect('/admin/login');
  }

  // Fetch lead
  const lead = await getLeadById(params.id);
  
  if (!lead) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/admin/leads"
            className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block"
          >
            ← Zpět na inbox
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Lead Detail
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Kontaktní údaje
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-slate-500">Jméno</dt>
                <dd className="text-slate-900 font-medium">
                  {lead.first_name} {lead.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">E-mail</dt>
                <dd>
                  <a 
                    href={`mailto:${lead.email}`}
                    className="text-sky-600 hover:text-sky-800"
                  >
                    {lead.email}
                  </a>
                </dd>
              </div>
              {lead.phone && (
                <div>
                  <dt className="text-sm text-slate-500">Telefon</dt>
                  <dd>
                    <a 
                      href={`tel:${lead.phone}`}
                      className="text-sky-600 hover:text-sky-800"
                    >
                      {lead.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Lead Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Informace o poptávce
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-slate-500">Typ</dt>
                <dd className="text-slate-900">
                  {typeLabels[lead.type] || lead.type}
                </dd>
              </div>
              {lead.apartment_title && (
                <div>
                  <dt className="text-sm text-slate-500">Apartmán</dt>
                  <dd className="text-slate-900">{lead.apartment_title}</dd>
                </div>
              )}
              {lead.preferred_dates && (
                <div>
                  <dt className="text-sm text-slate-500">Preferované termíny</dt>
                  <dd className="text-slate-900">{lead.preferred_dates}</dd>
                </div>
              )}
              {lead.guest_count && (
                <div>
                  <dt className="text-sm text-slate-500">Počet hostů</dt>
                  <dd className="text-slate-900">{lead.guest_count}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-slate-500">Vytvořeno</dt>
                <dd className="text-slate-900">{formatDate(lead.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Message */}
          {lead.message && (
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Zpráva
              </h2>
              <div className="bg-slate-50 rounded p-4 text-slate-700 whitespace-pre-wrap">
                {lead.message}
              </div>
            </div>
          )}

          {/* Status Management */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Status a poznámky
            </h2>
            <LeadStatusForm 
              leadId={lead.id} 
              currentStatus={lead.status} 
              currentNotes={lead.notes || ''} 
            />
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Metadata
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">ID</dt>
                <dd className="font-mono text-xs text-slate-600">{lead.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Jazyk</dt>
                <dd className="text-slate-900">{lead.language?.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">GDPR souhlas</dt>
                <dd className="text-slate-900">{lead.gdpr_consent ? '✓ Ano' : '✗ Ne'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Marketing souhlas</dt>
                <dd className="text-slate-900">{lead.marketing_consent ? '✓ Ano' : '✗ Ne'}</dd>
              </div>
              {lead.ip_address && (
                <div>
                  <dt className="text-slate-500">IP adresa</dt>
                  <dd className="font-mono text-xs text-slate-600">{lead.ip_address}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Poslední aktualizace</dt>
                <dd className="text-slate-900">{formatDate(lead.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
