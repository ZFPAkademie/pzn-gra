// vk-analytics 0.2.0 — bot signály a skóre; sdílené s edge (jen regexy, žádné node importy)

// Obecné roboty (skripty, monitoring, headless)
export const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|selenium|puppeteer|playwright|python-requests|python-urllib|aiohttp|httpx|curl\/|wget\/|java\/|go-http-client|libwww|okhttp|scrapy|node-fetch|undici|axios|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|site24x7|monitor|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|skypeuripreview|embedly|quora link preview|outbrain|pinterest|vkshare|w3c_validator|ahrefs|semrush|mj12bot|dotbot|petalbot|dataforseo|screaming frog|bytespider|ccbot|gptbot|claudebot|claude-web|anthropic-ai|perplexitybot|oai-searchbot|chatgpt-user|meta-externalagent|applebot|amazonbot|yandex|baiduspider|seznambot|duckduckbot|bingbot|googlebot|adsbot/i

// Pojmenovaní crawleři (pro vk_crawler_hits) — pořadí = priorita
const CRAWLERS: [RegExp, string][] = [
  [/GPTBot/i, "gptbot"], [/OAI-SearchBot/i, "oai-searchbot"], [/ChatGPT-User/i, "chatgpt-user"],
  [/ClaudeBot/i, "claudebot"], [/Claude-Web|anthropic-ai/i, "claude-web"],
  [/PerplexityBot/i, "perplexitybot"], [/Perplexity-User/i, "perplexity-user"],
  [/Google-Extended/i, "google-extended"], [/Googlebot/i, "googlebot"], [/AdsBot-Google/i, "adsbot-google"],
  [/Applebot-Extended/i, "applebot-extended"], [/Applebot/i, "applebot"],
  [/bingbot/i, "bingbot"], [/SeznamBot/i, "seznambot"], [/DuckDuckBot/i, "duckduckbot"], [/YandexBot/i, "yandexbot"],
  [/CCBot/i, "ccbot"], [/Bytespider/i, "bytespider"], [/meta-externalagent|FacebookBot/i, "meta-externalagent"],
  [/Amazonbot/i, "amazonbot"], [/cohere-ai/i, "cohere"], [/MistralAI-User|Mistral/i, "mistral"], [/DuckAssistBot/i, "duckassist"],
  [/AhrefsBot/i, "ahrefs"], [/SemrushBot/i, "semrush"], [/MJ12bot/i, "mj12"], [/DotBot/i, "dotbot"], [/PetalBot/i, "petalbot"],
]
export function crawlerName(ua: string): string | null {
  for (const [re, name] of CRAWLERS) if (re.test(ua)) return name
  return BOT_UA.test(ua) ? "other" : null
}
export const AI_CRAWLERS = new Set(["gptbot", "oai-searchbot", "chatgpt-user", "claudebot", "claude-web", "perplexitybot", "perplexity-user", "google-extended", "applebot-extended", "ccbot", "bytespider", "meta-externalagent", "amazonbot", "cohere", "mistral", "duckassist"])

export const BOT_WEIGHTS: Record<string, number> = {
  ua: 90, honeypot: 100, webdriver: 90, no_headers: 25, no_accept_language: 25, screen: 30,
  no_interaction: 40, speed: 40, linear_scroll: 30, regular_intervals: 30, volume: 80,
}
export function scoreReasons(reasons: string[]): number {
  let s = 0
  for (const r of Array.from(new Set(reasons))) s += BOT_WEIGHTS[r] ?? 10
  return Math.min(100, s)
}

/** Serverové signály z hlaviček requestu na /collect. */
export function serverBotReasons(h: { get(name: string): string | null }): string[] {
  const out: string[] = []
  const ua = h.get("user-agent") || ""
  if (!ua || BOT_UA.test(ua)) out.push("ua")
  if (!h.get("accept-language")) out.push("no_accept_language")
  // sendBeacon i fetch posílají sec-fetch-*; jejich absence = ne-prohlížeč (starší Safari toleruje jen chybějící sec-ch-ua)
  if (!h.get("sec-fetch-mode") && !h.get("sec-fetch-site")) out.push("no_headers")
  return out
}
