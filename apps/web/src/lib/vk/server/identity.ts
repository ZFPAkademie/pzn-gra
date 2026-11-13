// vk-analytics 0.2.0 — HMAC klíč identity (nikdy surový e-mail)
import { createHmac } from "node:crypto"

export function identityKey(raw: string): string | null {
  const salt = process.env.VK_IDENTITY_SALT
  if (!salt) return null
  const norm = raw.trim().toLowerCase()
  if (!norm || norm.length > 200) return null
  return createHmac("sha256", salt).update(norm).digest("hex")
}
