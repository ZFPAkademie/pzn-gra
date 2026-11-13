"use client"
// vk-analytics 0.2.0 — klikací heatmapa nad screenshotem (pokud existuje) nebo prázdným plátnem
import { useEffect, useRef, useState } from "react"

type Pt = { x_pct: number; y_px: number; doc_h: number; kind: string }

export function Heatmap({ points, shot, width }: { points: Pt[]; shot: string | null; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [hasShot, setHasShot] = useState(false)
  const docH = points.length ? Math.max(...points.map((p) => p.doc_h || 0), 800) : 800
  const h = Math.min(docH, 6000)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const W = 1000, H = Math.round((h / width) * W)
    c.width = W; c.height = H
    const g = c.getContext("2d"); if (!g) return
    g.clearRect(0, 0, W, H)
    for (const p of points) {
      const x = (p.x_pct / 100) * W, y = (p.y_px / width) * W
      const r = 18
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      const col = p.kind === "rage" || p.kind === "dead" ? "224,82,82" : "25,224,140"
      grad.addColorStop(0, `rgba(${col},.55)`); grad.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
    }
  }, [points, width, h])
  return (
    <div className="vk-heat" style={{ aspectRatio: `${width} / ${h}` }}>
      {shot && <img src={shot} alt="" onLoad={() => setHasShot(true)} onError={() => setHasShot(false)} style={{ display: hasShot ? "block" : "none" }} />}
      {!hasShot && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 12, opacity: .6 }}>{shot ? "screenshot chybí — " : ""}kliky nad proporčním plátnem ({points.length})</div>}
      <canvas ref={ref} />
    </div>
  )
}
