// vk-analytics 0.3.1 — klientský pixel (bez závislostí, ~5 kB min)
// First-party, bez PII. Dávkuje události, posílá sendBeacon.
//
// Do zařízení se nezapisuje NIC kromě volby „neměřte mě“ — identitu i návštěvu
// určuje server z otisku, který se každý den mění. Uložit odmítnutí je nutné
// k tomu, aby se dodrželo, a na to se povinnost souhlasu nevztahuje.
import type { VkProps, VkEventIn, VkClickIn, VkFirstCtx } from "./types"

const ENDPOINT = "/api/vk/collect"
const IDENTIFY = "/api/vk/identify"
const FLUSH_MS = 15_000
const TICK_MS = 5_000
const IDLE_MS = 30_000
const VISIT_GAP_MS = 30 * 60 * 1000
const MAX_BATCH = 50
const SCROLL_MARKS = [25, 50, 75, 90, 100]

type VisitState = { id: string; last: number; day: string; key: string }

const S = {
  inited: false, disabled: false, visit: null as VisitState | null, first: null as VkFirstCtx | null,
  seq: 0, queue: [] as VkEventIn[], clicks: [] as VkClickIn[], userProps: {} as VkProps,
  path: "", pendingStatus: 0 as number, pageActive: 0, pendingSeconds: 0, lastInteraction: 0, interacted: false,
  marks: new Set<number>(), maxScroll: 0, pvTimes: [] as number[], scrollSamples: [] as { t: number; y: number }[],
  clickTimes: [] as number[], recent: [] as { t: number; x: number; y: number }[], articleWords: 0,
  flushTimer: 0 as ReturnType<typeof setTimeout> | 0, tickTimer: 0 as ReturnType<typeof setInterval> | 0, ytPlayers: new WeakSet<Element>(),
}

// ---------- storage ----------
function ls(): Storage | null { try { return window.localStorage } catch { return null } }
function uid(): string { try { return crypto.randomUUID().replace(/-/g, "") } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36) } }
function today(): string { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }

function optedOut(): boolean {
  const st = ls()
  try {
    const p = new URLSearchParams(location.search)
    if (p.has("noanalytics")) { st?.setItem("vk_optout", "1"); console.info("[vk] Tento prohlížeč je vyřazen z měření. Zpět zapneš přes ?analytics.") }
    else if (p.has("analytics")) { st?.removeItem("vk_optout"); console.info("[vk] Měření je v tomto prohlížeči opět zapnuté.") }
    if ((navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true) return true
    return st?.getItem("vk_optout") === "1"
  } catch { return false }
}

// ---------- návštěva ----------
function utm(): Record<string, string> {
  const out: Record<string, string> = {}
  const p = new URLSearchParams(location.search)
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) { const v = p.get(k); if (v) out[k] = v.slice(0, 150) }
  return out
}
function clickIdKind(): string | null {
  const p = new URLSearchParams(location.search)
  for (const k of ["gclid", "fbclid", "msclkid", "ttclid"]) if (p.has(k)) return k
  return null
}
function externalRef(): string {
  try { const h = new URL(document.referrer).hostname; return h && h !== location.hostname ? h : "" } catch { return "" }
}
function sourceKey(): string {
  const u = utm(); if (u.utm_source || u.utm_medium || u.utm_campaign) return `${u.utm_source || ""}|${u.utm_medium || ""}|${u.utm_campaign || ""}`
  return externalRef()
}
function bucket(w: number): string { return w < 640 ? "xs" : w < 768 ? "sm" : w < 1024 ? "md" : w < 1536 ? "lg" : "xl" }
function ctx(): VkFirstCtx {
  return {
    referrer: document.referrer || "", utm: utm(), click_id_kind: clickIdKind(), had_query: location.search.length > 1,
    viewport_w: innerWidth, viewport_h: innerHeight, screen_w: screen.width, screen_h: screen.height, screen_bucket: bucket(innerWidth),
    dark_mode: !!matchMedia?.("(prefers-color-scheme: dark)").matches, lang: (navigator.language || "").slice(0, 12),
  }
}
function resolveVisit(): void {
  // Stav návštěvy žije jen v paměti stránky. Po přechodu na jinou stránku ji
  // server napojí na předchozí podle mezery v čase, takže se nic neukládá.
  const now = Date.now(); const key = sourceKey(); const day = today()
  const v = S.visit
  const fresh = !v || now - v.last > VISIT_GAP_MS || v.day !== day || (key && key !== v.key)
  if (fresh) { S.visit = { id: "", last: now, day, key }; S.first = ctx(); S.seq = 0 }
  else { v!.last = now; S.first = ctx() } // kontext posílá server jen u nové návštěvy
}
function touchVisit(): void { if (S.visit) S.visit.last = Date.now() }

