/**
 * Apartmán k pronájmu - Detail page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getRentalApartmentBySlug, getRentalApartments, getSalesManager } from '@/lib/apartments';
import { getApartmentImages } from '@/data/apartment-images';
import { ApartmentGallery } from '@/components/features/apartment-gallery';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const apartments = getRentalApartments();
  return apartments.map((apt) => ({ slug: apt.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const apt = getRentalApartmentBySlug(params.slug);
  if (!apt) return { title: 'Apartmán nenalezen' };
  
  return {
    title: `${apt.title} | Pronájem | Pod Zlatým návrším`,
    description: apt.description,
  };
}

export default function RentalApartmentDetailPage({ params }: Props) {
  const apt = getRentalApartmentBySlug(params.slug);
  const manager = getSalesManager();
  const images = getApartmentImages(params.slug);
  
  if (!apt) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Zpět na přehled
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            {apt.alsoForSale && (
              <span className="px-4 py-2 bg-gold text-navy text-xs uppercase tracking-widest">
                I k prodeji
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            {apt.title}
          </h1>
          <div className="flex items-center gap-4 text-white/50">
            <span>{apt.layout}</span>
            <span>·</span>
            <span>{apt.totalArea}</span>
            <span>·</span>
            <span>max. {apt.maxGuests} hostů</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16">
            
            {/* Left: Details */}
            <div className="lg:col-span-2">
              {/* Gallery */}
              <div className="mb-16">
                <ApartmentGallery images={images} title={apt.title} />
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Plocha</p>
                  <p className="text-2xl font-light text-navy">{apt.totalArea}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Dispozice</p>
                  <p className="text-2xl font-light text-navy">{apt.layout}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Max. hostů</p>
                  <p className="text-2xl font-light text-navy">{apt.maxGuests}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Orientace</p>
                  <p className="text-2xl font-light text-navy">{apt.orientation}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-16">
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">O apartmánu</h2>
                <p className="text-navy/70 leading-relaxed text-lg">
                  {apt.description}
                </p>
              </div>

              {/* Room breakdown */}
              <div className="mb-16">
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">Členění</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone p-6">
                    <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Vstupní hala</p>
                    <p className="text-xl text-navy">{apt.rooms.hall}</p>
                  </div>
                  <div className="bg-stone p-6">
                    <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Koupelna</p>
                    <p className="text-xl text-navy">{apt.rooms.bathroom}</p>
                  </div>
                  {apt.rooms.bedroom && (
                    <div className="bg-stone p-6">
                      <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Ložnice</p>
                      <p className="text-xl text-navy">{apt.rooms.bedroom}</p>
                    </div>
                  )}
                  <div className="bg-stone p-6">
                    <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">Pokoj s kuchyní</p>
                    <p className="text-xl text-navy">{apt.rooms.livingKitchen}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">Vybavení</h2>
                <div className="flex flex-wrap gap-3">
                  {apt.features.map((feature, i) => (
                    <span key={i} className="px-4 py-2 bg-stone text-navy text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Booking Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Rental Card */}
              <div className="bg-navy p-8">
                <p className="text-gold text-sm tracking-widest uppercase mb-4">Pronájem od</p>
                <div className="flex items-baseline mb-2">
                  <p className="text-4xl font-light text-white">
                    {apt.pricePerNight.toLocaleString('cs-CZ')}
                  </p>
                  <p className="text-white/50 ml-2">Kč / noc</p>
                </div>
                <p className="text-white/30 text-sm mb-8">
                  Ceny se mohou lišit dle sezóny
                </p>
                
                <Link 
                  href="/kontakt"
                  className="flex items-center justify-center w-full py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors mb-4"
                >
                  Poptat rezervaci
                </Link>
                
                <div className="border-t border-white/10 pt-6 mt-6">
                  <p className="text-white/50 text-sm mb-4">Nebo nás kontaktujte přímo:</p>
                  <a 
                    href="mailto:rezervace@podzlatymnavrsim.cz"
                    className="flex items-center text-white hover:text-gold transition-colors text-sm"
                  >
                    <svg className="w-4 h-4 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    rezervace@podzlatymnavrsim.cz
                  </a>
                </div>
              </div>

              {/* Sale Card - only if alsoForSale */}
              {apt.alsoForSale && (
                <div className="bg-stone p-8 border-2 border-gold">
                  <p className="text-gold text-sm tracking-widest uppercase mb-4">Tento apartmán je i k prodeji</p>
                  <p className="text-navy/70 text-sm mb-6">
                    Díky vybavení apartmánu můžete ihned bez dalších nákladů profitovat z pronájmu jednotky.
                  </p>
                  
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                      <Image
                        src={manager.photo}
                        alt={manager.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="text-navy font-medium">{manager.name}</p>
                      <p className="text-navy/50 text-xs">{manager.title}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <a 
                      href={`tel:${manager.phone.replace(/\s/g, '')}`}
                      className="flex items-center justify-center w-full py-3 bg-navy text-white text-sm uppercase tracking-widest hover:bg-navy/90 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {manager.phone}
                    </a>
                    <a 
                      href={`mailto:${manager.email}?subject=Zájem o koupi ${apt.title}`}
                      className="flex items-center justify-center w-full py-3 border border-navy text-navy text-sm uppercase tracking-widest hover:bg-navy/5 transition-colors"
                    >
                      Napsat e-mail
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Other apartments */}
      <section className="py-16 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">
            Prohlédněte si další dostupné apartmány
          </p>
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            Všechny apartmány k pronájmu
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
