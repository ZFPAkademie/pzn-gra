/**
 * E2E admin Majitelé (migrace 026 + provize):
 *  - majitel s více apartmány, apartmán s více majiteli (manželé, každý vlastní přístup)
 *  - spolumajitelé v portálu: sdílený dokument ano, osobní dokument druhého ne
 *  - odebrání majitele v Apartmánech, odškrtnutí v Upravit, audit_log
 *  - úprava provize u stávajícího majitele: inline i formulář Upravit (16. 11. 2026 nešla)
 * Heslo adminu pro QA: .vibekodex/qa.json → env.ADMIN_DASH_PASSWORD
 */
import { env, admin, BASE, launch, check, summary } from "./qa-env.mjs"

const APT1 = "00000000-0000-4000-8000-000000000a01" // qa-apartman
const APT2 = "00000000-0000-4000-8000-000000000a02" // qa-apartman-fdm
const H = { email: "qa-manzel@example.test", name: "QA Manžel" }
const W = { email: "qa-manzelka@example.test", name: "QA Manželka" }
const PW = "Qa-Heslo-" + Math.random().toString(36).slice(2, 10)
const ADMIN_PW = env.ADMIN_DASH_PASSWORD
if (!ADMIN_PW) { console.error("Chybí ADMIN_DASH_PASSWORD v .env.qa (doplň .vibekodex/qa.json → env, pak local_db.sh)"); process.exit(1) }

async function cleanup() {
  const { data: os } = await admin.from("owners").select("id, user_id").in("email", [H.email, W.email])
  for (const o of os ?? []) {
    await admin.from("owner_documents").delete().eq("owner_id", o.id)
    await admin.from("apartment_owners").delete().eq("owner_id", o.id)
    await admin.from("owners").delete().eq("id", o.id)
    if (o.user_id) await admin.auth.admin.deleteUser(o.user_id)
  }
  const { data: us } = await admin.auth.admin.listUsers()
  for (const u of us?.users ?? []) if ([H.email, W.email].includes(u.email)) await admin.auth.admin.deleteUser(u.id)
  await admin.from("apartments").update({ owner_id: null, status: "available" }).in("id", [APT1, APT2])
}
const links = async (ownerId) => ((await admin.from("apartment_owners").select("apartment_id").eq("owner_id", ownerId)).data ?? []).map(r => r.apartment_id).sort()
const ownerId = async (email) => (await admin.from("owners").select("id").eq("email", email).single()).data?.id

