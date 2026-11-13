// vk-analytics 0.2.0 — dashboard (server component). Kalendář a heatmapa jsou klientské.
import { vkAdapter } from "@vk/adapter"
import { parseRange, loadAgg, bounds, type Range, type Agg } from "./queries"
import { fmt, pct, secs, CHANNEL_LABEL } from "./format"
import { Kpi, Card, Note, Empty, Bars, Trend, Table } from "./ui"
import { DateRange } from "./DateRange"
import { Heatmap } from "./Heatmap"
import { saveEventDef, deleteEventDef, saveSettings, recomputeDays, addPrompt, togglePrompt, deletePrompt, addCompetitor, deleteCompetitor, runAiNow, saveAiInterval } from "./actions"

const TABS: [string, string][] = [["prehled", "Přehled"], ["zdroje", "Zdroje"], ["stranky", "Stránky"], ["cesty", "Cesty"], ["zarizeni", "Zařízení"], ["lokality", "Lokality"], ["odkazy", "Odkazy & heatmapa"], ["uzivatele", "Uživatelé"], ["boti", "Boti & crawleři"], ["ai", "AI viditelnost"], ["nastaveni", "Nastavení"]]

export async function VkDashboard({ searchParams, title = "Analytika" }: { searchParams: Record<string, string | undefined>; title?: string }) {
  const admin = vkAdapter.getAdminClient()
  const r = parseRange(searchParams)
  const base = vkAdapter.adminBasePath
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(); for (const [k, v] of Object.entries({ ...r.q, ...patch })) if (v) p.set(k, v); return `${base}?${p.toString()}`
  }
  if (!admin) return <div className="vk"><h1>{title}</h1><Empty text="Supabase není nakonfigurovaná." /></div>
  const [agg, prev] = await Promise.all([loadAgg(admin, r.from, r.to), r.cmp ? loadAgg(admin, r.prevFrom, r.prevTo) : Promise.resolve(null)])
  const ctx = { admin, r, agg, prev, link }
  return (
    <div className="vk">
      <div className="vk-head"><h1>{title} <small style={{ fontWeight: 400, opacity: .6, fontSize: 13 }}>{r.label}</small></h1><DateRange from={r.from} to={r.to} /></div>
      <nav className="vk-tabs">{TABS.map(([k, l]) => <a key={k} href={link({ tab: k })} className={r.tab === k ? "on" : ""}>{l}</a>)}</nav>
      {r.tab === "prehled" && <Prehled {...ctx} />}
      {r.tab === "zdroje" && <Zdroje {...ctx} />}
      {r.tab === "stranky" && <Stranky {...ctx} />}
      {r.tab === "cesty" && <Cesty {...ctx} />}
      {r.tab === "zarizeni" && <Zarizeni {...ctx} />}
      {r.tab === "lokality" && <Lokality {...ctx} />}
      {r.tab === "odkazy" && <Odkazy {...ctx} />}
      {r.tab === "uzivatele" && <Uzivatele {...ctx} />}
      {r.tab === "boti" && <Boti {...ctx} />}
      {r.tab === "ai" && <Ai {...ctx} />}
      {r.tab === "nastaveni" && <Nastaveni {...ctx} />}
    </div>
  )
}

type Ctx = { admin: NonNullable<ReturnType<typeof vkAdapter.getAdminClient>>; r: Range; agg: Agg; prev: Agg | null; link: (p: Record<string, string | undefined>) => string }
const conversions = (a: Agg) => a.metricsStarting("conversion:")

function Prehled({ r, agg, prev }: Ctx) {
  const v = agg.get("visits"), pv = prev?.get("visits")
  const eng = agg.get("engaged"), conv = agg.get("converted")
  return <>
    <div className="vk-kpis">
      <Kpi label="Návštěvy" value={v} prev={pv} />
      <Kpi label="Návštěvníci (prohlížeče)" value={agg.get("visitors")} prev={prev?.get("visitors")} />
      <Kpi label="Zobrazení stránek" value={agg.get("pageviews")} prev={prev?.get("pageviews")} />
      <Kpi label="Míra zapojení" value={pct(eng, v)} sub={prev ? `předtím ${pct(prev.get("engaged"), prev.get("visits"))}` : "≥10 s aktivně, ≥2 stránky nebo konverze"} />
      <Kpi label="Konverze" value={conv} prev={prev?.get("converted")} />
      <Kpi label="Konverzní poměr" value={pct(conv, v)} sub={prev ? `předtím ${pct(prev.get("converted"), prev.get("visits"))}` : "konverze / návštěvy"} />
      <Kpi label="Průměrný aktivní čas" value={secs(v ? agg.get("active_seconds") / v : 0)} sub="čas s otevřenou záložkou a interakcí" />
      <Kpi label="Boti (odfiltrováno)" value={agg.get("bots")} sub="nejsou v žádném jiném čísle" />
    </div>
    <div className="vk-grid">
      <Card title="Návštěvy po dnech" hint={r.cmp ? "čárkovaně předchozí období" : undefined}><Trend series={agg.days("visits", r.from, r.to)} prev={prev?.days("visits", r.prevFrom, r.prevTo)} /></Card>
      <Card title="Konverze po dnech"><Trend series={agg.days("converted", r.from, r.to)} prev={prev?.days("converted", r.prevFrom, r.prevTo)} /></Card>
      <Card title="Kanály"><Bars rows={agg.top("visits", "channel")} label={(c) => CHANNEL_LABEL[c] ?? c} extra={(c) => `${fmt(agg.get("converted", "channel", c))} konv.`} /></Card>
      <Card title="Konverze podle typu">{conversions(agg).length ? <Bars rows={conversions(agg).map((m) => ({ value: m.slice(11), n: agg.get(m) }))} /> : <Empty text="Žádná událost není označena jako konverze — Nastavení." />}</Card>
      <Card title="Nejnavštěvovanější stránky"><Bars rows={agg.top("pageviews", "path", 10)} total={agg.get("pageviews")} /></Card>
      <Card title="Vstupní stránky"><Bars rows={agg.top("visits", "entry_path", 10)} total={agg.get("visits")} /></Card>
    </div>
  </>
}

