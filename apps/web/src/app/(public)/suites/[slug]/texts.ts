/**
 * Texty prezentace apartmánu na prodej (/suites/[slug]) — CZ + EN (DEC-034: prodej bez PL).
 *
 * Pravidla obsahu (vibekodex vyber-prezentace + DEC-030):
 * - každé číslo z DB, FDM, půdorysu nebo citovaného zdroje; nic odhadnutého,
 * - cena „Na dotaz“ → žádný výnos v %, žádná cena za m², žádná kalkulačka,
 * - obsazenost = aktuální stav kalendáře správce, ne minulý výkon ani záruka,
 * - hodnocení z Booking.com patří celému ubytování Golden Ridge Apartments, ne jednomu bytu.
 */

import type { BaseLocale } from '@/lib/i18n';
import type { GalleryCategory } from '@/lib/sale-presentation';

export const SALE_TEXTS = {
  cs: {
    back: 'Zpět na přehled',
    forSale: 'Na prodej',
    price: 'Cena',
    priceOnRequest: 'Na dotaz',
    ctaViewing: 'Domluvit prohlídku',
    ctaRental: 'Pronájem v číslech',

    numbersLabel: 'V číslech',
    stats: {
      area: 'Celková plocha',
      layout: 'Dispozice',
      floor: 'Podlaží',
      topFloor: 'nejvyšší v domě',
      aspect: 'Orientace',
      guests: 'Hostů při pronájmu',
      lift: 'K lanovce Labská',
      rating: 'Hodnocení hostů',
      ratingNote: (count: string) => `Golden Ridge Apartments, ${count} hodnocení na Booking.com`,
      completed: 'Kolaudace domu',
      completedValue: '2023',
    },

    personasLabel: 'Pro koho',
    personasTitle: 'Hory pro sebe, příjem z pronájmu, nebo obojí',
    personas: [
      {
        title: 'Hory pro sebe',
        text: 'Apartmán 50 metrů od lanovky, kam přijedete kdykoli. Lyže zůstanou v uzamykatelné lyžárně, auto na parkovacím stání u domu.',
      },
      {
        title: 'Pronájem, když tam nejste',
        text: 'Apartmán už dnes hosté pronajímají pod značkou Golden Ridge Apartments. Rezervace chodí z webu i z Booking.com a Airbnb, pronájem a správu zajistí správce.',
      },
      {
        title: 'Obojí',
        text: 'Termíny pro sebe si blokujete sami a přehled rezervací vidíte v klientském portálu. Podmínky správy probereme při prohlídce.',
      },
    ],

    rentalLabel: 'Pronájem v číslech',
    rentalTitle: 'Ceník a obsazenost přímo z kalendáře správce',
    rentalLead:
      'Apartmán je v pronájmu. Čísla níže se načítají živě z rezervačního systému správce: kolik nocí nejbližší sezóny už je obsazených, v porovnání s celým domem, a kolik stojí noc v jednotlivých měsících.',
    seasonWinter: (label: string) => `Hlavní sezóna ${label}, prosinec–únor`,
    seasonNext90: 'Nejbližších 90 dní',
    kpiThis: 'Už obsazeno v tomto apartmánu',
    kpiHouse: (units: number) => `Průměr celého domu, ${units} apartmánů`,
    nightsTotal: (booked: number, nights: number) => `${booked} z ${nights} nocí`,
    peakPrice: 'Cena za noc v lednu a únoru',
    offPrice: 'Cena za noc mimo zimu',
    thisApt: 'Tento apartmán',
    houseAvg: 'Průměr domu',
    seasonNote: 'Vzdálenější měsíce se teprve plní, proto obsazenost uvádíme jen pro nejbližší sezónu.',
    priceTitle: 'Ceník za noc na rok dopředu',
    fromToday: 'od dneška',
    upTo: 'svátky až',
    nightsOf: (booked: number, nights: number) => `${booked} z ${nights}`,
    rentalNote: (date: string) =>
      `Stav k ${date}. Obsazené noci = rezervace hostů a blokace v kalendáři správce (Front Desk Master); průměr domu = všechny apartmány v pronájmu ve stejném období. ` +
      'Ceny jsou ceny za noc pro hosty, medián měsíce, před provizí správce, úklidem a daněmi. Jde o aktuální stav rezervací, ne o výsledek minulých let ani o záruku budoucího příjmu.',
    tryAsGuest: 'Prohlédněte si apartmán jako host',

    apartmentLabel: 'Apartmán',
    about: 'O apartmánu',
    rooms: 'Členění podle půdorysu',
    roomNames: { hall: 'Vstupní hala', bathroom: 'Koupelna', bedroom: 'Ložnice', livingKitchen: 'Pokoj s kuchyní' },
    features: 'Vybavení',

    galleryLabel: 'Fotografie',
    galleryTitle: 'Apartmán, dům a okolí',
    chapters: {
      interior: 'Apartmán',
      winter: 'Dům v zimě',
      exterior: 'Dům v létě',
      plan: 'Půdorysy',
      other: 'Další fotografie',
    } satisfies Record<GalleryCategory, string>,
    photoOf: (i: number, n: number) => `${i} / ${n}`,
    close: 'Zavřít',
    prev: 'Předchozí',
    next: 'Další',

    locationLabel: 'Dům a lokalita',
    locationTitle: 'U sjezdovky, v klidné části Labská',
    house: [
      { value: '19', label: 'apartmánů ve dvou horských domech' },
      { value: 'U = 0,16', label: 'W/m²K, obvodové stěny nízkoenergetické dřevostavby D.E.E.D.' },
      { value: '11/2023', label: 'kolaudace' },
    ],
    nearbyTitle: 'Vzdálenosti od domu',

    marketTitle: 'Ceny nemovitostí v regionu',

    stepsTitle: 'Postup koupě',
    contactLabel: 'Kontakt',
    contactTitle: 'Apartmán vám osobně ukáže',
    contactNote: 'Rádi vám zodpovíme všechny dotazy a domluvíme prohlídku.',
    email: 'Napsat e-mail',
    emailSubject: 'Zájem o',
    salesManager: null as string | null,

    otherLabel: 'Další apartmán na prodej',
    allForSale: 'Všechny apartmány na prodej',

    sourcesTitle: 'Zdroje a poznámky',
    sources: (ratingDate: string) => [
      'Plochy, dispozice, podlaží a orientace: projektová dokumentace a půdorysy apartmánu.',
      `Hodnocení hostů: veřejný profil Golden Ridge Apartments na Booking.com, stav k ${ratingDate}. Týká se celého ubytování, ne jen tohoto apartmánu.`,
      'Ceny za noc a obsazenost: rezervační systém správce (Front Desk Master), průběžně synchronizováno.',
      'Vzdálenosti: Booking.com a OpenStreetMap, zaokrouhleno.',
    ],
  },
  en: {
    back: 'Back to overview',
    forSale: 'For sale',
    price: 'Price',
    priceOnRequest: 'On request',
    ctaViewing: 'Arrange a viewing',
    ctaRental: 'Rental in figures',

    numbersLabel: 'In figures',
    stats: {
      area: 'Total area',
      layout: 'Layout',
      floor: 'Floor',
      topFloor: 'top floor of the building',
      aspect: 'Aspect',
      guests: 'Guests when let',
      lift: 'To the Labská chairlift',
      rating: 'Guest rating',
      ratingNote: (count: string) => `Golden Ridge Apartments, ${count} reviews on Booking.com`,
      completed: 'Building completed',
      completedValue: '2023',
    },

    personasLabel: 'Who it suits',
    personasTitle: 'Mountains for yourself, rental income, or both',
    personas: [
      {
        title: 'Mountains for yourself',
        text: 'An apartment 50 metres from the chairlift that you can come to whenever you like. Your skis stay in the lockable ski room and your car in a parking space by the building.',
      },
      {
        title: 'Letting it while you are away',
        text: 'Guests already book the apartment under the Golden Ridge Apartments brand. Bookings come from our website as well as Booking.com and Airbnb, and the manager takes care of letting and management.',
      },
      {
        title: 'Both',
        text: 'You block dates for yourself and see all bookings in the owner portal. We will go through the management terms at the viewing.',
      },
    ],

    rentalLabel: 'Rental in figures',
    rentalTitle: 'Prices and occupancy straight from the manager’s calendar',
    rentalLead:
      'The apartment is being let. The figures below are loaded live from the manager’s booking system: how many nights of the coming season are already booked, compared with the whole building, and the nightly price in each month.',
    seasonWinter: (label: string) => `Main season ${label}, December–February`,
    seasonNext90: 'Next 90 days',
    kpiThis: 'Already booked in this apartment',
    kpiHouse: (units: number) => `Average of the whole building, ${units} apartments`,
    nightsTotal: (booked: number, nights: number) => `${booked} of ${nights} nights`,
    peakPrice: 'Nightly price in January and February',
    offPrice: 'Nightly price outside winter',
    thisApt: 'This apartment',
    houseAvg: 'Building average',
    seasonNote: 'Later months are only starting to fill up, so occupancy is shown only for the coming season.',
    priceTitle: 'Nightly prices for the year ahead',
    fromToday: 'from today',
    upTo: 'holidays up to',
    nightsOf: (booked: number, nights: number) => `${booked} of ${nights}`,
    rentalNote: (date: string) =>
      `As of ${date}. Booked nights = guest bookings and blocks in the manager’s calendar (Front Desk Master); building average = all apartments being let over the same period. ` +
      'Prices are nightly guest prices, the monthly median, before the manager’s commission, cleaning and taxes. This is the current booking status, not a result of past years nor a guarantee of future income.',
    tryAsGuest: 'View the apartment as a guest',

    apartmentLabel: 'Apartment',
    about: 'About the apartment',
    rooms: 'Room breakdown from the floor plan',
    roomNames: { hall: 'Entrance hall', bathroom: 'Bathroom', bedroom: 'Bedroom', livingKitchen: 'Living room with kitchen' },
    features: 'Features',

    galleryLabel: 'Photos',
    galleryTitle: 'The apartment, the building and the surroundings',
    chapters: {
      interior: 'Apartment',
      winter: 'The building in winter',
      exterior: 'The building in summer',
      plan: 'Floor plans',
      other: 'More photos',
    } satisfies Record<GalleryCategory, string>,
    photoOf: (i: number, n: number) => `${i} / ${n}`,
    close: 'Close',
    prev: 'Previous',
    next: 'Next',

    locationLabel: 'Building and location',
    locationTitle: 'By the slope, in the quiet Labská part of town',
    house: [
      { value: '19', label: 'apartments in two mountain buildings' },
      { value: 'U = 0.16', label: 'W/m²K, external walls of the low-energy D.E.E.D. timber construction' },
      { value: '11/2023', label: 'building approval' },
    ],
    nearbyTitle: 'Distances from the building',

    marketTitle: 'Property prices in the region',

    stepsTitle: 'How the purchase works',
    contactLabel: 'Contact',
    contactTitle: 'Your viewing with',
    contactNote: 'We will be happy to answer all your questions and arrange a viewing.',
    email: 'Send an email',
    emailSubject: 'Enquiry about',
    salesManager: 'Sales Manager' as string | null,

    otherLabel: 'Another apartment for sale',
    allForSale: 'All apartments for sale',

    sourcesTitle: 'Sources and notes',
    sources: (ratingDate: string) => [
      'Area, layout, floor and aspect: project documentation and floor plans of the apartment.',
      `Guest rating: public Golden Ridge Apartments profile on Booking.com, as of ${ratingDate}. It covers the whole property, not only this apartment.`,
      'Nightly prices and occupancy: the manager’s booking system (Front Desk Master), synchronised continuously.',
      'Distances: Booking.com and OpenStreetMap, rounded.',
    ],
  },
} as const;

