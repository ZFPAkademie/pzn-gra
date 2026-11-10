/**
 * Prezentace apartmánu na prodej (/suites/[slug], 10. 11. 2026).
 *
 * Ověřuje, že prodejní stránka:
 * 1. bere ceník a obsazenost z FDM dvojčete (stejná budova + jednotka, napojené na FDM),
 * 2. skládá galerii po kapitolách (apartment_images.category, migrace 023),
 * 3. drží cenu „Na dotaz“ a pro byt, který není na prodej, vrací 404.
 *
 * Potřebuje `npm run dev:qa` a seed (qa-apartman-fdm = budova A, jednotka 2).
 */
import { admin, BASE, check, summary } from "./qa-env.mjs"

const SALE_ID = "00000000-0000-4000-8000-000000000a03"
const SALE_SLUG = "qa-apartman-prodej"

await admin.from("apartments").delete().eq("id", SALE_ID)
const { error: e1 } = await admin.from("apartments").insert({
  id: SALE_ID,
  slug: SALE_SLUG,
  title: "QA apartmán na prodej",
  building: "A", unit: "2", layout: "1+kk", area_m2: 40, floor: 3, floors_total: 3,
  status: "available", for_sale: true, for_rent: false, in_rental_program: false,
  max_guests: 2,
  rooms: { hall: "5 m²", bathroom: "5 m²", bedroom: null, livingKitchen: "30 m²" },
})
check("prodejní apartmán založen", !e1, e1?.message)

const { error: e2 } = await admin.from("apartment_images").insert([
  { apartment_id: SALE_ID, storage_path: "qa/interier.jpg", sort_order: 0, category: "interior", alt_text: "QA interiér" },
  { apartment_id: SALE_ID, storage_path: "zima/chaty-panorama.jpg", sort_order: 1, category: "winter", alt_text: "QA zima" },
  { apartment_id: SALE_ID, storage_path: "qa/pudorys.jpg", sort_order: 2, category: "plan", alt_text: "QA půdorys" },
])
check("fotky s kapitolami založeny", !e2, e2?.message)

const res = await fetch(`${BASE}/suites/${SALE_SLUG}`, { headers: { Cookie: "NEXT_LOCALE=cs" } })
const html = await res.text()
check("prodejní stránka 200", res.status === 200, String(res.status))
check("cena Na dotaz", html.includes("Na dotaz"))
check("pronájem v číslech z FDM dvojčete", html.includes("Ceník a obsazenost přímo z kalendáře správce"))
check("odkaz na pronájem dvojčete", html.includes("/apartmany-spindleruv-mlyn-pronajem/qa-apartman-fdm"))
// Seed: obsazené dny dnes +20 až +22 — mohou padnout do dvou měsíců, počítej po měsících
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" })
const bookedByMonth = {}
for (const n of [20, 21, 22]) {
  const d = new Date(today + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  const m = d.toISOString().slice(0, 7)
  bookedByMonth[m] = (bookedByMonth[m] ?? 0) + 1
}
const plain = html.replace(/<!-- -->/g, "")
for (const [m, c] of Object.entries(bookedByMonth)) {
  const ok = new RegExp(`>${c} z \\d+<`).test(plain)
  check(`obsazené noci z FDM ${m}: ${c}`, ok, ok ? "" : `chybí „${c} z N“`)
}
check("kapitoly galerie", html.includes("Dům v zimě") && html.includes("Půdorysy"))
check("plochy podle půdorysu", html.includes("Členění podle půdorysu") && html.includes("30 m²"))
check("bez výnosu v % a kalkulačky", !/výnos\s*\d|Kalkulačk/i.test(html))

const notSale = await fetch(`${BASE}/suites/qa-apartman`)
check("byt mimo prodej → 404", notSale.status === 404, String(notSale.status))

await admin.from("apartments").delete().eq("id", SALE_ID)
process.exit(summary())
