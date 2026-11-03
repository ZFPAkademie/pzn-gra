/**
 * Texty stránek /podil a /podil/[available] (cs + en)
 *
 * Regulatorně citlivý obsah — EN je věrný překlad CZ, varování o riziku v plném znění.
 * Na /podil nikde neuvádět číslo apartmánu (ani v EN).
 */

import type { ReactNode } from 'react';
import type { ApartmentDB } from '@/lib/apartments';
import {
  getApartmentBySlugDB,
  getSaleApartmentBySlug,
  layoutLabel,
  localizeApartment,
} from '@/lib/apartments';

type Locale = 'cs' | 'en';

/** Cena jednoho podílu (2 % apartmánu) — shodně s mailingem do sítě ZFP, 11/2026. */
const PODIL_PRICE_CZK = 200_000;

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
  apartmentIntro: string;
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
  metaDescription: 'Mějte svůj kousek hor ve Špindlerově Mlýně. Družstevní podíl na horském apartmánu: podíl na výnosu z pronájmu, sleva 20 % na vlastní pobyt a jen jedna smlouva.',
  metaDescriptionShort: 'Družstevní podíl na horském apartmánu ve Špindlerově Mlýně: výnos z pronájmu, sleva 20 % na vlastní pobyt, jedna smlouva.',
  notFound: 'Apartmán nenalezen',
  heroLabel: 'Družstevní podíl',
  heroTitle: 'Mějte svůj kousek hor ve Špindlerově Mlýně',
  heroText: (
    <>
      Vlastněte <strong className="text-white">družstevní podíl na horském apartmánu</strong>, aniž
      byste museli kupovat celý byt a starat se o pronájem. <strong className="text-white">Podíl
      na výnosu z pronájmu</strong>, <strong className="text-white">sleva 20 % na vlastní
      pobyt</strong> a <strong className="text-white">jen jedna smlouva</strong>.
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
  benefitsTitle: 'Proč družstevní podíl',
  benefits: [
    { title: 'Výnos z pronájmu', description: 'Orientačně 2–5 % ročně, vyplácený dvakrát ročně' },
    { title: 'Růst hodnoty nemovitostí', description: 'Ceny bytů v Královéhradeckém kraji rostly v letech 2015–2025 v průměru o 11 % ročně, v roce 2023 ale meziročně klesly.¹' },
    { title: 'Žádné starosti', description: 'O pronájem, správu i výplatu výnosů se postará družstvo' },
    { title: 'Jednoduchost a diskrétnost', description: 'Podpis jediné smlouvy a neveřejný registr vlastníků' },
    { title: 'Sleva 20 % na vlastní pobyt', description: 'Hory můžete nejen vlastnit, ale i využívat' },
    { title: 'Součást finančního portfolia', description: 'Podíl na reálné nemovitosti jako diverzifikace majetku' },
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
  stepsTitle: 'Jak to probíhá',
  steps: [
    { title: 'Nezávazná konzultace', description: 'Vysvětlíme vám produkt a odpovíme na vaše dotazy.' },
    { title: 'Výběr počtu podílů', description: 'Jeden, nebo kolik chcete.' },
    { title: 'Podpis jedné smlouvy', description: 'Bez zbytečné administrativy.' },
    { title: 'Správa a výplata výnosů', description: 'O provoz se stará družstvo, výnosy se vyplácejí pololetně.' },
  ],
  apartmentLabel: 'Nabízený apartmán',
  apartmentTitle: 'Apartmán ve Špindlerově Mlýně',
  apartmentIntro:
    'Zařízený apartmán 50 metrů od lanovky a sjezdovky Labská ve Špindlerově Mlýně, jedné z nejoblíbenějších ' +
    'horských destinací v Česku. Turisté sem jezdí po celý rok: v zimě lyžovat, v létě na turistiku do Krkonoš.',
  heroImageAlt: 'Apartmán ve Špindlerově Mlýně',
  photoAlt: (n) => `Apartmán - foto ${n}`,
  aboutTitle: 'O apartmánu',
  specsTitle: 'Specifikace',
  specLayout: 'Dispozice',
  specTotalArea: 'Celková plocha',
  specFloor: 'Patro',
  specOrientation: 'Orientace',
  specHall: 'Vstupní hala',
  specBathroom: 'Koupelna',
  specLivingKitchen: 'Pokoj s kuchyní',
  sharesTitle: 'Tento apartmán je nabízen v rámci družstevního vlastnictví',
  sharesText: (total, percent) =>
    `Apartmán je rozdělen na ${total} družstevních podílů. Každý odpovídá ${percent} % apartmánu a stojí ` +
    `${PODIL_PRICE_CZK.toLocaleString('cs-CZ')} Kč. Můžete začít jedním podílem, nebo jich získat víc.`,
  sold: 'Rezervováno',
  available: 'Dostupných',
  ofTotal: (total) => `z celkových ${total} podílů`,
  formTitle: 'Máte zájem o družstevní podíl?',
  formText: 'Zanechte nám kontakt a připravíme vám nezávaznou nabídku.',
  wholeApartmentText: 'Máte zájem o koupi celého apartmánu?',
  wholeApartmentLink: 'Zobrazit apartmány k prodeji',
};

const en: PodilTexts = {
  metaTitle: 'Cooperative share in an apartment | Pod Zlatým návrším',
  metaDescription: 'Own your piece of the mountains in Špindlerův Mlýn. A cooperative share in a mountain apartment: a share in rental income, a 20% discount on your own stays and just one contract.',
  metaDescriptionShort: 'A cooperative share in a mountain apartment in Špindlerův Mlýn: rental income, a 20% discount on your own stays, one contract.',
  notFound: 'Apartment not found',
  heroLabel: 'Cooperative share',
  heroTitle: 'Own your piece of the mountains in Špindlerův Mlýn',
  heroText: (
    <>
      Own a <strong className="text-white">cooperative share in a mountain apartment</strong> without
      having to buy a whole flat or look after renting it out. <strong className="text-white">A share
      in rental income</strong>, <strong className="text-white">a 20% discount on your own
      stays</strong> and <strong className="text-white">just one contract</strong>.
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
  benefitsTitle: 'Why a cooperative share',
  benefits: [
    { title: 'Rental income', description: 'Indicatively 2–5% per year, paid out twice a year' },
    { title: 'Growth in property values', description: 'Flat prices in the Hradec Králové Region rose by an average of 11% per year in 2015–2025, but fell year-on-year in 2023.¹' },
    { title: 'No worries', description: 'The cooperative takes care of renting, management and payout of returns' },
    { title: 'Simplicity and discretion', description: 'A single contract to sign and a non-public register of owners' },
    { title: '20% discount on your own stays', description: 'Not only own the mountains, but also enjoy them' },
    { title: 'Part of a financial portfolio', description: 'A share in real property as asset diversification' },
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
    { title: 'Non-binding consultation', description: 'We explain the product and answer your questions.' },
    { title: 'Choosing the number of shares', description: 'One, or as many as you like.' },
    { title: 'Signing a single contract', description: 'Without unnecessary paperwork.' },
    { title: 'Management and payout of returns', description: 'The cooperative runs everything, returns are paid out semi-annually.' },
  ],
  apartmentLabel: 'The apartment on offer',
  apartmentTitle: 'Apartment in Špindlerův Mlýn',
  apartmentIntro:
    'A furnished apartment 50 metres from the Labská chairlift and slope in Špindlerův Mlýn, one of the most popular ' +
    'mountain destinations in the Czech Republic. Visitors come all year round: skiing in winter, hiking in the Krkonoše in summer.',
  heroImageAlt: 'Apartment in Špindlerův Mlýn',
  photoAlt: (n) => `Apartment - photo ${n}`,
  aboutTitle: 'About the apartment',
  specsTitle: 'Specifications',
  specLayout: 'Layout',
  specTotalArea: 'Total area',
  specFloor: 'Floor',
  specOrientation: 'Orientation',
  specHall: 'Entrance hall',
  specBathroom: 'Bathroom',
  specLivingKitchen: 'Living room with kitchen',
  sharesTitle: 'This apartment is offered under cooperative ownership',
  sharesText: (total, percent) =>
    `The apartment is divided into ${total} cooperative shares. Each corresponds to ${percent}% of the apartment and costs ` +
    `CZK ${PODIL_PRICE_CZK.toLocaleString('en-GB')}. You can start with one share or acquire more.`,
  sold: 'Reserved',
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

/** Apartmán nabízený v družstevních podílech (číslo se na /podil nikde neuvádí). */
export const PODIL_APARTMENT_SLUG = 'chata-2-suite-11';

/**
 * Apartmán pro /podil ze stejného zdroje jako detail /suites/[slug] (tabulka apartments),
 * aby plochy a rozměry seděly s detailem. Při výpadku DB záloha ze statického JSON.
 */
export async function getPodilApartment(locale: Locale): Promise<ApartmentDB | null> {
  const fromDb = await getApartmentBySlugDB(PODIL_APARTMENT_SLUG);
  if (fromDb) return localizeApartment(fromDb, locale);
  const s = getSaleApartmentBySlug(PODIL_APARTMENT_SLUG);
  if (!s) return null;
  const area = Number.parseFloat(s.totalArea.replace(',', '.'));
  return {
    id: s.slug, slug: s.slug, title: s.title, subtitle: s.subtitle, layout: s.layout,
    area_m2: Number.isFinite(area) ? area : null, floor: s.floor, orientation: s.orientation,
    description: s.description, features: s.features, rooms: s.rooms,
    max_guests: null, base_price_cents: null, fdm_room_use_id: null,
    for_sale: true, for_rent: false, in_rental_program: false, status: s.status,
    title_en: null, subtitle_en: null, orientation_en: null, description_en: null, features_en: null,
    title_pl: null, subtitle_pl: null, orientation_pl: null, description_pl: null, features_pl: null,
  };
}

/**
 * Údaje nabízeného apartmánu ve zvoleném jazyce — formát ploch a podlaží stejný jako na /suites/[slug].
 * Texty už jsou lokalizované přes getPodilApartment (description_en, features_en, orientation_en).
 */
export function getPodilApartmentView(apartment: ApartmentDB, locale: Locale) {
  const en = locale === 'en';
  const roomArea = (v: string | null | undefined) =>
    v ? (en ? v.replace(/(\d),(\d)/g, '$1.$2') : v) : '—';
  // Czech NP numbering: 1. NP = ground floor (British convention)
  const ordinal = (n: number) => {
    const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
    return `${n}${s}`;
  };
  const floorNo = apartment.floor;
  const floor =
    floorNo == null ? '—'
      : !en ? `${floorNo}. NP`
      : floorNo <= 1 ? 'Ground floor' : `${ordinal(floorNo - 1)} floor`;
  return {
    description: apartment.description ?? '',
    features: apartment.features ?? [],
    layout: layoutLabel(apartment.layout, locale) || '—',
    totalArea: apartment.area_m2 != null
      ? Number(apartment.area_m2).toLocaleString(en ? 'en-GB' : 'cs-CZ') + ' m²'
      : '—',
    floor,
    orientation: apartment.orientation ?? '—',
    hall: roomArea(apartment.rooms?.hall),
    bathroom: roomArea(apartment.rooms?.bathroom),
    livingKitchen: roomArea(apartment.rooms?.livingKitchen),
  };
}
