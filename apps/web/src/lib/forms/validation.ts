/**
 * Validace a antispam pro veřejné formuláře (kontakt, poptávky, podíly, rezervace).
 *
 * Převzato ze ZFP reality HUB (src/lib/forms/validation.ts) a upraveno pro gra3:
 *  - hlášky cs / en / pl (DEC-034 — rezervace jsou i polsky),
 *  - telefon zná kromě ČR a SR i Polsko, Německo a Rakousko (hosté),
 *  - navíc `spamSignals()` — vzorce, které na web reálně chodily (11/2026):
 *    náhodné řetězce se střídáním velkých a malých písmen, gmail s tečkami,
 *    user agent v uvozovkách, nabídky „katalogu zdarma“ s holou doménou.
 *
 * Jeden zdroj pravdy pro klienta i server: stejná funkce běží v prohlížeči (okamžitá
 * zpětná vazba u pole) i v API route (skutečná obrana — klient se dá obejít).
 *
 * Záměrně BEZ reCAPTCHA / Turnstile: skript třetí strany by se načetl každému
 * návštěvníkovi bez souhlasu s cookies. Ochrana je vlastní a bezcookie:
 * honeypot + časová past + validace + obsahová heuristika + rate limit.
 */

import { parsePhoneNumberFromString, type MetadataJson, type NumberType } from 'libphonenumber-js/core'
// Výřez metadat pro CZ, SK, PL, DE, AT (scripts/build_phone_metadata.mjs) — jednotky kB místo 150 kB,
// přitom zná přidělené rozsahy operátorů i typ čísla. Ostatní zahraniční čísla ověřujeme jen délkou.
import phoneMetadataJson from './phone-metadata.json'

export type FormLocale = 'cs' | 'en' | 'pl'

function lang(locale: string | null | undefined): FormLocale {
  return locale === 'en' || locale === 'pl' ? locale : 'cs'
}

const MSG = {
  cs: {
    phoneRequired: 'Vyplňte prosím telefon.',
    phoneChars: 'Telefon smí obsahovat jen číslice a předvolbu.',
    phoneUnassigned: 'Zkontrolujte prosím telefonní číslo — takové číslo operátor nepřiděluje.',
    phoneCheck: 'Zkontrolujte prosím telefonní číslo.',
    phoneFormat: 'Telefon musí mít 9 číslic (např. 777 123 456), nebo zadejte číslo i s předvolbou (+49 …).',
    emailRequired: 'Vyplňte prosím e-mail.',
    emailInvalid: 'Zadejte prosím platný e-mail (např. jan.novak@seznam.cz).',
    emailDisposable: 'Zadejte prosím trvalý e-mail — na jednorázovou schránku odpověď nedoručíme.',
    emailReal: 'Zadejte prosím svůj skutečný e-mail.',
    emailNoMx: 'Doména e-mailu neexistuje nebo nepřijímá poštu — zkontrolujte prosím část za zavináčem.',
    nameRequired: 'Vyplňte prosím jméno.',
    nameInvalid: 'Zadejte prosím jméno a příjmení.',
    nameReal: 'Zadejte prosím své skutečné jméno.',
    messageRequired: 'Napište prosím krátce, co potřebujete.',
    messageTooLong: (max: number) => `Zpráva je příliš dlouhá (max ${max} znaků).`,
    messageLinks: 'Zprávu se nepodařilo odeslat. Napište ji prosím bez odkazů.',
    tooMany: 'Odeslali jste příliš mnoho zpráv. Zkuste to prosím za chvíli.',
    contactRequired: 'Vyplňte prosím e-mail, ať víme, kam se ozvat.',
    didYouMean: 'Nemysleli jste',
  },
  en: {
    phoneRequired: 'Please enter your phone number.',
    phoneChars: 'The phone number may only contain digits and a country code.',
    phoneUnassigned: 'Please check the phone number — no operator issues such a number.',
    phoneCheck: 'Please check the phone number.',
    phoneFormat: 'Please enter the phone number including the country code (e.g. +44 7700 900123).',
    emailRequired: 'Please enter your email.',
    emailInvalid: 'Please enter a valid email address (e.g. jane.smith@gmail.com).',
    emailDisposable: 'Please use a permanent email address — we cannot reply to a disposable inbox.',
    emailReal: 'Please enter your real email address.',
    emailNoMx: 'This email domain does not exist or does not accept mail — please check the part after @.',
    nameRequired: 'Please enter your name.',
    nameInvalid: 'Please enter your first and last name.',
    nameReal: 'Please enter your real name.',
    messageRequired: 'Please briefly tell us what you need.',
    messageTooLong: (max: number) => `The message is too long (max ${max} characters).`,
    messageLinks: 'The message could not be sent. Please write it without links.',
    tooMany: 'You have sent too many messages. Please try again in a while.',
    contactRequired: 'Please enter your email so we know where to reply.',
    didYouMean: 'Did you mean',
  },
  pl: {
    phoneRequired: 'Proszę podać numer telefonu.',
    phoneChars: 'Numer telefonu może zawierać tylko cyfry i numer kierunkowy.',
    phoneUnassigned: 'Proszę sprawdzić numer telefonu — operator nie przydziela takiego numeru.',
    phoneCheck: 'Proszę sprawdzić numer telefonu.',
    phoneFormat: 'Numer musi mieć 9 cyfr (np. 600 123 456) lub proszę podać go z numerem kierunkowym (+48 …).',
    emailRequired: 'Proszę podać adres e-mail.',
    emailInvalid: 'Proszę podać prawidłowy adres e-mail (np. anna.nowak@gmail.com).',
    emailDisposable: 'Proszę podać stały adres e-mail — na skrzynkę jednorazową nie odpowiemy.',
    emailReal: 'Proszę podać swój prawdziwy adres e-mail.',
    emailNoMx: 'Domena e-mail nie istnieje lub nie przyjmuje poczty — proszę sprawdzić część po @.',
    nameRequired: 'Proszę podać imię.',
    nameInvalid: 'Proszę podać imię i nazwisko.',
    nameReal: 'Proszę podać swoje prawdziwe imię.',
    messageRequired: 'Proszę krótko napisać, czego Pan/Pani potrzebuje.',
    messageTooLong: (max: number) => `Wiadomość jest za długa (maks. ${max} znaków).`,
    messageLinks: 'Nie udało się wysłać wiadomości. Proszę napisać ją bez linków.',
    tooMany: 'Wysłano zbyt wiele wiadomości. Proszę spróbować ponownie za chwilę.',
    contactRequired: 'Proszę podać adres e-mail, abyśmy wiedzieli, gdzie odpowiedzieć.',
    didYouMean: 'Czy chodziło o',
  },
} as const

