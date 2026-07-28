-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 009 — app_settings: klíč/hodnota pro provozní nastavení
-- První použití: počet volných družstevních podílů (edituje asistentka
-- přes /sprava-podilu chráněnou PINem, /podil čte odsud).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.app_settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- Žádné policies — přístup výhradně přes service role (server actions)

GRANT ALL ON TABLE public.app_settings TO service_role;

INSERT INTO public.app_settings (key, value)
VALUES ('podil_available', '50')
ON CONFLICT (key) DO NOTHING;