function Zdroje({ agg, prev }: Ctx) {
  const v = agg.get("visits")
  return <>
    <Note>„Zdroj návštěvy" je atribuce každé návštěvy zvlášť (UTM → referrer). Kanál <b>AI asistenti</b> zachytí jen návštěvy s referrerem — desktopové aplikace ChatGPT/Claude chodí jako přímá návštěva, takže je AI provoz podhodnocený.</Note>
    <div className="vk-grid">
      <Card title="Kanály" hint="návštěvy · konverze · konv. poměr"><Bars rows={agg.top("visits", "channel")} total={v} label={(c) => CHANNEL_LABEL[c] ?? c} extra={(c) => `${fmt(agg.get("converted", "channel", c))} konv. (${pct(agg.get("converted", "channel", c), agg.get("visits", "channel", c))})`} /></Card>
      <Card title="Zdroje" hint="utm_source nebo doména"><Bars rows={agg.top("visits", "source", 20)} total={v} extra={(s) => `${fmt(agg.get("converted", "source", s))} konv.`} /></Card>
      {prev && <Card title="Kanály — předchozí období"><Bars rows={prev.top("visits", "channel")} total={prev.get("visits")} label={(c) => CHANNEL_LABEL[c] ?? c} /></Card>}
      <Card title="Zapojení podle kanálu"><Bars rows={agg.top("engaged", "channel")} total={agg.get("engaged")} label={(c) => CHANNEL_LABEL[c] ?? c} extra={(c) => `míra ${pct(agg.get("engaged", "channel", c), agg.get("visits", "channel", c))}`} /></Card>
    </div>
  </>
}

function Stranky({ agg, link }: Ctx) {
  const pages = agg.top("pageviews", "path", 40)
  const scrollMedian = (p: string) => {
    const buckets = [25, 50, 75, 90, 100].map((b) => ({ b, n: agg.get("scroll_bucket", "path", `${p}|${b}`) }))
    const pv = agg.get("pageviews", "path", p); if (!pv) return "–"
    // podíl pageviews, které dosáhly aspoň X % (koše jsou kumulativní: kdo dosáhl 75, dosáhl i 50)
    let med = "<25 %"; for (const { b, n } of buckets) if (n / pv >= 0.5) med = `≥${b} %`
    return med
  }
  return <>
    <Card title="Stránky" hint="zobrazení · unikátní · průměrný aktivní čas · medián scrollu · dočtení článků · 404">
      <Table head={["Stránka", { t: "Zobrazení", n: true }, { t: "Unikátní", n: true }, { t: "Aktivní čas / zobrazení", n: true }, { t: "Scroll (medián)", n: true }, { t: "Dočteno", n: true }]}
        rows={pages.map((p) => { const pv = p.n, un = agg.get("page_visitors", "path", p.value), sec = agg.get("page_seconds", "path", p.value), rd = agg.get("article_read", "path", p.value), ur = agg.get("article_unread", "path", p.value)
          return [<a key="l" href={link({ tab: "odkazy", path: p.value })} className="vk-mono">{p.value}</a>, fmt(pv), fmt(un), secs(pv ? sec / pv : 0), scrollMedian(p.value), rd + ur ? pct(rd, rd + ur) : "–"] })} />
    </Card>
    <div className="vk-grid" style={{ marginTop: 16 }}>
      <Card title="Výstupní stránky"><Bars rows={agg.top("exit", "path", 12)} total={agg.get("visits")} /></Card>
      <Card title="Stránky 404" hint="page_view se status 404">{agg.top("status_404", "path", 12).length ? <Bars rows={agg.top("status_404", "path", 12)} /> : <Empty text="Žádné 404 (nebo VkStatus není v not-found.tsx)." />}</Card>
      <Card title="Vlastní události" hint="mimo konverze"><Bars rows={agg.top("event", "event", 20)} /></Card>
    </div>
  </>
}

