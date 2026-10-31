/**
 * Informace pro hosty sdílené napříč webem — pravidla pobytu, praktické informace,
 * hodnocení hostů, vzdálenosti a časté dotazy.
 *
 * Zdroj: veřejný inzerát Golden Ridge Apartments na Booking.com (stav k 1. 11. 2026)
 * + údaje provozovatele. Jediné místo pravdy: detail apartmánu, přehled pronájmu,
 * Lokalita i úvodní stránka čtou odsud. Při změně podmínek upravit jen tento soubor.
 */

import type { Locale } from '@/lib/i18n';

export const PROPERTY = {
  name: 'Golden Ridge Apartments · Pod Zlatým návrším',
  street: 'Labská 113 a 114',
  city: '543 51 Špindlerův Mlýn',
  lat: 50.714718,
  lng: 15.579834,
} as const;

/** Hodnocení hostů na Booking.com — ruční opis, aktualizovat spolu s `asOf` */
export const GUEST_RATING = {
  source: 'Booking.com',
  score: 9.4,
  count: 398,
  asOf: '2026-11-01',
  categories: [
    { key: 'comfort', score: 9.6 },
    { key: 'cleanliness', score: 9.5 },
    { key: 'facilities', score: 9.5 },
    { key: 'value', score: 9.4 },
    { key: 'location', score: 9.2 },
    { key: 'staff', score: 9.2 },
    { key: 'wifi', score: 10 },
  ],
} as const;

export type RatingCategoryKey = (typeof GUEST_RATING.categories)[number]['key'];

/** Citace hostů z Booking.com (zkráceno, křestní jména tak, jak je uvádí Booking) */
export const GUEST_QUOTES: { name: string; text: Record<Locale, string> }[] = [
  {
    name: 'Michal',
    text: {
      cs: 'Perfektně vybavený moderní apartmán. Vše bylo nové. Kuchyň výborně vybavená, postele pohodlné, lyžárna, poloha hned vedle lanovky a sjezdovky, parkování vyhrazené.',
      en: 'A perfectly equipped modern apartment. Everything was new. Excellent kitchen, comfortable beds, a ski room, right next to the chairlift and the slope, reserved parking.',
      pl: 'Doskonale wyposażony, nowoczesny apartament. Wszystko było nowe. Świetnie wyposażona kuchnia, wygodne łóżka, narciarnia, położenie tuż przy wyciągu i stoku, zarezerwowany parking.',
    },
  },
  {
    name: 'Kateřina',
    text: {
      cs: 'Krásný, nový a prostorný apartmán, skvělá lokalita a kompletní vybavení kuchyně. Pračka, sušák a myčka nádobí bylo příjemné zjištění. Majitel velmi ochotný.',
      en: 'A beautiful, new and spacious apartment, a great location and a fully equipped kitchen. The washing machine, drying rack and dishwasher were a pleasant surprise. A very helpful host.',
      pl: 'Piękny, nowy i przestronny apartament, świetna lokalizacja i w pełni wyposażona kuchnia. Pralka, suszarka i zmywarka były miłym zaskoczeniem. Bardzo pomocny gospodarz.',
    },
  },
  {
    name: 'Matěj',
    text: {
      cs: 'Kvalita architektonického zpracování a designu je špičková. Čekal jsem pěkný apartmán, ale byl krásný. Místo je odlehlé od turistického šrumce, což jsem hledal a našel.',
      en: 'The quality of the architecture and design is top class. I expected a nice apartment and got a beautiful one. The place is away from the tourist bustle, which is exactly what I was looking for.',
      pl: 'Jakość architektury i designu jest najwyższej klasy. Spodziewałem się ładnego apartamentu, a był piękny. Miejsce z dala od turystycznego zgiełku, dokładnie tego szukałem.',
    },
  },
  {
    name: 'Michelle',
    text: {
      cs: 'Úžasný výhled, naprostý klid, super matrace, spokojení pejsci. Apartmán mohu vřele doporučit. Rádi se vrátíme.',
      en: 'An amazing view, total peace and quiet, great mattresses, happy dogs. I can warmly recommend the apartment. We will be back.',
      pl: 'Wspaniały widok, absolutny spokój, świetne materace, zadowolone psy. Serdecznie polecam. Chętnie wrócimy.',
    },
  },
  {
    name: 'Martinovská',
    text: {
      cs: 'Vše naprosto super, lokalita, ubytování a krásný pokoj s výhledem. S nikým se nemusíte potkat, klíče si vyzvednete ve schránce.',
      en: 'Everything was great: the location, the accommodation and a lovely room with a view. You do not need to meet anyone, you collect the keys from the key box.',
      pl: 'Wszystko świetne: lokalizacja, apartament i piękny pokój z widokiem. Nie trzeba się z nikim spotykać, klucze odbiera się ze skrzynki.',
    },
  },
];

