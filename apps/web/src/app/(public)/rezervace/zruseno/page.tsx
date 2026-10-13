import { Metadata } from 'next';
import Link from 'next/link';
import { getRequestLocaleFull } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      cs: 'Platba zrušena | Pod Zlatým návrším',
      en: 'Payment cancelled | Pod Zlatým návrším',
      pl: 'Płatność anulowana | Pod Zlatým návrším',
    }[getRequestLocaleFull()],
  };
}

const TEXTS = {
  cs: {
    label: 'Platba přerušena',
    heading: 'Rezervace nebyla dokončena',
    text: 'Platba byla přerušena nebo zrušena. Vaše osobní údaje nebyly uloženy a za rezervaci nebylo nic účtováno. Můžete se vrátit a vybrat termín znovu.',
    retry: 'Vybrat termín znovu',
    contact: 'Kontaktovat nás',
    trouble: 'Máte potíže s platbou? Napište nám na',
  },
  en: {
    label: 'Payment interrupted',
    heading: 'Your reservation was not completed',
    text: 'The payment was interrupted or cancelled. Your personal details have not been stored and nothing has been charged for the reservation. You can go back and choose your dates again.',
    retry: 'Choose dates again',
    contact: 'Contact us',
    trouble: 'Having trouble with your payment? Write to us at',
  },
  pl: {
    label: 'Płatność przerwana',
    heading: 'Rezerwacja nie została ukończona',
    text: 'Płatność została przerwana lub anulowana. Państwa dane osobowe nie zostały zapisane i nie pobrano żadnej opłaty za rezerwację. Mogą Państwo wrócić i ponownie wybrać termin.',
    retry: 'Wybierz termin ponownie',
    contact: 'Skontaktuj się z nami',
    trouble: 'Mają Państwo problem z płatnością? Prosimy napisać na adres',
  },
};

export default function BookingCancelledPage() {
  const t = TEXTS[getRequestLocaleFull()];
  return (
    <>
      <section className="bg-[#0B1626] pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-8">
            <svg className="w-7 h-7 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-white/30 text-xs tracking-widest uppercase mb-4">{t.label}</p>
          <h1 className="text-3xl md:text-4xl font-light text-white">
            {t.heading}
          </h1>
        </div>
      </section>

      <section className="py-16 bg-[#FAFAF7]">
        <div className="max-w-2xl mx-auto px-6 space-y-6">

          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8">
            <p className="text-navy/70 text-sm leading-relaxed mb-6">
              {t.text}
            </p>

            <div className="space-y-3">
              <Link
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="flex items-center justify-center w-full py-4 bg-[#C9A24D] text-[#0B1626] text-sm uppercase tracking-wider hover:bg-[#b8913c] transition-colors"
              >
                {t.retry}
              </Link>
              <Link
                href="/kontakt"
                className="flex items-center justify-center w-full py-4 border border-navy/20 text-navy text-sm uppercase tracking-wider hover:bg-navy/5 transition-colors"
              >
                {t.contact}
              </Link>
            </div>
          </div>

          <p className="text-xs text-navy/40 text-center">
            {t.trouble}{' '}
            <a href="mailto:rezervace@podzlatymnavrsim.cz" className="underline">
              rezervace@podzlatymnavrsim.cz
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