async function Cesty({ admin, r, agg, link }: Ctx) {
  const b = bounds(r)
  const entries = agg.top("visits", "entry_path", 12)
  const path = r.path || entries[0]?.value || "/"
  const [{ data: next }, { data: before }] = await Promise.all([
    admin.rpc("vk_paths_next", { p_path: path, p_from: b.from, p_to: b.to, p_limit: 25 }),
    admin.rpc("vk_paths_before_conversion", { p_from: b.from, p_to: b.to, p_limit: 25 }),
  ])
  const Step = ({ s }: { s: string }) => s ? <span className="stp">{s}</span> : null
  return <>
    <Note>Cesty se počítají ze syrových událostí (max 90 dní zpět). „(odchod)" = návštěva na této stránce skončila.</Note>
    <Card title={`Co následuje po ${path}`} hint="vyber vstupní stránku">
      <div className="vk-range" style={{ marginBottom: 10 }}>{entries.map((e) => <a key={e.value} className={`vk-chip${e.value === path ? " on" : ""}`} href={link({ path: e.value })}>{e.value}</a>)}</div>
      {(next as { step1: string; step2: string; step3: string; n: number }[] | null)?.length ? <table className="vk-table"><tbody>{(next as { step1: string; step2: string; step3: string; n: number }[]).map((x, i) => <tr key={i}><td><div className="vk-path"><span className="stp">{path}</span><span className="arr">→</span><Step s={x.step1} />{x.step2 && <><span className="arr">→</span><Step s={x.step2} /></>}{x.step3 && <><span className="arr">→</span><Step s={x.step3} /></>}</div></td><td className="n">{fmt(Number(x.n))}</td></tr>)}</tbody></table> : <Empty />}
    </Card>
    <div style={{ height: 16 }} />
    <Card title="Poslední 3 kroky před konverzí">
      {(before as { conversion: string; step_minus3: string; step_minus2: string; step_minus1: string; n: number }[] | null)?.length ? <table className="vk-table"><tbody>{(before as { conversion: string; step_minus3: string; step_minus2: string; step_minus1: string; n: number }[]).map((x, i) => <tr key={i}><td><div className="vk-path"><Step s={x.step_minus3} />{x.step_minus3 && <span className="arr">→</span>}<Step s={x.step_minus2} />{x.step_minus2 && <span className="arr">→</span>}<Step s={x.step_minus1} /><span className="arr">→</span><span className="vk-tag pos">{x.conversion}</span></div></td><td className="n">{fmt(Number(x.n))}</td></tr>)}</tbody></table> : <Empty text="Žádné konverze v období (nebo nejsou definované v Nastavení)." />}
    </Card>
  </>
}

function Zarizeni({ agg }: Ctx) {
  const v = agg.get("visits")
  const ex = (dim: string) => (x: string) => `konv. ${pct(agg.get("converted", dim, x), agg.get("visits", dim, x))}`
  return <div className="vk-grid">
    <Card title="Typ zařízení"><Bars rows={agg.top("visits", "device")} total={v} label={(d) => ({ mobile: "Mobil", tablet: "Tablet", desktop: "Desktop" }[d] ?? d)} extra={ex("device")} /></Card>
    <Card title="Šířka obrazovky" hint="xs<640 · sm<768 · md<1024 · lg<1536 · xl"><Bars rows={agg.top("visits", "screen_bucket")} total={v} extra={ex("screen_bucket")} /></Card>
    <Card title="Zobrazení stránek podle zařízení"><Bars rows={agg.top("pageviews", "device")} total={agg.get("pageviews")} label={(d) => ({ mobile: "Mobil", tablet: "Tablet", desktop: "Desktop" }[d] ?? d)} /></Card>
    <Card title="Zapojení podle zařízení"><Bars rows={agg.top("engaged", "device")} label={(d) => ({ mobile: "Mobil", tablet: "Tablet", desktop: "Desktop" }[d] ?? d)} extra={(d) => `míra ${pct(agg.get("engaged", "device", d), agg.get("visits", "device", d))}`} /></Card>
  </div>
}

function Lokality({ agg }: Ctx) {
  return <div className="vk-grid">
    <Card title="Země"><Bars rows={agg.top("visits", "country", 20)} total={agg.get("visits")} extra={(c) => `${fmt(agg.get("converted", "country", c))} konv.`} /></Card>
    <Note>Region a město se ukládají na návštěvě (z hlaviček Vercelu, IP se neukládá); do denních souhrnů jde jen země. Detail měst je v záložce Uživatelé u konkrétních identit.</Note>
  </div>
}

