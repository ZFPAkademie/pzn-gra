-- Vibekodex: evidence běhů cronů (SHIP-04). Zdroj: __vibekodex/os/sql/cron_runs.sql — do projektu se KOPÍRUJE
-- jako migrace, opravuje se tady. Zapisuje jen server (service_role) přes os/cron/cron-run.ts (withCronRun).
-- Proč: cron, který 8 dní vrací 401 nebo padá, nikdo nepozná, dokud neexistuje stopa. Týdenní kontrola
-- produkce (prod_check.py) z téhle tabulky čte: job bez běhu za 7 dní = FAIL, failed/error = pozor.
create table if not exists public.cron_runs (
  id           uuid primary key default gen_random_uuid(),
  job          text not null,                       -- název = poslední část cesty routy (/api/cron/<job>)
  started_at   timestamptz not null default now(),
  duration_ms  int,
  status       int,                                 -- HTTP kód odpovědi routy (200 ok, 500 pád)
  processed    int not null default 0,              -- z JSON odpovědi routy, pokud tam je (processed|count|total)
  delivered    int not null default 0,              -- sent|delivered|done
  skipped      int not null default 0,
  failed       int not null default 0,              -- failed|errors (číslo)
  error        text                                 -- výjimka nebo HTTP >= 400
);
create index if not exists cron_runs_job_idx on public.cron_runs (job, started_at desc);
alter table public.cron_runs enable row level security;
revoke all on table public.cron_runs from anon, authenticated;
grant all on table public.cron_runs to service_role;
comment on table public.cron_runs is 'Evidence běhů cronů (Vibekodex SHIP-04). Zapisuje withCronRun(), čte prod_check.py. Retence: řádky starší 90 dní maže sám wrapper při každém ~100. běhu.';
