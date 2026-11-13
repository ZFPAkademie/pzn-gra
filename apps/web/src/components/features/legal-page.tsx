/**
 * Právní stránka (obchodní podmínky, ochrana soukromí) — texty v `@/data/legal`.
 */

import type { LegalDocument } from '@/data/legal';

export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">{doc.tagline}</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6">{doc.title}</h1>
          <p className="text-xl text-white/50 max-w-2xl">{doc.intro}</p>
        </div>
      </section>

      {/* Sections */}
      <section className="py-20 bg-cream">
        <div className="max-w-3xl mx-auto px-6">
          <ol className="space-y-14">
            {doc.sections.map((section, i) => (
              <li key={section.title} id={section.id} className="scroll-mt-28">
                <span className="text-gold text-sm tracking-widest">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="text-2xl font-light text-navy mt-2 mb-5">{section.title}</h2>
                {section.paragraphs?.map((p, j) => (
                  <p key={j} className="text-navy/70 leading-relaxed mb-4 last:mb-0">{p}</p>
                ))}
                {section.items && (
                  <ul className="space-y-3">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start text-navy/70 leading-relaxed">
                        <span className="w-4 h-px bg-gold mr-4 mt-3 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-16 pt-8 border-t border-navy/10 text-sm text-navy/40">{doc.effective}</p>
        </div>
      </section>
    </>
  );
}
