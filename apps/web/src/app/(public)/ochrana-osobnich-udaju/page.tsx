/**
 * Zásady ochrany osobních údajů — texty v `@/data/legal` (cs + en + pl).
 * Na tuto adresu odkazuje souhlas v rezervačním formuláři.
 */

import { Metadata } from 'next';
import { getRequestLocaleFull } from '@/lib/i18n-server';
import { PRIVACY } from '@/data/legal';
import { LegalPage } from '@/components/features/legal-page';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const doc = PRIVACY[getRequestLocaleFull()];
  return pageMetadata({
    title: `${doc.title} | Pod Zlatým návrším`,
    description: doc.intro,
    path: '/ochrana-osobnich-udaju',
  });
}

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY[getRequestLocaleFull()]} />;
}
