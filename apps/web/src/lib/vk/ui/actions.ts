"use server"
// vk-analytics 0.2.0 — server actions dashboardu (vše za isAdminRequest)
import { revalidatePath } from "next/cache"
import { vkAdapter } from "@vk/adapter"
import { runAiVisibility } from "@vk/server/ai-runner"

async function guard() {
  if (!(await vkAdapter.isAdminRequest())) throw new Error("unauthorized")
  const admin = vkAdapter.getAdminClient(); if (!admin) throw new Error("no supabase")
  return admin
}
const done = () => revalidatePath(vkAdapter.adminBasePath)
const s = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max)

export async function saveEventDef(fd: FormData) {
  const admin = await guard()
  const name = s(fd, "name", 41); if (!/^[a-z][a-z0-9_]{1,40}$/.test(name)) return
  const value = Number(s(fd, "value")) || null
  await admin.from("vk_event_defs").upsert({ name, label: s(fd, "label") || name, is_conversion: fd.get("is_conversion") === "on", value, funnel_step: Number(s(fd, "funnel_step")) || null })
  done()
}
export async function deleteEventDef(fd: FormData) { const admin = await guard(); await admin.from("vk_event_defs").delete().eq("name", s(fd, "name", 41)); done() }

export async function saveSettings(fd: FormData) {
  const admin = await guard()
  const th = Math.max(0, Math.min(100, Number(s(fd, "bot_threshold")) || 70))
  const brand = { name: s(fd, "brand_name", 80), aliases: s(fd, "brand_aliases", 500).split(",").map((x) => x.trim()).filter(Boolean), domain: s(fd, "brand_domain", 100) }
  await admin.from("vk_settings").upsert([
    { key: "bot_threshold", value: th }, { key: "retention_days", value: Math.max(30, Number(s(fd, "retention_days")) || 730) },
    { key: "daily_sid_cap", value: Math.max(100, Number(s(fd, "daily_sid_cap")) || 2000) }, { key: "brand", value: brand },
  ])
  await admin.rpc("vk_rescore", { p_threshold: th })
  done()
}

export async function recomputeDays(fd: FormData) {
  const admin = await guard()
  const n = Math.max(1, Math.min(120, Number(s(fd, "days")) || 30))
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  for (let i = 1; i <= n; i++) { const d = new Date(today + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - i); await admin.rpc("vk_rollup", { p_day: d.toISOString().slice(0, 10) }) }
  done()
}

export async function addPrompt(fd: FormData) {
  const admin = await guard()
  const text = s(fd, "text", 1000); if (!text) return
  const kind = ["branded", "unbranded", "comparison"].includes(s(fd, "kind")) ? s(fd, "kind") : "unbranded"
  await admin.from("vk_ai_prompts").insert({ text, kind, topic: s(fd, "topic", 80) || null, lang: s(fd, "lang", 5) || "cs", priority: fd.get("priority") === "on" })
  done()
}
export async function togglePrompt(fd: FormData) { const admin = await guard(); await admin.from("vk_ai_prompts").update({ active: fd.get("active") === "1" }).eq("id", s(fd, "id", 40)); done() }
export async function deletePrompt(fd: FormData) { const admin = await guard(); await admin.from("vk_ai_prompts").delete().eq("id", s(fd, "id", 40)); done() }
export async function addCompetitor(fd: FormData) {
  const admin = await guard(); const name = s(fd, "name", 80); if (!name) return
  await admin.from("vk_ai_competitors").upsert({ name, domain: s(fd, "domain", 100) || null, aliases: s(fd, "aliases", 500).split(",").map((x) => x.trim()).filter(Boolean) }, { onConflict: "name" })
  done()
}
export async function deleteCompetitor(fd: FormData) { const admin = await guard(); await admin.from("vk_ai_competitors").delete().eq("id", s(fd, "id", 40)); done() }
export async function runAiNow(fd: FormData) {
  await guard()
  const promptId = s(fd, "prompt_id", 40) || undefined
  // force = ignoruj interval (doměření baseline); jinak se měří jen prompty starší než interval
  await runAiVisibility(vkAdapter, { promptId, force: fd.get("force") === "1", limit: promptId ? 12 : Number(process.env.VK_AI_BATCH || 20) })
  done()
}

export async function saveAiInterval(fd: FormData) {
  const admin = await guard()
  const d = Math.max(0, Math.min(180, Number(s(fd, "ai_interval_days")) || 14))
  await admin.from("vk_settings").upsert({ key: "ai_interval_days", value: d })
  done()
}
