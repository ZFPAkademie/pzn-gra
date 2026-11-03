import { apartmentOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card';

export const alt = 'Apartmán Pod Zlatým návrším ve Špindlerově Mlýně';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image({ params }: { params: { slug: string } }) {
  return apartmentOgCard(params.slug, 'rent');
}
