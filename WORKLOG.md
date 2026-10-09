# WORKLOG.md
## Pod Zlatým návrším — deník práce

Append-only, nejnovější nahoře.

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
