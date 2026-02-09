/**
 * Admin Leads Inbox
 * /admin/leads
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getLeads, getLeadCounts } from '@/lib/leads-service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Status badge colors
const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-green-100 text-green-800',
  spam: 'bg-slate-100 text-slate-600',
};

// Type labels
const typeLabels: Record<string, string> = {
  rent_inquiry: 'Pronájem',
  sale_inquiry: 'Prodej',
  investment_inquiry: 'Investice',
  investment_share_request: 'Podíly',
  general_inquiry: 'Obecný',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  // Check authentication
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect('/admin/login');
  }

  // Get filter from URL
  const statusFilter = searchParams.status || undefined;

  // Fetch data
  const { leads, total } = await getLeads({ 
    status: statusFilter,
    limit: 100,
  });
  const counts = await getLeadCounts();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Leads Inbox
          </h1>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Odhlásit se
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/leads?status=new"
            className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
              statusFilter === 'new' ? 'ring-2 ring-sky-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-blue-600">{counts.new || 0}</div>
            <div className="text-sm text-slate-600">Nové</div>
          </Link>
          <Link
            href="/admin/leads?status=in_progress"
            className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
              statusFilter === 'in_progress' ? 'ring-2 ring-sky-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-yellow-600">{counts.in_progress || 0}</div>
            <div className="text-sm text-slate-600">V řešení</div>
          </Link>
          <Link
            href="/admin/leads?status=closed"
            className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
              statusFilter === 'closed' ? 'ring-2 ring-sky-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-green-600">{counts.closed || 0}</div>
            <div className="text-sm text-slate-600">Uzavřené</div>
          </Link>
          <Link
            href="/admin/leads"
            className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
              !statusFilter ? 'ring-2 ring-sky-500' : ''
            }`}
          >
            <div className="text-3xl font-bold text-slate-600">{total}</div>
            <div className="text-sm text-slate-600">Celkem</div>
          </Link>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Apartmán
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Žádné záznamy
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700">
                        {typeLabels[lead.type] || lead.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {lead.apartment_title || lead.apartment_slug || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[lead.status] || ''}`}>
                        {lead.status === 'new' && 'Nový'}
                        {lead.status === 'in_progress' && 'V řešení'}
                        {lead.status === 'closed' && 'Uzavřeno'}
                        {lead.status === 'spam' && 'Spam'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-sky-600 hover:text-sky-800 text-sm font-medium"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
