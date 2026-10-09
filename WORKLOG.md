# WORKLOG.md
## Pod Zlatým návrším — deník práce

Append-only, nejnovější nahoře.

---

## 2026-10-09 — Compliance /podil: doložení růstu hodnoty nemovitostí

### Zadání
- Právník: u „Historický růst cen nemovitostí ve Špindlerově Mlýně 8–12 % ročně" doplnit název zdroje, rok a upozornění, že minulý vývoj nezaručuje budoucí výnosy; poté upraví bod 9 smlouvy o zprostředkování nabytí.

### Rešerše (výsledek)
- Pro Špindlerův Mlýn neexistuje veřejná roční řada realizovaných cen — jen bodové údaje (město/REAS 2021: 119 858 Kč/m²; Deloitte 2023 a 2024: ~190 000 Kč/m² přes Aktuálně.cz a Echo24). Spojovat je nelze (různé metodiky, vyšlo by 26 % p.a.).
- Doložitelný zdroj: ČSÚ, Ceny nemovitostí 2023–2025 (014016-26, 15. 7. 2026), tab. 2-6b index cen bytů 2015 = 100 — Královéhradecký kraj 11,1 % p.a. 2015–2025, ale −3,6 % v 2023 a jen 2,1 % p.a. 2022–2025. Okres Trutnov (tab. 2-4): 2023→2025 10,6 % p.a.
- Právní rámec: § 5 odst. 2 a § 5a ZOS (pravdivé číslo bez kontextu = klamavé), § 2 odst. 1 b) zák. o regulaci reklamy; čl. 44 odst. 4 nař. 2017/565 jako standard formulace; stanovisko ČNB RS2022-06 (§ 98 ZISIF) předáno právníkovi k posouzení.

### Změna na webu
- `/podil` + `/podil/[available]`: karta „Růst hodnoty nemovitostí" → krajský index ČSÚ 11 % p.a. 2015–2025 včetně poklesu 2023; pod Hlavní výhody poznámka ¹ se zdrojem, rokem, bodovými údaji Deloitte a varováním o minulé výkonnosti.
- Deploy `c605ae1` → https://pzn-gra.vercel.app/podil — ověřeno markerem, starý text zmizel, screenshot mobil OK, security_probe (apps/web) PROŠLO.

### Otevřené
- Právník upraví bod 9 smlouvy o zprostředkování nabytí podle doplněného zdroje (text poznámky z webu lze převzít doslova).
- `security_probe` z kořene repa hlásí falešné nálezy (prochází archiv `nova/`) — spouštět na `apps/web`.

---

## 2026-10-09 — Vibekodex úroveň 4: CI, QA staging, oprava cache dostupnosti

### Setup
- CI (GitHub Actions): typecheck, build s falešnými env, `security_probe --api-only`, gitleaks nových commitů — zelené od běhu #2 (lock přegenerovaný npm 11)
- QA staging (`os/qa`): kořen `apps/web`, `supabase/` symlink, schéma = dump z produkce (parita ✓), stack `gra3` (API 54401, app 3005)
- `.vibekodex/security.json` přesunut do `apps/web` (probe vidí middleware, ne archiv `nova/`), allow_read/allow_api s důvody
- gitleaks pre-commit hook v repu neběžel (lokální `core.hooksPath` přebíjel globální) → odstraněno; `.gitleaksignore` pro zakommitovaný `.next` z února

### Opravy v kódu
- **Dostupnost vracela zastaralý výsledek**: Next.js datová cache ukládala odpovědi supabase-js i v route handlerech (`.next/cache/fetch-cache` obsahovala dotazy na `bookings`). Po založení rezervace zůstal termín „volný". Všichni serveroví klienti Supabase mají `global.fetch` s `cache: 'no-store'` (`supabase-server.ts`, `supabase.ts`). Nalezeno kouřovým testem v QA, platilo i v produkci.
- Typecheck: duplicitní `)}` v `lead-form.tsx` maskoval 11 typových chyb (build je přecházel kvůli `ignoreBuildErrors`): Stripe webhook importoval neexistující funkce, `checkin_info` chybělo v selectu rezervace, mrtvý `ApartmentGrid`, přetypování Supabase joinů
- QA: `scripts/seed-qa.mjs` (pevné ID apartmánu + ceník), `scripts/e2e-smoke.mjs` (RLS anon, iCal token skrytý, dostupnost/cena/blokace přes API, web, admin redirect) — 17 kontrol, 2× po sobě zelené
- Lekce do OS: dump schématu nepřenese REVOKE (→ `supabase/qa/seed_grants.sql`), Next datová cache v route handlerech

### Otevřené
- `next.config.js` má stále `typescript.ignoreBuildErrors: true` — CI typecheck to teď hlídá; zvážit vypnutí
- `VERCEL_TOKEN` je v kořenovém `.env.local` (ne v `apps/web`) — `vercel_project.sh ls` pouštět z kořene; `inspect` s týmovým tokenem padá („User not found“), detail nasazení přes API `GET /v6/deployments?projectId&teamId` (vrací commit a stav). Ověřeno: 5195413 a d32a53d READY ve 14:00
- `nova/` (archiv sprintu 3, 249 souborů) v repu — rozhodnutí, zda smazat

