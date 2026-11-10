/**
 * Družstvo — sdílené konstanty a popisky (server i klient, bez serverových importů).
 * Evidence zájemců a vlastníků družstevních podílů, admin /admin/druzstvo.
 */

export const COOP_TOTAL_SHARES = 50;

export const COOP_STATUSES = ['new', 'contacted', 'reservation', 'owner', 'cancelled'] as const;
export type CoopStatus = (typeof COOP_STATUSES)[number];

/** Stavy, které blokují podíly — odečítají se od 50 na veřejné stránce /podil */
export const COOP_TAKEN_STATUSES: CoopStatus[] = ['reservation', 'owner'];

export const coopStatusLabels: Record<CoopStatus, string> = {
  new: 'Nový',
  contacted: 'Kontaktován',
  reservation: 'Rezervace',
  owner: 'Vlastník',
  cancelled: 'Zrušený',
};

export const COOP_SOURCES = ['web', 'referral', 'advisor', 'other'] as const;
export type CoopSource = (typeof COOP_SOURCES)[number];

export const coopSourceLabels: Record<CoopSource, string> = {
  web: 'Web /podil',
  referral: 'Doporučení',
  advisor: 'Poradce ZFP',
  other: 'Jiné',
};

export const COOP_FILE_CATEGORIES = ['application', 'contract', 'id_document', 'payment', 'other'] as const;
export type CoopFileCategory = (typeof COOP_FILE_CATEGORIES)[number];

export const coopFileCategoryLabels: Record<CoopFileCategory, string> = {
  application: 'Přihláška',
  contract: 'Smlouva',
  id_document: 'Doklad totožnosti',
  payment: 'Potvrzení platby',
  other: 'Ostatní',
};

/** Povolené přílohy: přípona → MIME typ */
export const COOP_FILE_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export const COOP_FILE_ACCEPT = '.pdf,.docx,.jpg,.jpeg,.png';
export const COOP_FILE_MAX_BYTES = 20 * 1024 * 1024;

export const COOP_EVENT_KINDS_MANUAL = ['note', 'call', 'meeting', 'email'] as const;
export type CoopManualEventKind = (typeof COOP_EVENT_KINDS_MANUAL)[number];

export const coopEventLabels: Record<string, string> = {
  created: 'Založeno',
  status: 'Změna stavu',
  note: 'Poznámka',
  call: 'Telefonát',
  meeting: 'Schůzka',
  email: 'E-mail',
  file_added: 'Příloha přidána',
  file_removed: 'Příloha smazána',
  archived: 'Archivováno',
  restored: 'Obnoveno z archivu',
};

export function isCoopStatus(v: unknown): v is CoopStatus {
  return typeof v === 'string' && (COOP_STATUSES as readonly string[]).includes(v);
}

export function fileExtension(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : '';
}

/** 'YYYY-MM-DD' → '5. 11. 2026' bez převodu přes Date (DB-03, žádný posun dne) */
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${parseInt(d, 10)}. ${parseInt(m, 10)}. ${y}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', {
    timeZone: 'Europe/Prague',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function coopFullName(c: { first_name: string; last_name: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ');
}
