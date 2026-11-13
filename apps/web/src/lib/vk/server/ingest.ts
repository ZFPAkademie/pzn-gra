// vk-analytics 0.3.0 — serverový ingest: validace, maskování, enrichment, bot skóre, RPC vk_ingest
import type { VkAdapter } from "../adapter.example"
import type { VkBatch, VkEventIn, VkClickIn, VkFirstCtx } from "../types"
import { maskPath } from "./mask"
import { cleanProps, looksLikePii } from "./pii"
import { parseUa, screenBucket } from "./ua"
import { serverBotReasons, scoreReasons } from "./bot"
import { classify } from "./classify"
import { visitorHash } from "./visitor"

const NAME = /^[a-z][a-z0-9_]{1,40}$/
const MAX_EVENTS = 50
const TS_PAST_MS = 5 * 60 * 1000
const TS_FUTURE_MS = 60 * 1000

type H = { get(name: string): string | null }

function allowedHosts(adapter: VkAdapter): string[] {
  const env = (process.env.VK_ALLOWED_HOSTS || "").split(",").map((s) => s.trim()).filter(Boolean)
  const dev = process.env.NODE_ENV !== "production" ? ["localhost", "127.0.0.1"] : []
  return [...adapter.siteHosts, ...env, ...dev].map((h) => h.replace(/^www\./, "").toLowerCase())
}
function originOk(h: H, hosts: string[]): boolean | null {
  const raw = h.get("origin") || h.get("referer")
  if (!raw) return null
  try { const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase(); return hosts.some((x) => host === x || host.endsWith("." + x)) } catch { return false }
}
function clampTs(v: unknown, now: number): string {
  const t = typeof v === "string" ? Date.parse(v) : NaN
  if (!Number.isFinite(t)) return new Date(now).toISOString()
  return new Date(Math.min(now + TS_FUTURE_MS, Math.max(now - TS_PAST_MS, t))).toISOString()
}
function str(v: unknown, max: number): string { return typeof v === "string" ? v.slice(0, max) : "" }
function num(v: unknown): number | null { return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null }
function excluded(path: string, prefixes: string[]): boolean { return prefixes.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : p + "/")) }

export type CollectResult = { ok: boolean; status: number; stored?: number }

