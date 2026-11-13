"use client"
// vk-analytics 0.2.0 — React vazba: page_view při každé navigaci + honeypot
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { vk } from "./tracker"

export function VkTracker() {
  const pathname = usePathname()
  useEffect(() => { vk.init() }, [])
  useEffect(() => { vk.pageview(pathname) }, [pathname])
  return (
    <a href="/vk-hp" data-vk-hp="1" aria-hidden="true" tabIndex={-1} rel="nofollow"
       style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, overflow: "hidden", opacity: 0 }}>.</a>
  )
}

/** Do `not-found.tsx`: označí následující page_view stavem 404 (efekt dítěte běží před efektem layoutu). */
export function VkStatus({ status }: { status: number }) {
  useEffect(() => { vk.setStatus(status) }, [status])
  return null
}
