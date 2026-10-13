/**
 * Texty stránek /podil a /podil/[available] (cs + en)
 *
 * Regulatorně citlivý obsah — EN je věrný překlad CZ, varování o riziku v plném znění.
 * Na /podil nikde neuvádět číslo apartmánu (ani v EN).
 */

import type { ReactNode } from 'react';
import type { SaleApartment } from '@/lib/apartments';
import { layoutLabel } from '@/lib/apartments';

type Locale = 'cs' | 'en';

export interface PodilTexts {
  metaTitle: string;
  metaDescription: string;
  metaDescriptionShort: string;
  notFound: string;
  heroLabel: string;
  heroTitle: string;
  heroText: ReactNode;
  videoTitle: string;
  audienceTitle: string;
  audienceInvestors: ReactNode;
  audienceDiversification: ReactNode;
  audienceUse: ReactNode;
  benefitsTitle: string;
  benefits: { title: string; description: string }[];
  legalNote: string;
  sourceNote: string;
  stepsTitle: string;
  steps: { title: string; description: string }[];
  apartmentLabel: string;
  apartmentTitle: string;
  heroImageAlt: string;
  photoAlt: (n: number) => string;
  aboutTitle: string;
  specsTitle: string;
  specLayout: string;
  specTotalArea: string;
  specFloor: string;
  specOrientation: string;
  specHall: string;
  specBathroom: string;
  specLivingKitchen: string;
  sharesTitle: string;
  sharesText: (total: number, percent: string) => string;
  sold: string;
  available: string;
  ofTotal: (total: number) => string;
  formTitle: string;
  formText: string;
  wholeApartmentText: string;
  wholeApartmentLink: string;
}

const cs: PodilTexts = {
  metaTitle: 'Družstevní podíl na apartmánu | Pod Zlatým návrším',
  metaDescription: 'Získejte družstevní podíl na horském apartmánu ve Špindlerově Mlýně. Podíl na výnosech z pronájmu, možnost vlastního využití se slevou.',
  metaDescriptionShort: 'Získejte družstevní podíl na horském apartmánu ve Špindlerově Mlýně.',
  notFound: 'Apartmán nenalezen',
  heroLabel: 'Družstevní podíl',
  heroTitle: 'Kupte si podíl na apartmánu ve Špindlu',
  heroText: (
    <>
      Získejte <strong className="text-white">družstevní podíl</strong> na horském apartmánu
      ve Špindlerově Mlýně. Nemovitost v prémiové lokalitě, <strong className="text-white">podíl
      na výnosech z pronájmu</strong>, možnost <strong className="text-white">vlastního využití
      se slevou</strong> a jednoduché smluvní řešení.
    </>
  ),
  videoTitle: 'Prohlídka projektu',
  audienceTitle: 'Pro koho je tento produkt',
  audienceInvestors: (
    <>Pro investory hledající <strong className="text-navy">nemovitostní expozici</strong> bez nutnosti koupě celé jednotky.</>
  ),
  audienceDiversification: (
    <>Pro zájemce o <strong className="text-navy">diverzifikaci portfolia</strong>.</>
  ),
  audienceUse: (
    <>Pro ty, kteří chtějí hory nejen vlastnit, ale i <strong className="text-navy">využívat</strong>.</>
  ),
  benefitsTitle: 'Hlavní výhody',
  benefits: [
    { title: 'Anonymita vlastnictví', description: 'Registr vlastníků družstevních podílů není veřejný.' },
    { title: 'Jednoduchost a rychlost', description: 'Podpis jedné smlouvy' },
    { title: 'Výnos z nájmu', description: 'Orientačně 2–5 % ročně s potenciálem růstu v čase, vypláceno pololetně' },
    { title: '50 podílů na apartmán', description: 'Možnost koupě libovolného počtu' },
    { title: 'Růst hodnoty nemovitostí', description: 'Ceny bytů v Královéhradeckém kraji rostly v letech 2015–2025 v průměru o 11 % ročně, v roce 2023 ale meziročně klesly.¹' },
    { title: 'Podíl na zisku', description: 'Z turistického pronájmu' },
    { title: '20% sleva na ubytování', description: 'Pro držitele podílu' },
    { title: 'Diverzifikace majetku', description: 'O podíl na reálné nemovitosti' },
  ],
  legalNote:
    'Uvedené výnosy a zhodnocení jsou orientační a mohou se lišit v závislosti na obsazenosti a tržních podmínkách. ' +
    'Družstevní podíl nezakládá přímé vlastnictví nemovitosti.',
  sourceNote:
    '¹ Zdroj: Český statistický úřad, Ceny nemovitostí 2023–2025 (kód 014016-26, vydáno 15. 7. 2026), ' +
    'tabulka 2-6b Indexy cen bytů, průměr 2015 = 100, Královéhradecký kraj; realizované kupní ceny ' +
    'z katastru nemovitostí. Průměrná cena bytů ve Špindlerově Mlýně dosáhla podle analýzy Deloitte ' +
    'v letech 2023 a 2024 téměř 190 000 Kč/m² (Aktuálně.cz 28. 1. 2024, Echo24 2. 8. 2025). ' +
    'Údaje se týkají minulosti. Minulý vývoj cen není spolehlivým ukazatelem budoucího vývoje ' +
    'ani zárukou budoucího zhodnocení. Hodnota nemovitosti i podílu může klesat. Nejde o investiční doporučení.',
  stepsTitle: 'Jak to funguje',
  steps: [
    { title: 'Nezávazná konzultace', description: 'Zjistíte vše potřebné o produktu a odpovíme na vaše dotazy.' },
    { title: 'Výběr počtu podílů', description: 'Vyberete si konkrétní počet podílů, které chcete získat.' },
    { title: 'Podpis jedné smlouvy', description: 'Jednoduché smluvní řešení bez zbytečné administrativy.' },
    { title: 'Správa a výplata výnosů', description: 'O vše se postaráme. Výnosy vyplácíme pololetně.' },
  ],
  apartmentLabel: 'Nabízený apartmán',
  apartmentTitle: 'Apartmán ve Špindlerově Mlýně',
  heroImageAlt: 'Apartmán ve Špindlerově Mlýně',
  photoAlt: (n) => `Apartmán - foto ${n}`,
  aboutTitle: 'O apartmánu',
  specsTitle: 'Specifikace',
  specLayout: 'Dispozice',
  specTotalArea: 'Celková plocha',
  specFloor: 'Patro',
  specOrientation: 'Orientace',
  specHall: 'Předsíň',
  specBathroom: 'Koupelna',
  specLivingKitchen: 'Obývací pokoj s kuchyní',
  sharesTitle: 'Tento apartmán je nabízen v rámci družstevního vlastnictví',
  sharesText: (total, percent) =>
    `Můžete si koupit jeden podíl nebo celých ${total}. Každý podíl představuje ${percent} % vlastnictví apartmánu a odpovídající podíl na výnosech z pronájmu.`,
  sold: 'Prodáno',
  available: 'Dostupných',
  ofTotal: (total) => `z celkových ${total} podílů`,
  formTitle: 'Máte zájem o družstevní podíl?',
  formText: 'Zanechte nám kontakt a připravíme vám nezávaznou nabídku.',
  wholeApartmentText: 'Máte zájem o koupi celého apartmánu?',
  wholeApartmentLink: 'Zobrazit apartmány k prodeji',
};

