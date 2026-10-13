export type BookingCurrency = 'CZK' | 'EUR';

/**
 * Formát částky v haléřích/centech podle měny — CZK bez desetin, EUR na celé eura pokud lze.
 * 'cs' 1 250 € / 1 500 Kč (výchozí) · 'en' €1,250 / CZK 1,500 · 'pl' 1250 € / 1500 CZK
 */
export function formatMoney(cents: number, currency: BookingCurrency | string, locale: 'cs' | 'en' | 'pl' = 'cs'): string {
  const amount = cents / 100;
  const numLocale = locale === 'en' ? 'en-GB' : locale === 'pl' ? 'pl-PL' : 'cs-CZ';
  if (currency === 'EUR') {
    const whole = Number.isInteger(amount);
    const num = amount.toLocaleString(numLocale, {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return locale === 'en' ? `€${num}` : num + ' €';
  }
  const num = amount.toLocaleString(numLocale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return locale === 'en' ? `CZK ${num}` : locale === 'pl' ? `${num} CZK` : num + ' Kč';
}