/** Postup koupě — převzato ze starého webu, bez rezervační zálohy (zadání 3. 11. 2026). Sdílí výpis /suites i detail. */
export const PURCHASE_STEPS = {
  cs: [
    { title: 'Rezervace', text: 'Vybraný apartmán vám nezávazně rezervujeme na dobu deseti dnů.' },
    { title: 'Rezervační smlouva', text: 'V této lhůtě svůj zájem potvrdíte podpisem rezervační smlouvy.' },
    { title: 'Kupní smlouva', text: 'Po podpisu kupní smlouvy uhradíte kupní cenu podle sjednaných platebních podmínek.' },
    { title: 'Zápis do katastru', text: 'Prodávající podá návrh na vklad vlastnického práva do katastru nemovitostí a apartmán vám předá.' },
  ],
  en: [
    { title: 'Reservation', text: 'We will reserve the apartment of your choice for ten days, with no obligation.' },
    { title: 'Reservation agreement', text: 'Within this period, you confirm your interest by signing a reservation agreement.' },
    { title: 'Purchase agreement', text: 'After signing the purchase agreement, you pay the purchase price according to the agreed payment terms.' },
    { title: 'Land register', text: 'The seller files the application to register your ownership in the Land Register and hands the apartment over to you.' },
  ],
} as const;

export function getSaleTexts(locale: BaseLocale) {
  return SALE_TEXTS[locale];
}
