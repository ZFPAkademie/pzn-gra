import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card';

export const alt = 'Pod Zlatým návrším — apartmány u lanovky Labská ve Špindlerově Mlýně';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: 'Pronájem · Prodej',
    title: 'Apartmány u lanovky ve Špindlerově Mlýně',
    subtitle: '50 m od sjezdovky Labská, rezervace online',
  });
}
