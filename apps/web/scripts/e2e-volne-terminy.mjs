/**
 * Hledání volných apartmánů podle termínu (/volne-terminy).
 *
 * Hledání nesmí nabídnout termín, který by rezervace odmítla, ani zatajit volný:
 * obsazené dny z FDM, rezervace z webu, blokace majitele, minimální pobyt, den odjezdu.
 * Kalendář QA apartmánu FDM je v scripts/seed-qa.mjs (dny počítané od dneška).
 */
import { admin, BASE, check, summary } from "./qa-env.mjs"

const APT_ID = "00000000-0000-4000-8000-000000000a02"
const SLUG = "qa-apartman-fdm"

const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" })
const day = (n) => {
  const d = new Date(today + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const page = async (query) => {
  const r = await fetch(`${BASE}/volne-terminy${query}`)
  // <!-- --> = oddělovač textových uzlů v HTML od Reactu, host ho nevidí
  return { status: r.status, html: (await r.text()).replace(/<!-- -->/g, "").replace(/&nbsp;| | /g, " ") }
}
const offers = (html, from, to) =>
  html.includes(`/apartmany-spindleruv-mlyn-pronajem/${SLUG}?od=${from}&amp;do=${to}#rezervace`)
const apiPrice = async (from, to) =>
  (await fetch(`${BASE}/api/v1/apartments/${SLUG}/availability?checkIn=${from}&checkOut=${to}`)).json()

// ── Volný termín ─────────────────────────────────────────────────────────────
{
  const { status, html } = await page(`?od=${day(5)}&do=${day(8)}`)
  check("volný termín: stránka 200", status === 200, String(status))
  check("volný termín: apartmán nabídnut s předvyplněným odkazem", offers(html, day(5), day(8)))
  const api = await apiPrice(day(5), day(8))
  check("cena sedí s rezervací", api.totalCents === 30000 && html.includes("300 €"), `api ${api.totalCents}`)
}
{
  const { html } = await page(`?od=${day(39)}&do=${day(42)}`)
  const api = await apiPrice(day(39), day(42))
  check("sezónní cena se sčítá po nocích", api.totalCents === 35000 && html.includes("350 €"), `api ${api.totalCents}`)
  check("proměnlivá cena je označená jako průměr", html.includes("průměr 117 €"))
}

// ── Co nabídnout nesmí ───────────────────────────────────────────────────────
{
  const { html } = await page(`?od=${day(19)}&do=${day(22)}`)
  check("obsazená noc z FDM: nenabídnut", !offers(html, day(19), day(22)))
  check("obsazeno: host dostane zprávu", html.includes("Pro tento termín nemáme volný apartmán"))
  check("obsazeno: nabídne náhradní termín stejné délky", html.includes(`${SLUG}?od=`), "bez náhradního termínu")
  check("náhradní termín je opravdu volný", !html.includes(`${SLUG}?od=${day(20)}`) && !html.includes(`${SLUG}?od=${day(21)}`))
}
{
  const { html } = await page(`?od=${day(29)}&do=${day(32)}`)
  check("minimální pobyt z FDM: kratší termín nenabídnut", !offers(html, day(29), day(32)))
  check("minimální pobyt: host se dozví proč", html.includes("minimální pobyt 4 noci"))
  const longer = await page(`?od=${day(29)}&do=${day(33)}`)
  check("minimální pobyt: dost dlouhý termín nabídnut", offers(longer.html, day(29), day(33)))
}
{
  const { html } = await page(`?od=${day(58)}&do=${day(62)}`)
  check("za horizontem kalendáře nic nenabízí", !offers(html, day(58), day(62)))
}

// ── Rezervace z webu a blokace majitele ──────────────────────────────────────
{
  const { error } = await admin.from("bookings").insert({
    apartment_id: APT_ID, status: "pending", payment_method: "bank_transfer",
    check_in: day(10), check_out: day(13), nights: 3,
    guest_first_name: "QA", guest_last_name: "Host", guest_email: "qa@example.com",
    guests_count: 2, total_amount_cents: 30000, currency: "EUR",
  })
  check("rezervace založena (admin)", !error, error?.message)
  let { html } = await page(`?od=${day(10)}&do=${day(12)}`)
  check("rezervace z webu blokuje hledání", !offers(html, day(10), day(12)))
  ;({ html } = await page(`?od=${day(8)}&do=${day(10)}`))
  check("den příjezdu dalšího hosta jde jako odjezd", offers(html, day(8), day(10)))
  ;({ html } = await page(`?od=${day(13)}&do=${day(15)}`))
  check("den odjezdu předchozího hosta jde jako příjezd", offers(html, day(13), day(15)))
  await admin.from("bookings").delete().eq("apartment_id", APT_ID)
}
{
  const { data: owner, error: ownerErr } = await admin.from("owners")
    .insert({ name: "QA Majitel", email: "qa-majitel@example.com" }).select("id").single()
  check("majitel založen (admin)", !ownerErr, ownerErr?.message)
  const { error } = await admin.from("blocked_dates").insert({
    apartment_id: APT_ID, owner_id: owner?.id, start_date: day(15), end_date: day(16),
  })
  check("blokace majitele založena", !error, error?.message)
  let { html } = await page(`?od=${day(16)}&do=${day(18)}`)
  check("blokace majitele platí včetně posledního dne", !offers(html, day(16), day(18)))
  ;({ html } = await page(`?od=${day(17)}&do=${day(19)}`))
  check("den po blokaci je volný", offers(html, day(17), day(19)))
  await admin.from("blocked_dates").delete().eq("apartment_id", APT_ID)
  if (owner?.id) await admin.from("owners").delete().eq("id", owner.id)
}

// ── Přehled, neplatné vstupy, kalendář ───────────────────────────────────────
{
  const { html } = await page("")
  check("přehled bez termínu nabízí nejbližší pobyty", html.includes("Nejbližší volné pobyty") && html.includes(`${SLUG}?od=`))
  const week = await page("?noci=7")
  const nights = [...week.html.matchAll(new RegExp(`${SLUG}\\?od=(\\d{4}-\\d{2}-\\d{2})&amp;do=(\\d{4}-\\d{2}-\\d{2})`, "g"))]
  check("filtr délky platí", nights.length > 0 && nights.every(([, a, b]) => (Date.parse(b) - Date.parse(a)) / 86400000 === 7), `${nights.length} nabídek`)
  for (const q of ["?od=abc&do=def", "?od=2020-01-01&do=2020-01-05", `?od=${day(5)}&do=${day(6)}`, `?od=${day(8)}&do=${day(5)}`]) {
    const bad = await page(q)
    check(`neplatný termín ${q.slice(0, 18)} → přehled, ne chyba`, bad.status === 200 && bad.html.includes("Nejbližší volné pobyty"), String(bad.status))
  }
}
{
  const r = await fetch(`${BASE}/api/v1/availability`)
  const j = await r.json().catch(() => ({}))
  const sold = new Set(j.soldOutDays ?? [])
  check("kalendář: obsazené dny hlásí", r.status === 200 && sold.has(day(20)) && sold.has(day(22)))
  check("kalendář: volné dny neoznačí", !sold.has(day(5)) && !sold.has(day(23)))
}
{
  const r = await fetch(`${BASE}/apartmany-spindleruv-mlyn-pronajem/${SLUG}?od=${day(5)}&do=${day(8)}`)
  const html = await r.text()
  check("detail s termínem z hledání: rezervační widget", r.status === 200 && html.includes('id="rezervace"'), String(r.status))
}

process.exit(summary())