const en: PodilTexts = {
  metaTitle: 'Cooperative share in an apartment | Pod Zlatým návrším',
  metaDescription: 'Acquire a cooperative share in a mountain apartment in Špindlerův Mlýn. A share in rental income, the option of personal use at a discount.',
  metaDescriptionShort: 'Acquire a cooperative share in a mountain apartment in Špindlerův Mlýn.',
  notFound: 'Apartment not found',
  heroLabel: 'Cooperative share',
  heroTitle: 'Buy a share in an apartment in Špindlerův Mlýn',
  heroText: (
    <>
      Acquire a <strong className="text-white">cooperative share</strong> in a mountain apartment
      in Špindlerův Mlýn. Property in a premium location, a <strong className="text-white">share
      in rental income</strong>, the option of <strong className="text-white">personal use
      at a discount</strong> and a simple contractual arrangement.
    </>
  ),
  videoTitle: 'Project tour',
  audienceTitle: 'Who this product is for',
  audienceInvestors: (
    <>For investors seeking <strong className="text-navy">real estate exposure</strong> without having to buy an entire unit.</>
  ),
  audienceDiversification: (
    <>For those interested in <strong className="text-navy">portfolio diversification</strong>.</>
  ),
  audienceUse: (
    <>For those who want not only to own the mountains, but also to <strong className="text-navy">use them</strong>.</>
  ),
  benefitsTitle: 'Key benefits',
  benefits: [
    { title: 'Anonymity of ownership', description: 'The register of cooperative share owners is not public.' },
    { title: 'Simplicity and speed', description: 'Signing a single contract' },
    { title: 'Rental income', description: 'Indicatively 2–5% per year with potential for growth over time, paid out semi-annually' },
    { title: '50 shares per apartment', description: 'Any number of shares can be purchased' },
    { title: 'Growth in property values', description: 'Flat prices in the Hradec Králové Region rose by an average of 11% per year in 2015–2025, but fell year-on-year in 2023.¹' },
    { title: 'Share in profits', description: 'From tourist rentals' },
    { title: '20% discount on accommodation', description: 'For shareholders' },
    { title: 'Asset diversification', description: 'Through a share in real property' },
  ],
  legalNote:
    'The returns and appreciation stated are indicative and may vary depending on occupancy and market conditions. ' +
    'A cooperative share does not constitute direct ownership of the property.',
  sourceNote:
    '¹ Source: Český statistický úřad (Czech Statistical Office), Ceny nemovitostí 2023–2025 (Property prices 2023–2025; code 014016-26, published 15 July 2026), ' +
    'table 2-6b Indexy cen bytů (flat price indices), 2015 average = 100, Královéhradecký kraj (Hradec Králové Region); actual purchase prices ' +
    'from the Czech land register (katastr nemovitostí). According to a Deloitte analysis, the average price of flats in Špindlerův Mlýn ' +
    'reached almost CZK 190,000/m² in 2023 and 2024 (Aktuálně.cz 28 January 2024, Echo24 2 August 2025). ' +
    'The data relate to the past. Past price performance is not a reliable indicator of future performance ' +
    'nor a guarantee of future appreciation. The value of the property and of the share may fall. This is not an investment recommendation.',
  stepsTitle: 'How it works',
  steps: [
    { title: 'Non-binding consultation', description: 'You will find out everything you need to know about the product and we will answer your questions.' },
    { title: 'Choosing the number of shares', description: 'You choose the specific number of shares you wish to acquire.' },
    { title: 'Signing a single contract', description: 'A simple contractual arrangement without unnecessary paperwork.' },
    { title: 'Management and payout of returns', description: 'We take care of everything. Returns are paid out semi-annually.' },
  ],
  apartmentLabel: 'The apartment on offer',
  apartmentTitle: 'Apartment in Špindlerův Mlýn',
  heroImageAlt: 'Apartment in Špindlerův Mlýn',
  photoAlt: (n) => `Apartment - photo ${n}`,
  aboutTitle: 'About the apartment',
  specsTitle: 'Specifications',
  specLayout: 'Layout',
  specTotalArea: 'Total area',
  specFloor: 'Floor',
  specOrientation: 'Orientation',
  specHall: 'Hallway',
  specBathroom: 'Bathroom',
  specLivingKitchen: 'Living room with kitchen',
  sharesTitle: 'This apartment is offered under cooperative ownership',
  sharesText: (total, percent) =>
    `You can buy a single share or all ${total}. Each share represents ${percent}% ownership of the apartment and a corresponding share in rental income.`,
  sold: 'Sold',
  available: 'Available',
  ofTotal: (total) => `out of a total of ${total} shares`,
  formTitle: 'Interested in a cooperative share?',
  formText: 'Leave us your contact details and we will prepare a non-binding offer for you.',
  wholeApartmentText: 'Interested in buying a whole apartment?',
  wholeApartmentLink: 'View apartments for sale',
};

