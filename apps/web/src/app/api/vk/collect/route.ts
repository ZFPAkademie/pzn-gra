// vk-analytics 0.2.0
import { NextRequest, NextResponse } from "next/server"
import { handleCollect } from "@vk/server/ingest"
import { vkAdapter } from "@vk/adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  try {
    const r = await handleCollect(body, req.headers, vkAdapter)
    return NextResponse.json({ ok: r.ok, stored: r.stored ?? 0 }, { status: r.status })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 }) // soft fail — nikdy nerozbít web
  }
}
