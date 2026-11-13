// vk-analytics 0.2.0 — edge middleware doplněk: log crawlerů + honeypot (bez SDK, jen fetch)
import type { NextFetchEvent, NextRequest } from "next/server"
import { crawlerName } from "./server/bot"
import { maskPath } from "./server/mask"

const STATIC = /\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|map|woff2?|ttf|mp4|webm|pdf)$/i

/**
 * Zavolej na začátku middleware. Vrátí Response pro honeypot, jinak null (pokračuj).
 * Loguje jen botí UA přes waitUntil — request nezdržuje.
 */
export function vkEdge(req: NextRequest, event: NextFetchEvent): Response | null {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/_next/") || STATIC.test(pathname)) return null
  const ua = req.headers.get("user-agent") || ""
  const isHoneypot = pathname === "/vk-hp"
  const bot = isHoneypot ? "honeypot" : crawlerName(ua)
  if (bot) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const p = fetch(`${url}/rest/v1/vk_crawler_hits`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ bot, path: maskPath(pathname), status: isHoneypot ? 204 : null, ua: ua.slice(0, 200) }),
      }).catch(() => {})
      event.waitUntil(p)
    }
  }
  return isHoneypot ? new Response(null, { status: 204 }) : null
}

/**
 * Matcher pro middleware — Next ho čte STATICKY, takže se musí do `config.matcher` vložit jako literál,
 * ne importovat: `export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }`
 */
export const VK_EDGE_MATCHER = "/((?!_next/static|_next/image|favicon.ico).*)"
