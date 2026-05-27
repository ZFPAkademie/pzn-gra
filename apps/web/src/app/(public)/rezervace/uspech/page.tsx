import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rezervace potvrzena | Pod Zlatým návrším',
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { session_id?: string };
}

export default function BookingSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id;

  return (
    <>
      <section className="bg-[#0B1626] pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full border border-gold/50 flex items-center justify-center mx-auto mb-8">
            <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-gold text-xs tracking-widest uppercase mb-4">Platba proběhla úspěšně</p>
          <h1 className="text-3xl md:text-4xl font-light text-white">
            Vaše rezervace je potvrzena
          </h1>
        </div>
      </section>

      <section className="py-16 bg-[#FAFAF7]">
        <div className="max-w-2xl mx-auto px-6 space-y-6">

          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8">
            <h2 className="text-xs text-navy/40 uppercase tracking-widest mb-6">Co následuje</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-sm bg-[#0B1626]/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-navy/40">1</span>
                </div>
                <div>
                  <p className="text-navy font-light mb-1">Potvrzení e-mailem</p>
                  <p className="text-sm text-navy/50">
                    Během několika minut obdržíte e-mail s potvrzením rezervace na adresu,
                    kterou jste zadali.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-sm bg-[#0B1626]/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-navy/40">2</span>
                </div>
                <div>
                  <p className="text-navy font-light mb-1">Instrukce k příjezdu</p>
                  <p className="text-sm text-navy/50">
                    Před příjezdem obdržíte podrobné instrukce k check-inu, přístupový kód
                    a informace o parkování.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-sm bg-[#0B1626]/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-navy/40">3</span>
                </div>
                <div>
                  <p className="text-navy font-light mb-1">Máte otázky?</p>
                  <p className="text-sm text-navy/50">
                    Kdykoli nás kontaktujte na{' '}
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
            <p className="text-white/50 text-sm mb-1">Příjezd</p>
            <p className="text-white text-xs">od 15:00 — Apartmán bude připraven k Vašemu příchodu</p>
            <div className="border-t border-white/10 my-4" />
            <p className="text-white/50 text-sm mb-1">Odjezd</p>
            <p className="text-white text-xs">do 10:00 — Prosíme o respektování času pro přípravu apartmánu</p>
          </div>

          <Link
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-flex items-center text-navy/50 hover:text-navy transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Zpět na přehled apartmánů
          </Link>
        </div>
      </section>
    </>
  );
}