async function Odkazy({ admin, r, agg, link }: Ctx) {
  const b = bounds(r)
  const path = r.path || agg.top("pageviews", "path", 1)[0]?.value || "/"
  const bucket = r.bucket || ""
  const [{ data: ctr }, { data: kinds }, { data: pts }] = await Promise.all([
    admin.rpc("vk_link_ctr", { p_from: b.from, p_to: b.to, p_path: path, p_limit: 100 }),
    admin.rpc("vk_click_summary", { p_from: b.from, p_to: b.to }),
    admin.rpc("vk_click_points", { p_path: path, p_from: b.from, p_to: b.to, p_bucket: bucket || null, p_limit: 3000 }),
  ])
  const pv = agg.get("pageviews", "path", path)
  const scroll = [25, 50, 75, 90, 100].map((s) => ({ s, n: agg.get("scroll_bucket", "path", `${path}|${s}`) }))
  const K = (kinds as { path: string; kind: string; n: number }[] | null) ?? []
  const rage = K.filter((k) => k.kind === "rage"), dead = K.filter((k) => k.kind === "dead")
  const slug = path === "/" ? "index" : path.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-")
  const widths: Record<string, number> = { xs: 390, sm: 700, md: 900, lg: 1280, xl: 1600 }
  const w = widths[bucket] ?? 1280
  return <>
    <div className="vk-range" style={{ marginBottom: 10 }}>{agg.top("pageviews", "path", 12).map((e) => <a key={e.value} className={`vk-chip${e.value === path ? " on" : ""}`} href={link({ path: e.value })}>{e.value}</a>)}</div>
    <div className="vk-grid">
      <Card title={`CTR odkazů na ${path}`} hint={`${fmt(pv)} zobrazení`}>
        <Table head={["Odkaz / text", "Typ", { t: "Kliky", n: true }, { t: "CTR", n: true }]} rows={((ctr as { href: string; text: string; kind: string; clicks: number; ctr: number | null }[] | null) ?? []).map((x) => [<span key="t"><b>{x.text || "(bez textu)"}</b><br /><span className="vk-mono" style={{ opacity: .7 }}>{x.href}</span></span>, x.kind, fmt(Number(x.clicks)), x.ctr != null ? `${String(x.ctr).replace(".", ",")} %` : "–"])} />
      </Card>
      <Card title="Scroll heatmapa" hint="kolik zobrazení dosáhlo hloubky">
        {pv ? <div className="vk-scroll">{scroll.map(({ s, n }) => <div key={s} style={{ display: "contents" }}><span>{s} %</span><div className="bar" style={{ width: `${Math.min(100, (n / pv) * 100)}%` }} /><span>{pct(n, pv)}</span></div>)}</div> : <Empty />}
      </Card>
      <Card title="Klikací heatmapa" hint="zeleně kliky · červeně rage/dead">
        <div className="vk-range" style={{ marginBottom: 8 }}>{["", "xs", "sm", "md", "lg", "xl"].map((bk) => <a key={bk || "all"} className={`vk-chip${bk === bucket ? " on" : ""}`} href={link({ bucket: bk || undefined })}>{bk || "vše"}</a>)}</div>
        <Heatmap points={(pts as { x_pct: number; y_px: number; doc_h: number; kind: string }[] | null) ?? []} shot={`/vk-shots/${slug}.${bucket || "lg"}.png`} width={w} />
        <div className="vk-note" style={{ marginBottom: 0 }}>Screenshot se hledá v <code>public/vk-shots/{slug}.{bucket || "lg"}.png</code>; heatmapa se kreslí i bez něj. Vybírej mobil/desktop zvlášť — společná mapa je kaše.</div>
      </Card>
      <Card title="Rage & dead kliky" hint="rozbité UI — heuristika">
        {rage.length + dead.length ? <Table head={["Stránka", "Typ", { t: "Počet", n: true }]} rows={[...rage, ...dead].sort((a, b) => Number(b.n) - Number(a.n)).slice(0, 20).map((k) => [<span key="p" className="vk-mono">{k.path}</span>, k.kind === "rage" ? "vztek (3+ kliky)" : "mrtvý klik", fmt(Number(k.n))])} /> : <Empty text="Žádné rage ani dead kliky. Dobře." />}
      </Card>
    </div>
  </>
}

