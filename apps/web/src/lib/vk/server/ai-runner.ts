// vk-analytics 0.3.1 — AI viditelnost: běhy promptů přes oficiální API, vyhodnocení zmínek
// Anthropic přes @anthropic-ai/sdk (web search + structured outputs); ostatní enginy přes jejich REST.
// Měříme API, ne spotřebitelské produkty — AI Overviews přes API nejdou vůbec.
import Anthropic from "@anthropic-ai/sdk"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { VkAdapter } from "../adapter.example"

export type Engine = "openai" | "anthropic" | "perplexity" | "gemini"
type RunOut = { answer: string; citations: string[]; model: string; cost_usd: number | null }
type Brand = { name: string; aliases: string[]; domain: string; is_own: boolean }
type Mention = { brand: string; is_own: boolean; mentioned: boolean; mention_kind: "cited" | "paraphrased" | "passing" | "none"; position: number | null; cited_url: string | null; sentiment: "pos" | "neu" | "neg" | null }

// Ceny $/token. Pozor: výsledky web searche se účtují jako VSTUPNÍ tokeny, takže
// jeden dotaz udělá desítky tisíc vstupních tokenů — na Opusu vychází ~$0.30 za dotaz.
// Pro měření viditelnosti stačí Sonnet (a lépe odpovídá tomu, co lidé reálně používají).
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-opus-5": { in: 5 / 1e6, out: 25 / 1e6 },
  "claude-sonnet-5": { in: 2 / 1e6, out: 10 / 1e6 },
  "claude-haiku-4-5": { in: 1 / 1e6, out: 5 / 1e6 },
}
const WEB_SEARCH = 10 / 1000
const priceOf = (model: string) => PRICES[model] ?? PRICES["claude-sonnet-5"]
// Hrubý odhad za běh s web searchem: u enginů bez rozpadu útraty jediná cena vůbec,
// u Anthropicu cena pokusu, na jehož odpověď jsme se nedočkali (viz claim níže).
// Slouží jen jako brzda rozpočtu; přesnou fakturaci nahradit nemá.
const COST_ESTIMATE: Record<string, number> = { anthropic: 0.3, openai: 0.05, perplexity: 0.012, gemini: 0.006 }
// Jeden dotaz s web searchem běžně trvá 15-40 s, výjimečně déle. Tvrdý strop na volání
// i na celý běh funkce (platforma ji utne bez varování) — rozpočet běhu sedí na
// maxDuration 300 s cron routy s rezervou na zápis. Pro baseline se obojí zvedne
// přes env a runner se pustí proti lokálně běžícímu serveru (viz ADOPCE.md § 12).
const CALL_TIMEOUT_MS = Number(process.env.VK_AI_CALL_TIMEOUT_MS || 90_000)
const FN_BUDGET_MS = Number(process.env.VK_AI_FN_BUDGET_MS || 270_000)
// Volání s web searchem se platí, i když klient na odpověď přestane čekat. SDK by
// po timeoutu zkoušelo znovu (výchozí 2×) — ve funkci s pevným limitem to jen
// násobí útratu a k odpovědi se stejně nedojde. Opakování obstará fronta další den.
const NO_RETRY = { maxRetries: 0 }
const isTimeout = (e: unknown) =>
  e instanceof Anthropic.APIConnectionTimeoutError || ["TimeoutError", "AbortError"].includes((e as Error)?.name)
const sig = () => AbortSignal.timeout(CALL_TIMEOUT_MS)

function enabledEngines(): Engine[] {
  const out: Engine[] = []
  if (process.env.OPENAI_API_KEY) out.push("openai")
  if (process.env.ANTHROPIC_API_KEY) out.push("anthropic")
  if (process.env.PERPLEXITY_API_KEY) out.push("perplexity")
  if (process.env.GEMINI_API_KEY) out.push("gemini")
  const only = (process.env.VK_AI_ENGINES || "").split(",").map((s) => s.trim()).filter(Boolean) as Engine[]
  return only.length ? out.filter((e) => only.includes(e)) : out
}

async function runOpenAI(prompt: string): Promise<RunOut> {
  const model = process.env.VK_AI_OPENAI_MODEL || "gpt-5"
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", signal: sig(), headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, tools: [{ type: "web_search" }], input: prompt }),
  })
  if (!r.ok) throw new Error(`openai ${r.status}: ${(await r.text()).slice(0, 300)}`)
  const j = await r.json() as { output?: { type: string; content?: { type: string; text?: string; annotations?: { type: string; url?: string }[] }[] }[] }
  let answer = ""; const cites = new Set<string>()
  for (const it of j.output || []) if (it.type === "message") for (const c of it.content || []) {
    if (c.type === "output_text") { answer += (c.text || "") + "\n"; for (const a of c.annotations || []) if (a.type === "url_citation" && a.url) cites.add(a.url) }
  }
  return { answer: answer.trim(), citations: Array.from(cites), model, cost_usd: null }
}

