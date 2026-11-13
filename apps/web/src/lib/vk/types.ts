// vk-analytics 0.3.0 — sdílené typy (klient i server, žádné node importy)
export type VkScalar = string | number | boolean | null | undefined
export type VkProps = Record<string, VkScalar>

export type VkEventIn = { name: string; path: string; ts: string; seq: number; props?: VkProps }
export type VkClickIn = {
  ts: string; path: string; x_pct: number; y_px: number; doc_h: number; viewport_w: number
  screen_bucket: string; selector: string; text: string; href: string; kind: string
}
export type VkFirstCtx = {
  referrer: string; utm: Record<string, string>; click_id_kind: string | null; had_query: boolean
  viewport_w: number; viewport_h: number; screen_w: number; screen_h: number
  screen_bucket: string; dark_mode: boolean; lang: string
}
export type VkBatch = {
  /** 0.3.0: identitu i návštěvu určuje server. Pole zůstávají volitelná kvůli starším pixelům. */
  sid?: string
  visit: { id?: string | null; first?: VkFirstCtx | null; props?: VkProps }
  events: VkEventIn[]
  clicks: VkClickIn[]
}

export const VK_CHANNELS = ['organic', 'paid', 'social', 'ai', 'referral', 'direct', 'email', 'internal'] as const
export type VkChannel = (typeof VK_CHANNELS)[number]
