/**
 * Redirect to /suites/[slug]
 */

import { redirect } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export default function ApartmanyProdejDetailPage({ params }: Props) {
  redirect(`/suites/${params.slug}`);
}
