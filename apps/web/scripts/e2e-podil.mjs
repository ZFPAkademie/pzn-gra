/**
 * Družstevní podíl (/podil, /podil/[available]) — redesign 11. 11. 2026.
 *
 * Obě stránky skládá jeden sdílený pohled (podil/view.tsx). Hlídá se, že:
 * 1. regulatorní texty (orientační výnos, zdroj ČSÚ, varování) na stránce zůstaly,
 * 2. číslo apartmánu se nikde neobjeví (DEC-009),
 * 3. /podil/[číslo] bere počet volných podílů z URL a mimo 0–50 vrací 404,
 * 4. formulář, kontakty a cena podílu jsou na stránce, CZ i EN.
 *
 * Potřebuje `npm run dev:qa`. Nic nezapisuje (formulář se neodesílá — to testuje e2e-druzstvo).
 */
import { BASE, check, summary } from "./qa-env.mjs"

const get = async (path, locale = "cs") => {
  const r = await fetch(`${BASE}${path}`, { headers: { Cookie: `NEXT_LOCALE=${locale}` } })
  return { status: r.status, html: (await r.text()).replace(/<!-- -->/g, "").replace(/ /g, " ") }
}

const cs = await get("/podil")
check("/podil 200", cs.status === 200, String(cs.status))
check("nadpis a cena podílu v úvodu", cs.html.includes("Mějte svůj kousek hor") && cs.html.includes("200 000 Kč"))
check("výhody s orientačním výnosem", cs.html.includes("Orientačně 2–5 % ročně"))
check("právní upozornění", cs.html.includes("Družstevní podíl nezakládá přímé vlastnictví nemovitosti"))
check("zdroj ČSÚ a varování", cs.html.includes("014016-26") && cs.html.includes("Minulý vývoj cen není spolehlivým ukazatelem"))
check("postup: 4 kroky", ["Nezávazná konzultace", "Výběr počtu podílů", "Podpis jedné smlouvy", "Správa a výplata výnosů"].every((x) => cs.html.includes(x)))
check("formulář a kotvy", cs.html.includes('id="poptavka"') && cs.html.includes('id="podil-email"') && cs.html.includes('href="#poptavka"'))
check("kontakty", cs.html.includes("r.kucera@zfpakademie.cz") && cs.html.includes("druzstvo@zfpakademie.cz"))
check("členění ploch apartmánu", cs.html.includes("Členění podle půdorysu") && cs.html.includes("Pokoj s kuchyní"))
check("50 čtverců podílů", (cs.html.match(/class="aspect-square (bg-gold|border border-white\/25)"/g) ?? []).length === 50)
// Číslo apartmánu se na /podil nesmí objevit — ani v textu, ani v popiscích fotek
const visible = cs.html.replace(/<script[\s\S]*?<\/script>/g, "")
check("bez čísla apartmánu", !/apartmán(u|em)? (č\. ?)?\d|3\.07|B\dA\d|suite-\d/i.test(visible.replace(/chata\d?[-_][^"' ]*/g, "")))

const some = await get("/podil/45")
check("/podil/45 200", some.status === 200, String(some.status))
check("/podil/45: 45 dostupných, 5 rezervováno", some.html.includes('tabular-nums">45<') && some.html.includes('tabular-nums">5<') && some.html.includes("45 z 50"))
check("/podil/45: 5 zlatých čtverců", (some.html.match(/class="aspect-square bg-gold"/g) ?? []).length === 5)
const soldOut = await get("/podil/0")
check("/podil/0 200, vyprodáno", soldOut.status === 200 && (soldOut.html.match(/class="aspect-square bg-gold"/g) ?? []).length === 50)
for (const bad of ["51", "-1", "abc"]) {
  const r = await get(`/podil/${bad}`)
  check(`/podil/${bad} → 404`, r.status === 404, String(r.status))
}

const en = await get("/podil", "en")
check("EN: nadpis, cena, varování", en.html.includes("Own your piece of the mountains") && en.html.includes("CZK 200,000") && en.html.includes("This is not an investment recommendation"))
check("EN: tlačítko a formulář", en.html.includes("I am interested in a share") && en.html.includes("Send inquiry"))

process.exit(summary())