/** Hlášky mimo jednotlivá pole (rate limit, chybějící kontakt, „nemysleli jste“). */
export function formMessages(locale?: string | null) {
  return MSG[lang(locale)]
}

export interface FieldCheck {
  ok: boolean
  /** Normalizovaný tvar pro uložení (telefon +420…, e-mail malými písmeny, jméno bez dvojitých mezer) */
  normalized: string | null
  error?: string
}

export interface FieldOptions {
  required?: boolean
  locale?: string | null
}

// ============================================
// TELEFON
// ============================================

const PHONE_METADATA = phoneMetadataJson as unknown as MetadataJson
type StrictCountry = 'CZ' | 'SK' | 'PL' | 'DE' | 'AT'
const STRICT_CODES: Record<string, StrictCountry> = { '420': 'CZ', '421': 'SK', '48': 'PL', '49': 'DE', '43': 'AT' }

export interface PhoneCheck extends FieldCheck {
  /** Čitelný mezinárodní tvar pro zobrazení: '+420 777 123 456' */
  formatted?: string
}

/**
 * Jaká čísla bereme jako kontakt na člověka. Prémiová (900…), bezplatná (800…)
 * a sdílená linka nejsou kontakt na hosta ani zájemce.
 */
const CONTACT_NUMBER_TYPES: ReadonlySet<NumberType> = new Set<NumberType>([
  'MOBILE', 'FIXED_LINE', 'FIXED_LINE_OR_MOBILE', 'VOIP',
])

/** Výplně, které projdou číslovacím plánem, ale člověk je nemá: 777 777 777, 123 456 789. */
function isFillerNumber(national: string): boolean {
  if (/^(\d)\1+$/.test(national)) return true
  if ('0123456789'.includes(national) || '9876543210'.includes(national)) return true
  return false
}

function checkCountry(text: string, country: StrictCountry): PhoneCheck | null {
  const parsed = parsePhoneNumberFromString(text, country, PHONE_METADATA)
  if (!parsed || parsed.country !== country) return null
  if (!parsed.isValid() || !CONTACT_NUMBER_TYPES.has(parsed.getType() as NumberType)) return null
  if (isFillerNumber(parsed.nationalNumber)) return null
  return { ok: true, normalized: parsed.number, formatted: parsed.formatInternational() }
}

