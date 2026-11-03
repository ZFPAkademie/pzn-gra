/**
 * Obrázek pro sdílení (Open Graph 1200 × 630) v Alpine Quiet Luxury stylu:
 * navy panel s logem a titulkem vlevo, fotka vpravo.
 * Písmo a podklady jsou v `src/assets/og` (ne z CDN) — next.config je přibaluje k funkcím.
 */

import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const NAVY = '#0B1626';
const GOLD = '#C9A24D';
const CREAM = '#FAFAF7';

const asset = (name: string) => readFile(join(process.cwd(), 'src/assets/og', name));
const dataUri = (buf: Buffer, mime: string) => `data:${mime};base64,${buf.toString('base64')}`;

export async function ogCard(o: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Absolutní URL fotky (jpg/png); bez ní fotka domu */
  photo?: string | null;
}) {
  const [light, lightExt, medium, mediumExt, logo, building] = await Promise.all([
    asset('inter-latin-300-normal.ttf'),
    asset('inter-latin-ext-300-normal.ttf'),
    asset('inter-latin-500-normal.ttf'),
    asset('inter-latin-ext-500-normal.ttf'),
    asset('logo.png'),
    asset('building-front.jpg'),
  ]);

  const photo = o.photo ?? dataUri(building, 'image/jpeg');
  const fs = o.title.length > 48 ? 46 : o.title.length > 30 ? 54 : 62;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: NAVY, fontFamily: 'Inter' }}>
        {/* Fotka vpravo s přechodem do navy */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 640, height: 630, display: 'flex' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} width={640} height={630} style={{ width: 640, height: 630, objectFit: 'cover' }} alt="" />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 640, height: 630, display: 'flex', background: `linear-gradient(90deg, ${NAVY} 0%, rgba(11,22,38,0.55) 22%, rgba(11,22,38,0) 55%)` }} />
        </div>

        {/* Text vlevo */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 660, height: 630, padding: '56px 0 56px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUri(logo, 'image/png')} width={84} height={84} alt="" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 30, fontWeight: 300, color: CREAM, letterSpacing: 1 }}>Pod Zlatým návrším</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: GOLD, letterSpacing: 4, marginTop: 6 }}>ŠPINDLERŮV MLÝN</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 24 }}>
            {o.eyebrow && (
              <div style={{ fontSize: 18, fontWeight: 500, color: GOLD, letterSpacing: 4, marginBottom: 22, display: 'flex' }}>
                {o.eyebrow.toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: fs, fontWeight: 300, color: '#FFFFFF', lineHeight: 1.12, display: 'flex' }}>{o.title}</div>
            {o.subtitle && (
              <div style={{ fontSize: 24, fontWeight: 300, color: 'rgba(250,250,247,0.65)', marginTop: 22, lineHeight: 1.35, display: 'flex' }}>
                {o.subtitle}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 56, height: 2, background: GOLD, display: 'flex' }} />
            <div style={{ fontSize: 20, fontWeight: 500, color: 'rgba(250,250,247,0.8)', letterSpacing: 1 }}>podzlatymnavrsim.cz</div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Inter', data: light, weight: 300, style: 'normal' },
        { name: 'Inter', data: lightExt, weight: 300, style: 'normal' },
        { name: 'Inter', data: medium, weight: 500, style: 'normal' },
        { name: 'Inter', data: mediumExt, weight: 500, style: 'normal' },
      ],
    }
  );
}

/** Náhled detailu apartmánu — jeho první fotka, název, dispozice a plocha (crawler nemá cookie → čeština) */
export async function apartmentOgCard(slug: string, kind: 'sale' | 'rent') {
  const { getApartmentBySlugDB } = await import('@/lib/apartments');
  const { getApartmentHeroImage } = await import('@/data/apartment-images');
  const [apt, photo] = await Promise.all([getApartmentBySlugDB(slug), getApartmentHeroImage(slug)]);
  const area = apt?.area_m2 ? `${Number(apt.area_m2).toLocaleString('cs-CZ')} m²` : null;
  const facts = [apt?.layout, area].filter(Boolean).join(' · ');
  return ogCard({
    eyebrow: kind === 'sale' ? 'Apartmán na prodej' : 'Apartmán k pronájmu',
    title: apt?.title ?? 'Pod Zlatým návrším',
    subtitle: kind === 'sale' ? facts || undefined : [facts, '50 m od lanovky Labská'].filter(Boolean).join(' · '),
    photo,
  });
}
