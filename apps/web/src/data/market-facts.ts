/**
 * Doložitelná tržní data pro prodej apartmánů (DEC-030, pattern sourced-performance-claim).
 *
 * Stejný zdroj a čísla jako `sourceNote` na /podil (src/app/(public)/podil/texts.tsx) —
 * při nové publikaci ČSÚ (vždy v létě) aktualizovat OBĚ místa: číslo, období, kód a datum vydání.
 * Varování podle čl. 44 odst. 4 nařízení 2017/565 se uvádí vždy celé.
 */

import type { BaseLocale } from '@/lib/i18n';

export const MARKET_FACTS: Record<
  BaseLocale,
  { label: string; growth: string; growthNote: string; local: string; localNote: string; source: string; warning: string }
> = {
  cs: {
    label: 'Trh',
    growth: '11 %',
    growthNote: 'průměrný roční růst cen bytů v Královéhradeckém kraji 2015–2025; v roce 2023 ceny meziročně klesly¹',
    local: '190 000 Kč/m²',
    localNote: 'téměř tolik dosáhla průměrná cena bytů ve Špindlerově Mlýně v letech 2023 a 2024 podle analýzy Deloitte²',
    source:
      '¹ Český statistický úřad, Ceny nemovitostí 2023–2025 (kód 014016-26, vydáno 15. 7. 2026), tabulka 2-6b Indexy cen bytů, ' +
      'průměr 2015 = 100, Královéhradecký kraj; realizované kupní ceny z katastru nemovitostí. ' +
      '² Analýza Deloitte, citováno Aktuálně.cz 28. 1. 2024 a Echo24 2. 8. 2025.',
    warning:
      'Údaje se týkají minulosti. Minulý vývoj cen není spolehlivým ukazatelem budoucího vývoje ani zárukou budoucího ' +
      'zhodnocení. Hodnota nemovitosti může klesat. Nejde o investiční doporučení.',
  },
  en: {
    label: 'Market',
    growth: '11%',
    growthNote: 'average annual growth in flat prices in the Hradec Králové Region in 2015–2025; prices fell year-on-year in 2023¹',
    local: 'CZK 190,000/m²',
    localNote: 'the average price of flats in Špindlerův Mlýn reached almost this in 2023 and 2024, according to a Deloitte analysis²',
    source:
      '¹ Český statistický úřad (Czech Statistical Office), Ceny nemovitostí 2023–2025 (Property prices 2023–2025; code 014016-26, ' +
      'published 15 July 2026), table 2-6b flat price indices, 2015 average = 100, Hradec Králové Region; actual purchase prices ' +
      'from the Czech land register. ² Deloitte analysis, quoted by Aktuálně.cz on 28 January 2024 and Echo24 on 2 August 2025.',
    warning:
      'The data relate to the past. Past price performance is not a reliable indicator of future performance nor a guarantee ' +
      'of future appreciation. The value of the property may fall. This is not an investment recommendation.',
  },
};