/** Číslo bez předvolby — v jakém pořadí zkoušet země podle jazyka stránky. */
const NATIONAL_ORDER: Record<FormLocale, StrictCountry[]> = {
  cs: ['CZ', 'SK'],
  en: ['CZ', 'SK'],
  pl: ['PL', 'CZ', 'SK'],
}

/**
 * Telefon: číslo z ČR, SR, PL, DE a AT projde jen tehdy, když ho operátor skutečně
 * přiděluje (rozsahy z libphonenumber). Bez předvolby zkoušíme země podle jazyka
 * (cs/en: ČR, SR; pl: Polsko, ČR, SR). Ostatní zahraniční číslo musí mít předvolbu
 * a rozumnou délku — americké „2015550123“ bez předvolby tak neprojde.
 */
export function validatePhone(raw: string | null | undefined, opts?: FieldOptions): PhoneCheck {
  const m = MSG[lang(opts?.locale)]
  const input = (raw ?? '').trim()
  if (!input) {
    return opts?.required ? { ok: false, normalized: null, error: m.phoneRequired } : { ok: true, normalized: null }
  }

  if (/[^\d\s+()\-./]/.test(input)) {
    return { ok: false, normalized: null, error: m.phoneChars }
  }

  const international = input.startsWith('+') || input.startsWith('00')
  let digits = input.replace(/\D/g, '')
  if (input.startsWith('00')) digits = digits.slice(2)

  if (international) {
    const code = ['420', '421', '48', '49', '43'].find((c) => digits.startsWith(c))
    if (code) {
      return checkCountry(`+${digits}`, STRICT_CODES[code]) ?? { ok: false, normalized: null, error: m.phoneUnassigned }
    }
    if (digits.length < 8 || digits.length > 15 || isFillerNumber(digits.slice(-9))) {
      return { ok: false, normalized: null, error: m.phoneCheck }
    }
    return { ok: true, normalized: `+${digits}`, formatted: `+${digits}` }
  }

  // Bez předvolby: národní tvar v zemích podle jazyka (slovenské 09xx i s nulou)
  if (digits.length >= 9 && digits.length <= 10) {
    for (const country of NATIONAL_ORDER[lang(opts?.locale)]) {
      const hit = checkCountry(digits, country)
      if (hit) return hit
    }
    return { ok: false, normalized: null, error: digits.length === 9 ? m.phoneUnassigned : m.phoneFormat }
  }
  return { ok: false, normalized: null, error: m.phoneFormat }
}

// ============================================
// E-MAIL
// ============================================

/** Jednorázové schránky — malý seznam pro prohlížeč; server má úplný (validation.server.ts). */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com',
  '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'trashmail.com',
  'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com',
  'fakeinbox.com', 'mailnesia.com', 'spam4.me', 'mvrht.net', 'moakt.com',
])

/** Domény z ukázek a testů — nikdy to není skutečný kontakt. (QA používá rezervované TLD .test) */
const EXAMPLE_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'test.cz',
  'domain.com', 'asdf.cz', 'aaa.cz', 'aaaa.cz',
])

/** Lokální část, která je zjevně výplň ('test', 'test123', 'asdf', 'qwerty'…). */
function isJunkLocalPart(local: string): boolean {
  const l = local.toLowerCase().replace(/[._-]/g, '')
  if (/^(test|testtest|tester|testing|zkouska|zkouška|pokus|aaa+|xxx+|asd+|qwe+|abc|abcd|nic|neco|neco1)\d*$/.test(l)) return true
  if (/^(qwerty|asdf|asdfgh|jkl|lkj|hjkl|yxcv|fdsa)\d*$/.test(l)) return true
  return false
}

/** Náhodná změť písmen — 8+ znaků bez jediné samohlásky (fhdkgjsl@…). */
function looksLikeKeyboardMash(text: string): boolean {
  const l = text.toLowerCase().replace(/[^a-z]/g, '')
  if (l.length < 8) return false
  return !/[aeiouy]/.test(l)
}

