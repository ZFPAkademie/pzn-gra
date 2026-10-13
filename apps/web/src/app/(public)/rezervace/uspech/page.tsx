import { Metadata } from 'next';
import Link from 'next/link';
import { getRequestLocaleFull } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      cs: 'Rezervace potvrzena | Pod Zlatým návrším',
      en: 'Reservation confirmed | Pod Zlatým návrším',
      pl: 'Rezerwacja potwierdzona | Pod Zlatým návrším',
    }[getRequestLocaleFull()],
  };
}

const TEXTS = {
  cs: {
    label: 'Platba proběhla úspěšně',
    heading: 'Vaše rezervace je potvrzena',
    next: 'Co následuje',
    step1Title: 'Potvrzení e-mailem',
    step1Text: 'Během několika minut obdržíte e-mail s potvrzením rezervace na adresu, kterou jste zadali.',
    step2Title: 'Instrukce k příjezdu',
    step2Text: 'Před příjezdem obdržíte podrobné instrukce k check-inu, přístupový kód a informace o parkování.',
    step3Title: 'Máte otázky?',
    step3Text: 'Kdykoli nás kontaktujte na',
    arrival: 'Příjezd',
    arrivalText: 'od 15:00 — Apartmán bude připraven k Vašemu příchodu',
    departure: 'Odjezd',
    departureText: 'do 10:00 — Prosíme o respektování času pro přípravu apartmánu',
    back: 'Zpět na přehled apartmánů',
  },
  en: {
    label: 'Payment successful',
    heading: 'Your reservation is confirmed',
    next: 'What happens next',
    step1Title: 'Confirmation by email',
    step1Text: 'Within a few minutes you will receive an email confirming your reservation at the address you provided.',
    step2Title: 'Arrival instructions',
    step2Text: 'Before your arrival you will receive detailed check-in instructions, an access code and parking information.',
    step3Title: 'Any questions?',
    step3Text: 'Contact us at any time at',
    arrival: 'Arrival',
    arrivalText: 'from 3:00 pm — The apartment will be ready for your arrival',
    departure: 'Departure',
    departureText: 'by 10:00 am — Please allow us time to prepare the apartment',
    back: 'Back to all apartments',
  },
  pl: {
    label: 'Płatność zakończona powodzeniem',
    heading: 'Państwa rezerwacja jest potwierdzona',
    next: 'Co dalej',
    step1Title: 'Potwierdzenie e-mailem',
    step1Text: 'W ciągu kilku minut otrzymają Państwo e-mail z potwierdzeniem rezerwacji na podany adres.',
    step2Title: 'Wskazówki dotyczące przyjazdu',
    step2Text: 'Przed przyjazdem otrzymają Państwo szczegółowe instrukcje dotyczące zameldowania, kod dostępu i informacje o parkingu.',
    step3Title: 'Mają Państwo pytania?',
    step3Text: 'Prosimy o kontakt w dowolnym momencie pod adresem',
    arrival: 'Przyjazd',
    arrivalText: 'od 15:00 — Apartament będzie przygotowany na Państwa przyjazd',
    departure: 'Wyjazd',
    departureText: 'do 10:00 — Prosimy o przestrzeganie tej godziny, abyśmy mogli przygotować apartament',
    back: 'Powrót do przeglądu apartamentów',
  },
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { session_id?: string };
}

export default function BookingSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id;
  const t = TEXTS[getRequestLocaleFull()];

  return (
    <>
      <section className="bg-[#0B1626] pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full border border-gold/50 flex items-center justify-center mx-auto mb-8">
            <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-gold text-xs tracking-widest uppercase mb-4">{t.label}</p>
          <h1 className="text-3xl md:text-4xl font-light text-white">
            {t.heading}
          </h1>
        </div>
      </section>

      <section className="py-16 bg-[#FAFAF7]">
        <div className="max-w-2xl mx-auto px-6 space-y-6">

          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8">
            <h2 className="text-xs text-navy/40 uppercase tracking-widest mb-6">{t.next}</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-sm bg-[#0B1626]/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-navy/40">1</span>
                </div>
                <div>
                  <p className="text-navy font-light mb-1">{t.step1Title}</p>
                  <p className="text-sm text-navy/50">
                    {t.step1Text}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-sm bg-[#0B1626]/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-navy/40">2</span>
                </div>
                <div>
                  <p className="text-navy font-light mb-1">{t.step2Title}</p>
                  <p className="text-sm text-navy/50">
                    {t.step2Text}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-sm bg-[#0B1626]/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-navy/40">3</span>
                </div>
                <div>
                  <p className="text-navy font-light mb-1">{t.step3Title}</p>
                  <p className="text-sm text-navy/50">
                    {t.step3Text}{' '}
                    <a
                      href="mailto:rezervace@podzlatymnavrsim.cz"
                      className="text-navy underline hover:no-underline"
                    >
                      rezervace@podzlatymnavrsim.cz
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0B1626] p-6">
            <p className="text-white/50 text-sm mb-1">{t.arrival}</p>
            <p className="text-white text-xs">{t.arrivalText}</p>
            <div className="border-t border-white/10 my-4" />
            <p className="text-white/50 text-sm mb-1">{t.departure}</p>
            <p className="text-white text-xs">{t.departureText}</p>
          </div>

          <Link
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-flex items-center text-navy/50 hover:text-navy transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.back}
          </Link>
        </div>
      </section>
    </>
  );
}
