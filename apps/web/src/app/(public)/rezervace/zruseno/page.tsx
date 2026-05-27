import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Platba zrušena | Pod Zlatým návrším',
};

export default function BookingCancelledPage() {
  return (
    <>
      <section className="bg-[#0B1626] pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-8">
            <svg className="w-7 h-7 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-white/30 text-xs tracking-widest uppercase mb-4">Platba přerušena</p>
          <h1 className="text-3xl md:text-4xl font-light text-white">
            Rezervace nebyla dokončena
          </h1>
        </div>
      </section>

      <section className="py-16 bg-[#FAFAF7]">
        <div className="max-w-2xl mx-auto px-6 space-y-6">

          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8">
            <p className="text-navy/70 text-sm leading-relaxed mb-6">
              Platba byla přerušena nebo zrušena. Vaše osobní údaje nebyly uloženy a za
              rezervaci nebylo nic účtováno. Můžete se vrátit a vybrat termín znovu.
            </p>

            <div className="space-y-3">
              <Link
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="flex items-center justify-center w-full py-4 bg-[#C9A24D] text-[#0B1626] text-sm uppercase tracking-wider hover:bg-[#b8913c] transition-colors"
              >
                Vybrat termín znovu
              </Link>
              <Link
                href="/kontakt"
                className="flex items-center justify-center w-full py-4 border border-navy/20 text-navy text-sm uppercase tracking-wider hover:bg-navy/5 transition-colors"
              >
                Kontaktovat nás
              </Link>
            </div>
          </div>

          <p className="text-xs text-navy/40 text-center">
            Máte potíže s platbou? Napište nám na{' '}
            <a href="mailto:rezervace@podzlatymnavrsim.cz" className="underline">
              rezervace@podzlatymnavrsim.cz
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