/** Vzdálenosti od domu (Booking.com / OpenStreetMap, zaokrouhleno) */
export const NEARBY: { key: string; distance: string; label: Record<Locale, string> }[] = [
  { key: 'lift', distance: '50 m', label: { cs: 'Lanovka a sjezdovka Labská', en: 'Labská chairlift and slope', pl: 'Wyciąg i stok Labská' } },
  { key: 'skibus', distance: '50 m', label: { cs: 'Zastávka skibusu Labská (zimní sezóna)', en: 'Labská ski bus stop (winter season)', pl: 'Przystanek skibusu Labská (sezon zimowy)' } },
  { key: 'restaurant', distance: '1,9 km', label: { cs: 'Nejbližší restaurace a kavárna', en: 'Nearest restaurant and café', pl: 'Najbliższa restauracja i kawiarnia' } },
  { key: 'centre', distance: '2,2 km', label: { cs: 'Centrum Špindlerova Mlýna', en: 'Špindlerův Mlýn town centre', pl: 'Centrum Szpindlerowego Młyna' } },
  { key: 'bus', distance: '2,2 km', label: { cs: 'Autobusové nádraží', en: 'Bus station', pl: 'Dworzec autobusowy' } },
  { key: 'hromovka', distance: '2,2 km', label: { cs: 'Ski areál Hromovka', en: 'Hromovka ski area', pl: 'Ośrodek narciarski Hromovka' } },
  { key: 'svatypetr', distance: '3 km', label: { cs: 'Ski areál Svatý Petr', en: 'Svatý Petr ski area', pl: 'Ośrodek narciarski Svatý Petr' } },
  { key: 'aquapark', distance: '3,8 km', label: { cs: 'Aquapark Špindlerův Mlýn', en: 'Špindlerův Mlýn aquapark', pl: 'Aquapark Szpindlerowy Młyn' } },
  { key: 'labskabouda', distance: '8 km', label: { cs: 'Labská bouda a pramen Labe', en: 'Labská bouda and the source of the Elbe', pl: 'Labská bouda i źródło Łaby' } },
  { key: 'snezka', distance: '12 km', label: { cs: 'Sněžka', en: 'Sněžka', pl: 'Śnieżka' } },
];

