// vk-analytics 0.3.0 — identity: HMAC klíč, sloučení zařízení; DELETE = GDPR výmaz
import { NextRequest, NextResponse } from "next/server"
import { vkAdapter } from "@vk/adapter"
import { identityKey } from "@vk/server/identity"
import { visitorHash } from "@vk/server/visitor"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { key, ref } = await req.json()
    if (typeof key !== "string") return NextResponse.json({ ok: false }, { status: 400 })
    // Identitu návštěvníka určuje server z požadavku, klient ji neposílá.
    const host = (req.headers.get("host") || "").replace(/^www\./, "").toLowerCase()
    const sid = visitorHash(req.headers, host)
    if (!sid) return NextResponse.json({ ok: true, stored: false })
    const hk = identityKey(key)
    if (!hk) return NextResponse.json({ ok: false, reason: "VK_IDENTITY_SALT missing" }, { status: 200 })
    const admin = vkAdapter.getAdminClient()
    if (!admin) return NextResponse.json({ ok: true, stored: false })
    const { error } = await admin.rpc("vk_identify", { p_key: hk, p_sid: sid, p_ref: typeof ref === "string" ? ref.slice(0, 100) : null })
    return NextResponse.json({ ok: !error })
  } catch { return NextResponse.json({ ok: false }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  if (!(await vkAdapter.isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 })
  const { key } = await req.json().catch(() => ({}))
  const hk = typeof key === "string" ? identityKey(key) : null
  if (!hk) return NextResponse.json({ ok: false }, { status: 400 })
  const admin = vkAdapter.getAdminClient()
  if (!admin) return NextResponse.json({ ok: false }, { status: 500 })
  const { data, error } = await admin.rpc("vk_forget", { p_key: hk })
  return NextResponse.json({ ok: !error, visits_detached: data ?? 0 })
}