---

## 2026-07-28 až 30 — SVJ modul, evidence klientů, fotogalerie, produkční opravy

### Audit vstupního stavu
- Ověřen build, kód a **živá produkční DB** (ne dokumentace — ta na několika místech lhala)
- Zjištěno: tabulka `svj_polls` nikdy neexistovala, přestože ji CLAUDE.md i SNAPSHOT uváděly
- Zjištěno: čísla migrací v SNAPSHOT byla posunutá oproti realitě → opraveno
- Stav dat: 11 bytů (8 pronájem + 3 prodej), 1 majitel, 2 rezervace, 0 SVJ postů

### 🔴 Opravené produkční chyby
- **Portál Pronájem vracel nuly** — selectoval neexistující sloupce `nights_count` / `total_price_cents`
  (v DB jsou `nights` / `total_amount_cents`). Majitel viděl 0 Kč tržeb a prázdný seznam rezervací.
- **Chybějící `BANK_IBAN` ve Vercelu** — hostům se v platebních údajích zobrazoval zástupný
  `CZ00 0000 0000 0000 0000 0000`. Doplněno spolu s `BANK_NAME`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`
  + `vercel redeploy`. Ověřeno na skutečné rezervační kartě.
- **Portál neměl mobilní layout** — fixed sidebar bez jediného breakpointu.

### Migrace
| # | Obsah | Status |
|---|-------|--------|
| 008 | `svj_posts.options` / `poll_deadline` / `archived_at`, GRANTy, privátní bucket `dokumenty` | ✅ spuštěna |
| 009 | `app_settings` (key/value) + seed `podil_available=50` | ✅ spuštěna |
| 010 | `apartment_images` (sort_order, UNIQUE per byt, veřejné čtení) | ✅ spuštěna |
| 010b | Seed 158 fotek z `apartment-images.ts`, pořadí 1:1 | ✅ spuštěna |

### Dodané moduly
- **SVJ kompletní** — portál: detail postu, komentáře (přidat/smazat vlastní), hlasování
  s deadline a optimistic UI, dokumenty přes signed URLs. Admin: editace postů, ankety,
  soft delete (`archived_at`), moderace komentářů, upload/editace/mazání dokumentů.
- **Evidence a komunikace s klienty** — `/portal/dokumenty` + `/admin/dokumenty` (upload per majitel),
  `/portal/udrzba` (hlášení závad) + `/admin/udrzba` (stavové chipy s auto-save + vyjádření správce).
- **Portál mobilně** — top bar + drawer (DEC-027), nav doplněna o Dokumenty, Údržba, Profil.
- **`/sprava-podilu`** — PIN stránka pro asistentku, mění počet volných podílů bez deploye (DEC-028).
- **Fotogalerie bytů v adminu** — upload více souborů, řazení, hlavní foto, mazání (DEC-029).
  Ošetřeno 44 sdílených souborů mezi páry chata ↔ golden-ridge.
- **Sitemap z DB** — slugy dle visibility flags místo 10 vymyšlených, + `/podil`, revalidate 1h.

### Deploye
| Commit | Obsah |
|--------|-------|
| `feb72c4` | SVJ modul + portál dokumenty/údržba + mobilní layout |
| `62dfd4a` | `/sprava-podilu` — PIN stránka |
| `b2752c7` | fix: trim `PODIL_PIN` (neviditelný `\n` z `echo`) |
| `2cc1751` | fotogalerie bytů z adminu |

### Provozní zjištění
- **`podzlatymnavrsim.cz` stále míří na Wix** (apex → 301 → www → wixdns.net, server Pepyaka).
  Alias ve Vercelu nastavený je, DNS ne. Nový web žije **pouze** na `pzn-gra.vercel.app`.
  Dřívější tvrzení opačného v dokumentaci opraveno.
- Push na GitHub: funkční PAT je v `.env.local` jako `TOKEN_SECRET`; uložen do `gh` CLI
  (účet ZFPAkademie) + `gh auth setup-git`.
- `.env.local` leží v rootu monorepa, ale Next.js běží v `apps/web` a čte jen odtud —
  nutná kopie (gitignored).
- Heslo pro Supabase účet `gra@podzlatymnavrsim.cz` nastaveno přes admin API.
  Účet ale není napojen na `owners` → portál ho odmítne. Do `/admin` nepatří (viz níže).
- Vyjasněna trojice oddělených přihlášení: `/admin` = jen heslo `ADMIN_DASH_PASSWORD` (`zlato`),
  `/portal` = Supabase e-mail+heslo, `/sprava-podilu` = PIN.

### Nedořešeno (viz PROJECT_SNAPSHOT)
- 🔴 Ceníky jen pro 1 z 8 pronajímaných bytů
- 🔴 DNS přepnutí ostré domény
- `lead-form.tsx:296` — přebývající `)}`, rozbíjí `type-check` (schová `ignoreBuildErrors`)
- `rooms` a `subtitle` se zobrazují veřejně, ale nejdou editovat
- Admin heslo `zlato` je slabé — doporučena změna
