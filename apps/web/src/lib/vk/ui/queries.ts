// vk-analytics 0.2.0 — dashboard datová vrstva (server-only)
import type { SupabaseClient } from "@supabase/supabase-js"

export type Row = { metric: string; dim: string; dim_value: string; n: number }
export type SeriesRow = { day: string; metric: string; n: number }
export type Range = {
  from: string; to: string; prevFrom: string; prevTo: string; days: number; cmp: boolean; label: string
  tab: string; path: string; bucket: string; q: Record<string, string | undefined>
}

export function pragueToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}
function addDays(d: string, n: number): string { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10) }
const ISO = /^\d{4}-\d{2}-\d{2}$/

export function parseRange(sp: Record<string, string | undefined>): Range {
  const today = pragueToday()
  let from: string, to: string, days: number, label: string
  if (sp.from && sp.to && ISO.test(sp.from) && ISO.test(sp.to) && sp.from <= sp.to) {
    from = sp.from; to = sp.to; days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1; label = `${from} – ${to}`
  } else {
    days = Math.max(1, Math.min(3650, Number(sp.days) || 30))
    if (sp.days === "all") { from = "2020-01-01"; to = today; days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1; label = "vše" }
    else { to = today; from = addDays(today, -(days - 1)); label = `posledních ${days} dní` }
  }
  return {
    from, to, days, prevTo: addDays(from, -1), prevFrom: addDays(from, -days), cmp: sp.cmp === "1", label,
    tab: sp.tab || "prehled", path: sp.path || "", bucket: sp.bucket || "", q: sp,
  }
}

export class Agg {
  private m = new Map<string, number>()
  private lists = new Map<string, { value: string; n: number }[]>()
  series = new Map<string, Map<string, number>>() // metric → day → n
  constructor(totals: Row[], series: SeriesRow[]) {
    for (const r of totals) {
      this.m.set(`${r.metric}|${r.dim}|${r.dim_value}`, Number(r.n))
      const k = `${r.metric}|${r.dim}`; if (!this.lists.has(k)) this.lists.set(k, []); this.lists.get(k)!.push({ value: r.dim_value, n: Number(r.n) })
    }
    for (const s of series) { if (!this.series.has(s.metric)) this.series.set(s.metric, new Map()); this.series.get(s.metric)!.set(s.day, Number(s.n)) }
  }
  get(metric: string, dim = "total", value = "total"): number { return this.m.get(`${metric}|${dim}|${value}`) ?? 0 }
  top(metric: string, dim: string, limit = 12): { value: string; n: number }[] { return (this.lists.get(`${metric}|${dim}`) ?? []).slice().sort((a, b) => b.n - a.n).slice(0, limit) }
  all(metric: string, dim: string): { value: string; n: number }[] { return this.lists.get(`${metric}|${dim}`) ?? [] }
  metricsStarting(prefix: string): string[] { const s = new Set<string>(); for (const k of Array.from(this.m.keys())) { const mtr = k.split("|")[0]; if (mtr.startsWith(prefix)) s.add(mtr) } return Array.from(s) }
  days(metric: string, from: string, to: string): { day: string; n: number }[] {
    const out: { day: string; n: number }[] = []; const mm = this.series.get(metric)
    for (let d = from; d <= to; d = addDays(d, 1)) out.push({ day: d, n: mm?.get(d) ?? 0 })
    return out
  }
}

export async function loadAgg(admin: SupabaseClient, from: string, to: string): Promise<Agg> {
  const { data, error } = await admin.rpc("vk_summary", { p_from: from, p_to: to })
  if (error || !data) return new Agg([], [])
  const j = data as { totals?: Row[]; series?: SeriesRow[] }
  return new Agg(j.totals ?? [], j.series ?? [])
}

export function bounds(r: Range): { from: string; to: string } {
  // timestamptz hranice pro RPC nad syrovými daty (Europe/Prague)
  const tz = (d: string, end: boolean) => { const x = new Date(`${d}T${end ? "23:59:59.999" : "00:00:00"}+02:00`); return x.toISOString() }
  return { from: tz(r.from, false), to: tz(r.to, true) }
}
