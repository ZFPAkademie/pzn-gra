// vk-analytics 0.2.0 — ADAPTÉR PROJEKTU
// Jediný soubor modulu, který se v projektu píše ručně. Zkopíruj jako `adapter.ts`
// vedle tohoto souboru a doplň. Sync skript `adapter.ts` nikdy nepřepisuje.
import type { SupabaseClient } from "@supabase/supabase-js"

export type VkAdapter = {
  /** Server-only klient se service role (obchází RLS). null = Supabase není nakonfigurovaná. */
  getAdminClient(): SupabaseClient | null
  /** true, když aktuální request patří přihlášenému adminovi (dashboard, akce, nastavení). */
  isAdminRequest(): Promise<boolean>
  /** Hostnames, ze kterých smí přicházet měření (bez protokolu). localhost se přidá v dev automaticky. */
  siteHosts: string[]
  /** Prefixy cest, které se neměří (admin, API…). */
  excludePaths: string[]
  /** Cesta admin stránky s dashboardem — pro odkazy mezi záložkami. */
  adminBasePath: string
  /** Název značky + aliasy pro AI viditelnost (lze přepsat v nastavení). */
  brand: { name: string; aliases: string[]; domain: string }
}

// Příklad pro projekt s `lib/supabase.ts` a cookie session:
//
// import { createAdminClient } from "../supabase"
// import { mxAuthed } from "../mx-auth"
// export const vkAdapter: VkAdapter = {
//   getAdminClient: createAdminClient,
//   isAdminRequest: mxAuthed,
//   siteHosts: ["vibekodex.com", "www.vibekodex.com"],
//   excludePaths: ["/mx", "/api", "/akademie"],
//   adminBasePath: "/mx/analytika",
//   brand: { name: "VIBEKODEX", aliases: ["Vibekodex", "vibekodex.com"], domain: "vibekodex.com" },
// }
export const vkAdapter: VkAdapter = {
  getAdminClient: () => null,
  isAdminRequest: async () => false,
  siteHosts: [],
  excludePaths: ["/api"],
  adminBasePath: "/admin/analytika",
  brand: { name: "", aliases: [], domain: "" },
}
