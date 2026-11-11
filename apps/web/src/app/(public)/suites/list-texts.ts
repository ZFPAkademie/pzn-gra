/**
 * Texty výpisu apartmánů na prodej (/suites) — CZ + EN (DEC-034: prodej bez PL).
 *
 * Společné popisky (plocha, podlaží, místnosti, poznámka k obsazenosti, postup koupě)
 * se berou z textů detailu `[slug]/texts.ts`, tady je jen to, co má výpis navíc.
 * Stejná pravidla jako detail (DEC-040): cena „Na dotaz“, žádný výnos v %, obsazenost
 * = stav kalendáře správce k datu, ne minulý výkon.
 */

import type { BaseLocale } from '@/lib/i18n';

/** 1 apartmán · 2–4 apartmány · 5+ apartmánů */
const csPlural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);

export const SALE_LIST_TEXTS = {
  cs: {
    heroLabel: (n: number) => (n === 1 ? 'Poslední apartmán' : n <= 4 ? `Poslední ${n} apartmány` : `Posledních ${n} apartmánů`),
    heroTitle: 'Zkolaudované apartmány Pod Zlatým návrším',
    heroLead:
      'Vyberte si z posledních dostupných apartmánů ve Špindlerově Mlýně. Všechny jsou vybavené, některé nábytkem KARE Design, ' +
      'a připravené k okamžitému využití i pronájmu. Mají výhled na hory, soukromí a polohu jen pár desítek metrů od sjezdovky Labská.',
    ctaChoose: 'Vybrat apartmán',

    stats: {
      forSale: 'Na prodej',
      forSaleValue: (n: number) => `${n} ${csPlural(n, 'apartmán', 'apartmány', 'apartmánů')}`,
      forSaleNote: 'z 19 ve dvou horských domech',
      area: 'Plocha',
      completed: 'Kolaudace domů',
      completedValue: '11/2023',
      houseWinter: (label: string) => `Obsazenost domu, zima ${label}`,
      houseNext90: 'Obsazenost domu, příštích 90 dní',
      houseNote: (units: number, date: string) => `průměr ${units} apartmánů v pronájmu, prosinec–únor, stav k ${date}`,
      houseNoteNext90: (units: number, date: string) => `průměr ${units} apartmánů v pronájmu, stav k ${date}`,
    },

    listLabel: (n: number) => `${n} ${csPlural(n, 'apartmán', 'apartmány', 'apartmánů')} k prodeji`,
    listTitle: 'Každý apartmán má vlastní prezentaci',
    listLead:
      'Fotografie po kapitolách, půdorysy a členění ploch. U apartmánů, které se pronajímají, i ceník a obsazenost přímo z kalendáře správce.',
    photos: (n: number) => `${n} ${csPlural(n, 'fotografie', 'fotografie', 'fotografií')}`,
    plans: (n: number) => `${n} ${csPlural(n, 'půdorys', 'půdorysy', 'půdorysů')}`,
    occupiedWinter: (label: string) => `Obsazeno, zima ${label}`,
    occupiedNext90: 'Obsazeno, příštích 90 dní',
    houseAvg: 'Průměr domu',
    nightPeak: 'Noc v lednu a únoru',
    nightOff: 'Noc mimo zimu',
    open: 'Otevřít prezentaci',

    compareLabel: 'Srovnání',
    compareTitle: 'V čem se apartmány liší',
    compareParam: 'Parametr',

    houseLabel: 'Domy a standard',
    houseTitle: 'Co mají apartmány společné',
    houseFacts: (layouts: string) => [
      { title: 'Dva rezidenční domy', text: `V nabídce jsou poslední apartmány (${layouts}) ve dvou rezidenčních domech.` },
      { title: 'Lyžárna a kolárna', text: 'Každý dům má vlastní lyžárnu a kolárnu.' },
      { title: 'Parkování', text: 'K apartmánům je možné dokoupit garážové nebo venkovní stání.' },
      { title: 'Standard', text: 'Dřevěné podlahy, podlahové vytápění a kvalitní kuchyňská linka.' },
    ],

    videoLabel: 'Video',
    videoTitle: 'Prohlídka projektu',

    locLabel: 'Lokalita',
    locText:
      'Skiareál Špindlerův Mlýn se řadí k nejznámějším a nejnavštěvovanějším střediskům zimních sportů v ČR. ' +
      'Apartmánové domy se nacházejí 50 metrů od sedačkové lanovky a červené sjezdovky Labská.',
    locLink: 'Více o lokalitě',

    contactLabel: 'Váš kontakt',
    contactTitle: 'Máte zájem o koupi?',
    contactText:
      'Kontaktujte našeho manažera prodeje pro nezávaznou konzultaci a prohlídku apartmánů. Vybraný apartmán si můžete nejdřív pronajmout na zkoušku.',

    crossCalcText: 'Spočítejte si výnos z investice',
    crossCalcLink: 'Investiční kalkulačka',
    crossShareText: 'Preferujete podílové vlastnictví?',
    crossShareLink: 'Nemovitostní produkt',

    sources: (ratingDate: string) => [
      'Plochy, dispozice, podlaží a orientace: projektová dokumentace a půdorysy apartmánů.',
      `Hodnocení hostů: veřejný profil Golden Ridge Apartments na Booking.com, stav k ${ratingDate}. Týká se celého ubytování, ne jednotlivých apartmánů.`,
      'Ceny za noc a obsazenost: rezervační systém správce (Front Desk Master), průběžně synchronizováno.',
      'Vzdálenosti: Booking.com a OpenStreetMap, zaokrouhleno.',
    ],
  },
  en: {
    heroLabel: (n: number) => (n === 1 ? 'The last apartment' : `The last ${n} apartments`),
    heroTitle: 'Completed apartments at Pod Zlatým návrším',
    heroLead:
      'Choose from the last available apartments in Špindlerův Mlýn. All of them are furnished, some with KARE Design furniture, ' +
      'and ready to use or let straight away. They offer mountain views, privacy and a location just a few dozen metres from the Labská slope.',
    ctaChoose: 'Choose an apartment',

    stats: {
      forSale: 'For sale',
      forSaleValue: (n: number) => `${n} ${n === 1 ? 'apartment' : 'apartments'}`,
      forSaleNote: 'out of 19 in two mountain buildings',
      area: 'Area',
      completed: 'Buildings completed',
      completedValue: '11/2023',
      houseWinter: (label: string) => `Building occupancy, winter ${label}`,
      houseNext90: 'Building occupancy, next 90 days',
      houseNote: (units: number, date: string) => `average of ${units} apartments being let, December–February, as of ${date}`,
      houseNoteNext90: (units: number, date: string) => `average of ${units} apartments being let, as of ${date}`,
    },

    listLabel: (n: number) => `${n} ${n === 1 ? 'apartment' : 'apartments'} for sale`,
    listTitle: 'Each apartment has its own presentation',
    listLead:
      'Photos by chapter, floor plans and a room-by-room breakdown. For apartments that are being let, also nightly prices and occupancy straight from the manager’s calendar.',
    photos: (n: number) => `${n} ${n === 1 ? 'photo' : 'photos'}`,
    plans: (n: number) => `${n} ${n === 1 ? 'floor plan' : 'floor plans'}`,
    occupiedWinter: (label: string) => `Booked, winter ${label}`,
    occupiedNext90: 'Booked, next 90 days',
    houseAvg: 'Building average',
    nightPeak: 'Night in January and February',
    nightOff: 'Night outside winter',
    open: 'Open the presentation',

    compareLabel: 'Comparison',
    compareTitle: 'How the apartments differ',
    compareParam: 'Parameter',

    houseLabel: 'Buildings and standard',
    houseTitle: 'What the apartments have in common',
    houseFacts: (layouts: string) => [
      { title: 'Two residential buildings', text: `On offer are the last apartments (${layouts}) in two residential buildings.` },
      { title: 'Ski room and bike storage', text: 'Each building has its own ski room and bike storage.' },
      { title: 'Parking', text: 'A garage or outdoor parking space can be purchased with the apartments.' },
      { title: 'Standard', text: 'Wooden floors, underfloor heating and a quality fitted kitchen.' },
    ],

    videoLabel: 'Video',
    videoTitle: 'Project tour',

    locLabel: 'Location',
    locText:
      'The Špindlerův Mlýn ski resort is one of the best-known and most visited winter sports resorts in the Czech Republic. ' +
      'The apartment buildings are 50 metres from the Labská chairlift and the red Labská slope.',
    locLink: 'More about the location',

    contactLabel: 'Your contact',
    contactTitle: 'Interested in buying?',
    contactText:
      'Contact our sales manager for a no-obligation consultation and a viewing of the apartments. You can rent your chosen apartment first to try it out.',

    crossCalcText: 'Calculate the return on your investment',
    crossCalcLink: 'Investment calculator',
    crossShareText: 'Prefer shared ownership?',
    crossShareLink: 'Real estate product',

    sources: (ratingDate: string) => [
      'Area, layout, floor and aspect: project documentation and floor plans of the apartments.',
      `Guest rating: public Golden Ridge Apartments profile on Booking.com, as of ${ratingDate}. It covers the whole property, not individual apartments.`,
      'Nightly prices and occupancy: the manager’s booking system (Front Desk Master), synchronised continuously.',
      'Distances: Booking.com and OpenStreetMap, rounded.',
    ],
  },
} as const;

export function getSaleListTexts(locale: BaseLocale) {
  return SALE_LIST_TEXTS[locale];
}
