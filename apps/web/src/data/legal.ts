/**
 * Právní dokumenty webu — obchodní podmínky ubytování a zásady ochrany osobních údajů.
 * Ubytovatel a provozovatel webu: Echo Wave s.r.o. (zadal uživatel 3. 11. 2026, údaje z ARES).
 * Storno: zdarma do 14 dnů před příjezdem, později 100 %; poplatek z pobytu je v ceně (zadání 3. 11. 2026).
 * Provozní pravidla pobytu drží `stay-info.ts` — při změně tam uprav i tady.
 * Jazyky: cs + en + pl (rezervační proces, DEC-034).
 */

import type { Locale } from '@/lib/i18n';
import { SALES_COMPANY } from '@/data/sales-company';

export const OPERATOR = {
  name: 'Echo Wave s.r.o.',
  address: 'Rybná 716/24, Staré Město, 110 00 Praha 1',
  ico: '24074951',
  dic: 'CZ24074951',
  registerCs: 'C 438329 vedená u Městského soudu v Praze',
  registerEn: 'C 438329, Municipal Court in Prague',
  registerPl: 'C 438329, Sąd Miejski w Pradze',
  email: 'info@podzlatymnavrsim.cz',
} as const;

export const LEGAL_EFFECTIVE = { cs: '3. listopadu 2026', en: '3 November 2026', pl: '3 listopada 2026' } as const;
/** Zásady ochrany osobních údajů — změna 13. 11. 2026: analytika se souhlasem (lišta cookies). */
export const PRIVACY_EFFECTIVE = { cs: '13. listopadu 2026', en: '13 November 2026', pl: '13 listopada 2026' } as const;