/** Pravidla pobytu — stejná jako v inzerátu na Booking.com */
export const HOUSE_RULES: { key: string; label: Record<Locale, string>; value: Record<Locale, string> }[] = [
  {
    key: 'checkin',
    label: { cs: 'Příjezd', en: 'Check-in', pl: 'Zameldowanie' },
    value: {
      cs: '16:00–24:00, samoobslužně. Kód ke schránce s klíči pošleme před příjezdem.',
      en: '4 pm to midnight, self check-in. We send the key box code before your arrival.',
      pl: '16:00–24:00, samodzielnie. Kod do skrzynki z kluczami wyślemy przed przyjazdem.',
    },
  },
  {
    key: 'checkout',
    label: { cs: 'Odjezd', en: 'Check-out', pl: 'Wymeldowanie' },
    value: { cs: 'do 11:00', en: 'by 11 am', pl: 'do 11:00' },
  },
  {
    key: 'cancellation',
    label: { cs: 'Zrušení rezervace', en: 'Cancellation', pl: 'Anulowanie rezerwacji' },
    value: {
      cs: 'Zdarma do 14 dnů před příjezdem.',
      en: 'Free of charge up to 14 days before arrival.',
      pl: 'Bezpłatnie do 14 dni przed przyjazdem.',
    },
  },
  {
    key: 'payment',
    label: { cs: 'Platba', en: 'Payment', pl: 'Płatność' },
    value: {
      cs: 'Bankovním převodem nebo QR platbou podle potvrzení rezervace.',
      en: 'By bank transfer or QR payment according to the booking confirmation.',
      pl: 'Przelewem bankowym lub płatnością QR zgodnie z potwierdzeniem rezerwacji.',
    },
  },
  {
    key: 'children',
    label: { cs: 'Děti', en: 'Children', pl: 'Dzieci' },
    value: {
      cs: 'Vítány v jakémkoli věku. Dětská postýlka na vyžádání za 10 € za pobyt.',
      en: 'Welcome at any age. A cot is available on request for €10 per stay.',
      pl: 'Mile widziane w każdym wieku. Łóżeczko dziecięce na życzenie za 10 € za pobyt.',
    },
  },
  {
    key: 'pets',
    label: { cs: 'Domácí mazlíčci', en: 'Pets', pl: 'Zwierzęta' },
    value: {
      cs: 'Vítáni za poplatek. Dejte nám prosím vědět předem.',
      en: 'Welcome for a fee. Please let us know in advance.',
      pl: 'Mile widziane za opłatą. Prosimy o wcześniejszą informację.',
    },
  },
  {
    key: 'quiet',
    label: { cs: 'Noční klid', en: 'Quiet hours', pl: 'Cisza nocna' },
    value: { cs: '22:00–8:00', en: '10 pm to 8 am', pl: '22:00–8:00' },
  },
  {
    key: 'smoking',
    label: { cs: 'Kouření a akce', en: 'Smoking and events', pl: 'Palenie i imprezy' },
    value: {
      cs: 'Apartmány jsou nekuřácké. Večírky a oslavy nejsou povoleny.',
      en: 'The apartments are non-smoking. Parties and events are not allowed.',
      pl: 'Apartamenty są dla niepalących. Imprezy i uroczystości nie są dozwolone.',
    },
  },
  {
    key: 'damage',
    label: { cs: 'Škody', en: 'Damage', pl: 'Szkody' },
    value: {
      cs: 'Za škodu způsobenou během pobytu můžeme požadovat náhradu do 100 €.',
      en: 'We may claim compensation of up to €100 for damage caused during the stay.',
      pl: 'Za szkody wyrządzone podczas pobytu możemy żądać odszkodowania do 100 €.',
    },
  },
  {
    key: 'languages',
    label: { cs: 'Domluvíte se', en: 'Languages spoken', pl: 'Języki' },
    value: {
      cs: 'česky, anglicky, slovensky, ukrajinsky',
      en: 'Czech, English, Slovak, Ukrainian',
      pl: 'czeski, angielski, słowacki, ukraiński',
    },
  },
];

/** Praktické informace o domě — i to, co hosté v recenzích zmiňují jako překvapení */
export const PRACTICAL: { key: string; text: Record<Locale, string> }[] = [
  { key: 'parking', text: { cs: 'Soukromé parkování zdarma přímo u domu, bez rezervace.', en: 'Free private parking right by the building, no reservation needed.', pl: 'Bezpłatny prywatny parking bezpośrednio przy budynku, bez rezerwacji.' } },
  { key: 'skiroom', text: { cs: 'Uzamykatelná lyžárna a kolárna v přízemí.', en: 'Lockable ski and bike room on the ground floor.', pl: 'Zamykana narciarnia i rowerownia na parterze.' } },
  { key: 'wifi', text: { cs: 'Wi-Fi zdarma v celém domě, hosté ji hodnotí 10 z 10.', en: 'Free Wi-Fi throughout the building, rated 10 out of 10 by guests.', pl: 'Bezpłatne Wi-Fi w całym budynku, ocenione przez gości na 10 z 10.' } },
  { key: 'kitchen', text: { cs: 'Plně vybavená kuchyň: myčka, trouba, mikrovlnná trouba, varná deska, kávovar, konvice, toustovač.', en: 'Fully equipped kitchen: dishwasher, oven, microwave, hob, coffee machine, kettle, toaster.', pl: 'W pełni wyposażona kuchnia: zmywarka, piekarnik, mikrofalówka, płyta grzewcza, ekspres do kawy, czajnik, toster.' } },
  { key: 'laundry', text: { cs: 'Pračka a sušák na prádlo v apartmánu, žehlička k dispozici.', en: 'Washing machine and drying rack in the apartment, iron available.', pl: 'Pralka i suszarka na pranie w apartamencie, żelazko do dyspozycji.' } },
  { key: 'tv', text: { cs: 'Televize s plochou obrazovkou a streamovacími službami, společenské hry.', en: 'Flat-screen TV with streaming services, board games.', pl: 'Telewizor z płaskim ekranem i serwisami streamingowymi, gry planszowe.' } },
  { key: 'bathroom', text: { cs: 'Vlastní koupelna s vanou nebo sprchou, fén, ručníky a toaletní potřeby v ceně.', en: 'Private bathroom with bath or shower, hairdryer, towels and toiletries included.', pl: 'Własna łazienka z wanną lub prysznicem, suszarka, ręczniki i kosmetyki w cenie.' } },
  { key: 'safe', text: { cs: 'Trezor, extra dlouhé postele (přes 2 metry), ložní prádlo v ceně.', en: 'Safe, extra-long beds (over 2 metres), bed linen included.', pl: 'Sejf, bardzo długie łóżka (ponad 2 metry), pościel w cenie.' } },
  { key: 'building', text: { cs: 'Dům má tři podlaží bez výtahu.', en: 'The building has three floors and no lift.', pl: 'Budynek ma trzy kondygnacje, bez windy.' } },
  { key: 'access', text: { cs: 'Příjezd k domu vede do kopce. V zimě počítejte se zimní výbavou auta.', en: 'The access road climbs uphill. In winter, make sure your car has winter equipment.', pl: 'Dojazd do budynku prowadzi pod górę. Zimą prosimy o zimowe wyposażenie samochodu.' } },
  { key: 'centre', text: { cs: 'Klidná část Labská: centrum je 2,2 km, v zimě skibusem od lanovky, pěšky asi 40 minut.', en: 'The quiet Labská part of town: the centre is 2.2 km away, by ski bus from the chairlift in winter or about 40 minutes on foot.', pl: 'Spokojna część Labská: centrum oddalone o 2,2 km, zimą skibusem od wyciągu, pieszo około 40 minut.' } },
];

