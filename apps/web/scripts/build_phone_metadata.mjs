/**
 * Vygeneruje metadata libphonenumber jen pro země, odkud hosté a zájemci reálně píší:
 * ČR, SR, Polsko, Německo, Rakousko (převzato ze ZFP reality HUB, tam jen CZ + SK).
 *
 * Plná metadata (libphonenumber-js/max) mají ~150 kB a šla by do každého veřejného
 * formuláře; minimální (`/min`) zase neznají přidělené rozsahy (999 123 456 projde jako
 * české číslo). Výřez má jednotky kB a přesnost plných metadat: rozsahy operátorů,
 * typ čísla (mobil / pevná / prémiová), národní formát. Ostatní země ověřujeme jen délkou.
 *
 * Spustit po aktualizaci balíčku libphonenumber-js:
 *   node scripts/build_phone_metadata.mjs
 */
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const full = require('libphonenumber-js/metadata.max.json')
const COUNTRIES = { '420': 'CZ', '421': 'SK', '48': 'PL', '49': 'DE', '43': 'AT' }
const out = {
  version: full.version,
  country_calling_codes: Object.fromEntries(Object.entries(COUNTRIES).map(([code, c]) => [code, [c]])),
  countries: Object.fromEntries(Object.values(COUNTRIES).map((c) => [c, full.countries[c]])),
}
const target = new URL('../src/lib/forms/phone-metadata.json', import.meta.url)
writeFileSync(target, JSON.stringify(out))
console.log(`phone-metadata.json: ${JSON.stringify(out).length} B, libphonenumber metadata v${full.version}`)
