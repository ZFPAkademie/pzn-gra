/**
 * Seed QA databáze gra3 — pevná ID, na která míří testy. Idempotentní (upsert).
 * Běží jen přes qa-env.mjs, tedy jen proti lokální QA databázi.
 */
import { admin, TARGET } from "./qa-env.mjs"

export const QA_APT_ID = "00000000-0000-4000-8000-000000000a01"
export const QA_APT_SLUG = "qa-apartman"
export const QA_FDM_APT_ID = "00000000-0000-4000-8000-000000000a02"
export const QA_FDM_APT_SLUG = "qa-apartman-fdm"

const { error: e1 } = await admin.from("apartments").upsert({
  id: QA_APT_ID,
  slug: QA_APT_SLUG,
  title: "QA apartmán",
  building: "A", unit: "1", layout: "2+kk", area_m2: 55, floor: 1,
  status: "available", for_sale: false, for_rent: true, in_rental_program: true,
  base_price_cents: 250000, max_guests: 4,
}, { onConflict: "id" })
if (e1) { console.error("seed apartments:", e1.message); process.exit(1) }

// Ceník na celý letošní i příští rok, ať testy nezávisí na datu.
const y = new Date().getFullYear()
const { error: e2 } = await admin.from("pricing_rules").upsert({
  id: "00000000-0000-4000-8000-000000000b01",
  apartment_id: QA_APT_ID, name: "QA základní",
  start_date: `${y}-01-01`, end_date: `${y + 1}-12-31`,
  price_per_night_cents: 250000, min_nights: 2,
}, { onConflict: "id" })
if (e2) { console.error("seed pricing_rules:", e2.message); process.exit(1) }

// Žádné rezervace ani blokace — testy začínají z volného kalendáře.
await admin.from("bookings").delete().eq("apartment_id", QA_APT_ID)
await admin.from("blocked_dates").delete().eq("apartment_id", QA_APT_ID)

// Apartmán napojený na Front Desk Master pro hledání podle termínu: 60 dní, 100 €/noc, minimum 2 noci.
// Dny +20 až +22 obsazené, noc +30 s minimem 4 noci (jako Silvestr), +40 s jinou cenou.
const { error: e3 } = await admin.from("apartments").upsert({
  id: QA_FDM_APT_ID,
  slug: QA_FDM_APT_SLUG,
  title: "QA apartmán FDM",
  building: "A", unit: "2", layout: "1+kk", area_m2: 40, floor: 1,
  status: "sold", for_sale: false, for_rent: true, in_rental_program: true,
  base_price_cents: 250000, max_guests: 4, fdm_room_use_id: 9001,
}, { onConflict: "id" })
if (e3) { console.error("seed apartments fdm:", e3.message); process.exit(1) }

const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" })
const dayOffset = (n) => {
  const d = new Date(today + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
await admin.from("fdm_calendar").delete().eq("apartment_id", QA_FDM_APT_ID)
const { error: e4 } = await admin.from("fdm_calendar").insert(
  Array.from({ length: 60 }, (_, n) => ({
    apartment_id: QA_FDM_APT_ID,
    date: dayOffset(n),
    available: n < 20 || n > 22,
    price_cents: n === 40 ? 15000 : 10000,
    currency: "EUR",
    min_stay: n === 30 ? 4 : 2,
    closed: false,
  }))
)
if (e4) { console.error("seed fdm_calendar:", e4.message); process.exit(1) }
await admin.from("bookings").delete().eq("apartment_id", QA_FDM_APT_ID)
await admin.from("blocked_dates").delete().eq("apartment_id", QA_FDM_APT_ID)

console.log(`seed hotov (${TARGET}): apartmány ${QA_APT_SLUG}, ${QA_FDM_APT_SLUG}`)