async function runAnthropic(prompt: string): Promise<RunOut> {
  const client = new Anthropic({ timeout: CALL_TIMEOUT_MS, ...NO_RETRY })
  const model = process.env.VK_AI_ANTHROPIC_MODEL || "claude-sonnet-5"
  const res = await client.messages.create({
    model, max_tokens: 4096,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: Number(process.env.VK_AI_MAX_SEARCHES || 4) }],
    messages: [{ role: "user", content: prompt }],
  })
  let answer = ""; const cites = new Set<string>()
  for (const b of res.content) {
    if (b.type === "text") {
      answer += b.text + "\n"
      for (const c of b.citations || []) if (c.type === "web_search_result_location" && c.url) cites.add(c.url)
    } else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const w of b.content) if (w.type === "web_search_result" && w.url) cites.add(w.url)
    }
  }
  const u = res.usage
  const searches = u.server_tool_use?.web_search_requests ?? 0
  const pr = priceOf(res.model)
  const cost = u.input_tokens * pr.in + u.output_tokens * pr.out + searches * WEB_SEARCH
  return { answer: answer.trim(), citations: Array.from(cites), model: res.model, cost_usd: Math.round(cost * 10000) / 10000 }
}

async function runPerplexity(prompt: string): Promise<RunOut> {
  const model = process.env.VK_AI_PERPLEXITY_MODEL || "sonar"
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST", signal: sig(), headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
  })
  if (!r.ok) throw new Error(`perplexity ${r.status}: ${(await r.text()).slice(0, 300)}`)
  const j = await r.json() as { choices?: { message?: { content?: string } }[]; citations?: string[]; search_results?: { url?: string }[] }
  const cites = new Set<string>([...(j.citations || []), ...(j.search_results || []).map((s) => s.url || "").filter(Boolean)])
  return { answer: (j.choices?.[0]?.message?.content || "").trim(), citations: Array.from(cites), model, cost_usd: null }
}

async function runGemini(prompt: string): Promise<RunOut> {
  const model = process.env.VK_AI_GEMINI_MODEL || "gemini-2.5-flash"
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST", signal: sig(), headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }),
  })
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 300)}`)
  const j = await r.json() as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { groundingChunks?: { web?: { uri?: string } }[] } }[] }
  const c = j.candidates?.[0]
  const answer = (c?.content?.parts || []).map((p) => p.text || "").join("\n").trim()
  const cites = new Set<string>((c?.groundingMetadata?.groundingChunks || []).map((g) => g.web?.uri || "").filter(Boolean))
  return { answer, citations: Array.from(cites), model, cost_usd: null }
}

const RUNNERS: Record<Engine, (p: string) => Promise<RunOut>> = { openai: runOpenAI, anthropic: runAnthropic, perplexity: runPerplexity, gemini: runGemini }

// ---------- vyhodnocení ----------
function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }
function firstIndex(text: string, aliases: string[]): number {
  let best = -1
  for (const a of aliases) { if (!a) continue; const m = new RegExp(`(^|[^\\p{L}\\p{N}])${esc(a)}(?=$|[^\\p{L}\\p{N}])`, "iu").exec(text); if (m && (best < 0 || m.index < best)) best = m.index }
  return best
}
export function evaluateDeterministic(answer: string, citations: string[], brands: Brand[]): Mention[] {
  const found = brands.map((b) => {
    const idx = firstIndex(answer, [b.name, ...b.aliases])
    const cited = b.domain ? citations.find((u) => { try { const h = new URL(u).hostname.replace(/^www\./, ""); const d = b.domain.replace(/^www\./, "").toLowerCase(); return h === d || h.endsWith("." + d) } catch { return false } }) ?? null : null
    return { b, idx, cited }
  })
  const order = found.filter((f) => f.idx >= 0).sort((a, b) => a.idx - b.idx).map((f) => f.b.name)
  return found.map(({ b, idx, cited }) => ({
    brand: b.name, is_own: b.is_own, mentioned: idx >= 0 || !!cited,
    mention_kind: cited ? "cited" : idx >= 0 ? "paraphrased" : "none",
    position: idx >= 0 ? order.indexOf(b.name) + 1 : null, cited_url: cited, sentiment: idx >= 0 || cited ? "neu" : null,
  }))
}

async function refineWithClaude(answer: string, mentions: Mention[]): Promise<Mention[]> {
  const targets = mentions.filter((m) => m.mentioned)
  if (!targets.length || !process.env.ANTHROPIC_API_KEY) return mentions
  const client = new Anthropic({ timeout: 30_000, ...NO_RETRY })
  const model = process.env.VK_AI_CLASSIFIER_MODEL || "claude-haiku-4-5"
  // `effort` umí jen novější rodiny (Opus 4.5+, Sonnet 5, …); Haiku 4.5 na něj vrací 400.
  const effort = /haiku|sonnet-4|opus-4-[0-4]/.test(model) ? {} : { effort: "low" as const }
  const res = await client.messages.parse({
    model,
    max_tokens: 2048,
    output_config: { ...effort, format: { type: "json_schema", schema: {
      type: "object", additionalProperties: false, required: ["items"],
      properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["brand", "kind", "sentiment"],
        properties: { brand: { type: "string" }, kind: { type: "string", enum: ["cited", "paraphrased", "passing"] }, sentiment: { type: "string", enum: ["pos", "neu", "neg"] } } } } },
    } } },
    messages: [{ role: "user", content: `Posuď, jak jsou v odpovědi AI asistenta zmíněny tyto značky: ${targets.map((t) => t.brand).join(", ")}.