/** Časté dotazy hostů (vychází z otázek, které hosté kladou na Booking.com) */
export const FAQ: { key: string; q: Record<Locale, string>; a: Record<Locale, string> }[] = [
  {
    key: 'arrival',
    q: { cs: 'Jak probíhá příjezd?', en: 'How does check-in work?', pl: 'Jak wygląda zameldowanie?' },
    a: {
      cs: 'Samoobslužně kdykoli mezi 16:00 a 24:00. Před příjezdem dostanete kód ke schránce s klíči, číslo apartmánu a pokyny k parkování. S nikým se nemusíte potkat.',
      en: 'Self check-in any time between 4 pm and midnight. Before arrival you receive the key box code, your apartment number and parking instructions. You do not need to meet anyone.',
      pl: 'Samodzielnie w dowolnym momencie między 16:00 a 24:00. Przed przyjazdem otrzymają Państwo kod do skrzynki z kluczami, numer apartamentu i instrukcje dotyczące parkowania.',
    },
  },
  {
    key: 'parking',
    q: { cs: 'Je parkování v ceně?', en: 'Is parking included?', pl: 'Czy parking jest w cenie?' },
    a: {
      cs: 'Ano. Soukromé parkoviště přímo u domu je zdarma a není potřeba ho rezervovat.',
      en: 'Yes. The private car park right by the building is free and does not need to be reserved.',
      pl: 'Tak. Prywatny parking bezpośrednio przy budynku jest bezpłatny i nie wymaga rezerwacji.',
    },
  },
  {
    key: 'lift',
    q: { cs: 'Jak daleko je lanovka a centrum?', en: 'How far are the chairlift and the town centre?', pl: 'Jak daleko jest wyciąg i centrum?' },
    a: {
      cs: 'Lanovka Labská se sjezdovkou dlouhou 1 770 m je 50 metrů od domu, dojedete k ní na lyžích. Centrum Špindlerova Mlýna je 2,2 km: v zimě skibusem od lanovky, autem pár minut, pěšky asi 40 minut.',
      en: 'The Labská chairlift with its 1,770 m slope is 50 metres from the building and you can ski to it. The centre of Špindlerův Mlýn is 2.2 km away: by ski bus from the lift in winter, a few minutes by car or about 40 minutes on foot.',
      pl: 'Wyciąg Labská ze stokiem o długości 1770 m znajduje się 50 metrów od budynku, można do niego dojechać na nartach. Centrum Szpindlerowego Młyna jest oddalone o 2,2 km: zimą skibusem od wyciągu, samochodem kilka minut, pieszo około 40 minut.',
    },
  },
  {
    key: 'pets',
    q: { cs: 'Můžu přijet se psem?', en: 'Can I bring my dog?', pl: 'Czy mogę przyjechać z psem?' },
    a: {
      cs: 'Ano, domácí mazlíčci jsou vítáni za poplatek. Napište nám to prosím do poznámky k rezervaci.',
      en: 'Yes, pets are welcome for a fee. Please mention it in the note to your booking.',
      pl: 'Tak, zwierzęta są mile widziane za opłatą. Prosimy o informację w uwagach do rezerwacji.',
    },
  },
  {
    key: 'kitchen',
    q: { cs: 'Co je v kuchyni?', en: 'What is in the kitchen?', pl: 'Co znajduje się w kuchni?' },
    a: {
      cs: 'Myčka, trouba, mikrovlnná trouba, varná deska, lednice s mrazákem, kávovar, rychlovarná konvice, toustovač a kompletní nádobí. Vaříte jako doma.',
      en: 'Dishwasher, oven, microwave, hob, fridge with freezer, coffee machine, kettle, toaster and a full set of cookware. You can cook just like at home.',
      pl: 'Zmywarka, piekarnik, mikrofalówka, płyta grzewcza, lodówka z zamrażarką, ekspres do kawy, czajnik, toster i komplet naczyń.',
    },
  },
  {
    key: 'cancel',
    q: { cs: 'Jak zruším rezervaci?', en: 'How do I cancel a booking?', pl: 'Jak anulować rezerwację?' },
    a: {
      cs: 'Do 14 dnů před příjezdem zdarma, stačí napsat na rezervace@podzlatymnavrsim.cz nebo využít odkaz na rezervační kartě.',
      en: 'Free of charge up to 14 days before arrival. Just e-mail rezervace@podzlatymnavrsim.cz or use the link on your booking card.',
      pl: 'Bezpłatnie do 14 dni przed przyjazdem. Wystarczy napisać na rezervace@podzlatymnavrsim.cz lub skorzystać z odnośnika na karcie rezerwacji.',
    },
  },
  {
    key: 'summer',
    q: { cs: 'Co dělat v létě?', en: 'What is there to do in summer?', pl: 'Co robić latem?' },
    a: {
      cs: 'Turistika a kola přímo od domu: Labská přehrada, pramen Labe a Labská bouda, Zlaté návrší, Sněžka. Lanovka Labská jezdí i v létě. V okolí je aquapark, bobová dráha a golf.',
      en: 'Hiking and cycling straight from the door: the Labská dam, the source of the Elbe and Labská bouda, Zlaté návrší, Sněžka. The Labská chairlift also runs in summer. An aquapark, a bobsleigh track and golf are nearby.',
      pl: 'Piesze wędrówki i rowery prosto spod domu: zapora Labská, źródło Łaby i Labská bouda, Zlaté návrší, Śnieżka. Wyciąg Labská kursuje również latem. W okolicy aquapark, tor saneczkowy i golf.',
    },
  },
];