// Záměrně konzervativní: povolený tvar, ne plná RFC 5322 (ta pustí i nesmysly).
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function validateEmail(raw: string | null | undefined, opts?: FieldOptions): FieldCheck {
  const m = MSG[lang(opts?.locale)]
  const input = (raw ?? '').trim().toLowerCase()
  if (!input) {
    return opts?.required ? { ok: false, normalized: null, error: m.emailRequired } : { ok: true, normalized: null }
  }
  if (!EMAIL_RE.test(input) || input.length > 254) {
    return { ok: false, normalized: null, error: m.emailInvalid }
  }

  const [local, domain] = input.split('@')
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, normalized: null, error: m.emailDisposable }
  if (EXAMPLE_DOMAINS.has(domain)) return { ok: false, normalized: null, error: m.emailReal }
  if (isJunkLocalPart(local) || looksLikeKeyboardMash(local)) return { ok: false, normalized: null, error: m.emailReal }

  const tld = domain.split('.').pop() ?? ''
  if (tld.length < 2 || /^\d+$/.test(tld)) return { ok: false, normalized: null, error: m.emailInvalid }

  return { ok: true, normalized: input }
}

// ---- Překlep v doméně ------------------------------------------------------

/** Domény, na které chodí většina kontaktů z ČR, SR, PL a DE — kandidáti pro opravu překlepu. */
const COMMON_EMAIL_DOMAINS = [
  'seznam.cz', 'gmail.com', 'email.cz', 'centrum.cz', 'post.cz', 'volny.cz', 'atlas.cz',
  'tiscali.cz', 'outlook.com', 'outlook.cz', 'hotmail.com', 'hotmail.cz', 'icloud.com',
  'yahoo.com', 'protonmail.com', 'proton.me', 'me.com', 'live.com',
  'azet.sk', 'zoznam.sk', 'centrum.sk', 'post.sk',
  'wp.pl', 'onet.pl', 'interia.pl', 'o2.pl', 'gmx.de', 'web.de', 't-online.de', 'gmx.at',
]

/** Překlepy, které Levenshtein netrefí jednoznačně (gmail.cz neexistuje, lidé ho ale píší). */
const EMAIL_DOMAIN_ALIASES: Record<string, string> = {
  'gmail.cz': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.pl': 'gmail.com',
  'googlemail.com': 'gmail.com',
  'seznam.com': 'seznam.cz', 'seznam.sk': 'seznam.cz', 'sezam.cz': 'seznam.cz',
  'hotmail.co': 'hotmail.com', 'outlook.co': 'outlook.com', 'icloud.cz': 'icloud.com',
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

/**
 * Návrh opravy překlepu v doméně („jan@seznma.cz“ → „jan@seznam.cz“).
 * Je to nabídka, ne blokace — vrací celou opravenou adresu, nebo null.
 */
export function suggestEmailCorrection(raw: string | null | undefined): string | null {
  const input = (raw ?? '').trim().toLowerCase()
  const at = input.lastIndexOf('@')
  if (at < 1 || at === input.length - 1) return null
  const local = input.slice(0, at)
  const domain = input.slice(at + 1)
  if (COMMON_EMAIL_DOMAINS.includes(domain)) return null
  const alias = EMAIL_DOMAIN_ALIASES[domain]
  if (alias) return `${local}@${alias}`
  // Krátké domény (post.cz) snesou jen 1 záměnu, delší 2 — jinak by „volny.cz“ opravoval „volne.cz“ u firem
  let best: { domain: string; dist: number } | null = null
  for (const candidate of COMMON_EMAIL_DOMAINS) {
    const dist = levenshtein(domain, candidate)
    const maxDist = candidate.length >= 9 ? 2 : 1
    if (dist > 0 && dist <= maxDist && (!best || dist < best.dist)) best = { domain: candidate, dist }
  }
  return best ? `${local}@${best.domain}` : null
}

// ============================================
// JMÉNO
// ============================================

export function validateName(raw: string | null | undefined, opts?: FieldOptions): FieldCheck {
  const m = MSG[lang(opts?.locale)]
  const input = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!input) {
    return opts?.required ? { ok: false, normalized: null, error: m.nameRequired } : { ok: true, normalized: null }
  }
  if (input.length < 2 || input.length > 100) return { ok: false, normalized: null, error: m.nameInvalid }
  // Číslice, URL nebo HTML ve jménu = strojový zápis
  if (/\d{3,}|https?:|www\.|[<>{}[\]]/i.test(input)) return { ok: false, normalized: null, error: m.nameInvalid }
  // Latinka vč. diakritiky (cs, sk, pl, de) — bez flagu /u, projekt cílí pod ES2015
  if (!/[A-Za-z\u00C0-\u024F]{2,}/.test(input)) return { ok: false, normalized: null, error: m.nameInvalid }
  if (looksLikeKeyboardMash(input.replace(/\s/g, ''))) return { ok: false, normalized: null, error: m.nameReal }
  return { ok: true, normalized: input }
}

