/**
 * 404 — horský rozcestník: značka tady končí, šipky vedou na hlavní cesty webu.
 * Root not-found není uvnitř (public) layoutu, proto vlastní PublicLayout.
 * Next u 404 sám přidá noindex.
 */

import Link from 'next/link';
import { PublicLayout } from '@/components/layouts';
import { VkStatus } from '@vk/VkTracker';
import { MountainSilhouette } from '@/components/ui/ornaments';
import { getRequestLocaleFull } from '@/lib/i18n-server';

const TEXTS = {
  cs: {
    altitude: 'Chyba 404 · Stránka nenalezena',
    title: 'Tady značka končí',
    text: 'Stránka, kterou hledáte, neexistuje nebo se přestěhovala. Web má novou mapu cest, na rozcestníku najdete ty hlavní.',
    signpost: 'Rozcestník',
    home: 'Zpět na úvod',
    routes: [
      { href: '/apartmany-spindleruv-mlyn-pronajem', label: 'Apartmány k pronájmu', note: 'pobyt u lanovky Labská' },
      { href: '/volne-terminy', label: 'Volné termíny', note: 'najít pobyt podle data' },
      { href: '/suites', label: 'Apartmány na prodej', note: 'poslední volné jednotky' },
      { href: '/lokalita', label: 'Lokalita', note: 'Labská, Špindlerův Mlýn' },
      { href: '/kontakt', label: 'Kontakt', note: 'rádi poradíme' },
    ],
  },
  en: {
    altitude: 'Error 404 · Page not found',
    title: 'The trail ends here',
    text: 'The page you are looking for does not exist or has moved. Our website has a new trail map; the signpost shows the main routes.',
    signpost: 'Signpost',
    home: 'Back to the homepage',
    routes: [
      { href: '/apartmany-spindleruv-mlyn-pronajem', label: 'Apartments for rent', note: 'stay by the Labská chairlift' },
      { href: '/volne-terminy', label: 'Available dates', note: 'find a stay by date' },
      { href: '/suites', label: 'Apartments for sale', note: 'the last available units' },
      { href: '/lokalita', label: 'Location', note: 'Labská, Špindlerův Mlýn' },
      { href: '/kontakt', label: 'Contact', note: 'we are happy to help' },
    ],
  },
  pl: {
    altitude: 'Błąd 404 · Nie znaleziono strony',
    title: 'Tu szlak się kończy',
    text: 'Strona, której szukasz, nie istnieje lub została przeniesiona. Nasza strona ma nową mapę szlaków, na drogowskazie znajdziesz te najważniejsze.',
    signpost: 'Drogowskaz',
    home: 'Powrót na stronę główną',
    routes: [
      { href: '/apartmany-spindleruv-mlyn-pronajem', label: 'Apartamenty na wynajem', note: 'pobyt przy wyciągu Labská' },
      { href: '/volne-terminy', label: 'Wolne terminy', note: 'znajdź pobyt według daty' },
      { href: '/lokalita', label: 'Lokalizacja', note: 'Labská, Szpindlerowy Młyn' },
      { href: '/kontakt', label: 'Kontakt', note: 'chętnie doradzimy' },
    ],
  },
} as const;

export default function NotFound() {
  const t = TEXTS[getRequestLocaleFull()];

  return (
    <PublicLayout>
      <VkStatus status={404} />
      <section className="relative overflow-hidden bg-navy pt-32 pb-40">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">{t.altitude}</p>
            <p className="text-7xl md:text-8xl font-light text-white/10 leading-none mb-4" aria-hidden="true">404</p>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-6">{t.title}</h1>
            {/* Turistická značka: červená mezi dvěma bílými, tady končí */}
            <div className="flex items-center gap-3 mb-8" aria-hidden="true">
              <span className="flex flex-col w-10 h-6 overflow-hidden rounded-sm">
                <span className="flex-1 bg-white" />
                <span className="flex-1 bg-gold" />
                <span className="flex-1 bg-white" />
              </span>
              <span className="w-16 h-px bg-white/20" />
              <span className="w-2 h-2 rotate-45 border border-white/40" />
            </div>
            <p className="text-lg text-white/60 max-w-md mb-10 leading-relaxed">{t.text}</p>
            <Link
              href="/"
              className="inline-block px-10 py-4 border border-white/30 text-white text-sm tracking-widest uppercase hover:border-gold hover:text-gold transition-colors"
            >
              {t.home}
            </Link>
          </div>

          <nav aria-label={t.signpost} className="relative">
            {/* Sloup rozcestníku */}
            <span className="absolute left-6 top-0 bottom-[-6rem] w-1 bg-gradient-to-b from-white/30 to-white/5" aria-hidden="true" />
            <ul className="relative space-y-3 pl-3">
              {t.routes.map((route, i) => (
                <li key={route.href} className={i % 2 === 1 ? 'sm:ml-8' : ''}>
                  <Link
                    href={route.href}
                    className="group flex items-center justify-between gap-6 bg-cream pl-6 pr-12 py-4 text-navy transition-colors hover:bg-gold"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 1.5rem) 0, 100% 50%, calc(100% - 1.5rem) 100%, 0 100%)' }}
                  >
                    <span>
                      <span className="block text-lg font-light">{route.label}</span>
                      <span className="block text-xs text-navy/50 uppercase tracking-widest mt-1 group-hover:text-navy/70">{route.note}</span>
                    </span>
                    <svg className="w-5 h-5 shrink-0 text-gold group-hover:text-navy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <MountainSilhouette className="absolute bottom-0 left-0 right-0 w-full h-32 text-white/5" />
      </section>
    </PublicLayout>
  );
}
