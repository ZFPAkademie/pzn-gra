"use client"
// vk-analytics 0.2.0 — kalendář: presety + vlastní rozsah + srovnání; stav v URL
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"

const PRESETS: [string, string][] = [["7", "7 dní"], ["30", "30 dní"], ["90", "90 dní"], ["180", "6 měs."], ["365", "rok"], ["all", "vše"]]

export function DateRange({ from, to }: { from: string; to: string }) {
  const router = useRouter(); const pathname = usePathname(); const sp = useSearchParams()
  const [f, setF] = useState(from); const [t, setT] = useState(to)
  const cur = sp.get("days") || (sp.get("from") ? "custom" : "30")
  const cmp = sp.get("cmp") === "1"
  const go = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(patch)) v === null ? p.delete(k) : p.set(k, v)
    router.push(`${pathname}?${p.toString()}`)
  }
  return (
    <div className="vk-range">
      {PRESETS.map(([k, l]) => <button key={k} className={`vk-chip${cur === k ? " on" : ""}`} onClick={() => go({ days: k, from: null, to: null })}>{l}</button>)}
      <input type="date" value={f} onChange={(e) => setF(e.target.value)} />
      <span>–</span>
      <input type="date" value={t} onChange={(e) => setT(e.target.value)} />
      <button className="vk-chip" onClick={() => f && t && go({ from: f, to: t, days: null })}>Zobrazit</button>
      <button className={`vk-chip${cmp ? " on" : ""}`} onClick={() => go({ cmp: cmp ? null : "1" })}>srovnat s předchozím</button>
    </div>
  )
}