// ============================================
// ZPRÁVA
// ============================================

/** Odkazy, kryptoměny, SEO nabídky — obsah, který člověk do poptávky apartmánu nepíše. */
const BLOCKED_MESSAGE_PATTERNS: RegExp[] = [
  /\b(?:https?:\/\/|www\.)\S+/i,
  /\[url[=\]]/i,
  /<a\s+href/i,
  /\b(?:backlinks?|link building|guest post|crypto|bitcoin|forex|casino|viagra|cialis|loan offer|binary option)\b/i,
]

export function validateMessage(raw: string | null | undefined, opts?: FieldOptions & { max?: number }): FieldCheck {
  const m = MSG[lang(opts?.locale)]
  const input = (raw ?? '').trim()
  const max = opts?.max ?? 2000
  if (!input) {
    return opts?.required ? { ok: false, normalized: null, error: m.messageRequired } : { ok: true, normalized: null }
  }
  if (input.length > max) return { ok: false, normalized: null, error: m.messageTooLong(max) }
  if (BLOCKED_MESSAGE_PATTERNS.some((re) => re.test(input))) {
    return { ok: false, normalized: null, error: m.messageLinks }
  }
  return { ok: true, normalized: input }
}

// ============================================
// SPAMOVÉ SIGNÁLY — co projde validací, ale člověk to nenapíše
// ============================================

export type SpamSignal =
  | 'random_name'        // „xMBAlwQpfevVXfkg“
  | 'random_message'     // „PfcRxJaVOjWhnhGMHDkTzteK“
  | 'bad_user_agent'     // prázdný, nebo v uvozovkách: "Mozilla/5.0 …
  | 'gmail_dots'         // l.i.h.e.lo.bi.49.6@gmail.com — gmail tečky ignoruje, člověk je nepotřebuje
  | 'solicitation'       // „list you in our catalogue, it's free, no commission“
  | 'domain_in_message'  // holá doména ve zprávě (tourist-europa.com) — kromě booking.com, airbnb…
  | 'foreign_script'     // delší text v cyrilici nebo CJK

/** Silné signály stačí samy, slabé až ve dvojici (skóre ≥ 2). */
const SIGNAL_WEIGHT: Record<SpamSignal, number> = {
  random_name: 2,
  random_message: 2,
  bad_user_agent: 2,
  gmail_dots: 1,
  solicitation: 1,
  domain_in_message: 1,
  foreign_script: 1,
}

/**
 * Slovo vypadá jako náhodný řetězec: 8+ písmen, aspoň 3 velká uvnitř slova a 3 malá
 * („vHwvWKgxinameywSFNVI“). Jména se dělí i na pomlčce a apostrofu, takže
 * „McDonald-MacArthur“ nebo „DeLaCruz“ (max. 2 velká uvnitř) projdou.
 */
function looksRandomWord(word: string): boolean {
  const letters = word.replace(/[^A-Za-z]/g, '')
  if (letters.length < 8) return false
  const innerUpper = (letters.slice(1).match(/[A-Z]/g) ?? []).length
  const lower = (letters.match(/[a-z]/g) ?? []).length
  return innerUpper >= 3 && lower >= 3
}

