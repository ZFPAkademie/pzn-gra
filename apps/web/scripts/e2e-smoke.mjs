/**
 * Kouřový test gra3 — to, co by zákazník nebo útočník poznal první.
 *
 * 1. RLS: anon nečte rezervace, poptávky ani majitele (osobní údaje), čte katalog apartmánů,
 *    ale ne iCal token (migrace 011 — sloupcový grant).
 * 2. Rezervační engine: dostupnost a cena pro veřejný kalendář; pending rezervace termín blokuje.
 * 3. Veřejný web odpovídá.
 *
 * Potřebuje `npm run dev:qa` (aplikace proti QA databázi) a seed (scripts/seed-qa.mjs).
 */
import { anon, admin, BASE, check, summary } from "./qa-env.mjs"

const APT_ID = "00000000-0000-4000-8000-000000000a01"
const SLUG = "qa-apartman"

// ── 1. RLS ───────────────────────────────────────────────────────────────────
for (const table of ["bookings", "leads", "owners", "booking_messages"]) {
  const { data, error } = await anon.from(table).select("*").limit(1)
  check(`anon nečte ${table}`, !!error || (data ?? []).length === 0, error?.message ?? `${(data ?? []).length} řádků`)
}
{
  const { data } = await anon.from("apartments").select("id, slug").eq("slug", SLUG)
  check("anon čte katalog apartmánů", (data ?? []).length === 1)
  const { error } = await anon.from("apartments").select("ical_export_token").eq("slug", SLUG)
  check("anon nečte ical_export_token", !!error, error?.message ?? "sloupec přečten")
}
{
  const { error } = await anon.from("bookings").insert({
    apartment_id: APT_ID, check_in: "2031-01-10", check_out: "2031-01-12", nights: 2,
    guest_first_name: "Anon", guest_last_name: "Test", guest_email: "anon@example.com",
    guests_count: 1, total_amount_cents: 1, currency: "CZK",
  })
  check("anon nezapíše rezervaci napřímo (jen přes API)", !!error, error?.message ?? "zapsáno")
}

// ── 2. Rezervační engine přes veřejné API ────────────────────────────────────
const d = (iso) => iso
const checkIn = d("2031-03-10"), checkOut = d("2031-03-13")
const url = (q) => `${BASE}/api/v1/apartments/${SLUG}/availability?${q}`

let r = await fetch(url(`checkIn=${checkIn}&checkOut=${checkOut}`))
let j = await r.json().catch(() => ({}))
check("dostupnost volného termínu = available", r.status === 200 && j.available === true, `${r.status} ${JSON.stringify(j)}`)
check("cena 3 nocí = 3 × 2 500 Kč", j.totalCents === 750000 && j.nights === 3, `totalCents=${j.totalCents} nights=${j.nights}`)

r = await fetch(url(`checkIn=${checkOut}&checkOut=${checkIn}`))
check("obrácený rozsah → 400", r.status === 400, String(r.status))

r = await fetch(url("year=2031&month=3"))
j = await r.json().catch(() => ({}))
check("měsíční přehled bez blokací", r.status === 200 && Array.isArray(j.blockedDates) && j.blockedDates.length === 0, JSON.stringify(j).slice(0, 80))

const { error: insErr } = await admin.from("bookings").insert({
  apartment_id: APT_ID, status: "pending", payment_method: "bank_transfer",
  check_in: checkIn, check_out: checkOut, nights: 3,
  guest_first_name: "QA", guest_last_name: "Host", guest_email: "qa@example.com",
  guests_count: 2, total_amount_cents: 750000, currency: "CZK",
})
check("pending rezervace založena (admin)", !insErr, insErr?.message)
r = await fetch(url(`checkIn=${checkIn}&checkOut=${checkOut}`))
j = await r.json().catch(() => ({}))
check("obsazený termín = not available", j.available === false, JSON.stringify(j).slice(0, 80))
r = await fetch(url("year=2031&month=3"))
j = await r.json().catch(() => ({}))
check("měsíční přehled zná blokované noci", Array.isArray(j.blockedDates) && j.blockedDates.length === 3, JSON.stringify(j.blockedDates))
await admin.from("bookings").delete().eq("apartment_id", APT_ID)

r = await fetch(`${BASE}/api/v1/apartments/neexistuje/availability?year=2031&month=3`)
check("neznámý apartmán → 404", r.status === 404, String(r.status))

// ── 3. Web ───────────────────────────────────────────────────────────────────
r = await fetch(`${BASE}/`)
const html = await r.text()
check("homepage 200 s obsahem", r.status === 200 && html.length > 5000, `${r.status}, ${html.length} B`)
// Informace pro hosty převzaté z Booking.com (1. 11. 2026) — podmínky pobytu a opravená Lokalita (Labská, ne centrum)
r = await fetch(`${BASE}/apartmany-spindleruv-mlyn-pronajem`, { headers: { cookie: "NEXT_LOCALE=cs" } })
const rentHtml = await r.text()
check("pronájem: podmínky pobytu + hodnocení hostů", r.status === 200 && rentHtml.includes("Podmínky pobytu") && rentHtml.includes("Booking.com"), String(r.status))
r = await fetch(`${BASE}/lokalita`, { headers: { cookie: "NEXT_LOCALE=cs" } })
const locHtml = await r.text()
check("lokalita: centrum 2,2 km, ne 500 m", r.status === 200 && locHtml.includes("2,2 km") && !locHtml.includes("500 m"), String(r.status))
r = await fetch(`${BASE}/admin/leads`, { redirect: "manual" })
check("admin bez přihlášení nepustí", r.status === 307 || r.status === 302 || r.status === 401 || r.status === 404, String(r.status))

process.exit(summary())