export async function handleCollect(body: unknown, headers: H, adapter: VkAdapter): Promise<CollectResult> {
  const b = body as Partial<VkBatch> | null
  if (!b || typeof b !== "object") return { ok: false, status: 400 }
  // Identita se počítá tady, ne v prohlížeči — do zařízení se nezapisuje nic.
  const host = (headers.get("host") || adapter.siteHosts[0] || "").replace(/^www\./, "").toLowerCase()
  const sid = visitorHash(headers, host)
  if (!sid) return { ok: true, status: 200, stored: 0 } // bez soli se neměří
  const visitId: string | null = null // návštěvu slepí databáze podle mezery v čase

  const now = Date.now()
  const reasons = serverBotReasons(headers)
  const ok = originOk(headers, allowedHosts(adapter))
  if (ok === false) return { ok: false, status: 403 }
  if (ok === null && !reasons.includes("no_headers")) reasons.push("no_headers")

  const events: VkEventIn[] = []
  const clientSignals = new Set<string>()
  for (const raw of (Array.isArray(b.events) ? b.events : []).slice(0, MAX_EVENTS)) {
    const e = raw as Partial<VkEventIn>
    const name = str(e.name, 41)
    if (!NAME.test(name)) continue
    const path = maskPath(str(e.path, 400))
    if (excluded(path, adapter.excludePaths)) continue
    const props = cleanProps(e.props)
    if (props && Array.isArray((e.props as Record<string, unknown>)?.bot_signals)) {
      for (const s of (e.props as unknown as { bot_signals: unknown[] }).bot_signals) if (typeof s === "string") clientSignals.add(s)
    }
    if (props) delete props.bot_signals
    events.push({ name, path, ts: clampTs(e.ts, now), seq: num(e.seq) ?? 0, props })
  }
  const clicks: VkClickIn[] = []
  for (const raw of (Array.isArray(b.clicks) ? b.clicks : []).slice(0, MAX_EVENTS)) {
    const c = raw as Partial<VkClickIn>
    const path = maskPath(str(c.path, 400))
    if (excluded(path, adapter.excludePaths)) continue
    const text = str(c.text, 80)
    clicks.push({
      ts: clampTs(c.ts, now), path, x_pct: Math.max(0, Math.min(100, Number(c.x_pct) || 0)), y_px: num(c.y_px) ?? 0,
      doc_h: num(c.doc_h) ?? 0, viewport_w: num(c.viewport_w) ?? 0, screen_bucket: screenBucket(num(c.viewport_w)),
      selector: str(c.selector, 200), text: looksLikePii(text) ? "" : text, href: maskHref(str(c.href, 300)), kind: str(c.kind, 20) || "other",
    })
    if (c.kind === "honeypot") clientSignals.add("honeypot")
  }
  if (events.length === 0 && clicks.length === 0) return { ok: true, status: 200, stored: 0 }

  for (const s of Array.from(clientSignals)) if (["webdriver", "screen", "no_interaction", "speed", "linear_scroll", "regular_intervals", "honeypot"].includes(s)) reasons.push(s)
  const bot_score = scoreReasons(reasons)

  let first: Record<string, unknown> | null = null
  const f = b.visit?.first as Partial<VkFirstCtx> | null | undefined
  if (f && typeof f === "object") {
    const ua = parseUa(headers.get("user-agent") || "", { mobile: headers.get("sec-ch-ua-mobile"), platform: headers.get("sec-ch-ua-platform") })
    const utm: Record<string, string> = {}
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) { const v = (f.utm as Record<string, unknown>)?.[k]; if (typeof v === "string" && v) utm[k] = v.slice(0, 150) }
    const clickIdKind = ["gclid", "fbclid", "msclkid", "ttclid"].includes(String(f.click_id_kind)) ? String(f.click_id_kind) : null
    const attr = classify({ utm, referrer: str(f.referrer, 500), clickIdKind, ownHosts: allowedHosts(adapter) })
    const vw = num(f.viewport_w)
    first = {
      ...attr, click_id_kind: clickIdKind, had_query: !!f.had_query,
      device: ua.device, os: ua.os, browser: ua.browser,
      viewport_w: vw, viewport_h: num(f.viewport_h), screen_bucket: screenBucket(vw),
      dark_mode: typeof f.dark_mode === "boolean" ? f.dark_mode : null, lang: str(f.lang, 12) || null,
      country: headers.get("x-vercel-ip-country") || null,
      region: headers.get("x-vercel-ip-country-region") || null,
      city: safeDecode(headers.get("x-vercel-ip-city")),
    }
  }

  const admin = adapter.getAdminClient()
  if (!admin) return { ok: true, status: 200, stored: 0 }
  const payload = {
    sid, visit: { id: visitId, first, bot_score, bot_reasons: Array.from(new Set(reasons)), props: cleanProps(b.visit?.props) ?? {} },
    events, clicks,
  }
  const { error } = await admin.rpc("vk_ingest", { p: payload })
  if (error) return { ok: false, status: 500 }
  return { ok: true, status: 200, stored: events.length + clicks.length }
}

function maskHref(href: string): string {
  if (!href) return ""
  if (/^(tel|mailto):/i.test(href)) return href.split(":")[0] + ":" // číslo/e-mail = PII
  try { const u = new URL(href, "https://x.invalid"); return (u.host === "x.invalid" ? "" : u.protocol + "//" + u.host) + maskPath(u.pathname) } catch { return maskPath(href) }
}
function safeDecode(v: string | null): string | null { if (!v) return null; try { return decodeURIComponent(v) } catch { return v } }