async function Uzivatele({ admin, r }: Ctx) {
  const b = bounds(r)
  const [{ data: ids }, { data: props }] = await Promise.all([admin.rpc("vk_identity_summary", { p_limit: 50 }), admin.rpc("vk_props_summary", { p_from: b.from, p_to: b.to })])
  const I = (ids as { identity_id: string; identity_key: string; external_ref: string | null; first_seen_at: string; last_seen_at: string; devices: number; visits: number; first_channel: string | null; first_source: string | null; converted: boolean; seconds_to_conversion: number | null }[] | null) ?? []
  const P = (props as { key: string; value: string; visits: number; converted: number }[] | null) ?? []
  return <>
    <Note>Identita vzniká jen deterministicky (formulář, přihlášení, odkaz z e-mailu) — nikdy z otisku prohlížeče. Klíč je HMAC, e-mail se nikde neukládá. „Zařízení" = počet prohlížečů sloučených pod jednu identitu.</Note>
    <Card title="Identifikovaní uživatelé" hint="posledních 50 · první zdroj = odkud přišli poprvé, napříč zařízeními">
      <Table head={["Klíč", "CRM ref", { t: "Zařízení", n: true }, { t: "Návštěv", n: true }, "První zdroj", "Konverze", { t: "Čas do konverze", n: true }, "Naposledy"]}
        rows={I.map((i) => [<span key="k" className="vk-mono">{i.identity_key.slice(0, 10)}…</span>, i.external_ref ?? "–", i.devices, fmt(Number(i.visits)), `${CHANNEL_LABEL[i.first_channel ?? ""] ?? i.first_channel ?? "–"}${i.first_source ? ` / ${i.first_source}` : ""}`, i.converted ? <span key="c" className="vk-tag pos">ano</span> : "ne", i.seconds_to_conversion != null ? secs(Number(i.seconds_to_conversion)) : "–", new Date(i.last_seen_at).toLocaleDateString("cs-CZ")])} />
    </Card>
    <div style={{ height: 16 }} />
    <Card title="Uživatelské vlastnosti jako segmenty" hint="vk.setProps({...}) · návštěvy · konverze">
      <Table head={["Vlastnost", "Hodnota", { t: "Návštěvy", n: true }, { t: "Konverze", n: true }, { t: "Poměr", n: true }]} rows={P.map((p) => [p.key, p.value, fmt(Number(p.visits)), fmt(Number(p.converted)), pct(Number(p.converted), Number(p.visits))])} />
    </Card>
  </>
}

async function Boti({ admin, r, agg }: Ctx) {
  const b = bounds(r)
  const [{ data: hist }, { data: cr }] = await Promise.all([admin.rpc("vk_bot_histogram", { p_from: b.from, p_to: b.to }), admin.rpc("vk_crawler_summary", { p_from: b.from, p_to: b.to })])
  const C = (cr as { bot: string; path: string; n: number; last_at: string }[] | null) ?? []
  const byBot = new Map<string, number>(); for (const c of C) byBot.set(c.bot, (byBot.get(c.bot) ?? 0) + Number(c.n))
  const llms = C.filter((c) => c.path === "/llms.txt"), sitemap = C.filter((c) => /sitemap/.test(c.path))
  const AI = new Set(["gptbot", "oai-searchbot", "chatgpt-user", "claudebot", "claude-web", "perplexitybot", "perplexity-user", "google-extended", "applebot-extended", "ccbot", "bytespider", "meta-externalagent", "amazonbot", "cohere", "mistral", "duckassist"])
  return <>
    <Note>Boti se <b>označují, nemažou</b> — práh skóre je v Nastavení a historie se přepočítá. Crawleři (nespouštějí JS) se logují zvlášť z middleware a v návštěvách nikdy nejsou.</Note>
    <div className="vk-kpis">
      <Kpi label="Návštěvy označené jako bot" value={agg.get("bots")} sub="v období" />
      <Kpi label="Požadavky AI crawlerů" value={Array.from(byBot).filter(([k]) => AI.has(k)).reduce((a, [, n]) => a + n, 0)} sub="GPTBot, ClaudeBot, PerplexityBot…" />
      <Kpi label="Stažení llms.txt" value={llms.reduce((a, c) => a + Number(c.n), 0)} sub="přímý signál zájmu AI" />
      <Kpi label="Stažení sitemap" value={sitemap.reduce((a, c) => a + Number(c.n), 0)} />
    </div>
    <div className="vk-grid">
      <Card title="Důvody označení"><Bars rows={agg.top("bot_reason", "reason")} /></Card>
      <Card title="Rozdělení bot skóre" hint="0–100, všechny návštěvy"><Bars rows={((hist as { score_bucket: number; n: number }[] | null) ?? []).map((h) => ({ value: `${h.score_bucket}–${h.score_bucket + 9}`, n: Number(h.n) }))} /></Card>
      <Card title="Crawleři" hint="požadavky za období"><Bars rows={Array.from(byBot).map(([value, n]) => ({ value, n })).sort((a, b) => b.n - a.n)} extra={(bot) => AI.has(bot) ? "AI" : null} /></Card>
      <Card title="Co AI crawleři čtou" hint="stránky podle požadavků"><Table head={["Bot", "Stránka", { t: "Požadavků", n: true }, "Naposledy"]} rows={C.filter((c) => AI.has(c.bot)).slice(0, 40).map((c) => [c.bot, <span key="p" className="vk-mono">{c.path}</span>, fmt(Number(c.n)), new Date(c.last_at).toLocaleDateString("cs-CZ")])} /></Card>
    </div>
  </>
}

