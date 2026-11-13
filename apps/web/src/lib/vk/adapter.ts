// vk-analytics — ADAPTÉR PROJEKTU (Pod Zlatým návrším, gra3). Jediný ručně psaný soubor modulu.
import type { VkAdapter } from "./adapter.example"
import { getAdminClient } from "../supabase"
import { isAdminAuthenticated } from "../admin-auth"

export const vkAdapter: VkAdapter = {
  getAdminClient: () => {
    try { return getAdminClient() } catch { return null }
  },
  isAdminRequest: isAdminAuthenticated,
  siteHosts: ["www.podzlatymnavrsim.cz", "podzlatymnavrsim.cz"],
  // /rezervace/[token] = karta hosta (token se v cestě maskuje, ale stránka je soukromá),
  // /portal a /sprava-podilu = přihlášení majitelé, /podil-prezentace = prezentace obchodníků.
  excludePaths: ["/admin", "/api", "/portal", "/login", "/auth", "/sprava-podilu", "/rezervace", "/podil-prezentace", "/vk-hp"],
  adminBasePath: "/admin/navstevnost",
  brand: {
    name: "Pod Zlatým návrším",
    aliases: ["Pod Zlatým návrším", "Golden Ridge Apartments", "podzlatymnavrsim.cz"],
    domain: "podzlatymnavrsim.cz",
  },
}
