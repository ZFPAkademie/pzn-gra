/**
 * QA prostředí + pojistka proti produkci.  (vibekodex os/qa, verze 1)
 *
 * Tento soubor spravuje `__vibekodex/os/qa/qa-env.mjs`. V projektu ho needituj —
 * změna jde do OS a pak `os/qa/sync_qa.sh <projekt>`.
 *
 * Proč existuje: do 1. 10. 2026 si každý e2e skript sám načetl `.env.local`, což je
 * ostrá databáze. Výsledek: smazané nahrávky předsedy představenstva, zamčená
 * peněženka, ostrý záznam z testu, test který maže všechny faktury v tenantu.
 * Test nemá na ostrá data žádný důvod chodit, tak se mu to tady bere z ruky.
 *
 * Pravidlo: cíl testu musí být lokální Supabase (127.0.0.1) nebo ref, který je
 * v `.vibekodex/qa.json` výslovně označený za QA. Všechno ostatní je produkce
 * a skript se nespustí. Není to seznam zakázaných — je to seznam povolených,
 * takže nový projekt je chráněný, ještě než o něm někdo něco napíše.
 *
 * Použití ve skriptu:
 *   import { env, admin, anon, BASE, launch, qaPassword, check, summary } from "./qa-env.mjs"
 */
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..")            // scripts/ → root projektu

// ---------------------------------------------------------------- env soubor
function parseEnvFile(path) {
  const out = {}
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
  return out
}

/** Pořadí: VKQA_ENV_FILE → .env.qa → .env.local. QA soubor vždy přebije ostrý. */
function pickEnvFile() {
  const candidates = [
    process.env.VKQA_ENV_FILE && resolve(ROOT, process.env.VKQA_ENV_FILE),
    join(ROOT, ".env.qa"),
    join(ROOT, ".env.local"),
  ].filter(Boolean)
  for (const c of candidates) if (existsSync(c)) return c
  fail(`Nenašel jsem žádný env soubor (${candidates.join(", ")}).`)
}

const ENV_FILE = pickEnvFile()
export const env = { ...parseEnvFile(ENV_FILE), ...envOverridesFromProcess() }

function envOverridesFromProcess() {
  // Runner (os/qa/run.sh) umí poslat cíl přes prostředí; proměnná vyhrává nad souborem.
  const keys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
  const out = {}
  for (const k of keys) if (process.env[k]) out[k] = process.env[k]
  return out
}

// ---------------------------------------------------------------- pojistka
function readQaConfig() {
  const p = join(ROOT, ".vibekodex", "qa.json")
  if (!existsSync(p)) return {}
  try { return JSON.parse(readFileSync(p, "utf8")) } catch (e) {
    fail(`.vibekodex/qa.json není platný JSON: ${e.message}`)
  }
}

/** „local" pro lokální stack, jinak ref z https://<ref>.supabase.co */
function targetRef(url) {
  if (!url) fail("V env souboru chybí NEXT_PUBLIC_SUPABASE_URL.")
  let host
  try { host = new URL(url).hostname } catch { fail(`NEXT_PUBLIC_SUPABASE_URL není URL: ${url}`) }
  if (host === "127.0.0.1" || host === "localhost" || host === "host.docker.internal") return "local"
  const m = host.match(/^([a-z0-9]{20})\./)
  return m ? m[1] : host
}

function fail(msg) {
  console.error(`\n  ZASTAVENO: ${msg}\n`)
  process.exit(3)
}

const qaConfig = readQaConfig()
export const TARGET = targetRef(env.NEXT_PUBLIC_SUPABASE_URL)

const allowed = new Set(["local", ...(qaConfig.qa_refs ?? [])])
if (!allowed.has(TARGET)) {
  const reason = process.env.VKQA_ALLOW_PROD
  if (!reason) {
    console.error(`
  ZASTAVENO: cíl '${TARGET}' není QA databáze.

  Env soubor:  ${ENV_FILE.replace(ROOT + "/", "")}
  Cíl:         ${env.NEXT_PUBLIC_SUPABASE_URL}
  Povolené:    ${[...allowed].join(", ")}

  Test proti ostré databázi už jednou smazal klientská data. Cesty dál:
    1) lokální QA databáze:   ${"os/qa/local_db.sh"} ${ROOT.split("/").pop()}
       (vytvoří .env.qa, ten má přednost před .env.local)
    2) vědomá výjimka:        VKQA_ALLOW_PROD="<důvod>" node ${process.argv[1]?.split("/").pop() ?? "skript"}
       Důvod se vypíše do výstupu, ať je v logu vidět, kdo si o to řekl.
`)
    process.exit(3)
  }
  console.log(`
  !! BĚŽÍM PROTI PRODUKCI (${TARGET}) — důvod: ${reason}
  !! Všechno, co tenhle skript zapíše nebo smaže, jsou ostrá data.
`)
}

// ---------------------------------------------------------------- process.env
// Knihovny projektu (src/lib) čtou process.env, ne `env`. Naplníme ho z QA env a klíče,
// které jsou jen v .env.local, vynulujeme — dotenv ani Next existující proměnnou
// nepřepíšou, takže skript importující src/lib nedosáhne na ostrou službu ani DB.
// Import tohohle souboru proto patří na PRVNÍ řádek skriptu (moduly se vyhodnocují v pořadí importů).
for (const [k, v] of Object.entries(env)) process.env[k] = v
{
  const local = join(ROOT, ".env.local")
  if (ENV_FILE !== local && existsSync(local)) {
    for (const k of Object.keys(parseEnvFile(local))) if (!(k in env)) process.env[k] = ""
  }
}