async function Ai({ admin, r }: Ctx) {
  const { data: ivRow } = await admin.from("vk_settings").select("value").eq("key", "ai_interval_days").maybeSingle()
  const interval = Number(ivRow?.value ?? 14)
  const [{ data: sc }, { data: sov }, { data: st }, { data: prompts }, { data: comps }, { data: runs }, { data: statusRow }] = await Promise.all([
    admin.rpc("vk_ai_scores", { p_from: r.from, p_to: r.to }), admin.rpc("vk_ai_sov", { p_from: r.from, p_to: r.to }), admin.rpc("vk_ai_stability", { p_to: r.to }),
    admin.from("vk_ai_prompts").select("id, text, kind, topic, lang, priority, active").order("created_at"),
    admin.from("vk_ai_competitors").select("id, name, domain, aliases").order("name"),
    admin.from("vk_ai_runs").select("id, engine, model, run_at, answer, citations, cost_usd, error, prompt_id").gte("run_date", r.from).lte("run_date", r.to).order("run_at", { ascending: false }).limit(30),
    admin.rpc("vk_ai_status", { p_interval_days: interval }),
  ])
  const status = (statusRow as { aktivnich: number; ceka: number; nikdy: number; posledni_beh: string | null; naklady_30d: number }[] | null)?.[0]
  const S = (sc as { engine: string; kind: string; topic: string; runs: number; mentioned: number; cited: number; pos: number; neg: number; competitor_mentions: number }[] | null) ?? []
  const tot = S.reduce((a, x) => ({ runs: a.runs + Number(x.runs), m: a.m + Number(x.mentioned), c: a.c + Number(x.cited), pos: a.pos + Number(x.pos), neg: a.neg + Number(x.neg), comp: a.comp + Number(x.competitor_mentions) }), { runs: 0, m: 0, c: 0, pos: 0, neg: 0, comp: 0 })
  const byEngine = new Map<string, { runs: number; m: number }>(); for (const x of S) { const e = byEngine.get(x.engine) ?? { runs: 0, m: 0 }; e.runs += Number(x.runs); e.m += Number(x.mentioned); byEngine.set(x.engine, e) }
  const byTopic = new Map<string, { runs: number; m: number }>(); for (const x of S) { const k = x.topic || "(bez tématu)"; const e = byTopic.get(k) ?? { runs: 0, m: 0 }; e.runs += Number(x.runs); e.m += Number(x.mentioned); byTopic.set(k, e) }
  const ST = (st as { prompt_id: string; prompt: string; engine: string; runs: number; mentioned: number }[] | null) ?? []
  const stable = ST.filter((x) => Number(x.runs) >= 5), stableOk = stable.filter((x) => Number(x.mentioned) >= 4)
  const P = (prompts as { id: string; text: string; kind: string; topic: string | null; lang: string; priority: boolean; active: boolean }[] | null) ?? []
  const Cp = (comps as { id: string; name: string; domain: string | null; aliases: string[] }[] | null) ?? []
  const R = (runs as { id: string; engine: string; model: string | null; run_at: string; answer: string | null; citations: string[]; cost_usd: number | null; error: string | null; prompt_id: string }[] | null) ?? []
  const cost = R.reduce((a, x) => a + (Number(x.cost_usd) || 0), 0)
  return <>
    <Note><b>Co tohle měří a co ne.</b> Odpovědi jsou nedeterministické — sleduj trend, ne jednotlivé číslo. Měříme <b>API modelů, ne spotřebitelské produkty</b>: ChatGPT aplikace má jiné vyhledávání a personalizaci než OpenAI API; <b>Google AI Overviews přes API nejdou vůbec</b>. Search Console nerozlišuje kliky z AI Overviews. Část AI provozu chodí bez referreru.</Note>
    <div className="vk-kpis">
      <Kpi label="Brand Visibility Score" value={pct(tot.m, tot.runs)} sub={`${fmt(tot.m)} z ${fmt(tot.runs)} odpovědí zmínilo značku`} />
      <Kpi label="S citací (odkazem)" value={pct(tot.c, tot.runs)} sub="odpověď odkázala na náš web" />
      <Kpi label="Share of voice" value={pct(tot.m, tot.m + tot.comp)} sub="naše zmínky / (naše + konkurence)" />
      <Kpi label="Stabilita" value={stable.length ? pct(stableOk.length, stable.length) : "–"} sub="promptů zmíněných ≥4× z posledních 5 běhů" />
      <Kpi label="Sentiment" value={`${fmt(tot.pos)} + / ${fmt(tot.neg)} −`} sub="pozitivní / negativní zmínky" />
      <Kpi label="Náklady za 30 dní" value={`${Number(status?.naklady_30d ?? cost).toFixed(2)} USD`} sub="Anthropic měřeno, ostatní enginy odhad" />
      <Kpi label="Čeká na změření" value={`${status?.ceka ?? 0} z ${status?.aktivnich ?? 0}`} sub={`interval ${interval} dní · naposledy ${status?.posledni_beh ? new Date(status.posledni_beh).toLocaleDateString("cs-CZ") : "nikdy"}`} />
    </div>
    <div className="vk-grid">
      <Card title="Viditelnost podle enginu"><Bars rows={Array.from(byEngine).map(([value, e]) => ({ value, n: e.m }))} extra={(e) => `z ${fmt(byEngine.get(e)?.runs ?? 0)} běhů = ${pct(byEngine.get(e)?.m ?? 0, byEngine.get(e)?.runs ?? 0)}`} /></Card>
      <Card title="Viditelnost podle tématu"><Bars rows={Array.from(byTopic).map(([value, e]) => ({ value, n: e.m }))} extra={(t) => `${pct(byTopic.get(t)?.m ?? 0, byTopic.get(t)?.runs ?? 0)}`} /></Card>
      <Card title="Share of voice — značky" hint="zmínky · s citací · sentiment"><Table head={["Značka", { t: "Zmínky", n: true }, { t: "Citace", n: true }, { t: "+ / −", n: true }]} rows={((sov as { brand: string; is_own: boolean; mentions: number; cited: number; pos: number; neg: number }[] | null) ?? []).map((x) => [x.is_own ? <b key="b">{x.brand}</b> : x.brand, fmt(Number(x.mentions)), fmt(Number(x.cited)), `${x.pos} / ${x.neg}`])} /></Card>
      <Card title="Stabilita per prompt × engine" hint="posledních 5 běhů"><Table head={["Prompt", "Engine", { t: "Zmíněno", n: true }]} rows={ST.slice(0, 40).map((x) => [x.prompt.slice(0, 80), x.engine, `${x.mentioned} / ${x.runs}`])} /></Card>
    </div>
    <div style={{ height: 16 }} />
    <div className="vk-grid">
      <Card title="Knihovna promptů" hint={`${P.filter((p) => p.active).length} aktivních`}>
        <form action={addPrompt} className="vk-form" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <textarea name="text" placeholder="Otázka, jak ji pokládá zákazník…" required />
          <div className="vk-form"><select name="kind"><option value="unbranded">neznačkový</option><option value="branded">značkový</option><option value="comparison">srovnávací</option></select><input name="topic" placeholder="téma" /><input name="lang" defaultValue="cs" style={{ width: 50 }} /><label><input type="checkbox" name="priority" /> priorita (3×/den)</label><button className="vk-btn">Přidat</button></div>
        </form>
        <Table head={["Prompt", "Typ", "Téma", "", ""]} rows={P.map((p) => [<span key="t" style={{ opacity: p.active ? 1 : .5 }}>{p.text}{p.priority && <span className="vk-tag" style={{ marginLeft: 6 }}>priorita</span>}</span>, p.kind, p.topic ?? "", <form key="a" action={togglePrompt}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={p.active ? "0" : "1"} /><button className="vk-btn ghost">{p.active ? "vypnout" : "zapnout"}</button></form>, <form key="d" action={deletePrompt}><input type="hidden" name="id" value={p.id} /><button className="vk-btn danger">smazat</button></form>])} />
        <form action={runAiNow} className="vk-form">
          <button className="vk-btn">Změřit, co čeká ({status?.ceka ?? 0})</button>
          <button className="vk-btn ghost" name="force" value="1">Změřit vše znovu</button>
          <span style={{ fontSize: 13, opacity: .7 }}>běh stojí peníze a končí po ~50 s — u větší knihovny klikni opakovaně, fronta navazuje</span>
        </form>
        <form action={saveAiInterval} className="vk-form">
          <label>Měřit každý prompt jednou za <input name="ai_interval_days" type="number" defaultValue={String(interval)} style={{ width: 70 }} /> dní</label>
          <button className="vk-btn ghost">Uložit interval</button>
          <span style={{ fontSize: 13, opacity: .7 }}>cron běží denně, ale sáhne jen na prompty starší než interval — čerstvé nic nestojí</span>
        </form>
      </Card>
      <Card title="Konkurenti">
        <form action={addCompetitor} className="vk-form"><input name="name" placeholder="název" required /><input name="domain" placeholder="doména" /><input name="aliases" placeholder="aliasy, čárkou" /><button className="vk-btn">Přidat</button></form>
        <Table head={["Název", "Doména", "Aliasy", ""]} rows={Cp.map((c) => [c.name, c.domain ?? "", (c.aliases ?? []).join(", "), <form key="d" action={deleteCompetitor}><input type="hidden" name="id" value={c.id} /><button className="vk-btn danger">smazat</button></form>])} />
      </Card>
    </div>
    <div style={{ height: 16 }} />
    <Card title="Poslední odpovědi" hint="celý text — kontrola, co modely říkají">
      {R.length ? R.map((x) => <details key={x.id} className="vk-ans"><summary><b>{x.engine}</b> · {x.model ?? ""} · {new Date(x.run_at).toLocaleString("cs-CZ")} · {P.find((p) => p.id === x.prompt_id)?.text.slice(0, 70) ?? ""}{x.error && <span className="vk-tag neg" style={{ marginLeft: 6 }}>chyba</span>}</summary><pre>{x.error ?? x.answer}</pre>{x.citations?.length ? <div style={{ fontSize: 12 }}>{x.citations.map((u) => <div key={u} className="vk-mono">{u}</div>)}</div> : null}</details>) : <Empty text={'Zatím žádné běhy. Přidej prompty a klíče enginů (ADOPCE.md), pak „Spustit běh teď".'} />}
    </Card>
  </>
}