/** Konfigurace lůžek odvozená z dispozice a kapacity (údaje shodné s Booking.com) */
export function bedConfiguration(
  apt: { layout: string | null; max_guests: number | null },
  locale: Locale,
): string {
  const twoRooms = (apt.layout ?? '').startsWith('2');
  const couple = (apt.max_guests ?? 4) <= 2;
  const T = {
    cs: {
      two: 'Ložnice s manželskou postelí king (extra dlouhá) a rozkládací pohovka v obývacím pokoji',
      couple: 'Manželská postel king (extra dlouhá)',
      studio: 'Manželská postel king (extra dlouhá) a rozkládací pohovka pro 2 osoby',
    },
    en: {
      two: 'Bedroom with an extra-long king bed and a sofa bed in the living room',
      couple: 'Extra-long king bed',
      studio: 'Extra-long king bed and a sofa bed for 2',
    },
    pl: {
      two: 'Sypialnia z łóżkiem king (bardzo długim) i rozkładana sofa w salonie',
      couple: 'Łóżko king (bardzo długie)',
      studio: 'Łóżko king (bardzo długie) i rozkładana sofa dla 2 osób',
    },
  }[locale];
  return twoRooms ? T.two : couple ? T.couple : T.studio;
}

export function formatScore(score: number, locale: Locale): string {
  return locale === 'en' ? score.toFixed(1) : score.toFixed(1).replace('.', ',');
}

export function formatCount(count: number, locale: Locale): string {
  return count.toLocaleString(locale === 'cs' ? 'cs-CZ' : locale === 'pl' ? 'pl-PL' : 'en-GB');
}

export function formatAsOf(iso: string, locale: Locale): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : locale === 'pl' ? 'pl-PL' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