function hasRandomWord(text: string): boolean {
  return text.split(/[\s\-'’]+/).some(looksRandomWord)
}

/** Domény, které host zmíní normálně („viděl jsem vás na booking.com“). */
const ALLOWED_MESSAGE_DOMAINS = /^(?:.*\.)?(?:booking\.com|airbnb\.[a-z.]+|podzlatymnavrsim\.cz|google\.com|seznam\.cz|mapy\.cz|mapy\.com)$/i
const BARE_DOMAIN_RE = /\b((?:[a-z0-9-]+\.)+(?:com|net|org|io|co|info|biz|eu|de|at|pl|sk|uk|us|xyz|online|site|top|app|pro|me|travel|agency|store|shop))\b/gi

const SOLICITATION_RE = new RegExp(
  [
    'catalog(?:ue)?', 'directory', 'free listing', 'list(?:ing)? (?:you|your)', 'add yourself',
    'no commission', 'zero commission', 'free of charge',
    '\\bseo\\b', 'search engine', 'google ranking', 'first page of google', 'web ?design', 'website redesign',
    'increase (?:your )?(?:traffic|bookings|sales|revenue)', 'more (?:bookings|guests|leads)',
    'partnership (?:offer|opportunity)', 'collaboration (?:offer|proposal)', 'sponsored (?:post|article)',
    'our (?:platform|agency|team) (?:can|will|helps)', 'reply (?:with )?["“]?yes',
    'unsubscribe',
  ].join('|'),
  'i',
)

export interface SpamInput {
  name?: string | null
  email?: string | null
  message?: string | null
  userAgent?: string | null
}

/**
 * Obsahové signály spamu. Volá je server po validaci — lead se pak uloží se stavem
 * `spam` (bez e-mailu adminovi, mimo inbox), aby šel případný omyl dohledat a vrátit.
 */
export function spamSignals(input: SpamInput): SpamSignal[] {
  const signals: SpamSignal[] = []
  const name = (input.name ?? '').trim()
  const message = (input.message ?? '').trim()
  const email = (input.email ?? '').trim().toLowerCase()
  const ua = (input.userAgent ?? '').trim()

  if (name && hasRandomWord(name)) signals.push('random_name')

  // Krátká zpráva z 1–3 „slov“, z nichž některé je náhodný řetězec
  if (message && message.split(/\s+/).length <= 3 && hasRandomWord(message)) signals.push('random_message')

  if (!ua || /^["']/.test(ua)) signals.push('bad_user_agent')

  const [local, domain] = email.split('@')
  if (local && (domain === 'gmail.com' || domain === 'googlemail.com') && (local.match(/\./g) ?? []).length >= 3) {
    signals.push('gmail_dots')
  }

  if (message) {
    if (SOLICITATION_RE.test(message)) signals.push('solicitation')
    const withoutEmails = message.replace(/\S+@\S+/g, ' ')
    const domains = withoutEmails.match(BARE_DOMAIN_RE) ?? []
    if (domains.some((d) => !ALLOWED_MESSAGE_DOMAINS.test(d))) signals.push('domain_in_message')
    if (/[Ѐ-ӿ]{6,}|[一-鿿]{4,}/.test(message)) signals.push('foreign_script')
  }
  return signals
}

export function isSpam(signals: SpamSignal[]): boolean {
  return signals.reduce((sum, s) => sum + SIGNAL_WEIGHT[s], 0) >= 2
}

// ============================================
// ANTISPAM — honeypot + časová past
// ============================================

/** Název skrytého pole. Vypadá jako běžné pole, aby ho bot vyplnil. */
export const HONEYPOT_FIELD = 'website_url'
/** Název pole s časem vykreslení formuláře (ms epoch). */
export const TIMESTAMP_FIELD = 'form_rendered_at'
/** Pod tuhle hranici formulář člověk nevyplní — je to bot. */
export const MIN_FILL_MS = 3_000

export interface AntispamPayload {
  [HONEYPOT_FIELD]?: string
  [TIMESTAMP_FIELD]?: number
}

export interface AntispamVerdict {
  ok: boolean
  /** Důvod pro log — klientovi se neukazuje, ať se bot nedozví, na čem spadl. */
  reason?: 'honeypot' | 'too_fast'
}

export function checkAntispam(body: AntispamPayload | null | undefined): AntispamVerdict {
  if (!body) return { ok: true }
  const trap = body[HONEYPOT_FIELD]
  if (typeof trap === 'string' && trap.trim() !== '') return { ok: false, reason: 'honeypot' }
  const rendered = body[TIMESTAMP_FIELD]
  if (typeof rendered === 'number' && Number.isFinite(rendered)) {
    const elapsed = Date.now() - rendered
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) return { ok: false, reason: 'too_fast' }
  }
  return { ok: true }
}

// ============================================
// RATE LIMIT (in-memory, per instance)
// ============================================

const hits = new Map<string, number[]>()

/**
 * Sliding-window limit. Paměť je per serverless instance, takže to není tvrdá kvóta —
 * jako další vrstva za honeypotem ale utne opakované odesílání z jedné IP bez Redisu.
 */
export function rateLimit(key: string, opts?: { limit?: number; windowMs?: number }): { ok: boolean; retryAfterSec?: number } {
  const limit = opts?.limit ?? 5
  const windowMs = opts?.windowMs ?? 10 * 60 * 1000
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (recent.length >= limit) {
    hits.set(key, recent)
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) }
  }

  recent.push(now)
  hits.set(key, recent)

  if (hits.size > 5000) {
    hits.forEach((v, k) => {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k)
    })
  }
  return { ok: true }
}

/** IP klienta z hlaviček (Vercel). Fallback na 'unknown' — limit pak sdílí jeden kbelík. */
export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    'unknown'
  )
}
