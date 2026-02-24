/**
 * Apartmány k pronájmu - Design 2030
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getRentalApartments } from '@/lib/apartments';
import { getApartmentHeroImage } from '@/data/apartment-images';

export const metadata: Metadata = {
  title: 'Apartmány k pronájmu | Pod Zlatým návrším | Špindlerův Mlýn',
  description: 'Luxusní apartmány k pronájmu ve Špindlerově Mlýně, přímo u lanovky. Plně vybavené, designový nábytek KARE.',
};

export default function RentalApartmentsPage() {
  const apartments = getRentalApartments();

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            Pronájem
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6">
            Apartmány k pronájmu
          </h1>
          <p className="text-xl text-white/50 max-w-xl">
            Luxusní apartmány ve Špindlerově Mlýně, přímo u lanovky Labská. Plně vybavené, designový nábytek KARE.
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-gold py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-navy">
            <div className="text-center">
              <p className="text-3xl font-light">{apartments.length}</p>
              <p className="text-sm opacity-70">apartmánů</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light">35–45</p>
              <p className="text-sm opacity-70">m² plocha</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light">2–4</p>
              <p className="text-sm opacity-70">hosté</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light">50 m</p>
              <p className="text-sm opacity-70">od lanovky</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apartments Grid */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apartments.map((apt) => {
              const heroImage = getApartmentHeroImage(apt.slug);
              return (
                <Link 
                  key={apt.slug} 
                  href={`/apartmany-spindleruv-mlyn-pronajem/${apt.slug}`}
                  className="group block bg-white"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-stone overflow-hidden">
                    {heroImage ? (
                      <Image
                        src={heroImage}
                        alt={apt.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-navy/10" />
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-white/90 text-navy text-xs">
                        {apt.layout} · {apt.totalArea}
                      </span>
                    </div>
                    {apt.alsoForSale && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-gold text-navy text-xs uppercase tracking-wider">
                          I k prodeji
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-light text-navy group-hover:text-gold transition-colors mb-2">
                      {apt.title}
                    </h2>
                    
                    <div className="flex items-center gap-4 text-sm text-navy/50 mb-4">
                      <span>max. {apt.maxGuests} hostů</span>
                      <span>·</span>
                      <span>{apt.orientation}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-navy/10">
                      <div>
                        <p className="text-2xl font-light text-navy">
                          {apt.pricePerNight.toLocaleString('cs-CZ')} Kč
                        </p>
                        <p className="text-xs text-navy/40">za noc</p>
                      </div>
                      <span className="text-sm text-navy border-b border-navy pb-1 group-hover:text-gold group-hover:border-gold transition-colors">
                        Detail
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            Všechny apartmány nabízejí
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Designový nábytek', desc: 'KARE Design' },
              { title: 'Plná výbava', desc: 'Myčka, trouba, kávovar' },
              { title: 'Komfort', desc: 'TV, Wi-Fi, trezor' },
              { title: 'Umístění', desc: '50 m od lanovky' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <h3 className="text-navy font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-navy/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Chcete rezervovat?
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Kontaktujte nás pro rezervaci nebo více informací o dostupnosti.
          </p>
          <Link 
            href="/kontakt"
            className="inline-block px-10 py-4 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors"
          >
            Kontaktovat nás
          </Link>
        </div>
      </section>
    </>
  );
}
