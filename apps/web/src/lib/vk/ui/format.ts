// vk-analytics 0.2.0
export const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("cs-CZ")
export const pct = (a: number, b: number, d = 1) => (b > 0 ? ((a / b) * 100).toFixed(d).replace(".", ",") + " %" : "–")
export const secs = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`)
export const delta = (cur: number, prev: number): { text: string; cls: string } => {
  if (!prev) return { text: cur ? "nové" : "–", cls: "" }
  const d = ((cur - prev) / prev) * 100
  return { text: `${d > 0 ? "+" : ""}${d.toFixed(0)} % vs. předchozí`, cls: d > 0 ? "up" : d < 0 ? "down" : "" }
}
export const CHANNEL_LABEL: Record<string, string> = { organic: "Vyhledávače", paid: "Placené", social: "Sociální sítě", ai: "AI asistenti", referral: "Odkazující weby", direct: "Přímá návštěva", email: "E-mail", internal: "Interní" }
export const dayLabel = (d: string) => { const [, m, dd] = d.split("-"); return `${Number(dd)}.${Number(m)}.` }
