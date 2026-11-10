/**
 * Družstvo (admin /admin/druzstvo, migrace 021) — evidence zájemců a vlastníků podílů.
 *
 * 1. RLS: anon ani přihlášený cizinec nečte a nezapíše coop_* (osobní údaje, doklady).
 * 2. Poptávka z /podil (POST /api/v1/leads) založí kontakt v Družstvu se stavem Nový a počtem podílů.
 * 3. Kapacita 50 podílů hlídaná triggerem; Rezervace/Vlastník bez počtu neprojde.
 * 4. Admin: bez přihlášení ani padělanou Base64 cookií (starý formát) se nikdo nedostane
 *    k výpisu ani k přílohám; s heslem (je-li v .env.qa ADMIN_DASH_PASSWORD) cookie ts.hmac.
 *
 * Potřebuje `npm run dev:qa`.
 */
import { anon, admin, BASE, check, env, summary } from "./qa-env.mjs"

// ── 1. RLS ───────────────────────────────────────────────────────────────────
for (const table of ["coop_contacts", "coop_contact_files", "coop_contact_events"]) {
  const { data, error } = await anon.from(table).select("*").limit(1)
  check(`anon nečte ${table}`, !!error || (data ?? []).length === 0, error?.message ?? `${(data ?? []).length} řádků`)
}
{
  const { error } = await anon.from("coop_contacts").insert({ first_name: "Anon", status: "owner", share_count: 1 })
  check("anon nezapíše coop_contacts", !!error, error?.message ?? "zapsáno")
}

// ── 2. Poptávka z webu → kontakt ─────────────────────────────────────────────
const email = `qa-druzstvo-${Date.now()}@example.com`
let r = await fetch(`${BASE}/api/v1/leads`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-forwarded-for": `10.9.${Date.now() % 250}.1` },
  body: JSON.stringify({
    type: "investment_share_request", name: "Jana QA Testová", email, phone: "777 111 222",
    message: "Zájem o 3 podíly", share_count: 3,
    metadata: { geo: { postal: "543 51" }, source: "podil", locale: "cs" },
  }),
})
let j = await r.json().catch(() => ({}))
check("poptávka podílu → 201", r.status === 201 && !!j.lead_id, `${r.status} ${JSON.stringify(j).slice(0, 80)}`)

const { data: contact } = await admin.from("coop_contacts").select("*").eq("lead_id", j.lead_id ?? "-").maybeSingle()
check("kontakt v Družstvu založen", !!contact, j.lead_id)
check("kontakt: stav Nový, 3 podíly, zdroj web, PSČ", contact?.status === "new" && contact?.share_count === 3 && contact?.source === "web" && contact?.postal_code === "543 51",
  JSON.stringify({ s: contact?.status, n: contact?.share_count, src: contact?.source, psc: contact?.postal_code }))
check("kontakt: souhlas GDPR neoznačen (formulář ho nesbírá)", contact?.gdpr_consent === false)
const { data: ev } = await admin.from("coop_contact_events").select("kind, body").eq("contact_id", contact?.id ?? "-")
check("historie: záznam založení se zprávou", (ev ?? []).some((e) => e.kind === "created" && e.body?.includes("Zájem o 3 podíly")))

// ── 3. Kapacita ──────────────────────────────────────────────────────────────
// Vychází z toho, co v QA databázi už je (data z jiných testů), ne z prázdné evidence
const created = []
{
  const { data: taken } = await admin.from("coop_contacts").select("share_count").is("archived_at", null).in("status", ["reservation", "owner"])
  const free = 50 - (taken ?? []).reduce((s, x) => s + (x.share_count ?? 0), 0)
  check("volná kapacita pro test ≥ 2", free >= 2, `volných ${free}`)

  const { data: a, error } = await admin.from("coop_contacts").insert({ first_name: "QA Vlastník", status: "owner", share_count: free }).select("id").single()
  check(`vlastník všech ${free} volných podílů projde`, !error, error?.message)
  if (a) created.push(a.id)
  const { data: b, error: e2 } = await admin.from("coop_contacts").insert({ first_name: "QA Přes", status: "reservation", share_count: 1 }).select("id").single()
  check("rezervace nad 50 podílů odmítnuta", !!e2 && e2.message.includes("COOP_CAPACITY"), e2?.message ?? "prošlo")
  if (b) created.push(b.id)
  const { data: c, error: e3 } = await admin.from("coop_contacts").insert({ first_name: "QA Bez", status: "owner" }).select("id").single()
  check("vlastník bez počtu podílů odmítnut", !!e3, e3?.message ?? "prošlo")
  if (c) created.push(c.id)
  // Archivovaný se nepočítá
  if (a) await admin.from("coop_contacts").update({ archived_at: new Date().toISOString() }).eq("id", a.id)
  const { data: d, error: e4 } = await admin.from("coop_contacts").insert({ first_name: "QA Po archivu", status: "owner", share_count: free - 1 }).select("id").single()
  check("archivovaný vlastník kapacitu uvolní", !e4, e4?.message)
  if (d) created.push(d.id)

  const html = await fetch(`${BASE}/podil`).then((x) => x.text()).catch(() => "")
  check("/podil počítá volné z evidence (zbývá 1)", />\s*1\s*</.test(html))
}
if (created.length) await admin.from("coop_contacts").delete().in("id", created)

// ── 4. Admin přístup ─────────────────────────────────────────────────────────
const someId = contact?.id ?? "00000000-0000-4000-8000-000000000000"
for (const path of ["/admin/druzstvo", `/admin/druzstvo/${someId}`, `/admin/druzstvo/soubor/${someId}`]) {
  r = await fetch(`${BASE}${path}`, { redirect: "manual" })
  check(`${path.replace(someId, ":id")} bez přihlášení → login`, [302, 307].includes(r.status) && (r.headers.get("location") ?? "").includes("/admin/login"), `${r.status}`)
}
{
  const forged = Buffer.from(`admin:${Date.now()}:cokoli`).toString("base64")
  r = await fetch(`${BASE}/admin/druzstvo`, { redirect: "manual", headers: { cookie: `admin_session=${forged}` } })
  check("padělaná cookie starého formátu neprojde", [302, 307].includes(r.status), String(r.status))
}
r = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "spatne-heslo" }) })
check("špatné heslo neprojde", r.status === 401 || r.status === 503, String(r.status))

if (env.ADMIN_DASH_PASSWORD) {
  r = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: env.ADMIN_DASH_PASSWORD }) })
  const setCookie = r.headers.get("set-cookie") ?? ""
  const token = /admin_session=([^;]+)/.exec(setCookie)?.[1] ?? ""
  check("přihlášení → cookie ts.hmac", r.status === 200 && /^\d+\.[0-9a-f]{64}$/.test(token), `${r.status} ${token.slice(0, 16)}`)
  r = await fetch(`${BASE}/admin/druzstvo`, { redirect: "manual", headers: { cookie: `admin_session=${token}` } })
  check("s platnou cookie se výpis Družstva otevře", r.status === 200 && (await r.text()).includes("Jana QA"), String(r.status))
  const tampered = token.replace(/.$/, (c) => (c === "0" ? "1" : "0"))
  r = await fetch(`${BASE}/admin/druzstvo`, { redirect: "manual", headers: { cookie: `admin_session=${tampered}` } })
  check("pozměněný podpis cookie neprojde", [302, 307].includes(r.status), String(r.status))
} else {
  console.log("  (přihlášení do adminu přeskočeno — v .env.qa není ADMIN_DASH_PASSWORD)")
}

if (contact?.id) await admin.from("coop_contacts").delete().eq("id", contact.id)
process.exit(summary())
