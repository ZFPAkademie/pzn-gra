/**
 * Spuštění na podzlatymnavrsim.cz (3. 11. 2026).
 *
 * Staré adresy z Wixu nesmí skončit na 404, právní stránky musí existovat (odkazuje na ně
 * rezervační formulář a patička), neznámá adresa vrací 404 s rozcestníkem, sitemapa a
 * canonical míří na www a každá stránka má náhled pro sdílení.
 */
import { BASE, admin, check, summary } from "./qa-env.mjs"

const get = (path) => fetch(`${BASE}${path}`, { redirect: "manual" })
const html = async (path) => (await (await fetch(`${BASE}${path}`)).text()).replace(/<!-- -->/g, "")

// ── Přesměrování starých adres (308, cíl rovnou finální stránka) ──────────────
const REDIRECTS = [
  ["/chata-1-suite-7-1-kk-35m2", "/suites/chata-1-suite-7"],
  ["/chata-2-suite-3-1-kk-35m2", "/suites"],
  ["/apartman-prodej-spindleruv-mlyn", "/suites"],
  ["/golden-ridge-11", "/apartmany-spindleruv-mlyn-pronajem/golden-ridge-11"],
  ["/golden-ridge-apartman-2", "/apartmany-spindleruv-mlyn-pronajem/golden-ridge-2"],
  ["/interier", "/standardy"],
  ["/formular-odeslan", "/"],
  ["/investicni-prilezitost", "/kalkulacka"],
  ["/apartmany-prodej/chata-1-suite-7", "/suites/chata-1-suite-7"],
]
for (const [from, to] of REDIRECTS) {
  const r = await get(from)
  const loc = new URL(r.headers.get("location") ?? "", BASE).pathname
  check(`přesměrování ${from}`, r.status === 308 && loc === to, `${r.status} → ${loc}`)
}

// ── Právní stránky ────────────────────────────────────────────────────────────
{
  const terms = await html("/obchodni-podminky")
  check("obchodní podmínky: ubytovatel Echo Wave", terms.includes("Echo Wave s.r.o.") && terms.includes("24074951"))
  check("obchodní podmínky: storno 14 dnů", terms.includes("14 dnů před dnem příjezdu"))
  const privacy = await html("/ochrana-osobnich-udaju")
  check("ochrana soukromí: správce a práva", privacy.includes("Echo Wave s.r.o.") && privacy.includes("uoou.gov.cz"))
  const home = await html("/")
  check("patička odkazuje na právní stránky", home.includes('href="/obchodni-podminky"') && home.includes('href="/ochrana-osobnich-udaju"'))
}

// ── 404 ───────────────────────────────────────────────────────────────────────
{
  const r = await fetch(`${BASE}/tahle-stranka-neexistuje`)
  const body = await r.text()
  check("neznámá adresa: 404 s rozcestníkem", r.status === 404 && body.includes("Tady značka končí"), String(r.status))
}

// ── SEO: www, canonical, náhled pro sdílení ───────────────────────────────────
{
  const sitemap = await html("/sitemap.xml")
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  check("sitemapa jen na www", locs.length > 0 && locs.every((u) => u.startsWith("https://www.podzlatymnavrsim.cz")), locs.find((u) => !u.startsWith("https://www.")))
  check("sitemapa bez přesměrovávacích adres", !locs.some((u) => /\/(apartmany-prodej|golden-ridge-apartments|investicni-prilezitost|nemovitostni-produkt)(\/|$)/.test(u)))
  const robots = await html("/robots.txt")
  check("robots.txt: sitemapa na www", robots.includes("Sitemap: https://www.podzlatymnavrsim.cz/sitemap.xml"))

  const lokalita = await html("/lokalita")
  check("canonical na www", lokalita.includes('rel="canonical" href="https://www.podzlatymnavrsim.cz/lokalita"'))
  // next dev skládá adresu obrázku z localhostu, produkční build z metadataBase (www) → kontrolujeme cestu
  check("og:title + og:image", lokalita.includes('property="og:title"') && /property="og:image" content="https?:\/\/[^"]+\/opengraph-image"/.test(lokalita))
  const og = await fetch(`${BASE}/opengraph-image`)
  check("výchozí náhled je PNG", og.status === 200 && og.headers.get("content-type") === "image/png", `${og.status} ${og.headers.get("content-type")}`)
}

// ── Kontaktní formulář ukládá (do 4. 11. 2026 jen console.log + úspěch) ─────────
{
  const marker = `QA-KONTAKT-${Date.now()}`
  const r = await fetch(`${BASE}/api/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "QA Kontakt", email: "qa-kontakt@example.com", phone: "", message: marker }),
  })
  const { data } = await admin.from("leads").select("id, type, first_name, last_name").eq("message", marker)
  check("kontaktní formulář → leads", r.status === 201 && data?.length === 1 && data[0].type === "general_inquiry", `${r.status} řádků ${data?.length}`)
  if (data?.length) await admin.from("leads").delete().in("id", data.map((d) => d.id))
}

// ── Odstraněná tvrzení se nevrací ─────────────────────────────────────────────
{
  const standardy = await html("/standardy")
  check("standardy: bez klimatizace a kosmetiky", !/klimatizac|kosmetik/i.test(standardy))
  check("standardy: konkrétní specifikace", standardy.includes("ADLO") && standardy.includes("Atlas Concorde"))
}

process.exit(summary())
