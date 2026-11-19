'use client';

/**
 * Antispam pro veřejné formuláře — bez cookies a bez skriptu třetí strany
 * (převzato ze ZFP reality HUB).
 *
 * Vrátí `fields` do <form> (skryté pole = past na boty) a `payload()` do těla
 * requestu. Server pak rozhodne v `checkAntispam()` — tohle je jen sběr.
 */

import { useEffect, useRef, useState } from 'react';
import { HONEYPOT_FIELD, TIMESTAMP_FIELD, type AntispamPayload } from './validation';

export function useAntispam() {
  const honeypot = useRef<HTMLInputElement>(null);
  // Až po mountu: při SSR by razítko bylo z doby renderu na serveru, ne z otevření stránky.
  const [renderedAt, setRenderedAt] = useState<number | null>(null);
  useEffect(() => setRenderedAt(Date.now()), []);

  function payload(): AntispamPayload {
    return {
      [HONEYPOT_FIELD]: honeypot.current?.value ?? '',
      ...(renderedAt ? { [TIMESTAMP_FIELD]: renderedAt } : {}),
    };
  }

  const fields = (
    // Inline styl, ne Tailwind: skrytí nesmí záviset na tom, jestli se třída vygeneruje.
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
    >
      <label htmlFor={HONEYPOT_FIELD}>Web (nevyplňujte)</label>
      <input
        ref={honeypot}
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );

  return { fields, payload };
}