await cleanup()
const browser = await launch()
try {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/admin/login`)
  await page.fill("input[type=password]", ADMIN_PW)
  await Promise.all([page.waitForURL(u => !u.pathname.startsWith("/admin/login"), { timeout: 30000 }), page.click("button[type=submit]")])

  async function addOwner(o, aptIds) {
    await page.goto(`${BASE}/admin/majitele`)
    await page.click("text=Přidat majitele")
    await page.fill("input[name=name]", o.name)
    await page.fill("input[name=email]", o.email)
    for (const id of aptIds) await page.check(`input[name=apartment_ids][value="${id}"]`)
    await page.locator("form", { has: page.locator("input[name=email]") }).locator("button[type=submit]").click()
    await page.waitForSelector(`h3:has-text("${o.name}")`, { timeout: 30000 })
  }

  // 1) Manžel se dvěma apartmány, manželka se sdíleným APT1
  await addOwner(H, [APT1, APT2])
  const hId = await ownerId(H.email)
  check("manžel má 2 apartmány", JSON.stringify(await links(hId)) === JSON.stringify([APT1, APT2].sort()), JSON.stringify(await links(hId)))
  await addOwner(W, [APT1])
  const wId = await ownerId(W.email)
  check("manželka má APT1", JSON.stringify(await links(wId)) === JSON.stringify([APT1]))
  const { data: a1 } = await admin.from("apartments").select("owner_id, status").eq("id", APT1).single()
  check("legacy owner_id = první majitel, status sold", a1.owner_id === hId && a1.status === "sold", JSON.stringify(a1))
  const txt = await page.textContent("body")
  check("karta ukazuje spolumajitele", txt.includes("spolu s QA Manželka") && txt.includes("spolu s QA Manžel"))

  // 2) Dokumenty: sdílený (s apartmánem) a osobní (bez)
  await admin.from("owner_documents").insert([
    { owner_id: hId, apartment_id: APT1, category: "purchase_contract", title: "QA sdílená smlouva", file_path: "qa/x.pdf" },
    { owner_id: hId, apartment_id: null, category: "other", title: "QA osobní dokument", file_path: "qa/y.pdf" },
  ])

  // 3) Portál — každý vlastní přihlášení
  for (const o of [H, W]) {
    const { data: u, error } = await admin.auth.admin.createUser({ email: o.email, password: PW, email_confirm: true })
    if (error) throw error
    await admin.from("owners").update({ user_id: u.user.id }).eq("email", o.email)
  }
  async function portal(o) {
    const c = await browser.newContext(); const p = await c.newPage()
    await p.goto(`${BASE}/portal/login`)
    await p.fill("input[type=email]", o.email)
    await p.fill("input[type=password]", PW)
    await Promise.all([p.waitForURL(u => u.pathname === "/portal" || u.pathname === "/portal/", { timeout: 30000 }), p.click("button[type=submit]")])
    const home = await p.textContent("main")
    await p.goto(`${BASE}/portal/dokumenty`)
    const docs = await p.textContent("main")
    await c.close()
    return { home, docs }
  }
  const hp = await portal(H)
  check("manžel v portálu: Moje apartmány (2)", hp.home.includes("Moje apartmány"), hp.home.slice(0, 120))
  check("manžel vidí oba dokumenty", hp.docs.includes("QA sdílená smlouva") && hp.docs.includes("QA osobní dokument"))
  const wp = await portal(W)
  check("manželka v portálu: Můj apartmán", wp.home.includes("Můj apartmán"), wp.home.slice(0, 120))
  check("manželka vidí sdílenou smlouvu", wp.docs.includes("QA sdílená smlouva"))
  check("manželka NEvidí osobní dokument manžela", !wp.docs.includes("QA osobní dokument"))

  // 4) Admin Apartmány: odebrat manžela z APT1 křížkem
  await page.goto(`${BASE}/admin/apartmany`)
  const row = page.locator("tr", { hasText: "qa-apartman" }).filter({ hasNotText: "qa-apartman-fdm" })
  await row.locator(`button[aria-label="Odebrat majitele ${H.name}"]`).click()
  await page.waitForTimeout(2500)
  check("APT1 po odebrání = jen manželka", JSON.stringify(await links(hId)) === JSON.stringify([APT2]) && JSON.stringify(await links(wId)) === JSON.stringify([APT1]))
  const { data: a1b } = await admin.from("apartments").select("owner_id").eq("id", APT1).single()
  check("legacy owner_id přešel na manželku", a1b.owner_id === wId)

  // 5) Admin Majitelé → Upravit manžela, odškrtnout vše
  await page.goto(`${BASE}/admin/majitele`)
  const card = page.locator("div.bg-white", { has: page.locator(`h3:text-is("${H.name}")`) })
  await card.locator("text=Upravit").click()
  await card.locator(`input[name=apartment_ids][value="${APT2}"]`).uncheck()
  await card.locator("form button[type=submit]").click()
  await page.waitForTimeout(2500)
  check("manžel po úpravě bez apartmánů", (await links(hId)).length === 0)
  const { data: a2 } = await admin.from("apartments").select("owner_id, status").eq("id", APT2).single()
  check("APT2 bez majitele, status beze změny (sold)", a2.owner_id === null && a2.status === "sold", JSON.stringify(a2))
  const { count } = await admin.from("audit_log").select("*", { count: "exact", head: true }).eq("table_name", "apartment_owners")
  check("audit_log zapsán", (count ?? 0) >= 4, String(count))

  // 6) Provize u stávajícího majitele — inline editor
  const rate = async (id) => Number((await admin.from("owners").select("commission_rate").eq("id", id).single()).data?.commission_rate)
  await page.goto(`${BASE}/admin/majitele`)
  const wCard = page.locator("div.bg-white", { has: page.locator(`h3:text-is("${W.name}")`) })
  await wCard.locator('button[title="Upravit provizi"]').click()
  await wCard.locator("input[name=commission]").fill("25")
  await wCard.locator("input[name=commission]").press("Enter")
  await page.waitForTimeout(2500)
  check("inline provize 25 % uložena", Math.abs(await rate(wId) - 0.25) < 1e-9, String(await rate(wId)))
  await page.goto(`${BASE}/admin/majitele`)
  check("inline provize zobrazena 25 %", (await wCard.locator('button[title="Upravit provizi"]').textContent()).includes("25 %"))

  // 7) Provize — formulář Upravit (předvyplněná, změna na 30)
  await wCard.locator("text=Upravit").first().click()
  const field = wCard.locator("input[name=commission_rate]")
  check("Upravit má předvyplněnou provizi", (await field.inputValue()) === "25", await field.inputValue())
  await field.fill("30")
  await wCard.locator("form button[type=submit]").click()
  await page.waitForTimeout(2500)
  check("provize z Upravit 30 % uložena", Math.abs(await rate(wId) - 0.3) < 1e-9, String(await rate(wId)))
  check("Upravit nezměnil apartmány", JSON.stringify(await links(wId)) === JSON.stringify([APT1]))
} finally {
  await browser.close()
  await cleanup()
}
summary()
