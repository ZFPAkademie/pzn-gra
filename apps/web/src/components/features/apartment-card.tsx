/**
 * Apartment Card - Design Checklist 2030
 * 
 * Pravidla:
 * - ŽÁDNÉ ikony (domečky zakázány!)
 * - Fotografie = hlavní prvek
 * - Cena sekundární
 * - CTA klidné
 * - Technické údaje jako metadata
 */

import Link from 'next/link';

interface ApartmentCardProps {
  title: string;
  slug: string;
  area: string;
  rooms: number;
  price?: string;
  mode: 'rent' | 'sale';
  locale: string;
}

export function ApartmentCard({
  title,
  slug,
  area,
  rooms,
  price,
  mode,
  locale,
}: ApartmentCardProps) {
  const href = mode === 'rent' 
    ? `/golden-ridge-apartments/apartman/${slug}`
    : `/apartmany-prodej/${slug}`;

  const t = locale === 'cs' ? {
    rooms: 'místností',
    view: 'Zobrazit',
    priceOnRequest: 'Cena na vyžádání',
  } : {
    rooms: 'rooms',
    view: 'View',
    priceOnRequest: 'Price on request',
  };

  return (
    <Link href={href} className="group block">
      {/* Image placeholder - will be replaced with real photos */}
      <div className="aspect-[4/3] bg-stone-200 mb-6 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-300 group-hover:scale-105 transition-transform duration-700" />
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-xl font-light text-navy group-hover:text-gold transition-colors">
          {title}
        </h3>
        
        {/* Metadata - subtle, secondary */}
        <p className="text-sm text-navy/40 tracking-wide">
          {area} · {rooms} {t.rooms}
        </p>
        
        {/* Price or CTA */}
        <div className="pt-4 flex items-center justify-between">
          <span className="text-sm text-navy/50">
            {price || t.priceOnRequest}
          </span>
          <span className="text-sm text-navy/40 group-hover:text-gold transition-colors flex items-center">
            {t.view}
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
