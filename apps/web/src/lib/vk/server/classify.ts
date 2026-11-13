// vk-analytics 0.2.0 — atribuce návštěvy: UTM + referrer → kanál/zdroj/medium
import type { VkChannel } from "../types"

export const AI_HOSTS = ["chatgpt.com", "chat.openai.com", "openai.com", "perplexity.ai", "claude.ai", "anthropic.com", "gemini.google.com", "bard.google.com", "copilot.microsoft.com", "bing.com/chat", "you.com", "poe.com", "grok.com", "x.ai", "chat.deepseek.com", "deepseek.com", "chat.mistral.ai", "mistral.ai", "meta.ai", "character.ai", "phind.com", "kagi.com", "duckduckgo.com/?q=&ia=chat"]
const SEARCH_HOSTS: [RegExp, string][] = [
  [/(^|\.)google\./, "google"], [/(^|\.)bing\.com$/, "bing"], [/(^|\.)seznam\.cz$/, "seznam"], [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)yahoo\./, "yahoo"], [/(^|\.)yandex\./, "yandex"], [/(^|\.)ecosia\.org$/, "ecosia"], [/(^|\.)qwant\.com$/, "qwant"], [/(^|\.)baidu\.com$/, "baidu"], [/(^|\.)centrum\.cz$/, "centrum"],
]
const SOCIAL_HOSTS: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|^l\.facebook|^lm\.facebook|^m\.facebook/, "facebook"], [/(^|\.)instagram\.com$|^l\.instagram/, "instagram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"], [/(^|\.)twitter\.com$|(^|\.)x\.com$|^t\.co$/, "x"], [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"], [/(^|\.)pinterest\./, "pinterest"], [/(^|\.)reddit\.com$/, "reddit"], [/(^|\.)threads\.net$/, "threads"], [/(^|\.)whatsapp\.com$/, "whatsapp"], [/(^|\.)t\.me$|telegram\.org$/, "telegram"],
]
const EMAIL_HOSTS = /mail\.google\.com|outlook\.(live|office)\.com|mail\.seznam\.cz|email\.seznam\.cz|mail\.yahoo|webmail|roundcube|centrum\.cz\/mail/i
const PAID_MEDIUM = /^(cpc|ppc|paid|paidsocial|paid_social|display|cpm|banner|retargeting|sklik|ads)$/i

export type Attribution = { channel: VkChannel; source: string | null; medium: string | null; campaign: string | null; term: string | null; content: string | null; referrer_host: string | null }

function host(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase() } catch { return null }
}
function isOwn(h: string, own: string[]): boolean {
  return own.some((o) => { const oo = o.replace(/^www\./, "").toLowerCase(); return h === oo || h.endsWith("." + oo) })
}

export function classify(input: { utm: Record<string, string>; referrer: string; clickIdKind: string | null; ownHosts: string[] }): Attribution {
  const utm = input.utm || {}
  const src = (utm.utm_source || "").toLowerCase().slice(0, 100) || null
  const med = (utm.utm_medium || "").toLowerCase().slice(0, 100) || null
  const camp = (utm.utm_campaign || "").slice(0, 150) || null
  const term = (utm.utm_term || "").slice(0, 150) || null
  const content = (utm.utm_content || "").slice(0, 150) || null
  const rh = input.referrer ? host(input.referrer) : null
  const referrer_host = rh && !isOwn(rh, input.ownHosts) ? rh : null

  let channel: VkChannel = "direct"
  let source = src
  let medium = med

  if (src || med) {
    if (med && PAID_MEDIUM.test(med)) channel = "paid"
    else if (med === "email" || med === "newsletter") channel = "email"
    else if (src && AI_HOSTS.some((a) => src.includes(a.split("/")[0]))) channel = "ai"
    else if (med === "social" || (src && SOCIAL_HOSTS.some(([re]) => re.test(src)))) channel = "social"
    else if (med === "organic") channel = "organic"
    else channel = "referral"
    if (!medium) medium = "campaign"
  } else if (input.clickIdKind === "gclid") { channel = "paid"; source = "google"; medium = "cpc" }
  else if (input.clickIdKind === "msclkid") { channel = "paid"; source = "bing"; medium = "cpc" }
  else if (input.clickIdKind === "fbclid") { channel = "social"; source = "facebook"; medium = "fbclid" }
  else if (input.clickIdKind === "ttclid") { channel = "paid"; source = "tiktok"; medium = "cpc" }
  else if (referrer_host) {
    const ai = AI_HOSTS.find((a) => referrer_host === a.split("/")[0] || referrer_host.endsWith("." + a.split("/")[0]))
    const se = SEARCH_HOSTS.find(([re]) => re.test(referrer_host))
    const so = SOCIAL_HOSTS.find(([re]) => re.test(referrer_host))
    if (ai) { channel = "ai"; source = ai.split("/")[0]; medium = "ai" }
    else if (se) { channel = "organic"; source = se[1]; medium = "organic" }
    else if (so) { channel = "social"; source = so[1]; medium = "social" }
    else if (EMAIL_HOSTS.test(input.referrer)) { channel = "email"; source = referrer_host; medium = "email" }
    else { channel = "referral"; source = referrer_host; medium = "referral" }
  } else if (rh && isOwn(rh, input.ownHosts)) { channel = "internal"; source = null; medium = null }

  return { channel, source, medium, campaign: camp, term, content, referrer_host }
}