export function getPodilTexts(locale: Locale): PodilTexts {
  return locale === 'cs' ? cs : en;
}

/**
 * Údaje nabízeného apartmánu ve zvoleném jazyce. CZ = beze změny ze statického JSON.
 * EN texty odpovídají migraci 013 (description_en, features_en, orientation_en) — bez čísla apartmánu.
 */
export function getPodilApartmentView(apartment: SaleApartment, locale: Locale) {
  if (locale === 'cs') {
    return {
      description: apartment.description,
      features: apartment.features,
      layout: apartment.layout,
      totalArea: apartment.totalArea,
      floor: `${apartment.floor}. NP`,
      orientation: apartment.orientation,
      hall: apartment.rooms.hall,
      bathroom: apartment.rooms.bathroom,
      livingKitchen: apartment.rooms.livingKitchen,
    };
  }
  const dot = (v: string | null | undefined) => (v ?? '').replace(/(\d),(\d)/g, '$1.$2');
  // Czech NP numbering: 1. NP = ground floor (British convention)
  const ordinal = (n: number) => {
    const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
    return `${n}${s}`;
  };
  const floorNo = Number(apartment.floor);
  const floor = Number.isFinite(floorNo)
    ? floorNo <= 1 ? 'Ground floor' : `${ordinal(floorNo - 1)} floor`
    : String(apartment.floor);
  const known = apartment.slug === 'chata-1-suite-7';
  return {
    description: known
      ? 'Apartment next to the staircase with a hallway offering space for a wardrobe, a spacious bathroom and an east-facing living room with kitchen overlooking the Labská ski slope. White kitchen units with wood décor, Electrolux appliances, underfloor heating in the bathroom, Laufen and Grohe fittings.'
      : apartment.description,
    features: known
      ? ['View of the Labská ski slope', 'Electrolux appliances', 'Underfloor heating', 'Laufen and Grohe']
      : apartment.features,
    layout: layoutLabel(apartment.layout, 'en'),
    totalArea: dot(apartment.totalArea),
    floor,
    orientation: known ? 'east' : apartment.orientation,
    hall: dot(apartment.rooms.hall),
    bathroom: dot(apartment.rooms.bathroom),
    livingKitchen: dot(apartment.rooms.livingKitchen),
  };
}
