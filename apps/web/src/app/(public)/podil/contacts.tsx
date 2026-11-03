/**
 * Kontakty pro dotazy pod formulářem — sdílené /podil a /podil/[available].
 * Data v texts.tsx (PODIL_CONTACTS), stejná jako v /podil-prezentace.
 */

import { getPodilTexts, PODIL_CONTACTS, telHref } from './texts';

export function PodilContacts({ locale }: { locale: 'cs' | 'en' }) {
  const t = getPodilTexts(locale);
  return (
    <div className="mt-16 pt-12 border-t border-navy/10">
      <h3 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-8">{t.contactsTitle}</h3>
      <div className="grid sm:grid-cols-2 gap-6">
        {PODIL_CONTACTS.map((c) => (
          <div key={c.email} className="bg-white border border-navy/10 p-6">
            <p className="text-xs uppercase tracking-widest text-gold mb-2">{c.role[locale]}</p>
            <p className="text-lg font-light text-navy mb-4">{c.name}</p>
            <p className="text-sm text-navy/60 mb-1">
              {t.contactPhone}:{' '}
              <a href={telHref(c.phone)} className="text-navy hover:text-gold transition-colors whitespace-nowrap">
                {c.phone}
              </a>
            </p>
            <p className="text-sm text-navy/60">
              {t.contactEmail}:{' '}
              <a href={`mailto:${c.email}`} className="text-navy hover:text-gold transition-colors break-all">
                {c.email}
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
