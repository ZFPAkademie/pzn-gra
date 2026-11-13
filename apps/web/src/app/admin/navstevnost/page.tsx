/**
 * Admin — Návštěvnost: Vibekodex Insight (vk-analytics, sdílený modul)
 * Měří se jen návštěvníci se souhlasem s analytickými cookies (lišta na webu).
 * Zdroje, stránky, konverze (rezervace, poptávky, podíly, kliky na telefon/e-mail), AI crawleři.
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { VkDashboard } from '@vk/ui/VkDashboard';
import '@vk/ui/vk.css';
import { AdminNav } from '../_components/admin-nav';

export const dynamic = 'force-dynamic';
// ruční měření AI viditelnosti běží jako server action stránky (rozpočet 270 s)
export const maxDuration = 300;

export default async function NavstevnostPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-stone pb-20 md:pb-0">
      <AdminNav />
      <div
        className="text-navy"
        style={{ ['--accent' as string]: '#0B1626', ['--accent-on' as string]: '#FFFFFF' }}
      >
        <VkDashboard searchParams={searchParams} title="Návštěvnost" />
      </div>
    </div>
  );
}
