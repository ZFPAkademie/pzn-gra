export type BookingCurrency = 'CZK' | 'EUR';

/** Formát částky v haléřích/centech podle měny — CZK bez desetin, EUR na celé eura pokud lze. */
export function formatMoney(cents: number, currency: BookingCurrency | string): string {
  const amount = cents / 100;
  if (currency === 'EUR') {
    const whole = Number.isInteger(amount);
    return amount.toLocaleString('cs-CZ', {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }) + ' €';
  }
  return amount.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' Kč';
}