// ---------------------------------------------------------------- klienti
export const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
export const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Adresa běžící aplikace. QA server jede na jiném portu než ostrý dev.
 *
 * Pojistka platí i tady: prohlížeč, který kliká v OSTRÉ aplikaci, zapisuje do ostré
 * databáze, ať je v env cokoli. Povolený je jen localhost a hosty z "qa_hosts".
 * (`BASE` bereme kvůli starším skriptům, které ho čtou z prostředí.)
 */
export const BASE =
  process.env.VKQA_BASE || process.env.BASE || qaConfig.base_url || "http://localhost:3001"

{
  let host
  try { host = new URL(BASE).hostname } catch { fail(`Adresa aplikace není URL: ${BASE}`) }
  const okHosts = new Set(["localhost", "127.0.0.1", ...(qaConfig.qa_hosts ?? [])])
  if (!okHosts.has(host) && !process.env.VKQA_ALLOW_PROD) {
    fail(`aplikace '${host}' není QA. Prohlížeč by klikal v ostré aplikaci a ta zapisuje do ostré databáze.\n` +
      `  Povolené hosty: ${[...okHosts].join(", ")} (doplň "qa_hosts" v .vibekodex/qa.json),\n` +
      `  nebo vědomá výjimka: VKQA_ALLOW_PROD="<důvod>".`)
  }
  if (!okHosts.has(host)) console.log(`  !! APLIKACE JE OSTRÁ (${host}) — důvod: ${process.env.VKQA_ALLOW_PROD}\n`)
}

// ---------------------------------------------------------------- prohlížeč
/**
 * Binárku hledá ve sdílené cache ~/Library/Caches/ms-playwright a bere nejvyšší
 * verzi. Natvrdo zapsaná cesta (chromium-1208) se po `npx playwright install`
 * tiše rozbije a skript pak hlásí chybu testu místo chyby prostředí.
 */
function newestBrowserDir(prefix) {
  const cache = join(process.env.HOME, "Library", "Caches", "ms-playwright")
  if (!existsSync(cache)) return null
  const rx = new RegExp(`^${prefix}-(\\d+)$`)
  const found = readdirSync(cache)
    .map((d) => [d, rx.exec(d)])
    .filter(([, m]) => m)
    .sort((a, b) => Number(b[1][1]) - Number(a[1][1]))
  return found.length ? join(cache, found[0][0]) : null
}

export function executablePath(browser = "chromium") {
  if (browser === "chromium") {
    const dir = newestBrowserDir("chromium")
    const exe = dir && join(dir, "chrome-mac-arm64", "Google Chrome for Testing.app",
      "Contents", "MacOS", "Google Chrome for Testing")
    if (exe && existsSync(exe)) return exe
  }
  if (browser === "webkit") {
    for (const p of ["webkit_mac14_arm64_special", "webkit"]) {
      const dir = newestBrowserDir(p)
      const exe = dir && join(dir, "pw_run.sh")
      if (exe && existsSync(exe)) return exe
    }
  }
  fail(`Prohlížeč '${browser}' není nainstalovaný. Spusť: os/qa/install_browsers.sh`)
}

/** Vrátí spuštěný browser. Import playwright-core je líný — skripty bez prohlížeče ho nepotřebují. */
export async function launch(browser = "chromium", opts = {}) {
  const pw = await import("playwright-core")
  const engine = browser === "webkit" ? pw.webkit : pw.chromium
  return engine.launch({ executablePath: executablePath(browser), ...opts })
}

// ---------------------------------------------------------------- QA účty
/**
 * Heslo QA účtu z Keychainu, ne z kódu. Založení:
 *   security add-generic-password -s "vibekodex QA <projekt>" -a <email> -w '<heslo>'
 */
export function qaSecret(account, service = qaConfig.keychain_service) {
  if (!service) fail("V .vibekodex/qa.json chybí 'keychain_service' — bez něj nevím, kde heslo hledat.")
  try {
    return execFileSync("security", ["find-generic-password", "-s", service, "-a", account, "-w"],
      { encoding: "utf8" }).trim()
  } catch {
    fail(`Heslo QA účtu '${account}' není v Keychainu (služba '${service}').\n` +
      `  Přidej:  security add-generic-password -s "${service}" -a "${account}" -w '<heslo>'`)
  }
}

/**
 * Heslo QA účtu, který si testy samy zakládají: z Keychainu, a když tam ještě
 * není, vygeneruje náhodné a uloží ho. Setup i test volají qaPassword se stejným
 * klíčem (e-mail účtu nebo název série), takže se potkají — a heslo není nikde
 * v kódu ani v gitu.
 */
export function qaPassword(account, service = qaConfig.keychain_service) {
  if (!service) fail("V .vibekodex/qa.json chybí 'keychain_service'.")
  try {
    return execFileSync("security", ["find-generic-password", "-s", service, "-a", account, "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  } catch {
    const pw = "Qa-" + randomBytes(12).toString("base64url") + "-9!"
    execFileSync("security", ["add-generic-password", "-s", service, "-a", account, "-w", pw])
    return pw
  }
}

// ---------------------------------------------------------------- výsledky
let failures = 0
export function check(label, ok, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? " — " + detail : ""}`)
  if (!ok) failures++
  return ok
}
/** Na konci skriptu: `process.exit(summary())` — runner čte exit kód. */
export function summary() {
  console.log(failures === 0 ? "\nVŠE PROŠLO" : `\nSELHALO: ${failures}`)
  return failures === 0 ? 0 : 1
}
