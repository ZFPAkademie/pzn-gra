// Vibekodex vzor SHIP-04: evidence běhů cronů do tabulky cron_runs (os/sql/cron_runs.sql).
// Zdroj: __vibekodex/os/cron/cron-run.ts — v projektu je KOPIE (src/lib/cron-run.ts), needitovat tam.
//
// Použití v routě (2 řádky místo `export async function GET`):
//   import { withCronRun } from "@/lib/cron-run"
//   async function handler(req: NextRequest) { …stávající tělo… }
//   export const GET = withCronRun("ares-daily", handler)      // job = poslední část cesty routy
//
// Co dělá: změří dobu, zapíše řádek do cron_runs (status, duration_ms, počty z JSON odpovědi, chybu),
// výjimku z handleru nepropadne jako 500 bez stopy — zapíše ji a vrátí 500 s textem.
// Co nedělá: neověřuje tajemství (to zůstává v handleru / assertCron). Odpovědi 401/403 se NEEVIDUJÍ,
// jinak by kdokoli bez klíče plnil tabulku. Zápis jde service_role klíčem přímo (bez závislosti na
// projektovém klientu), selhání zápisu se jen zaloguje — cron kvůli evidenci nikdy nespadne.
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type Handler<R extends Request> = (req: R, ctx?: any) => Promise<Response> | Response

const COUNT_KEYS: Record<string, string[]> = {
  processed: ["processed", "count", "total", "checked", "zpracovano"],
  delivered: ["delivered", "sent", "created", "done", "updated", "odeslano"],
  skipped: ["skipped", "preskoceno"],
  failed: ["failed", "errors", "failures", "chyby"],
}

function pick(body: any, keys: string[]): number {
  if (!body || typeof body !== "object") return 0
  for (const k of keys) {
    const v = body[k] ?? body.result?.[k] ?? body.stats?.[k]
    if (typeof v === "number") return v
    if (Array.isArray(v)) return v.length
  }
  return 0
}

async function record(row: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) { console.error("[cron_runs] chybí SUPABASE_URL / SERVICE_ROLE_KEY — běh neevidován"); return }
  const db = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await db.from("cron_runs").insert(row)
  if (error) console.error("[cron_runs] zápis selhal:", error.message)
  // retence: zhruba každý stý běh smaž záznamy starší 90 dní (bez samostatného cronu)
  if (Math.random() < 0.01) {
    await db.from("cron_runs").delete().lt("started_at", new Date(Date.now() - 90 * 864e5).toISOString())
  }
}

export function withCronRun<R extends Request>(job: string, handler: Handler<R>): Handler<R> {
  return async (req: R, ctx?: any) => {
    const t0 = Date.now()
    let res: Response | undefined
    let error: string | null = null
    try {
      res = await handler(req, ctx)
    } catch (e) {
      error = (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 500)
      console.error(`[cron ${job}] pád:`, e)
    }
    const status = res?.status ?? 500
    if (status === 401 || status === 403) return res!          // bez klíče: nic neevidovat
    let body: any = null
    if (res && (res.headers.get("content-type") || "").includes("json")) {
      try { body = await res.clone().json() } catch { /* bez těla */ }
    }
    if (!error && status >= 400) error = `HTTP ${status}` + (body?.error ? `: ${String(body.error).slice(0, 300)}` : "")
    await record({
      job, started_at: new Date(t0).toISOString(), duration_ms: Date.now() - t0, status,
      processed: pick(body, COUNT_KEYS.processed), delivered: pick(body, COUNT_KEYS.delivered),
      skipped: pick(body, COUNT_KEYS.skipped), failed: pick(body, COUNT_KEYS.failed), error,
    })
    return res ?? NextResponse.json({ error }, { status: 500 })
  }
}