export interface LegalSection {
  /** Kotva v URL (např. #cookies z lišty souhlasu). */
  id?: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDocument {
  tagline: string;
  title: string;
  intro: string;
  effective: string;
  sections: LegalSection[];
}

const ACCOMMODATION = 'Golden Ridge Apartments, Labská 113 a 114, 543 51 Špindlerův Mlýn';

// ═══════════════════════════════════════════════════════════
// OBCHODNÍ PODMÍNKY UBYTOVÁNÍ
// ═══════════════════════════════════════════════════════════

export const TERMS: Record<Locale, LegalDocument> = {
  cs: {
    tagline: 'Pronájem apartmánů',
    title: 'Obchodní podmínky',
    intro: `Tyto obchodní podmínky upravují ubytování v apartmánech Pod Zlatým návrším (${ACCOMMODATION}) rezervovaném přes web podzlatymnavrsim.cz.`,
    effective: `Účinné od ${PRIVACY_EFFECTIVE.cs}`,
    sections: [
      {
        title: 'Ubytovatel',
        paragraphs: [
          `${OPERATOR.name}, ${OPERATOR.address}, IČ ${OPERATOR.ico}, DIČ ${OPERATOR.dic}, zapsaná v obchodním rejstříku, sp. zn. ${OPERATOR.registerCs}. Kontakt: ${OPERATOR.email}.`,
          'Ubytovatel poskytuje ubytování v apartmánech svým jménem, a to i v apartmánech, jejichž vlastníci mu svěřili jejich pronájem.',
          'Rezervace uzavřené přes Booking.com, Airbnb a další portály se řídí podmínkami daného portálu. Pravidla pobytu uvedená níže platí pro všechny hosty.',
        ],
      },
      {
        title: 'Rezervace a uzavření smlouvy',
        items: [
          'Host vybere apartmán a termín, vyplní rezervační formulář a odešle ho. Odesláním formuláře host potvrzuje, že se s těmito podmínkami seznámil a souhlasí s nimi.',
          'Po odeslání dostane host e-mail s rekapitulací rezervace, cenou a platebními pokyny. Stejné údaje najde na své rezervační kartě.',
          'Smlouva o ubytování vzniká připsáním platby na účet ubytovatele. O přijetí platby a potvrzení rezervace host dostane e-mail.',
          'Pokud host cenu neuhradí, ubytovatel může nepotvrzenou rezervaci zrušit.',
        ],
      },
      {
        title: 'Cena a platba',
        items: [
          'Cena pobytu se řídí ceníkem platným v okamžiku rezervace a je uvedena v rezervaci včetně měny.',
          'Cena zahrnuje ubytování pro sjednaný počet osob, ložní prádlo, ručníky, parkování u domu, Wi-Fi a poplatek z pobytu.',
          'Cenu host hradí předem bankovním převodem nebo QR platbou podle pokynů v potvrzení rezervace.',
          'Dětskou postýlku zapůjčíme na vyžádání za 10 € za pobyt. Domácí mazlíčci jsou vítáni za poplatek, dejte nám o nich prosím vědět předem.',
        ],
      },
      {
        title: 'Zrušení rezervace',
        items: [
          'Host může rezervaci zrušit zdarma nejpozději 14 dnů před dnem příjezdu, a to e-mailem na info@podzlatymnavrsim.cz nebo odkazem na rezervační kartě. Uhrazenou cenu vrátíme bez zbytečného odkladu, nejpozději do 14 dnů od zrušení, na účet, ze kterého byla zaplacena.',
          'Při zrušení později než 14 dnů před příjezdem, při nenastoupení pobytu nebo při předčasném odjezdu se cena pobytu nevrací.',
          'Pokud ubytovatel nemůže ubytování poskytnout z důvodů, které nemohl ovlivnit (například havárie v apartmánu nebo zásah vyšší moci), nabídne hostovi jiný apartmán nebo termín, a pokud host nabídku nepřijme, vrátí mu celou uhrazenou cenu.',
          'Spotřebitel nemůže od smlouvy o ubytování odstoupit ve lhůtě 14 dnů bez udání důvodu, protože jde o službu poskytovanou ve sjednaném termínu (§ 1837 písm. j) občanského zákoníku). Bezplatné zrušení podle prvního bodu tím není dotčeno.',
        ],
      },
      {
        title: 'Pobyt',
        items: [
          'Příjezd je samoobslužný mezi 16:00 a 24:00. Kód ke schránce s klíči, číslo apartmánu a pokyny k parkování pošleme před příjezdem.',
          'Odjezd je do 11:00. Klíče host vrátí do schránky.',
          'V apartmánu může být ubytováno nejvýše tolik osob, kolik je uvedeno v rezervaci.',
          'Host je povinen sdělit údaje potřebné k zápisu do evidence ubytovaných hostů podle zákona o místních poplatcích a u cizinců také podle zákona o pobytu cizinců.',
          'Noční klid platí od 22:00 do 8:00. Apartmány jsou nekuřácké, večírky a oslavy nejsou povoleny.',
          'Dům má tři podlaží bez výtahu. Příjezd k domu vede do kopce, v zimě je potřeba zimní výbava auta.',
        ],
      },
      {
        title: 'Odpovědnost za škodu',
        paragraphs: [
          'Host odpovídá za škodu, kterou během pobytu způsobí on nebo osoby a zvířata, která s ním pobývají. Za škodu může ubytovatel požadovat náhradu do 100 €. Škodu prosím nahlaste hned, jakmile vznikne.',
        ],
      },
      {
        title: 'Reklamace',
        paragraphs: [
          'Pokud něco v apartmánu nefunguje nebo neodpovídá rezervaci, dejte nám vědět během pobytu na info@podzlatymnavrsim.cz, abychom to mohli hned napravit. Reklamaci vyřídíme bez zbytečného odkladu, nejpozději do 30 dnů od jejího uplatnění.',
        ],
      },
      {
        title: 'Mimosoudní řešení sporů',
        paragraphs: [
          'Spotřebitel má právo na mimosoudní řešení sporu ze smlouvy o ubytování. Příslušným subjektem je Česká obchodní inspekce, Štěpánská 567/15, 120 00 Praha 2, www.coi.cz.',
        ],
      },
      {
        title: 'Osobní údaje',
        paragraphs: [
          'Osobní údaje hostů zpracováváme podle zásad ochrany osobních údajů zveřejněných na stránce Ochrana soukromí.',
        ],
      },
      {
        title: 'Závěrečná ustanovení',
        paragraphs: [
          'Smlouva o ubytování se řídí právem České republiky, zejména občanským zákoníkem. Ubytovatel může tyto podmínky měnit; pro rezervaci platí podmínky účinné v den jejího odeslání.',
        ],
      },
    ],
  },
  en: {
    tagline: 'Apartment rentals',
    title: 'Terms and conditions',
    intro: `These terms and conditions govern accommodation in the Pod Zlatým návrším apartments (${ACCOMMODATION}) booked through the podzlatymnavrsim.cz website.`,
    effective: `Effective from ${PRIVACY_EFFECTIVE.en}`,
    sections: [
      {
        title: 'Accommodation provider',
        paragraphs: [
          `${OPERATOR.name}, ${OPERATOR.address}, Czech Republic, Company ID ${OPERATOR.ico}, VAT ID ${OPERATOR.dic}, registered in the Commercial Register, file no. ${OPERATOR.registerEn}. Contact: ${OPERATOR.email}.`,
          'The provider offers accommodation in its own name, including in apartments whose owners have entrusted it with their rental.',
          'Bookings made through Booking.com, Airbnb and other platforms are governed by the terms of that platform. The house rules below apply to all guests.',
        ],
      },
      {
        title: 'Booking and conclusion of the contract',
        items: [
          'The guest selects an apartment and dates, completes the booking form and submits it. By submitting the form, the guest confirms that they have read and agree to these terms.',
          'After submitting, the guest receives an e-mail with a summary of the booking, the price and payment instructions. The same details are available on their booking card.',
          'The accommodation contract is concluded when the payment is credited to the provider’s account. The guest receives an e-mail confirming receipt of payment and the booking.',
          'If the guest does not pay the price, the provider may cancel the unconfirmed booking.',
        ],
      },
      {
        title: 'Price and payment',
        items: [
          'The price of the stay follows the price list valid at the time of booking and is stated in the booking, including the currency.',
          'The price includes accommodation for the agreed number of guests, bed linen, towels, parking by the building, Wi-Fi and the local tourist tax.',
          'The guest pays the price in advance by bank transfer or QR payment according to the instructions in the booking confirmation.',
          'A baby cot is available on request for €10 per stay. Pets are welcome for a fee; please let us know in advance.',
        ],
      },
      {
        title: 'Cancellation',
        items: [
          'The guest may cancel the booking free of charge no later than 14 days before the day of arrival, by e-mail to info@podzlatymnavrsim.cz or via the link on the booking card. We will refund the amount paid without undue delay, within 14 days of cancellation at the latest, to the account from which it was paid.',
          'If the booking is cancelled later than 14 days before arrival, if the guest does not arrive, or if the guest leaves early, the price of the stay is not refunded.',
          'If the provider cannot provide the accommodation for reasons beyond its control (for example a technical failure in the apartment or force majeure), it will offer the guest another apartment or dates; if the guest declines, the full amount paid will be refunded.',
          'Consumers cannot withdraw from an accommodation contract within 14 days without giving a reason, as it is a service provided on agreed dates (Section 1837(j) of the Czech Civil Code). This does not affect free cancellation under the first point.',
        ],
      },
      {
        title: 'Your stay',
        items: [
          'Check-in is self-service between 4 pm and midnight. We will send the code for the key box, the apartment number and parking instructions before arrival.',
          'Check-out is by 11 am. Please return the keys to the key box.',
          'The apartment may be occupied by no more than the number of guests stated in the booking.',
          'Guests must provide the details required for the register of guests under Czech law on local fees and, for foreign nationals, under the Act on the Residence of Foreign Nationals.',
          'Quiet hours are from 10 pm to 8 am. The apartments are non-smoking; parties and events are not allowed.',
          'The building has three floors and no lift. The access road climbs uphill; winter equipment for your car is needed in winter.',
        ],
      },
      {
        title: 'Liability for damage',
        paragraphs: [
          'The guest is liable for damage caused during the stay by them or by the people and animals staying with them. The provider may claim compensation of up to €100 for damage. Please report any damage as soon as it occurs.',
        ],
      },
      {
        title: 'Complaints',
        paragraphs: [
          'If something in the apartment does not work or does not match the booking, please let us know during your stay at info@podzlatymnavrsim.cz so that we can fix it straight away. We will handle complaints without undue delay, within 30 days at the latest.',
        ],
      },
      {
        title: 'Out-of-court dispute resolution',
        paragraphs: [
          'Consumers have the right to out-of-court resolution of disputes arising from the accommodation contract. The competent body is the Czech Trade Inspection Authority, Štěpánská 567/15, 120 00 Prague 2, www.coi.cz.',
        ],
      },
      {
        title: 'Personal data',
        paragraphs: [
          'We process guests’ personal data in accordance with the privacy policy published on the Privacy policy page.',
        ],
      },
      {
        title: 'Final provisions',
        paragraphs: [
          'The accommodation contract is governed by the laws of the Czech Republic, in particular the Civil Code. The provider may amend these terms; a booking is governed by the terms in effect on the day it was submitted.',
        ],
      },
    ],
  },
  pl: {
    tagline: 'Wynajem apartamentów',
    title: 'Regulamin',
    intro: `Niniejszy regulamin określa zasady zakwaterowania w apartamentach Pod Zlatým návrším (${ACCOMMODATION}) rezerwowanych przez stronę podzlatymnavrsim.cz.`,
    effective: `Obowiązuje od ${PRIVACY_EFFECTIVE.pl}`,
    sections: [
      {
        title: 'Usługodawca',
        paragraphs: [
          `${OPERATOR.name}, ${OPERATOR.address}, Czechy, REGON (IČ) ${OPERATOR.ico}, NIP (DIČ) ${OPERATOR.dic}, wpisana do rejestru handlowego, sygn. ${OPERATOR.registerPl}. Kontakt: ${OPERATOR.email}.`,
          'Usługodawca świadczy usługi zakwaterowania we własnym imieniu, także w apartamentach, których właściciele powierzyli mu ich wynajem.',
          'Rezerwacje dokonane przez Booking.com, Airbnb i inne portale podlegają warunkom danego portalu. Poniższe zasady pobytu obowiązują wszystkich gości.',
        ],
      },
      {
        title: 'Rezerwacja i zawarcie umowy',
        items: [
          'Gość wybiera apartament i termin, wypełnia formularz rezerwacji i go wysyła. Wysyłając formularz, gość potwierdza, że zapoznał się z niniejszym regulaminem i go akceptuje.',
          'Po wysłaniu gość otrzymuje e-mail z podsumowaniem rezerwacji, ceną i instrukcjami płatności. Te same informacje znajdzie na swojej karcie rezerwacji.',
          'Umowa o zakwaterowanie zostaje zawarta z chwilą zaksięgowania płatności na koncie usługodawcy. Gość otrzymuje e-mail potwierdzający otrzymanie płatności i rezerwację.',
          'Jeśli gość nie zapłaci ceny, usługodawca może anulować niepotwierdzoną rezerwację.',
        ],
      },
      {
        title: 'Cena i płatność',
        items: [
          'Cena pobytu wynika z cennika obowiązującego w chwili rezerwacji i jest podana w rezerwacji wraz z walutą.',
          'Cena obejmuje zakwaterowanie dla uzgodnionej liczby osób, pościel, ręczniki, parking przy budynku, Wi-Fi oraz opłatę miejscową.',
          'Gość płaci z góry przelewem bankowym lub płatnością QR zgodnie z instrukcjami w potwierdzeniu rezerwacji.',
          'Łóżeczko dziecięce udostępniamy na życzenie za 10 € za pobyt. Zwierzęta są mile widziane za opłatą, prosimy o wcześniejszą informację.',
        ],
      },
      {
        title: 'Anulowanie rezerwacji',
        items: [
          'Gość może bezpłatnie anulować rezerwację najpóźniej 14 dni przed dniem przyjazdu, e-mailem na adres info@podzlatymnavrsim.cz lub przez odnośnik na karcie rezerwacji. Zapłaconą kwotę zwrócimy niezwłocznie, najpóźniej w ciągu 14 dni od anulowania, na konto, z którego została zapłacona.',
          'W przypadku anulowania później niż 14 dni przed przyjazdem, nieprzybycia lub wcześniejszego wyjazdu cena pobytu nie podlega zwrotowi.',
          'Jeśli usługodawca nie może zapewnić zakwaterowania z przyczyn od niego niezależnych (na przykład awaria w apartamencie lub siła wyższa), zaproponuje gościowi inny apartament lub termin, a jeśli gość odmówi, zwróci całą zapłaconą kwotę.',
          'Konsument nie może odstąpić od umowy o zakwaterowanie w ciągu 14 dni bez podania przyczyny, ponieważ jest to usługa świadczona w uzgodnionym terminie (§ 1837 lit. j) czeskiego kodeksu cywilnego). Nie wpływa to na bezpłatne anulowanie zgodnie z pierwszym punktem.',
        ],
      },
      {
        title: 'Pobyt',
        items: [
          'Zameldowanie jest samoobsługowe w godzinach 16:00–24:00. Kod do skrzynki z kluczami, numer apartamentu i wskazówki dotyczące parkowania wyślemy przed przyjazdem.',
          'Wymeldowanie do 11:00. Klucze prosimy zostawić w skrzynce.',
          'W apartamencie może przebywać najwyżej tyle osób, ile podano w rezerwacji.',
          'Gość jest zobowiązany podać dane wymagane do ewidencji gości zgodnie z czeskimi przepisami o opłatach lokalnych oraz, w przypadku cudzoziemców, o pobycie cudzoziemców.',
          'Cisza nocna obowiązuje od 22:00 do 8:00. Apartamenty są dla niepalących, imprezy i uroczystości są zabronione.',
          'Budynek ma trzy kondygnacje, bez windy. Dojazd prowadzi pod górę, zimą potrzebne jest zimowe wyposażenie samochodu.',
        ],
      },
      {
        title: 'Odpowiedzialność za szkody',
        paragraphs: [
          'Gość odpowiada za szkody wyrządzone podczas pobytu przez siebie oraz osoby i zwierzęta przebywające z nim. Usługodawca może żądać odszkodowania do wysokości 100 €. Prosimy zgłaszać szkody od razu.',
        ],
      },
      {
        title: 'Reklamacje',
        paragraphs: [
          'Jeśli coś w apartamencie nie działa lub nie odpowiada rezerwacji, prosimy o informację w trakcie pobytu na adres info@podzlatymnavrsim.cz, abyśmy mogli od razu to naprawić. Reklamacje rozpatrujemy niezwłocznie, najpóźniej w ciągu 30 dni.',
        ],
      },
      {
        title: 'Pozasądowe rozwiązywanie sporów',
        paragraphs: [
          'Konsument ma prawo do pozasądowego rozwiązania sporu wynikającego z umowy o zakwaterowanie. Właściwym podmiotem jest Czeska Inspekcja Handlowa (Česká obchodní inspekce), Štěpánská 567/15, 120 00 Praga 2, www.coi.cz.',
        ],
      },
      {
        title: 'Dane osobowe',
        paragraphs: [
          'Dane osobowe gości przetwarzamy zgodnie z polityką prywatności opublikowaną na stronie Polityka prywatności.',
        ],
      },
      {
        title: 'Postanowienia końcowe',
        paragraphs: [
          'Umowa o zakwaterowanie podlega prawu Republiki Czeskiej, w szczególności kodeksowi cywilnemu. Usługodawca może zmieniać niniejszy regulamin; dla rezerwacji obowiązuje regulamin aktualny w dniu jej wysłania.',
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// ZÁSADY OCHRANY OSOBNÍCH ÚDAJŮ
// ═══════════════════════════════════════════════════════════

export const PRIVACY: Record<Locale, LegalDocument> = {
  cs: {
    tagline: 'Ochrana soukromí',
    title: 'Zásady ochrany osobních údajů',
    intro: 'Vážíme si vaší důvěry. Na této stránce najdete, jaké osobní údaje o vás zpracováváme, proč, jak dlouho a jaká máte práva.',
    effective: `Účinné od ${LEGAL_EFFECTIVE.cs}`,
    sections: [
      {
        title: 'Správce',
        paragraphs: [
          `Správcem osobních údajů je provozovatel webu podzlatymnavrsim.cz a ubytovatel ${OPERATOR.name}, ${OPERATOR.address}, IČ ${OPERATOR.ico}, zapsaná v obchodním rejstříku, sp. zn. ${OPERATOR.registerCs}.`,
          `Dotazy ke koupi apartmánu předáváme prodávajícímu ${SALES_COMPANY.name}, ${SALES_COMPANY.address}, IČ ${SALES_COMPANY.ico}, který je pro jejich vyřízení samostatným správcem. Dotazy k družstevním podílům předáváme pověřeným společnostem ze skupiny ZFP GROUP, které podíly nabízejí.`,
          'S dotazy k osobním údajům se obracejte na info@podzlatymnavrsim.cz.',
        ],
      },
      {
        title: 'Jaké údaje a proč',
        items: [
          'Rezervace ubytování: jméno a příjmení, e-mail, telefon, termín a počet hostů, poznámka, jazyk a vaše zprávy na rezervační kartě. Potřebujeme je k uzavření a plnění smlouvy o ubytování (čl. 6 odst. 1 písm. b) GDPR).',
          'Evidence ubytovaných hostů a poplatek z pobytu: údaje, které ukládá zákon o místních poplatcích a u cizinců zákon o pobytu cizinců. Jde o plnění právní povinnosti (čl. 6 odst. 1 písm. c) GDPR).',
          'Účetnictví a daně: údaje na dokladech o platbě, rovněž kvůli právní povinnosti.',
          'Dotazy a poptávky z formulářů (kontakt, zájem o koupi apartmánu, o pobyt nebo o podíl): jméno, e-mail, telefon a zpráva. Zpracováváme je, abychom vám mohli odpovědět a připravit nabídku (čl. 6 odst. 1 písm. b) a f) GDPR).',
          'Novinky e-mailem zasíláme jen tehdy, když k tomu dáte souhlas. Souhlas můžete kdykoli odvolat odkazem v e-mailu nebo zprávou na info@podzlatymnavrsim.cz.',
          'Klientský portál majitelů apartmánů: přihlašovací e-mail a údaje potřebné ke správě apartmánu a pronájmu, po dobu smluvního vztahu s majitelem.',
        ],
      },
      {
        title: 'Jak dlouho údaje uchováváme',
        items: [
          'Údaje z rezervace po dobu pobytu a dále po dobu, kdy mohou vzniknout nároky ze smlouvy (zpravidla 3 roky).',
          'Evidenci ubytovaných hostů 6 let, jak ukládá zákon o místních poplatcích.',
          'Účetní a daňové doklady 10 let.',
          'Dotazy a poptávky 3 roky od posledního kontaktu, pokud z nich nevznikne smlouva.',
        ],
      },
      {
        title: 'Kdo s údaji pracuje',
        paragraphs: [
          'Údaje nikomu neprodáváme. Pro provoz webu a rezervací využíváme tyto zpracovatele: Supabase (databáze a přihlašování), Vercel (hosting webu), Resend (odesílání e-mailů), rezervační systém Front Desk Master a s vaším souhlasem Google (Google Analytics). Dále naši účetní a banku. Pokud rezervujete přes Booking.com nebo Airbnb, předává nám údaje daný portál.',
          'Některé z těchto služeb mohou zpracovávat údaje i mimo Evropskou unii, zejména v USA. Předání je v takovém případě zajištěno rozhodnutím Evropské komise o odpovídající ochraně (EU-U.S. Data Privacy Framework) nebo standardními smluvními doložkami.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies a měření návštěvnosti',
        paragraphs: [
          'Bez souhlasu web používá jen technické cookies a úložiště prohlížeče nutné pro jeho fungování: zapamatování zvoleného jazyka (NEXT_LOCALE, 1 rok), přihlášení do klientského portálu a administrace a uložení vaší volby k cookies (pzn-cookie-consent).',
          'Analytické nástroje spouštíme jen s vaším souhlasem, který udělíte v liště při první návštěvě (čl. 6 odst. 1 písm. a) GDPR). Používáme dva. Vlastní měření návštěvnosti ukládá do naší databáze navštívené stránky, zdroj návštěvy (například vyhledávač nebo kampaň), typ zařízení a prohlížeče a přibližnou polohu (země, město). IP adresu neukládá a návštěvníka rozlišuje jen otiskem, který se každý den mění; data mažeme po 2 letech. Google Analytics 4 od Google Ireland Limited nastavuje cookies _ga a _ga_* s platností až 2 roky, bez reklamních funkcí a s anonymizací IP adresy; Google data uchovává nejvýše 14 měsíců.',
          'Reklamní cookies nepoužíváme. Souhlas můžete kdykoli změnit nebo odvolat odkazem Cookies v patičce webu.',
        ],
      },
      {
        title: 'Vaše práva',
        items: [
          'Požádat o přístup ke svým údajům a o jejich kopii.',
          'Požádat o opravu nepřesných údajů.',
          'Požádat o výmaz údajů, pokud už je nepotřebujeme a zákon nám jejich uchování neukládá.',
          'Požádat o omezení zpracování a o přenesení údajů.',
          'Vznést námitku proti zpracování založenému na oprávněném zájmu.',
          'Odvolat souhlas, pokud jste ho udělili.',
          'Podat stížnost u Úřadu pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, www.uoou.gov.cz.',
        ],
      },
    ],
  },
  en: {
    tagline: 'Privacy',
    title: 'Privacy policy',
    intro: 'We value your trust. This page explains what personal data we process about you, why, for how long and what rights you have.',
    effective: `Effective from ${LEGAL_EFFECTIVE.en}`,
    sections: [
      {
        title: 'Controller',
        paragraphs: [
          `The controller of your personal data is the operator of the podzlatymnavrsim.cz website and accommodation provider ${OPERATOR.name}, ${OPERATOR.address}, Czech Republic, Company ID ${OPERATOR.ico}, registered in the Commercial Register, file no. ${OPERATOR.registerEn}.`,
          `Enquiries about buying an apartment are passed to the seller ${SALES_COMPANY.name}, ${SALES_COMPANY.address}, Company ID ${SALES_COMPANY.ico}, which acts as a separate controller for handling them. Enquiries about cooperative shares are passed to the authorised ZFP GROUP companies offering the shares.`,
          'For questions about your personal data, contact info@podzlatymnavrsim.cz.',
        ],
      },
      {
        title: 'What data and why',
        items: [
          'Accommodation bookings: first and last name, e-mail, phone, dates and number of guests, notes, language and your messages on the booking card. We need them to conclude and perform the accommodation contract (Art. 6(1)(b) GDPR).',
          'Register of guests and local tourist tax: the details required by Czech law on local fees and, for foreign nationals, by the Act on the Residence of Foreign Nationals. This is a legal obligation (Art. 6(1)(c) GDPR).',
          'Accounting and tax: details on payment records, also as a legal obligation.',
          'Enquiries from forms (contact, interest in buying an apartment, a stay or a share): name, e-mail, phone and message. We process them to reply to you and prepare an offer (Art. 6(1)(b) and (f) GDPR).',
          'We only send news by e-mail if you consent. You can withdraw your consent at any time via the link in the e-mail or by writing to info@podzlatymnavrsim.cz.',
          'Owner portal: login e-mail and the details needed to manage the apartment and its rental, for the duration of the contract with the owner.',
        ],
      },
      {
        title: 'How long we keep data',
        items: [
          'Booking data for the duration of the stay and then for as long as claims under the contract may arise (usually 3 years).',
          'The register of guests for 6 years, as required by Czech law on local fees.',
          'Accounting and tax records for 10 years.',
          'Enquiries for 3 years from the last contact, unless they lead to a contract.',
        ],
      },
      {
        title: 'Who works with the data',
        paragraphs: [
          'We do not sell your data. To run the website and bookings, we use these processors: Supabase (database and login), Vercel (website hosting), Resend (sending e-mails), the Front Desk Master booking system and, with your consent, Google (Google Analytics), as well as our accountant and bank. If you book through Booking.com or Airbnb, that platform passes your details to us.',
          'Some of these services may process data outside the European Union, in particular in the USA. In that case, the transfer is covered by the European Commission’s adequacy decision (EU-U.S. Data Privacy Framework) or by standard contractual clauses.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies and visitor statistics',
        paragraphs: [
          'Without your consent, the website only uses technical cookies and browser storage required for it to work: remembering your chosen language (NEXT_LOCALE, 1 year), logging in to the owner portal and administration, and storing your cookie choice (pzn-cookie-consent).',
          'We only run analytics with your consent, which you give in the banner on your first visit (Art. 6(1)(a) GDPR). We use two tools. Our own visitor measurement stores in our database the pages visited, the source of the visit (for example a search engine or a campaign), the type of device and browser and an approximate location (country, city). It does not store your IP address and distinguishes visitors only by a fingerprint that changes every day; we delete the data after 2 years. Google Analytics 4 by Google Ireland Limited sets the _ga and _ga_* cookies, valid for up to 2 years, without advertising features and with IP anonymisation; Google keeps the data for no more than 14 months.',
          'We do not use advertising cookies. You can change or withdraw your consent at any time via the Cookies link in the website footer.',
        ],
      },
      {
        title: 'Your rights',
        items: [
          'Request access to your data and a copy of it.',
          'Request correction of inaccurate data.',
          'Request erasure of your data if we no longer need it and the law does not require us to keep it.',
          'Request restriction of processing and data portability.',
          'Object to processing based on legitimate interest.',
          'Withdraw your consent if you have given it.',
          'Lodge a complaint with the Czech Office for Personal Data Protection, Pplk. Sochora 27, 170 00 Prague 7, www.uoou.gov.cz.',
        ],
      },
    ],
  },
  pl: {
    tagline: 'Prywatność',
    title: 'Polityka prywatności',
    intro: 'Cenimy Państwa zaufanie. Na tej stronie wyjaśniamy, jakie dane osobowe przetwarzamy, w jakim celu, jak długo i jakie przysługują Państwu prawa.',
    effective: `Obowiązuje od ${LEGAL_EFFECTIVE.pl}`,
    sections: [
      {
        title: 'Administrator',
        paragraphs: [
          `Administratorem danych osobowych jest operator strony podzlatymnavrsim.cz i usługodawca ${OPERATOR.name}, ${OPERATOR.address}, Czechy, REGON (IČ) ${OPERATOR.ico}, wpisana do rejestru handlowego, sygn. ${OPERATOR.registerPl}.`,
          `Zapytania dotyczące zakupu apartamentu przekazujemy sprzedającemu ${SALES_COMPANY.name}, ${SALES_COMPANY.address}, IČ ${SALES_COMPANY.ico}, który jest odrębnym administratorem w zakresie ich obsługi. Zapytania dotyczące udziałów spółdzielczych przekazujemy upoważnionym spółkom z grupy ZFP GROUP, które oferują udziały.`,
          'W sprawach danych osobowych prosimy o kontakt: info@podzlatymnavrsim.cz.',
        ],
      },
      {
        title: 'Jakie dane i w jakim celu',
        items: [
          'Rezerwacja zakwaterowania: imię i nazwisko, e-mail, telefon, termin i liczba gości, uwagi, język oraz Państwa wiadomości na karcie rezerwacji. Są potrzebne do zawarcia i wykonania umowy o zakwaterowanie (art. 6 ust. 1 lit. b RODO).',
          'Ewidencja gości i opłata miejscowa: dane wymagane przez czeskie przepisy o opłatach lokalnych oraz, w przypadku cudzoziemców, o pobycie cudzoziemców. Jest to obowiązek prawny (art. 6 ust. 1 lit. c RODO).',
          'Księgowość i podatki: dane na dokumentach płatności, również jako obowiązek prawny.',
          'Zapytania z formularzy (kontakt, zakup apartamentu, pobyt lub udział): imię, e-mail, telefon i wiadomość. Przetwarzamy je, aby odpowiedzieć i przygotować ofertę (art. 6 ust. 1 lit. b i f RODO).',
          'Nowości e-mailem wysyłamy tylko za Państwa zgodą. Zgodę można w każdej chwili wycofać przez odnośnik w e-mailu lub pisząc na info@podzlatymnavrsim.cz.',
          'Portal właścicieli apartamentów: e-mail logowania i dane potrzebne do zarządzania apartamentem i jego wynajmem, przez czas trwania umowy z właścicielem.',
        ],
      },
      {
        title: 'Jak długo przechowujemy dane',
        items: [
          'Dane rezerwacji przez czas pobytu, a następnie przez okres, w którym mogą powstać roszczenia z umowy (zwykle 3 lata).',
          'Ewidencję gości przez 6 lat, zgodnie z czeskimi przepisami o opłatach lokalnych.',
          'Dokumenty księgowe i podatkowe przez 10 lat.',
          'Zapytania przez 3 lata od ostatniego kontaktu, jeśli nie doprowadzą do zawarcia umowy.',
        ],
      },
      {
        title: 'Kto ma dostęp do danych',
        paragraphs: [
          'Nie sprzedajemy Państwa danych. Do obsługi strony i rezerwacji korzystamy z podmiotów przetwarzających: Supabase (baza danych i logowanie), Vercel (hosting strony), Resend (wysyłka e-maili), system rezerwacyjny Front Desk Master oraz, za Państwa zgodą, Google (Google Analytics), a także z usług naszej księgowej i banku. W przypadku rezerwacji przez Booking.com lub Airbnb dane przekazuje nam dany portal.',
          'Niektóre z tych usług mogą przetwarzać dane poza Unią Europejską, w szczególności w USA. Przekazanie jest wtedy zabezpieczone decyzją Komisji Europejskiej stwierdzającą odpowiedni stopień ochrony (EU-U.S. Data Privacy Framework) lub standardowymi klauzulami umownymi.',
        ],
      },
      {
        id: 'cookies',
        title: 'Pliki cookies i statystyki odwiedzin',
        paragraphs: [
          'Bez zgody strona używa wyłącznie technicznych plików cookies i pamięci przeglądarki niezbędnych do jej działania: zapamiętanie wybranego języka (NEXT_LOCALE, 1 rok), logowanie do portalu właścicieli i administracji oraz zapisanie Państwa wyboru dotyczącego cookies (pzn-cookie-consent).',
          'Narzędzia analityczne uruchamiamy wyłącznie za Państwa zgodą, wyrażoną na pasku przy pierwszej wizycie (art. 6 ust. 1 lit. a) RODO). Korzystamy z dwóch. Własny pomiar odwiedzin zapisuje w naszej bazie danych odwiedzone strony, źródło wizyty (np. wyszukiwarka lub kampania), typ urządzenia i przeglądarki oraz przybliżoną lokalizację (kraj, miasto). Nie zapisuje adresu IP, a odwiedzających rozróżnia jedynie odciskiem, który zmienia się codziennie; dane usuwamy po 2 latach. Google Analytics 4 od Google Ireland Limited ustawia pliki cookies _ga i _ga_* ważne do 2 lat, bez funkcji reklamowych i z anonimizacją adresu IP; Google przechowuje dane maksymalnie 14 miesięcy.',
          'Nie używamy reklamowych plików cookies. Zgodę mogą Państwo w każdej chwili zmienić lub wycofać za pomocą odnośnika Pliki cookies w stopce strony.',
        ],
      },
      {
        title: 'Państwa prawa',
        items: [
          'Żądać dostępu do swoich danych i ich kopii.',
          'Żądać sprostowania nieprawidłowych danych.',
          'Żądać usunięcia danych, jeśli nie są nam już potrzebne, a prawo nie nakazuje ich przechowywania.',
          'Żądać ograniczenia przetwarzania i przeniesienia danych.',
          'Wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie.',
          'Wycofać zgodę, jeśli została udzielona.',
          'Wnieść skargę do czeskiego Urzędu Ochrony Danych Osobowych (Úřad pro ochranu osobních údajů), Pplk. Sochora 27, 170 00 Praga 7, www.uoou.gov.cz.',
        ],
      },
    ],
  },
};