Pro každou značku urči:
- kind: "cited" = odpověď na značku výslovně odkazuje jako na zdroj nebo doporučení s odkazem; "paraphrased" = značka je věcně popsána nebo doporučena; "passing" = jen letmá zmínka bez obsahu.
- sentiment: "pos" = doporučující/pozitivní, "neu" = neutrální, "neg" = varující/negativní.

ODPOVĚĎ:
${answer.slice(0, 12000)}` }],
  })
  const items = (res.parsed_output as { items?: { brand: string; kind: Mention["mention_kind"]; sentiment: Mention["sentiment"] }[] } | null)?.items || []
  return mentions.map((m) => {
    const it = items.find((x) => x.brand.toLowerCase() === m.brand.toLowerCase())
    if (!it || !m.mentioned) return m
    return { ...m, mention_kind: m.mention_kind === "cited" ? "cited" : it.kind, sentiment: it.sentiment }
  })
}

// ---------- orchestrace ----------
export type AiRunSummary = { attempted: number; done: number; skipped: number; cost: number; errors: string[]; engines: Engine[] }

async function loadBrands(admin: SupabaseClient, adapter: VkAdapter): Promise<Brand[]> {
  const { data: s } = await admin.from("vk_settings").select("value").eq("key", "brand").maybeSingle()
  const cfg = (s?.value as { name?: string; aliases?: string[]; domain?: string } | null) || {}
  const own: Brand = { name: cfg.name || adapter.brand.name, aliases: cfg.aliases?.length ? cfg.aliases : adapter.brand.aliases, domain: cfg.domain || adapter.brand.domain, is_own: true }
  const { data: comps } = await admin.from("vk_ai_competitors").select("name, domain, aliases")
  return [own, ...(comps || []).map((c) => ({ name: c.name as string, aliases: (c.aliases as string[]) || [], domain: (c.domain as string) || "", is_own: false }))].filter((b) => b.name)
}

export async function runAiVisibility(adapter: VkAdapter, opts: { promptId?: string; limit?: number; date?: string; force?: boolean } = {}): Promise<AiRunSummary> {
  const admin = adapter.getAdminClient()
  const engines = enabledEngines()
  const out: AiRunSummary = { attempted: 0, done: 0, skipped: 0, cost: 0, errors: [], engines }
  if (!admin || !engines.length) { out.errors.push(!admin ? "no supabase" : "no engine keys"); return out }
  const limit = opts.limit ?? Number(process.env.VK_AI_BATCH || 20)
  const maxRuns = Number(process.env.VK_AI_DAILY_MAX_RUNS || 300)
  const budget = Number(process.env.VK_AI_DAILY_BUDGET_USD || 5)
  const runDate = opts.date || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())

  const { data: todayRuns } = await admin.from("vk_ai_runs").select("cost_usd").eq("run_date", runDate)
  const spent = (todayRuns || []).reduce((a, r) => a + (Number(r.cost_usd) || 0), 0)
  if ((todayRuns || []).length >= maxRuns || spent >= budget) { out.errors.push(`denní limit dosažen (${(todayRuns || []).length} běhů, ${spent.toFixed(2)} USD)`); return out }

  // Fronta řazená podle toho, co neběželo nejdéle — jinak by při počtu promptů
  // vyšším než denní limit zůstal konec seznamu navždy nezměřený.
  // Interval měření je datový, ne cronový: cron může běžet denně, ale sáhne jen na
  // prompty starší než interval. Zátěž i cena se rozloží a čerstvé prompty nic nestojí.
  const { data: iv } = await admin.from("vk_settings").select("value").eq("key", "ai_interval_days").maybeSingle()
  const intervalDays = opts.force ? 0 : Number(iv?.value ?? process.env.VK_AI_INTERVAL_DAYS ?? 14)
  let prompts: { id: string; text: string; priority: boolean }[] | null
  if (opts.promptId) {
    const { data } = await admin.from("vk_ai_prompts").select("id, text, priority").eq("id", opts.promptId)
    prompts = data as typeof prompts
  } else {
    const { data } = await admin.rpc("vk_ai_queue", { p_limit: 200, p_min_age_days: intervalDays })
    prompts = data as typeof prompts
  }
  if (!prompts?.length) { out.errors.push(intervalDays > 0 ? `nic k měření — vše mladší než ${intervalDays} dní` : "žádné aktivní prompty"); return out }
  const brands = await loadBrands(admin, adapter)
  const { data: existing } = await admin.from("vk_ai_runs").select("prompt_id, engine, slot").eq("run_date", runDate)
  const have = new Set((existing || []).map((r) => `${r.prompt_id}|${r.engine}|${r.slot}`))

  const started = Date.now()
  for (const p of prompts || []) {
    // Zbývá čas aspoň na jedno kolo? Funkci utne platforma bez varování, takže radši
    // skončíme dřív — fronta si při dalším volání vyzvedne, kde jsme přestali.
    if (out.done >= limit || spent + out.cost >= budget || Date.now() - started > FN_BUDGET_MS - CALL_TIMEOUT_MS) return out

    const slots = p.priority ? [0, 1, 2] : [0]
    const jobs: { engine: Engine; slot: number }[] = []
    for (const engine of engines) for (const slot of slots) {
      if (have.has(`${p.id}|${engine}|${slot}`)) out.skipped++
      else jobs.push({ engine, slot })
    }
    if (!jobs.length) continue

    // Slot se zabere dřív, než se zavolá engine. Když platforma funkci utne uprostřed
    // volání, zůstane po zaplaceném pokusu řádek s odhadem ceny — bez něj se fronta
    // neposune, zítra se volá znovu totéž a denní brzda, která sčítá vk_ai_runs,
    // útratu nevidí. UNIQUE na slotu zároveň brání souběhu dvou spuštění.
    const claimed: { engine: Engine; id: string }[] = []
    for (const { engine, slot } of jobs) {
      const { data: row, error } = await admin.from("vk_ai_runs")
        .insert({ prompt_id: p.id, engine, run_date: runDate, slot, error: "nedokončeno — funkce skončila dřív, než přišla odpověď", cost_usd: COST_ESTIMATE[engine] ?? null })
        .select("id").single()
      if (row) claimed.push({ engine, id: row.id as string })
      else if (error?.code === "23505") out.skipped++
      else out.errors.push(`${engine}: ${error?.message}`)
    }
    if (!claimed.length) continue
    out.attempted += claimed.length

    // Enginy jednoho promptu běží současně — sekvenčně by se do limitu funkce vešel sotva jeden.
    const results = await Promise.all(claimed.map(async (c) => {
      try { return { ...c, r: await RUNNERS[c.engine](p.text as string), err: null as string | null, timeout: false } }
      catch (e) { return { ...c, r: null, err: (e as Error).message.slice(0, 400), timeout: isTimeout(e) } }
    }))

    for (const { engine, id, r, err, timeout } of results) {
      if (!r) {
        // Pokus, na který jsme se nedočkali, se zaplatil — odhad zůstává. Okamžitá chyba API ne.
        const cost = timeout ? COST_ESTIMATE[engine] ?? null : 0
        await admin.from("vk_ai_runs").update({ error: err, cost_usd: cost }).eq("id", id)
        out.cost += cost ?? 0
        out.errors.push(`${engine}: ${err?.slice(0, 120)}`)
        continue
      }
      const cost = r.cost_usd ?? COST_ESTIMATE[engine] ?? null
      const { error } = await admin.from("vk_ai_runs")
        .update({ model: r.model, answer: r.answer, citations: r.citations, cost_usd: cost, error: null, run_at: new Date().toISOString() })
        .eq("id", id)
      if (error) { out.errors.push(`${engine}: ${error.message}`); continue }
      out.cost += cost ?? 0
      let mentions = evaluateDeterministic(r.answer, r.citations, brands)
      try { mentions = await refineWithClaude(r.answer, mentions) } catch (e) { out.errors.push(`classify: ${(e as Error).message.slice(0, 120)}`) }
      if (mentions.length) await admin.from("vk_ai_mentions").insert(mentions.map((m) => ({ run_id: id, ...m })))
      out.done++
    }
  }
  return out
}
