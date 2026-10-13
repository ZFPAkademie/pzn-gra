export type BookingCurrency = 'CZK' | 'EUR';

/**
 * Formát částky v haléřích/centech podle měny — CZK bez desetin, EUR na celé eura pokud lze.
 * locale 'en' → anglický zápis (€1,250 / CZK 1,500), výchozí 'cs' beze změny (1 250 € / 1 500 Kč).
 */
export function formatMoney(cents: number, currency: BookingCurrency | string, locale: 'cs' | 'en' = 'cs'): string {
  const amount = cents / 100;
  const numLocale = locale === 'en' ? 'en-GB' : 'cs-CZ';
  if (currency === 'EUR') {
    const whole = Number.isInteger(amount);
    const num = amount.toLocaleString(numLocale, {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return locale === 'en' ? `€${num}` : num + ' €';
  }
  const num = amount.toLocaleString(numLocale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return locale === 'en' ? `CZK ${num}` : num + ' Kč';
}
