// vk-analytics 0.2.0 — noční rollup (Vercel cron). Přepočte včerejšek + předvčerejšek (pozdní události) a promaže retenci.
import { NextRequest, NextResponse } from "next/server"
import { vkAdapter } from "@vk/adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function pragueDate(offsetDays: number): string {
  const d = new Date(Date.now() - offsetDays * 86_400_000)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 })
  const admin = vkAdapter.getAdminClient()
  if (!admin) return NextResponse.json({ ok: false, reason: "no supabase" }, { status: 500 })
  const out: Record<string, unknown> = {}
  for (const off of [2, 1]) {
    const day = pragueDate(off)
    const { data, error } = await admin.rpc("vk_rollup", { p_day: day })
    out[day] = error ? `error: ${error.message}` : data
  }
  const { data: pruned } = await admin.rpc("vk_prune")
  out.pruned = pruned ?? 0
  return NextResponse.json({ ok: true, ...out })
}
