/**
 * Seed QA databáze gra3 — pevná ID, na která míří testy. Idempotentní (upsert).
 * Běží jen přes qa-env.mjs, tedy jen proti lokální QA databázi.
 */
import { admin, TARGET } from "./qa-env.mjs"

export const QA_APT_ID = "00000000-0000-4000-8000-000000000a01"
export const QA_APT_SLUG = "qa-apartman"

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

console.log(`seed hotov (${TARGET}): apartmán ${QA_APT_SLUG}`)
