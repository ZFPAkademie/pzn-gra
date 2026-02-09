/**
 * Sale Apartment Detail Page
 * Production v1: Static detail with CTA panel
 * 
 * URL: /apartmany-prodej/[slug]
 * 
 * CENA SE NEZOBRAZUJE, vždy „Cena na dotaz"
 * CTA: "Nezávazně poptat cenu" (per design doc)
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { 
  getApartmentBySlug, 
  formatAreaDisplay, 
} from '@/lib/apartments';
import { SaleDetailCTA } from './client';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const apartment = getApartmentBySlug(params.slug);
  
  if (!apartment || apartment.mode !== 'sale') {
    return { title: 'Apartmán nenalezen' };
  }

  return {
    title: `${apartment.title} | Prodej | Pod Zlatým návrším`,
    description: `${apartment.title} - ${formatAreaDisplay(apartment.m2.total)}. Luxusní apartmán na prodej v Krkonoších.`,
  };
}

export default async function SaleApartmentDetailPage({ params }: PageProps) {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const apartment = getApartmentBySlug(params.slug);

  if (!apartment || apartment.mode !== 'sale') {
    notFound();
  }

  const t = locale === 'cs' ? {
    back: 'Zpět na nabídku',
    badge: 'Prodej',
    priceLabel: 'Cena',
    priceValue: 'Na dotaz',
    areaLabel: 'Plocha',
    roomsLabel: 'Místnosti',
    buildingLabel: 'Budova',
    layoutTitle: 'Rozdělení ploch',
    total: 'Celkem',
    investTitle: 'Investiční příležitost',
    investText: 'Apartmány Pod Zlatým návrším představují exkluzivní investiční příležitost. Kombinace prémiové lokality, kvalitní výstavby a možnosti generovat pasivní příjem z pronájmu.',
    investLink: 'Více o investici',
  } : {
    back: 'Back to listings',
    badge: 'Sale',
    priceLabel: 'Price',
    priceValue: 'On request',
    areaLabel: 'Area',
    roomsLabel: 'Rooms',
    buildingLabel: 'Building',
    layoutTitle: 'Area breakdown',
    total: 'Total',
    investTitle: 'Investment opportunity',
    investText: 'Pod Zlatým návrším apartments represent an exclusive investment opportunity. A combination of premium location, quality construction, and the ability to generate passive rental income.',
    investLink: 'More about investment',
  };

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-stone py-4">
        <div className="max-w-6xl mx-auto px-6">
          <Link 
            href="/apartmany-prodej" 
            className="text-sm text-stone-700 hover:text-navy transition-colors"
          >
            ← {t.back}
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left: Images & Info (3 cols) */}
            <div className="lg:col-span-3">
              {/* Main image placeholder */}
              <div className="aspect-[4/3] bg-stone rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-stone-400">
                  <svg className="w-20 h-20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
                  </svg>
                </div>
              </div>

              {/* Thumbnail placeholders */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-stone rounded" />
                ))}
              </div>

              {/* Room breakdown */}
              <div className="mt-12">
                <h2 className="text-xl font-medium text-navy mb-6">{t.layoutTitle}</h2>
                <div className="space-y-3">
                  {apartment.m2.breakdown.map((room, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-stone-700">{room.room}</span>
                      <span className="font-medium text-navy">{room.m2.toFixed(2)} m²</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-navy">{t.total}</span>
                    <span className="font-medium text-navy">{apartment.m2.total.toFixed(2)} m²</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: CTA Panel (2 cols) */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 bg-white border border-stone-300 rounded-lg p-6 shadow-sm">
                {/* Badge */}
                <span className="inline-block bg-gold-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded mb-4">
                  {t.badge}
                </span>
                
                {/* Title */}
                <h1 className="text-2xl font-medium text-navy mb-4">
                  {apartment.title}
                </h1>

                {/* Price - VŽDY "Cena na dotaz" */}
                <div className="mb-6 p-4 bg-gold-50 rounded-lg border border-amber-200">
                  <div className="text-sm text-amber-700 mb-1">{t.priceLabel}</div>
                  <div className="text-2xl font-medium text-amber-900">
                    {t.priceValue}
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-100">
                  <div>
                    <div className="text-sm text-slate-500">{t.areaLabel}</div>
                    <div className="font-medium text-navy">{formatAreaDisplay(apartment.m2.total)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">{t.roomsLabel}</div>
                    <div className="font-medium text-navy">{apartment.m2.breakdown.length}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-slate-500">{t.buildingLabel}</div>
                    <div className="font-medium text-navy">{apartment.building}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <SaleDetailCTA 
                  apartment={{ slug: apartment.slug, title: apartment.title }}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Info */}
      <section className="py-12 md:py-16 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-xl font-medium text-navy mb-4">{t.investTitle}</h2>
            <p className="text-stone-700 mb-4">{t.investText}</p>
            <Link 
              href="/investicni-prilezitost"
              className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
            >
              {t.investLink}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
