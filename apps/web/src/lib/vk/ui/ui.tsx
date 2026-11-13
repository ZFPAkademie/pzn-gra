// vk-analytics 0.2.0 — primitiva dashboardu (server-safe, inline SVG, každý graf má číslo)
import { fmt, delta, dayLabel } from "./format"

export function Kpi({ label, value, prev, sub }: { label: string; value: string | number; prev?: number; sub?: string }) {
  const d = typeof value === "number" && prev !== undefined ? delta(value, prev) : null
  return <div className="vk-kpi"><div className="l">{label}</div><div className="v">{typeof value === "number" ? fmt(value) : value}</div>{d ? <div className={`d ${d.cls}`}>{d.text}</div> : sub ? <div className="d">{sub}</div> : null}</div>
}

export function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <div className="vk-card"><h3>{title}{hint && <small>{hint}</small>}</h3>{children}</div>
}
export function Note({ children }: { children: React.ReactNode }) { return <div className="vk-note">{children}</div> }
export function Empty({ text = "Zatím žádná data v tomto období." }: { text?: string }) { return <div className="vk-empty">{text}</div> }

// Technické hodnoty dimenzí → lidský popisek (historická data bez zařízení, zdroj bez referreru, crawleři)
const HUMAN: Record<string, string> = { "?": "neznámé (historická data)", "(none)": "bez zdroje", other: "ostatní boti", honeypot: "honeypot" }

export function Bars({ rows, total, label: labelIn, extra, href }: {
  rows: { value: string; n: number }[]; total?: number; label?: (v: string) => string
  extra?: (v: string) => string | null; href?: (v: string) => string
}) {
  if (!rows.length) return <Empty />
  const label = (v: string) => { const l = labelIn ? labelIn(v) : v; return l === v ? (HUMAN[v] ?? v) : l }
  const max = Math.max(...rows.map((r) => r.n), 1)
  const t = total ?? rows.reduce((a, r) => a + r.n, 0)
  return (
    <table className="vk-bars"><tbody>
      {rows.map((r) => <tr key={r.value}>
        <td className="l" title={r.value}>{href ? <a href={href(r.value)}>{label(r.value)}</a> : label(r.value)}</td>
        <td className="b"><div className="vk-bar" style={{ width: `${(r.n / max) * 100}%` }} /></td>
        <td className="n">{fmt(r.n)}</td>
        <td className="s">{t > 0 ? `${((r.n / t) * 100).toFixed(1).replace(".", ",")} %` : ""}{extra ? <> · {extra(r.value)}</> : null}</td>
      </tr>)}
    </tbody></table>
  )
}

export function Trend({ series, prev, unit = "" }: { series: { day: string; n: number }[]; prev?: { day: string; n: number }[]; unit?: string }) {
  if (!series.length) return <Empty />
  // viewBox se škáluje na šířku karty; popisky jsou v těchto jednotkách (vk.css → .vk-svg text)
  const W = 720, H = 240, padL = 52, padR = 16, padT = 30, padB = 38
  const all = [...series.map((s) => s.n), ...(prev?.map((s) => s.n) ?? [])]
  const max = Math.max(...all, 1)
  const x = (i: number, len: number) => padL + (len > 1 ? (i / (len - 1)) * (W - padL - padR) : (W - padL - padR) / 2)
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  const pathOf = (s: { n: number }[]) => s.map((p, i) => `${i ? "L" : "M"}${x(i, s.length).toFixed(1)},${y(p.n).toFixed(1)}`).join(" ")
  const every = Math.max(1, Math.ceil(series.length / 16))
  return (
    <svg className="vk-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="trend">
      {(max >= 2 ? [0, 0.5, 1] : [0, 1]).map((f) => <g key={f}><line className="ax" x1={padL} x2={W - padR} y1={y(max * f)} y2={y(max * f)} /><text x={padL - 8} y={y(max * f) + 5} textAnchor="end">{fmt(Math.round(max * f))}</text></g>)}
      {prev && prev.length > 1 && <path className="prev" d={pathOf(prev)} />}
      <path className="ln" d={pathOf(series)} />
      {series.map((p, i) => <g key={p.day}>
        <circle className="pt" cx={x(i, series.length)} cy={y(p.n)} r={3.5} />
        {/* popisky se počítají ODZADU: poslední den je vždy vidět a rozestupy zůstanou pravidelné */}
        {(series.length - 1 - i) % every === 0 && <>
          <text x={x(i, series.length)} y={y(p.n) - 10} textAnchor="middle" fontWeight={600}>{fmt(p.n)}{unit}</text>
          <text x={x(i, series.length)} y={H - 10} textAnchor="middle" opacity={.7}>{dayLabel(p.day)}</text>
        </>}
      </g>)}
    </svg>
  )
}

export function Table({ head, rows }: { head: (string | { t: string; n?: boolean })[]; rows: (React.ReactNode | { v: React.ReactNode; n?: boolean })[][] }) {
  if (!rows.length) return <Empty />
  const H = head.map((h) => (typeof h === "string" ? { t: h } : h))
  return <div style={{ overflowX: "auto" }}><table className="vk-table"><thead><tr>{H.map((h, i) => <th key={i} className={h.n ? "n" : ""}>{h.t}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => { const cell = c && typeof c === "object" && "v" in (c as object) ? (c as { v: React.ReactNode; n?: boolean }) : { v: c as React.ReactNode, n: H[j]?.n }; return <td key={j} className={cell.n ? "n" : ""}>{cell.v}</td> })}</tr>)}</tbody></table></div>
}