// ---------- fronta a odeslání ----------
function push(name: string, props?: VkProps): void {
  if (S.disabled) return
  S.queue.push({ name, path: S.path || location.pathname, ts: new Date().toISOString(), seq: S.seq++, props })
  if (S.queue.length >= MAX_BATCH) flush()
}
function botSignals(): string[] {
  const out: string[] = []
  const n = navigator as unknown as { webdriver?: boolean }
  if (n.webdriver) out.push("webdriver")
  if (screen.width === 0 || (screen.width === 800 && screen.height === 600) || innerWidth === 0) out.push("screen")
  if (S.pvTimes.length >= 3 && !S.interacted) out.push("no_interaction")
  const t = Date.now(); if (S.pvTimes.filter((x) => t - x < 10_000).length > 4) out.push("speed")
  if (S.scrollSamples.length >= 8) {
    const sp: number[] = []
    for (let i = 1; i < S.scrollSamples.length; i++) { const a = S.scrollSamples[i - 1], b = S.scrollSamples[i]; const dt = b.t - a.t; if (dt > 0) sp.push(Math.abs(b.y - a.y) / dt) }
    if (sp.length >= 6) { const m = sp.reduce((x, y) => x + y, 0) / sp.length; const sd = Math.sqrt(sp.reduce((x, y) => x + (y - m) ** 2, 0) / sp.length); if (m > 0 && sd / m < 0.05) out.push("linear_scroll") }
  }
  if (S.clickTimes.length >= 4) {
    const iv: number[] = []; for (let i = 1; i < S.clickTimes.length; i++) iv.push(S.clickTimes[i] - S.clickTimes[i - 1])
    if (iv.every((x) => Math.abs(x - iv[0]) < 50)) out.push("regular_intervals")
  }
  return out
}
function flush(): void {
  if (S.disabled || !S.visit) return
  if (S.flushTimer) { clearTimeout(S.flushTimer); S.flushTimer = 0 }
  if (S.pendingSeconds > 0) {
    const sig = botSignals()
    S.queue.push({ name: "engaged_time", path: S.path, ts: new Date().toISOString(), seq: S.seq++, props: sig.length ? { seconds: S.pendingSeconds, bot_signals: sig as unknown as string } : { seconds: S.pendingSeconds } })
    S.pendingSeconds = 0
  }
  if (S.queue.length === 0 && S.clicks.length === 0) return
  const body = JSON.stringify({
    visit: { first: S.first, props: S.userProps },
    events: S.queue.splice(0, MAX_BATCH), clicks: S.clicks.splice(0, MAX_BATCH),
  })
  S.first = null
  let sent = false
  try { if (navigator.sendBeacon) sent = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" })) } catch { sent = false }
  if (!sent) { try { fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {}) } catch {} }
  touchVisit()
  if (S.queue.length || S.clicks.length) S.flushTimer = setTimeout(flush, 500)
}
function schedule(): void { if (!S.flushTimer) S.flushTimer = setTimeout(flush, FLUSH_MS) }

// ---------- aktivita ----------
function onInteract(): void { S.lastInteraction = Date.now(); S.interacted = true }
function tick(): void {
  if (document.visibilityState !== "visible") return
  if (Date.now() - S.lastInteraction > IDLE_MS) return
  S.pendingSeconds += TICK_MS / 1000; S.pageActive += TICK_MS / 1000
  schedule()
}
function onScroll(): void {
  const doc = document.documentElement
  const h = Math.max(doc.scrollHeight, document.body?.scrollHeight || 0)
  if (h <= 0) return
  const pct = Math.min(100, Math.round(((scrollY + innerHeight) / h) * 100))
  S.scrollSamples.push({ t: Date.now(), y: scrollY }); if (S.scrollSamples.length > 40) S.scrollSamples.shift()
  if (pct > S.maxScroll) S.maxScroll = pct
  for (const m of SCROLL_MARKS) if (pct >= m && !S.marks.has(m)) { S.marks.add(m); push("scroll", { pct: m }) }
  onInteract()
}
let scrollRaf = 0
function onScrollRaf(): void { if (scrollRaf) return; scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; onScroll() }) }

