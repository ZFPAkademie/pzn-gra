// vk-analytics 0.2.0 — rodina zařízení/OS/prohlížeče z UA + client hints (bez verzí)
export type UaInfo = { device: "mobile" | "tablet" | "desktop"; os: string; browser: string }

export function parseUa(ua: string, hints: { mobile?: string | null; platform?: string | null }): UaInfo {
  const u = ua || ""
  let device: UaInfo["device"] = "desktop"
  if (/iPad|Tablet|PlayBook|Silk/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u))) device = "tablet"
  else if (hints.mobile === "?1" || /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(u)) device = "mobile"

  let os = "other"
  const p = (hints.platform || "").replace(/"/g, "")
  if (p) os = p === "macOS" ? "macOS" : p === "Windows" ? "Windows" : p === "Android" ? "Android" : p === "Chrome OS" ? "ChromeOS" : p === "Linux" ? "Linux" : p === "iOS" ? "iOS" : "other"
  if (os === "other") {
    if (/iPhone|iPad|iPod/i.test(u)) os = "iOS"
    else if (/Android/i.test(u)) os = "Android"
    else if (/Windows/i.test(u)) os = "Windows"
    else if (/Mac OS X|Macintosh/i.test(u)) os = "macOS"
    else if (/CrOS/i.test(u)) os = "ChromeOS"
    else if (/Linux/i.test(u)) os = "Linux"
  }
  // iPadOS 13+ se hlásí jako Mac s dotykem
  if (os === "macOS" && device === "tablet") os = "iOS"

  let browser = "other"
  if (/Edg\//i.test(u)) browser = "Edge"
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera"
  else if (/SamsungBrowser/i.test(u)) browser = "Samsung"
  else if (/Firefox\//i.test(u)) browser = "Firefox"
  else if (/Chrome\/|CriOS/i.test(u)) browser = "Chrome"
  else if (/Safari\//i.test(u)) browser = "Safari"
  return { device, os, browser }
}

export function screenBucket(w: number | undefined | null): string {
  if (!w || w <= 0) return "?"
  if (w < 640) return "xs"
  if (w < 768) return "sm"
  if (w < 1024) return "md"
  if (w < 1536) return "lg"
  return "xl"
}
