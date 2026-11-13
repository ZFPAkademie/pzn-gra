// vk-analytics 0.2.0 — obrana proti PII v datech
import type { VkProps, VkScalar } from "../types"

const KEY = /^[a-z][a-z0-9_]{0,40}$/

export function looksLikePii(v: unknown): boolean {
  if (typeof v !== "string") return false
  if (v.includes("@")) return true
  const digits = v.replace(/\D/g, "")
  return digits.length >= 9
}

/** Vyčistí props: ≤20 klíčů, snake_case, skaláry, řetězce ≤200, bez PII, ≤2 kB. */
export function cleanProps(input: unknown): VkProps | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined
  const out: VkProps = {}
  let n = 0
  for (const [k, raw] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 20) break
    if (!KEY.test(k)) continue
    let v: VkScalar
    if (raw === null) v = null
    else if (typeof raw === "boolean" || typeof raw === "number") v = Number.isFinite(raw as number) || typeof raw === "boolean" ? (raw as VkScalar) : null
    else if (typeof raw === "string") { if (looksLikePii(raw)) continue; v = raw.slice(0, 200) }
    else continue
    out[k] = v; n++
  }
  if (n === 0) return undefined
  return JSON.stringify(out).length > 2048 ? undefined : out
}
