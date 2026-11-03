/**
 * Obchodní podmínky ubytování — texty v `@/data/legal` (cs + en + pl).
 */

import { Metadata } from 'next';
import { getRequestLocaleFull } from '@/lib/i18n-server';
import { TERMS } from '@/data/legal';
import { LegalPage } from '@/components/features/legal-page';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const doc = TERMS[getRequestLocaleFull()];
  return pageMetadata({
    title: `${doc.title} | Pod Zlatým návrším`,
    description: doc.intro,
    path: '/obchodni-podminky',
  });
}

export default function TermsPage() {
  return <LegalPage doc={TERMS[getRequestLocaleFull()]} />;
}
