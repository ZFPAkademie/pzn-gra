// vk-analytics 0.3.0 — serverová událost (konverze, kterou zapisuje API routa, ne prohlížeč)
// Identitu si routa spočítá sama z požadavku — klient už žádné hlavičky posílat nemusí.
import type { SupabaseClient } from "@supabase/supabase-js"
import { identityKey } from "./identity"
import { maskPath } from "./mask"
import { visitorHash } from "./visitor"

type H = { get(name: string): string | null }

export async function vkServerTrack(admin: SupabaseClient | null, headers: H, name: string, props?: Record<string, string | number | boolean | null>, opts?: { path?: string; identify?: string; ref?: string }): Promise<boolean> {
  if (!admin) return false
  const host = (headers.get("host") || "").replace(/^www\./, "").toLowerCase()
  const sid = visitorHash(headers, host)
  if (!sid) return false
  const { error } = await admin.rpc("vk_ingest", { p: {
    sid, visit: { id: null, first: null, bot_score: 0, bot_reasons: [], props: {} },
    events: [{ name, path: maskPath(opts?.path || headers.get("referer")?.replace(/^https?:\/\/[^/]+/, "") || "/"), ts: new Date().toISOString(), seq: 9000, props: props ?? null }],
    clicks: [],
  } })
  if (opts?.identify) { const k = identityKey(opts.identify); if (k) await admin.rpc("vk_identify", { p_key: k, p_sid: sid, p_ref: opts.ref ?? null }) }
  return !error
}
