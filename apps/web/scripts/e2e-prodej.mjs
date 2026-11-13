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
check("pronájem jako bonus z FDM dvojčete", html.includes("Když tam nejste, apartmán může vydělávat"))
// Důraz na prodej (13. 11. 2026): „Co kupujete“ a kontakt před pronájmem, podrobnosti pronájmu sbalené
const iBuy = html.indexOf("Co s apartmánem kupujete"), iContact = html.indexOf('id="kontakt"'), iRent = html.indexOf('id="pronajem"')
check("prodej: sekce Co kupujete", iBuy > 0)
check("prodej: Co kupujete i kontakt před pronájmem", iBuy > 0 && iContact > iBuy && iRent > iContact, `${iBuy} / ${iContact} / ${iRent}`)
check("prodej: obsazenost po měsících sbalená", /<details[^>]*>[\s\S]*Obsazenost po měsících a ceník na rok/.test(html))
check("odkaz na pronájem dvojčete", html.includes("/apartmany-spindleruv-mlyn-pronajem/qa-apartman-fdm"))
// Seed: obsazené dny dnes +20 až +22. Stránka ukazuje obsazenost jen v okně sezóny
// (říjen–únor → prosinec–únor, jinak dnes + 90 dní) — počítej stejně, po měsících.
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" })
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const [y, mo] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))]
let from = today, to = addDays(today, 89)
if (mo >= 10 || mo <= 2) {
  const sy = mo >= 10 ? y : y - 1
  from = today > `${sy}-12-01` ? today : `${sy}-12-01`
  to = addDays(`${sy + 1}-03-01`, -1)
}
const bookedByMonth = {}
for (const n of [20, 21, 22]) {
  const day = addDays(today, n)
  if (day < from || day > to) continue
  bookedByMonth[day.slice(0, 7)] = (bookedByMonth[day.slice(0, 7)] ?? 0) + 1
}
check("průměr domu v sezóně", html.includes("Průměr celého domu"))
const plain = html.replace(/<!-- -->/g, "")
for (const [m, c] of Object.entries(bookedByMonth)) {
  const ok = new RegExp(`>${c} z \\d+<`).test(plain)
  check(`obsazené noci z FDM ${m}: ${c}`, ok, ok ? "" : `chybí „${c} z N“`)
}
check("kapitoly galerie", html.includes("Dům v zimě") && html.includes("Půdorysy"))
check("plochy podle půdorysu", html.includes("Členění podle půdorysu") && html.includes("30 m²"))
check("bez výnosu v % a kalkulačky", !/výnos\s*\d|Kalkulačk/i.test(html))

// ── Výpis /suites (11. 11. 2026): karta apartmánu, pronájem v číslech z FDM, bez výnosu ──
const listRes = await fetch(`${BASE}/suites`, { headers: { Cookie: "NEXT_LOCALE=cs" } })
const list = (await listRes.text()).replace(/<!-- -->/g, "")
check("výpis 200", listRes.status === 200, String(listRes.status))
check("výpis: karta apartmánu s odkazem na prezentaci", list.includes(`href="/suites/${SALE_SLUG}"`) && list.includes("Otevřít prezentaci"))
check("výpis: cena Na dotaz", list.includes("Na dotaz"))
check("výpis: plocha z DB", list.includes("40 m²"))
check("výpis: obsazenost z FDM dvojčete", /Obsazeno, (zima|příštích 90 dní)/.test(list) && list.includes("Průměr domu"))
check("výpis: poznámka o stavu kalendáře", list.includes("ne o výsledek minulých let ani o záruku budoucího příjmu"))
check("výpis: počet fotek bez půdorysů", list.includes("2 fotografie") && list.includes("1 půdorys"))
check("výpis: postup koupě a kontakt", list.includes("Zápis do katastru") && list.includes('id="kontakt"'))
check("výpis: bez výnosu v %", !/výnos\s*\d/i.test(list))
const listEn = await fetch(`${BASE}/suites`, { headers: { Cookie: "NEXT_LOCALE=en" } }).then((x) => x.text())
check("výpis EN", listEn.includes("Open the presentation") && listEn.includes("On request"))

const notSale = await fetch(`${BASE}/suites/qa-apartman`)
check("byt mimo prodej → 404", notSale.status === 404, String(notSale.status))

await admin.from("apartments").delete().eq("id", SALE_ID)
process.exit(summary())
