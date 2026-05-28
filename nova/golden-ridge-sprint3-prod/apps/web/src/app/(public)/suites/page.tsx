/**
 * Suites - Apartmány na prodej - Design 2030
 * Content from XLSX: "Suites - prodej"
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSaleApartments, getSalesManager } from '@/lib/apartments';
import { getApartmentHeroImage } from '@/data/apartment-images';

export const metadata: Metadata = {
  title: 'Zkolaudované apartmány v Krkonoších prodej | Pod Zlatým návrším',
  description: 'Vyberte si z posledních dostupných apartmánů ve Špindlerově Mlýně – některé jsou plně vybavené nábytkem KARE Design a připravené k okamžitému využití i pronájmu.',
};

export default function SuitesPage() {
  const apartments = getSaleApartments();
  const manager = getSalesManager();

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            Poslední {apartments.length} apartmány
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            Zkolaudované apartmány Pod Zlatým návrším
          </h1>
          <p className="text-xl text-white/60 max-w-3xl leading-relaxed">
            Vyberte si z posledních dostupných apartmánů ve Špindlerově Mlýně – některé jsou plně vybavené 
            nábytkem KARE Design a připravené k okamžitému využití i pronájmu. Vybavené jsou všechny tři 
            dostupné apartmány. Všechny apartmány mají výhled na hory, soukromí a polohu jen pár desítek 
            metrů od sjezdovky Labská.
          </p>
        </div>
      </section>

      {/* Video */}
      <section className="py-16 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative aspect-video">
            <iframe
              src="https://www.youtube.com/embed/gJqA9imgAsQ"
              title="Pod Zlatým návrším"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Doplňující info */}
      <section className="py-16 bg-gold">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-navy/80 max-w-4xl leading-relaxed">
            V nabídce jsou poslední apartmány (1+kk a 2+kk) ve dvou rezidenčních domech. 
            Každý dům má vlastní lyžárnu a kolárnu. K apartmánům je možné dokoupit garážové 
            nebo venkovní stání. Standard zahrnuje dřevěné podlahy, podlahové vytápění a 
            kvalitní kuchyňskou linku.
          </p>
        </div>
      </section>

      {/* Apartments Grid */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-navy/40 uppercase tracking-widest mb-12">
            {apartments.length} apartmány k prodeji
          </p>

          <div className="space-y-16">
            {apartments.map((apt, index) => {
              const heroImage = getApartmentHeroImage(apt.slug);
              return (
                <Link 
                  key={apt.slug} 
                  href={`/suites/${apt.slug}`}
                  className="group block"
                >
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className={`relative aspect-[4/3] bg-stone overflow-hidden ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                      {heroImage ? (
                        <Image
                          src={heroImage}
                          alt={apt.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-navy/10" />
                      )}
                      <div className="absolute top-6 left-6">
                        <span className="px-4 py-2 bg-gold text-navy text-xs uppercase tracking-widest">
                          Na prodej
                        </span>
                      </div>
                    </div>
                    
                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                      <h2 className="text-3xl font-light text-navy group-hover:text-gold transition-colors mb-2">
                        {apt.title}
                      </h2>
                      <p className="text-navy/50 mb-6">{apt.subtitle}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Plocha</p>
                          <p className="text-navy">{apt.totalArea}</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Dispozice</p>
                          <p className="text-navy">{apt.layout}</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Patro</p>
                          <p className="text-navy">{apt.floor}. NP</p>
                        </div>
                        <div>
                          <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Orientace</p>
                          <p className="text-navy">{apt.orientation}</p>
                        </div>
                      </div>

                      <p className="text-lg font-medium text-gold mb-6">Cena na dotaz</p>
                      
                      <span className="inline-flex items-center text-navy border-b border-navy pb-1 group-hover:text-gold group-hover:border-gold transition-colors">
                        Zobrazit detail
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Okolí */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">
            Okolí apartmánů Pod Zlatým návrším
          </h2>
          <p className="text-navy/60 max-w-2xl mx-auto mb-12">
            Skiareál Špindlerův Mlýn se řadí k nejznámějším a nejnavštěvovanějším střediskům zimních sportů v ČR. 
            Apartmánové domy se nacházejí 50 metrů od sedačkové lanovky a červené sjezdovky Labská.
          </p>
          <Link 
            href="/lokalita"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            Více o lokalitě
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Sales Manager Contact */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <p className="text-gold text-sm tracking-widest uppercase mb-6">Váš kontakt</p>
              <h2 className="text-3xl font-light text-white mb-8">
                Máte zájem o koupi?
              </h2>
              <p className="text-white/50 mb-8">
                Kontaktujte našeho manažera prodeje pro nezávaznou konzultaci a prohlídku apartmánů. 
                Vybraný apartmán si můžete nejdřív pronajmout na zkoušku.
              </p>
              
              <div className="space-y-4">
                <a 
                  href={`tel:${manager.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center md:justify-start text-white hover:text-gold transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="text-lg">{manager.phone}</span>
                </a>
                <a 
                  href={`mailto:${manager.email}`}
                  className="flex items-center justify-center md:justify-start text-white hover:text-gold transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-lg">{manager.email}</span>
                </a>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-gold/20">
                  <Image
                    src={manager.photo}
                    alt={manager.name}
                    width={256}
                    height={256}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cream px-6 py-3 text-center">
                  <p className="text-navy font-medium">{manager.name}</p>
                  <p className="text-xs text-navy/50">{manager.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="py-16 bg-cream border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-navy/50 mb-4">Spočítejte si výnos z investice</p>
              <Link 
                href="/kalkulacka"
                className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
              >
                Investiční kalkulačka
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
            <div>
              <p className="text-navy/50 mb-4">Preferujete podílové vlastnictví?</p>
              <Link 
                href="/nemovitostni-produkt"
                className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
              >
                Nemovitostní produkt
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