async function Nastaveni({ admin, agg }: Ctx) {
  const [{ data: defs }, { data: st }] = await Promise.all([admin.from("vk_event_defs").select("*").order("name"), admin.from("vk_settings").select("key, value")])
  const S: Record<string, unknown> = {}; for (const x of (st as { key: string; value: unknown }[] | null) ?? []) S[x.key] = x.value
  const brand = (S.brand as { name?: string; aliases?: string[]; domain?: string }) ?? {}
  const D = (defs as { name: string; label: string; is_conversion: boolean; value: number | null; funnel_step: number | null }[] | null) ?? []
  const seen = new Set(D.map((d) => d.name))
  const unregistered = agg.all("event", "event").filter((e) => !seen.has(e.value)).sort((a, b) => b.n - a.n)
  return <>
    <div className="vk-grid">
      <Card title="Události a konverze" hint="změna se promítne do historie při dalším rollupu">
        <Table head={["Událost", "Popis", "Konverze", { t: "Hodnota", n: true }, ""]} rows={D.map((d) => [<span key="n" className="vk-mono">{d.name}</span>, d.label, d.is_conversion ? <span key="c" className="vk-tag pos">ano</span> : "ne", d.value ?? "", <form key="x" action={deleteEventDef}><input type="hidden" name="name" value={d.name} /><button className="vk-btn danger">smazat</button></form>])} />
        <form action={saveEventDef} className="vk-form"><input name="name" placeholder="název_události" required pattern="[a-z][a-z0-9_]{1,40}" /><input name="label" placeholder="popis" /><label><input type="checkbox" name="is_conversion" /> konverze</label><input name="value" placeholder="hodnota" style={{ width: 80 }} /><input name="funnel_step" placeholder="krok" style={{ width: 60 }} /><button className="vk-btn">Uložit</button></form>
        {unregistered.length > 0 && <div className="vk-note">Měřené, ale nepopsané události: {unregistered.map((u) => <span key={u.value} className="vk-tag">{u.value} · {fmt(u.n)}</span>)}</div>}
      </Card>
      <Card title="Boti, retence, značka">
        <form action={saveSettings} className="vk-form" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <label>Práh bot skóre (0–100) <input name="bot_threshold" type="number" defaultValue={String(S.bot_threshold ?? 70)} style={{ width: 80 }} /> <span style={{ fontSize: 12, opacity: .7 }}>uložení přepočítá historii</span></label>
          <label>Denní strop událostí na prohlížeč <input name="daily_sid_cap" type="number" defaultValue={String(S.daily_sid_cap ?? 2000)} style={{ width: 100 }} /></label>
          <label>Retence syrových událostí (dny) <input name="retention_days" type="number" defaultValue={String(S.retention_days ?? 730)} style={{ width: 100 }} /> <span style={{ fontSize: 12, opacity: .7 }}>denní souhrny zůstávají navždy</span></label>
          <label>Značka (AI viditelnost) <input name="brand_name" defaultValue={brand.name || vkAdapter.brand.name} placeholder="název" /></label>
          <label>Aliasy <input name="brand_aliases" defaultValue={(brand.aliases?.length ? brand.aliases : vkAdapter.brand.aliases).join(", ")} placeholder="čárkou" style={{ width: "100%" }} /></label>
          <label>Doména <input name="brand_domain" defaultValue={brand.domain || vkAdapter.brand.domain} /></label>
          <div><button className="vk-btn">Uložit nastavení</button></div>
        </form>
        <form action={recomputeDays} className="vk-form" style={{ marginTop: 14 }}><label>Přepočítat denní souhrny za posledních <input name="days" type="number" defaultValue="30" style={{ width: 60 }} /> dní</label><button className="vk-btn ghost">Přepočítat</button></form>
      </Card>
    </div>
  </>
}
