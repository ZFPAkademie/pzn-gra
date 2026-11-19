/**
 * Antispam a validace veřejných formulářů (lib/forms, 19. 11. 2026).
 *
 * Vzorce spamu, které na web skutečně chodily (11/2026): bot s náhodným jménem, gmailem
 * s tečkami, US telefonem a UA v uvozovkách; nabídka „katalogu zdarma“ (Tourist.com).
 * Bot dostane úspěch, lead se uloží se stavem spam (bez e-mailu), past/časová past neuloží nic,
 * člověk s chybou dostane konkrétní hlášku, opakované odesílání → 429.
 */
import { BASE, admin, check, summary } from "./qa-env.mjs"

const T = Date.now()
let ipSeq = 0
const post = (path, body, { ua = "Mozilla/5.0 (QA)", cookie } = {}) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ua,
      // Každý scénář z jiné IP, ať se nesčítá do rate limitu ostatních skriptů
      "X-Forwarded-For": `10.77.${T % 200}.${++ipSeq}`,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  })
const leadsByEmail = async (email) => (await admin.from("leads").select("id, status, notes").eq("email", email)).data ?? []
const created = []

// ── Bot z 11/2026 → 201, uloženo jako spam ───────────────────────────────────
{
  const email = `l.i.h.e.lo.bi.${T}@gmail.com`
  const r = await post("/api/v1/contact",
    { name: "xMBAlwQpfevVXfkg", email, phone: "2997435066", message: "dGIBDFSJgrnOaBHy" },
    { ua: '"Mozilla/5.0 (Macintosh)' })
  const rows = await leadsByEmail(email)
  created.push(...rows.map((x) => x.id))
  check("bot: odpověď 201 (nic neprozradí)", r.status === 201, String(r.status))
  check("bot: uložen jako spam s důvodem", rows.length === 1 && rows[0].status === "spam" && rows[0].notes?.includes("random_name"),
    JSON.stringify(rows))
}

// ── Nabídka katalogu → spam ─────────────────────────────────────────────────
{
  const email = `alba${T}@touristcenters.com`
  const r = await post("/api/v1/contact", {
    name: "Alba Torres", email,
    message: "Hello, I'd like to list you on Tourist.com, a catalogue of travel offers. It's free, no commission. tourist-europa.com",
  })
  const rows = await leadsByEmail(email)
  created.push(...rows.map((x) => x.id))
  check("katalog: 201 a stav spam", r.status === 201 && rows.length === 1 && rows[0].status === "spam", `${r.status} ${JSON.stringify(rows)}`)
}

// ── Past a časová past → 201, nic se neuloží ────────────────────────────────
for (const [label, extra] of [["honeypot", { website_url: "http://x.com" }], ["moc rychle", { form_rendered_at: Date.now() - 500 }]]) {
  const email = `jan.${label.replace(/\W/g, "")}${T}@seed.test`
  const r = await post("/api/v1/contact", { name: "Jan Novák", email, message: "Dobrý den", ...extra })
  const rows = await leadsByEmail(email)
  created.push(...rows.map((x) => x.id))
  check(`${label}: 201 a nic uloženo`, r.status === 201 && rows.length === 0, `${r.status} řádků ${rows.length}`)
}

// ── Podíl od bota → spam, bez kontaktu v Družstvu ───────────────────────────
{
  const email = `s.e.s.e.d${T}@gmail.com`
  const r = await post("/api/v1/leads", {
    type: "investment_share_request", name: "OwJboXrVmYHYAsSLDdCYv", email,
    message: "IOVNUKSKgMGdjgqeZIkeIxfS", share_count: 2, metadata: { locale: "cs" },
  }, { ua: '"Mozilla/5.0' })
  const rows = await leadsByEmail(email)
  created.push(...rows.map((x) => x.id))
  const coop = rows.length ? (await admin.from("coop_contacts").select("id").eq("lead_id", rows[0].id)).data ?? [] : []
  check("podíl od bota: spam, bez Družstva", r.status === 201 && rows[0]?.status === "spam" && coop.length === 0,
    `${r.status} ${rows[0]?.status} coop ${coop.length}`)
}

// ── Člověk s chybou dostane konkrétní hlášku ve svém jazyce ─────────────────
{
  let r = await post("/api/v1/contact", { name: "Jan Novák", email: `jan${T}@seed.test`, phone: "456789", message: "Dobrý den" })
  let j = await r.json()
  check("kontakt: špatný telefon → 400 s hláškou", r.status === 400 && /Telefon/.test(j.error ?? ""), `${r.status} ${j.error}`)

  r = await post("/api/v1/leads", { type: "investment_share_request", name: "John Smith", email: "test@example.com", metadata: { locale: "en" } })
  j = await r.json()
  check("podíl EN: vymyšlený e-mail → 400 anglicky", r.status === 400 && /real email/.test(j.error ?? ""), `${r.status} ${j.error}`)

  r = await post("/api/v1/bookings", {
    apartmentId: "00000000-0000-4000-8000-000000000000", checkIn: "2027-01-10", checkOut: "2027-01-12",
    firstName: "Anna", lastName: "Nowak", email: "anna@wp.pl", phone: "123", gdprConsent: true,
  }, { cookie: "NEXT_LOCALE=pl" })
  j = await r.json()
  check("rezervace PL: špatný telefon → 400 polsky", r.status === 400 && /Numer/.test(j.error ?? ""), `${r.status} ${j.error}`)

  r = await post("/api/v1/bookings", {
    apartmentId: "00000000-0000-4000-8000-000000000000", checkIn: "2027-01-10", checkOut: "2027-01-12",
    firstName: "Jan", lastName: "Novák", email: `jan${T}@seed.test`, gdprConsent: true, website_url: "spam",
  })
  check("rezervace s pastí → 400, nic nezapíše", r.status === 400, String(r.status))
}

// ── Rate limit: 6. zpráva z jedné IP za 10 min → 429 ────────────────────────
{
  const ip = `10.78.${T % 200}.1`
  const codes = []
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${BASE}/api/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (QA)", "X-Forwarded-For": ip },
      body: JSON.stringify({ name: "Jan Novák", email: "jan@seed.test", phone: "456", message: "x" }),
    })
    codes.push(r.status)
  }
  check("rate limit: 6. pokus 429", codes[5] === 429 && codes.slice(0, 5).every((c) => c === 400), codes.join(","))
}

if (created.length) await admin.from("leads").delete().in("id", created)
process.exit(summary())
