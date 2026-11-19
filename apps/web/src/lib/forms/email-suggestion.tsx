'use client';

/**
 * „Nemysleli jste jan@seznam.cz?“ pod polem e-mailu — nabídka opravy překlepu
 * v doméně (seznma.cz, gmail.cz…). Nic neblokuje, jen jedním klikem opraví.
 */

import { formMessages, suggestEmailCorrection } from './validation';

export function EmailSuggestion({
  email,
  locale,
  onAccept,
  className = '',
}: {
  email: string;
  locale?: string;
  onAccept: (corrected: string) => void;
  className?: string;
}) {
  const suggestion = suggestEmailCorrection(email);
  if (!suggestion) return null;
  return (
    <p className={`mt-2 text-sm text-navy/60 ${className}`}>
      {formMessages(locale).didYouMean}{' '}
      <button
        type="button"
        onClick={() => onAccept(suggestion)}
        className="underline decoration-gold underline-offset-2 text-navy hover:text-gold"
      >
        {suggestion}
      </button>
      ?
    </p>
  );
}