// ---------- kliky ----------
function selectorOf(el: Element): string {
  const parts: string[] = []; let cur: Element | null = el; let depth = 0
  while (cur && cur !== document.body && depth < 4) {
    let s = cur.tagName.toLowerCase()
    if (cur.id) { parts.unshift(`${s}#${cur.id}`); break }
    const cls = Array.from(cur.classList).filter((c) => !/^[a-z]{1,3}[-_]?[A-Za-z0-9]{5,}$/.test(c) || !/\d/.test(c)).slice(0, 2)
    if (cls.length) s += "." + cls.join(".")
    const parent: HTMLElement | null = cur.parentElement
    const tag = cur.tagName
    if (parent) { const sib = Array.from(parent.children).filter((c: Element) => c.tagName === tag); if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(cur) + 1})` }
    parts.unshift(s); cur = parent; depth++
  }
  return parts.join(">").slice(0, 200)
}
function onClick(e: MouseEvent): void {
  onInteract()
  const t = e.target as Element | null; if (!t || !(t instanceof Element)) return
  const now = Date.now(); S.clickTimes.push(now); if (S.clickTimes.length > 8) S.clickTimes.shift()
  const docH = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0)
  const base = { ts: new Date().toISOString(), path: S.path, x_pct: Math.round((e.clientX / innerWidth) * 10000) / 100, y_px: Math.round(e.clientY + scrollY), doc_h: docH, viewport_w: innerWidth, screen_bucket: bucket(innerWidth) }

  if (t.closest("[data-vk-hp]")) { e.preventDefault(); S.clicks.push({ ...base, selector: "honeypot", text: "", href: "/vk-hp", kind: "honeypot" }); push("click", { kind: "honeypot" }); flush(); return }

  // rage: 3+ kliky do 1 s v okruhu 30 px
  S.recent = S.recent.filter((r) => now - r.t < 1000); S.recent.push({ t: now, x: e.clientX, y: e.clientY })
  if (S.recent.length >= 3 && S.recent.every((r) => Math.hypot(r.x - e.clientX, r.y - e.clientY) < 30)) {
    S.clicks.push({ ...base, selector: selectorOf(t), text: "", href: "", kind: "rage" }); push("click", { kind: "rage", sel: selectorOf(t) }); S.recent = []
  }

  const el = t.closest("a,button,[role=button],input[type=submit],summary,label") as HTMLElement | null
  if (!el) { if (Math.random() < 0.25) S.clicks.push({ ...base, selector: selectorOf(t), text: "", href: "", kind: "other" }); return }
  const text = (el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 80)
  const sel = selectorOf(el)
  if (el instanceof HTMLAnchorElement && el.href) {
    let kind = "link"; const href = el.getAttribute("href") || ""
    if (/^tel:/i.test(href)) kind = "tel"; else if (/^mailto:/i.test(href)) kind = "mailto"
    else if (el.hasAttribute("download") || /\.(pdf|docx?|xlsx?|pptx?|zip|csv|txt)(\?|$)/i.test(el.pathname)) kind = "download"
    else if (el.host !== location.host) kind = "outbound"
    S.clicks.push({ ...base, selector: sel, text, href: el.href, kind })
    // tel/mailto/download/outbound dostanou vlastní název události, aby šly označit jako konverze
    const named: Record<string, string> = { tel: "click_phone", mailto: "click_email", download: "file_download", outbound: "outbound_click" }
    push(named[kind] ?? "click", { kind, href: kind === "tel" || kind === "mailto" ? kind + ":" : el.href.slice(0, 300), text, sel })
    if (kind !== "link") flush()
    return
  }
  S.clicks.push({ ...base, selector: sel, text, href: "", kind: "button" })
  push("click", { kind: "button", text, sel })
  // dead click: nic se nezměnilo do 500 ms (heuristika, jen pro tlačítka)
  const url0 = location.href; let mutated = false
  const mo = new MutationObserver(() => { mutated = true }); try { mo.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true }) } catch {}
  setTimeout(() => { mo.disconnect(); if (!mutated && location.href === url0 && document.activeElement === el) { S.clicks.push({ ...base, selector: sel, text, href: "", kind: "dead" }); push("click", { kind: "dead", text, sel }) } }, 500)
}

// ---------- video ----------
type YTPlayer = { getCurrentTime(): number; getDuration(): number }
type YTApi = { Player: new (el: Element, opts: { events: { onStateChange: (e: { data: number; target: YTPlayer }) => void } }) => unknown }
function setupVideo(): void {
  document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
    if (v.dataset.vk) return; v.dataset.vk = "1"
    const marks = new Set<number>(); const id = (v.currentSrc || v.src || "video").split("/").pop()?.slice(0, 80) || "video"
    v.addEventListener("play", () => { if (!marks.has(0)) { marks.add(0); push("video", { id, phase: "start" }) } })
    v.addEventListener("timeupdate", () => { if (!v.duration) return; const p = (v.currentTime / v.duration) * 100; for (const m of [25, 50, 75]) if (p >= m && !marks.has(m)) { marks.add(m); push("video", { id, phase: String(m) }) } })
    v.addEventListener("ended", () => { if (!marks.has(100)) { marks.add(100); push("video", { id, phase: "complete" }) } })
  })
  const yts = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]')).filter((f) => /enablejsapi=1/.test(f.src) && !S.ytPlayers.has(f))
  if (!yts.length) return
  const w = window as unknown as { YT?: YTApi; onYouTubeIframeAPIReady?: () => void }
  const attach = () => {
    if (!w.YT?.Player) return
    for (const f of yts) {
      if (S.ytPlayers.has(f)) continue; S.ytPlayers.add(f)
      const id = (f.src.match(/embed\/([^?&/]+)/)?.[1] || "yt").slice(0, 40); const marks = new Set<number>(); let poll = 0 as ReturnType<typeof setInterval> | 0
      new w.YT.Player(f, { events: { onStateChange: (e) => {
        if (e.data === 1) { if (!marks.has(0)) { marks.add(0); push("video", { id, phase: "start", provider: "youtube" }) }
          if (!poll) poll = setInterval(() => { const d = e.target.getDuration(); if (!d) return; const p = (e.target.getCurrentTime() / d) * 100; for (const m of [25, 50, 75]) if (p >= m && !marks.has(m)) { marks.add(m); push("video", { id, phase: String(m), provider: "youtube" }) } }, 5000) }
        if (e.data === 0 && !marks.has(100)) { marks.add(100); push("video", { id, phase: "complete", provider: "youtube" }) }
        if ((e.data === 0 || e.data === 2) && poll) { clearInterval(poll); poll = 0 }
      } } })
    }
  }
  if (w.YT?.Player) attach()
  else {
    const prev = w.onYouTubeIframeAPIReady; w.onYouTubeIframeAPIReady = () => { prev?.(); attach() }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) { const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true; document.head.appendChild(s) }
  }
}

// ---------- článek ----------
function finalizeArticle(): void {
  if (S.articleWords <= 0) return
  const need = 0.5 * (S.articleWords / 230) * 60
  push("article_read", { read: S.maxScroll >= 90 && S.pageActive >= need, pct: S.maxScroll, seconds: Math.round(S.pageActive), words: S.articleWords })
  S.articleWords = 0
}

// ---------- veřejné API ----------
export const vk = {
  init(): void {
    if (S.inited || typeof window === "undefined") return
    S.inited = true
    if (optedOut()) { S.disabled = true; return }
    resolveVisit(); S.lastInteraction = Date.now()
    addEventListener("scroll", onScrollRaf, { passive: true })
    for (const ev of ["pointerdown", "keydown", "touchstart", "mousemove"]) addEventListener(ev, onInteract, { passive: true })
    document.addEventListener("click", onClick, true)
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { finalizeArticle(); flush() } })
    addEventListener("pagehide", () => { finalizeArticle(); flush() })
    S.tickTimer = setInterval(tick, TICK_MS)
  },
  setStatus(status: number): void { S.pendingStatus = status },
  /** 0.3.0: identitu určuje server z požadavku — hlavičky se už posílat nemusí. */
  /** 0.3.0: identitu určuje server z požadavku — klient ji nezná. Ponecháno kvůli starším voláním. */
  ids(): { sid: string; visit: string } { return { sid: "", visit: "" } },
  pageview(path?: string, status?: number): void {
    if (S.disabled) return
    if (!S.inited) vk.init()
    finalizeArticle()
    S.path = path || location.pathname
    S.marks = new Set(); S.maxScroll = 0; S.pageActive = 0; S.scrollSamples = []
    if (S.visit && (Date.now() - S.visit.last > VISIT_GAP_MS || S.visit.day !== today())) resolveVisit()
    const st = status || S.pendingStatus; S.pendingStatus = 0
    push("page_view", st ? { status: st } : undefined)
    S.pvTimes.push(Date.now()); if (S.pvTimes.length > 10) S.pvTimes.shift()
    flush()
    requestAnimationFrame(() => { const a = document.querySelector("article"); S.articleWords = a ? (a.textContent || "").trim().split(/\s+/).length : 0; onScroll(); setTimeout(setupVideo, 1500) })
  },
  track(name: string, props?: VkProps): void { push(name, props); flush() },
  setProps(props: VkProps): void { S.userProps = { ...S.userProps, ...props }; push("set_props", props); schedule() },
  identify(key: string, ref?: string): void {
    if (S.disabled || !key) return
    try { fetch(IDENTIFY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, ref }), keepalive: true }).catch(() => {}) } catch {}
  },
}
