// vk-analytics 0.3.1 — cron AI viditelnosti (idempotentní: UNIQUE na prompt×engine×den×slot)
import { NextRequest, NextResponse } from "next/server"
import { vkAdapter } from "@vk/adapter"
import { runAiVisibility } from "@vk/server/ai-runner"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 })
  const r = await runAiVisibility(vkAdapter)
  return NextResponse.json({ ok: true, ...r })
}
