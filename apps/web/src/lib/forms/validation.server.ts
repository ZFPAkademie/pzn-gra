/**
 * Serverová nadstavba validace e-mailu — jen pro API routy (převzato ze ZFP reality HUB).
 *
 * Sdílený `validateEmail` (validation.ts) běží i v prohlížeči, a tak nese jen malý
 * seznam jednorázových domén. Tady se k němu přidá:
 *  1. úplný seznam jednorázových schránek (balíček disposable-email-domains, ~120 tis.),
 *  2. ověření, že doména za zavináčem skutečně přijímá poštu (MX záznam v DNS,
 *     s náhradou A/AAAA podle RFC 5321). „jan@seznma.cz" tak neprojde, i když vypadá správně.
 *
 * Výpadek DNS nebo pomalá odpověď nikdy neblokuje — kontakt pustíme dál (soft-fail).
 * Existenci konkrétní schránky (SMTP RCPT TO) neověřujeme: servery lžou, greylistují
 * a zdržují odeslání o sekundy.
 */

// Jen pro API routy (node:dns) — do klientské komponenty neimportovat.
import { promises as dns } from 'node:dns'
import disposableDomainList from 'disposable-email-domains'
import { formMessages, validateEmail, type FieldCheck, type FieldOptions } from './validation'

let disposableSet: Set<string> | null = null
function isDisposableDomain(domain: string): boolean {
  if (!disposableSet) disposableSet = new Set(disposableDomainList as string[])
  return disposableSet.has(domain)
}

type MailServerVerdict = 'yes' | 'no' | 'unknown'

const DNS_TIMEOUT_MS = 2_000
const DNS_CACHE_TTL_MS = 60 * 60 * 1000
const dnsCache = new Map<string, { verdict: MailServerVerdict; until: number }>()

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), DNS_TIMEOUT_MS)),
  ])
}

/** Kódy, které znamenají „doména/záznam neexistuje" — vše ostatní je výpadek, ne důkaz. */
const NEGATIVE_DNS_CODES = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN'])

async function lookup(fn: () => Promise<unknown[]>): Promise<MailServerVerdict> {
  try {
    const records = await withTimeout(fn())
    return records.length > 0 ? 'yes' : 'no'
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code ?? ''
    return NEGATIVE_DNS_CODES.has(code) ? 'no' : 'unknown'
  }
}

/** Rezervované TLD (RFC 2606) nikdy nemají MX — QA účty @seed.test; v ostrém provozu je nikdo nezadá. */
const RESERVED_TLDS = new Set(['test', 'example', 'invalid', 'localhost'])

/** Přijímá doména poštu? MX, bez něj A/AAAA (RFC 5321 implicitní MX). */
export async function hasMailServer(domain: string): Promise<MailServerVerdict> {
  if (RESERVED_TLDS.has(domain.split('.').pop() ?? '')) return 'unknown'
  const cached = dnsCache.get(domain)
  if (cached && cached.until > Date.now()) return cached.verdict

  let verdict = await lookup(() => dns.resolveMx(domain))
  if (verdict === 'no') {
    const a = await lookup(() => dns.resolve4(domain))
    verdict = a === 'yes' ? 'yes' : a === 'unknown' ? 'unknown' : await lookup(() => dns.resolve6(domain))
  }

  // Nejistota se necachuje — příště se zkusí znovu
  if (verdict !== 'unknown') dnsCache.set(domain, { verdict, until: Date.now() + DNS_CACHE_TTL_MS })
  if (dnsCache.size > 5000) dnsCache.clear()
  return verdict
}

/**
 * Plná serverová kontrola e-mailu: tvar + jednorázové schránky + doručitelnost domény.
 * Používat v API routách místo `validateEmail`; klient dál volá jen sdílenou část.
 */
export async function validateEmailDeliverable(
  raw: string | null | undefined,
  opts?: FieldOptions,
): Promise<FieldCheck> {
  const base = validateEmail(raw, opts)
  if (!base.ok || !base.normalized) return base

  const m = formMessages(opts?.locale)
  const domain = base.normalized.split('@')[1]
  if (isDisposableDomain(domain)) {
    return { ok: false, normalized: null, error: m.emailDisposable }
  }
  if ((await hasMailServer(domain)) === 'no') {
    return { ok: false, normalized: null, error: m.emailNoMx }
  }
  return base
}
