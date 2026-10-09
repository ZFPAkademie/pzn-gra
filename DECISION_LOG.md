# DECISION_LOG.md
## Pod Zlatým návrším — Architektonická rozhodnutí

---

## Format
```
[DATUM] [ID] — ROZHODNUTÍ
Status: LOCKED | OPEN | DEPRECATED
Kontext: proč bylo potřeba rozhodnout
Rozhodnutí: co bylo rozhodnuto
Důvod: proč tato varianta
Alternativy: co bylo zváženo
Důsledky: co z toho vyplývá
```

---

## Locked Decisions (neměnit bez diskuze)

### [2026-01] DEC-001 — Lead Capture před Booking Engine
**Status:** LOCKED

**Kontext:** Potřebovali jsme validovat business model před investicí do složitého booking systému.

**Rozhodnutí:** Implementovat nejdřív lead capture (formuláře → Supabase → email notifikace), booking engine až po validaci.

**Důvod:** 
- Rychlejší time-to-market
- Nižší riziko (nebudujeme co nikdo nechce)
- Manuální správa rezervací je OK pro začátek

**Důsledky:** Booking engine je v plánu jako Sprint 5+.

---

### [2026-02] DEC-002 — Supabase jako jediná databáze
**Status:** LOCKED

**Kontext:** Výběr databázové vrstvy pro celý systém.

**Rozhodnutí:** Supabase (PostgreSQL) pro vše — data, auth, storage, realtime.

**Důvod:**
- Managed PostgreSQL (žádná DevOps)
- Row Level Security pro multi-tenant
- Realtime subscriptions pro live kalendář
- Storage pro obrázky s CDN
- Auth včetně magic links

**Alternativy:**
- PlanetScale (MySQL) — méně features
- Firebase — vendor lock-in, NoSQL limits
- Self-hosted Postgres — operations overhead

**Důsledky:** Všechny migrace jsou SQL, typy generujeme ze schématu.

---

### [2026-02] DEC-003 — Stripe pro platby i výplaty
**Status:** LOCKED

**Kontext:** Potřebujeme přijímat platby od hostů A vyplácet majitelům.

**Rozhodnutí:** Stripe Checkout (hosté) + Stripe Connect (majitelé).

**Důvod:**
- Jeden vendor pro vše
- Connect umožňuje split payments
- Webhooks pro automatizaci
- PSD2/SCA compliance

**Alternativy:**
- PayPal — horší UX, vyšší fees
- Comgate/GoPay — lokální, ale bez Connect equivalent
- Ruční výplaty — neškáluje

**Důsledky:** Majitelé budou onboardováni do Stripe Connect.

---

### [2026-02] DEC-004 — Měna EUR
**Status:** LOCKED

**Kontext:** Volba primární měny pro booking.

**Rozhodnutí:** EUR jako primární měna.

**Důvod:**
- Mezinárodní hosté (Polsko, Německo, Nizozemí)
- Stabilnější než CZK
- Stripe defaultně podporuje

**Důsledky:** CZK zobrazení možné jako sekundární (přepočet).

---

### [2026-02] DEC-005 — 100% platba předem
**Status:** LOCKED

**Kontext:** Platební model pro rezervace.

**Rozhodnutí:** Host platí 100% při rezervaci.

**Důvod:**
- Jednodušší implementace
- Nižší riziko no-show
- Žádné vymáhání doplatků

**Alternativy:**
- Záloha + doplatek — komplikace s timing
- Platba na místě — cash handling, no-show risk

**Důsledky:** Refund policy musí být jasná.

---

### [2026-02] DEC-006 — Alpine Quiet Luxury Design System
**Status:** LOCKED

**Kontext:** Vizuální identita webu.

**Rozhodnutí:** Alpine Quiet Luxury 2030 — vlastní design systém pro prémiový horský resort.

**Klíčové prvky:**
- Barvy: navy (#0B1626), gold (#C9A24D), stone, cream
- Typografie: font-light headings
- SVG Alpine ornamenty (corner, diamond, horizontal) — komponenta `AlpineOrnament`
- Žádné emoji, žádné bold

**Důsledky:** Všechny UI změny musí respektovat design tokens.

---

### [2026-02] DEC-007 — Kanonický JSON pro apartmány
**Status:** LOCKED

**Kontext:** Zdroj pravdy pro data apartmánů.

**Rozhodnutí:** `apartments.canonical.json` jako single source of truth.

**Důvod:**
- Git versioning
- TypeScript typy
- Rychlé změny bez DB migrace
- Dobré pro statický obsah

**Důsledky:** Při přechodu na full booking se data migrují do DB.

---

### [2026-02] DEC-008 — Supabase Storage pro obrázky
**Status:** LOCKED

**Kontext:** Kam ukládat fotky apartmánů.

**Rozhodnutí:** Supabase Storage bucket `apartmany` + TypeScript mapping.

**Důvod:**
- CDN delivery
- Next.js Image optimization
- Centrální správa
- Public bucket (žádná auth pro zobrazení)

**Důsledky:** Mapping v `apartment-images.ts`, sorting logic v kódu.

---

### [2026-05] DEC-009 — Družstevní podíl pouze apartmán 7
**Status:** LOCKED

**Kontext:** Které apartmány nabízet jako podíly.

**Rozhodnutí:** Pouze chata-1-suite-7, nikdy nezmiňovat číslo.

**Důvod:**
- Business rozhodnutí
- Anonymita produktu
- Flexibilita do budoucna

**Důsledky:** Na /podil pouze "Apartmán ve Špindlerově Mlýně".

---

### [2026-05] DEC-010 — URL-based share availability
**Status:** LOCKED

**Kontext:** Jak aktualizovat počet dostupných podílů.

**Rozhodnutí:** `/podil/[available]` — číslo v URL určuje stav.

**Důvod:**
- Žádná změna kódu pro update
- Marketing může měnit linky
- Shareable stavy

**Příklady:**
- `/podil` nebo `/podil/50` → 50 dostupných
- `/podil/45` → 5 prodaných, 45 dostupných
- `/podil/0` → vyprodáno

---

### [2026-05] DEC-018 — Bankovní převod místo Stripe pro booking
**Status:** LOCKED

**Kontext:** Booking engine implementován, ale Stripe vyžaduje schválení managera.

**Rozhodnutí:** Platba přes bankovní převod + SPD QR kód jako primární platební metoda. Stripe přidán až po schválení.

**Důvod:**
- Unblock booking engine bez čekání na Stripe onboarding
- SPD QR kód je standard pro české platby
- Soft-fail design — Stripe lze přidat bez přepisování flow

**Důsledky:** Admin musí ručně potvrdit platbu (updateBookingStatus → confirmed). Email se odešle automaticky.

---

### [2026-05] DEC-019 — Token-based rezervační karta (bez auth)
**Status:** LOCKED

**Kontext:** Host potřebuje přistoupit k rezervaci bez nutnosti registrace.

**Rozhodnutí:** UUID `confirmation_token` v URL jako jediný autorizační mechanismus pro hosta. Znalost URL = přístup k rezervaci.

**Důvod:**
- Zero friction pro hosta
- Žádná registrace, žádný email verification
- URL lze sdílet (host → rodina)
- Platné pro messaging i check-in info

**Důsledky:** Token musí být dostatečně entropický (UUID v4). URL nesmí být indexovatelné (noindex).

---

### [2026-05] DEC-020 — iCal sync přes blocked_dates (ne separátní tabulka)
**Status:** LOCKED

**Kontext:** Kde ukládat blokace importované z Booking.com/Airbnb.

**Rozhodnutí:** Importované blokace jdou do existující tabulky `blocked_dates` se sloupci `source`, `external_uid`, `channel_connection_id`. Žádná separátní tabulka.

**Důvod:**
- Disponibilita (`checkAvailability`) dotazuje jeden zdroj
- Jednodušší dotazy
- Source tracking (`source IN ('owner', 'booking_com', 'airbnb')`) dostatečný

**Důsledky:** Při smazání `channel_connection` se kaskádově smažou i bloky (ON DELETE CASCADE).

---

### [2026-05] DEC-021 — C→A migrace: data apartmánů z JSON do DB
**Status:** LOCKED

**Kontext:** Veřejný web četl z `apartments.canonical.json`, admin panel z Supabase DB. Dva zdroje pravdy = nekonzistence.

**Rozhodnutí:** Jednorázový import (C→A): přidat sloupce do DB (description, orientation, rooms, subtitle), seedovat z JSON, přepnout web na DB. JSON zachovat jako zálohu, ale nečíst z něj.

**Důvod:**
- Jeden zdroj pravdy (DB)
- Admin může editovat obsah bez deploymentu
- Žádný JSON maintenance overhead

**Alternativy:**
- A→C (DB → JSON): složitější, ztráta admin editovatelnosti
- Zachovat dual-source: technický dluh, divergence

**Důsledky:** `generateStaticParams` odstraněno z 5 stránek, `export const dynamic = 'force-dynamic'`, `getApartmentBySlugDB()` místo JSON funkcí. JSON funkce zachovány v kódu pro zpětnou kompatibilitu.

---

### [2026-05] DEC-022 — Shared AdminNav komponenta + mobilní bottom tab bar
**Status:** LOCKED

**Kontext:** Každá admin stránka měla vlastní hardcoded nav. Nekonzistence, missing items.

**Rozhodnutí:** Centrální `AdminNav` komponenta v `_components/admin-nav.tsx`. Desktop: horizontální nav. Mobil: slim top bar + fixed bottom tab bar (3 primární sekce + Více drawer s 5 sekundárními).

**Důvod:**
- DRY — jedna změna propaguje všude
- Mobile-first UX
- Viditelné aktivní sekce na všech zařízeních

**Důsledky:** Všechny admin stránky importují `<AdminNav />`. Stránky s bottom barem potřebují `pb-14` nebo spacer `div.h-14` na konci main obsahu.

---

### [2026-05] DEC-023 — revalidatePath nevolat v akcích které vrací data do UI
**Status:** LOCKED

**Kontext:** `sendMagicLink` volal `revalidatePath('/admin/majitele')` — způsobilo RSC re-render, který resetoval client component state před tím, než uživatel stihl zkopírovat magic link.

**Rozhodnutí:** `revalidatePath` NEVOLAT v server actions které vracejí data zobrazovaná klientem (magic link URL, generované tokeny atp.). Revalidovat pouze při mutacích datových záznamů (create, update, delete).

**Důvod:**
- RSC re-render resetuje veškerý client useState
- Uživatel ztratí výsledek akce dřív než ho použije

**Důsledky:** `sendMagicLink` neobsahuje `revalidatePath`. Uživatel vidí link dokud nerefreshuje ručně.

---

## Open Decisions (k řešení)

### [TBD] DEC-011 — Channel Manager — živé napojení
**Status:** OPEN

**Otázky:**
- Booking.com Connectivity API (real-time) vs iCal (batch, každou hodinu)?
- iCal je hotový. Connectivity API = budoucí upgrade?
- Airbnb Open API vyžaduje schválení partnera.

**Aktuální stav:** iCal sync implementován a funkční.

---

### [2026-05] DEC-012 — Owner Portal autentizace
**Status:** LOCKED (viz DEC-024 pro změnu login metody)

**Rozhodnutí:** Primární login = email + heslo (DEC-024). Invite magic link zůstává jako admin nástroj (`sendMagicLink` action). Route ochrana přes Next.js middleware — `/portal/**` vyžaduje platnou Supabase session. Multi-apartment owners: zatím 1:1 (owner vidí jen svůj apartmán).

**Middleware pattern:** `createSupabaseServerClient` v middleware → `getSession()` → redirect na `/portal/login` pokud no session.

---

### [TBD] DEC-013 — Commission model
**Status:** OPEN

**Otázky:**
- Flat rate vs tiered (vyšší obrat = nižší procento)?
- Per-apartment nebo per-owner?
- Sezónní rozdíly?

---

## Deprecated Decisions

### [2026-01] DEC-DEP-001 — Booking systém v Sprint 2
**Status:** DEPRECATED

**Původně:** Implementovat full booking v Sprint 2.
**Změna:** Pivot na lead capture (DEC-001).
**Důvod:** Business validace před komplexní implementací.

---

### [2026-05] DEC-015 — Apartment visibility flags
**Status:** LOCKED

**Kontext:** Apartmány mají různé stavy - k prodeji, pronájem, prodáno ale nepronajímá.

**Rozhodnutí:** Tři booleany na každém apartmánu:
- `for_sale` — zobrazit v sekci PRODEJ
- `for_rent` — zobrazit v sekci PRONÁJEM  
- `in_rental_program` — aktivní v booking engine

**Důvod:**
- Flexibilní kombinace (může být k prodeji A pronajímat)
- Admin kontrola bez změny kódu
- Opt-in/opt-out pro majitele

**Důsledky:** Admin dashboard musí umět tyto flags nastavovat.

---

### [2026-05] DEC-016 — Klientský portál pro všechny majitele
**Status:** LOCKED

**Kontext:** Majitelé apartmánů (i ti co nepronajímají) potřebují přístup k informacím.

**Rozhodnutí:** Jednotný klientský portál se třemi sekcemi:
1. **Můj apartmán** (všichni) — profil, dokumenty, údržba
2. **Pronájem** (opt-in) — kalendář, výnosy, blokace
3. **SVJ** (všichni) — nástěnka, diskuze, hlasování

**Důvod:**
- Jeden login pro vše
- Majitel vidí relevantní sekce dle svého statusu
- SVJ komunikace centralizovaná

**Reference:** Podobný portál v projektu FABR.

---

### [2026-05] DEC-017 — SVJ modul
**Status:** LOCKED

**Kontext:** Vlastníci apartmánů tvoří SVJ a potřebují komunikovat.

**Rozhodnutí:** Integrovaný SVJ modul v klientském portálu:
- Nástěnka (oznámení, pinned posts)
- Diskuze (témata, komentáře)
- Hlasování (polls s deadline)
- Dokumenty (stanovy, zápisy, finance)
- Kontakty (správce, opt-in pro ostatní vlastníky)

**Důvod:**
- Centralizace komunikace
- Není potřeba externí nástroj
- Audit trail všech rozhodnutí

---

### [2026-05] DEC-014 — Opt-in rental program
**Status:** LOCKED

**Kontext:** Majitel prodaného apartmánu se může rozhodnout pronajímat.

**Rozhodnutí:** 
1. Majitel požádá v portálu "Chci pronajímat"
2. Admin nastaví provizi a aktivuje `in_rental_program`
3. Apartmán se objeví v booking engine
4. Majitel vidí sekci Pronájem v portálu

**Důvod:**
- Kontrola nad kvalitou (admin schvaluje)
- Flexibilita pro majitele
- Provize nastavena před aktivací

**Důsledky:** Admin workflow pro onboarding majitelů do rental programu.

---

### [2026-07] DEC-029 — Fotky bytů: DB tabulka apartment_images místo mapování v kódu
**Status:** LOCKED

**Kontext:** Fotky žily v `src/data/apartment-images.ts` (mapování slug → složka v bucketu). Přidání nebo výměna fotky = zásah programátora + deploy. Stejná bolest jako DEC-021 s obsahem apartmánů.

**Rozhodnutí:** Tabulka `apartment_images` (apartment_id, storage_path, sort_order, UNIQUE(apartment_id, storage_path)) je zdroj pravdy. Migrace 010 + seed 010b naimportoval 158 stávajících fotek se zachovaným pořadím. Hlavní (hero) foto = nejnižší `sort_order`, žádný separátní flag. Statické mapování v kódu zůstává jako **fallback** — když DB vrátí prázdno, web ukáže původní fotky.

**Sdílené soubory:** Byty párů chata ↔ golden-ridge sdílejí 44 souborů. Každý byt má vlastní DB řádek; při mazání se soubor odstraní ze Storage jen tehdy, když na něj neodkazuje žádný jiný řádek.

**Důsledky:** `getApartmentImages`/`getApartmentHeroImage` jsou nově **async**. Seznamy musí použít `getHeroImagesBySlugs(slugs)` — jeden dotaz místo N (nelze awaitovat uvnitř `.map()` v JSX). Upload jde přímo z prohlížeče do Storage (FILE-01), bucket `apartmany` zůstává public kvůli CDN.

---

### [2026-10] DEC-031 — Vibekodex úroveň 4 v monorepu: QA a bezpečnostní test z `apps/web`, schéma QA = dump z produkce
**Status:** LOCKED

**Kontext:** Repo je pnpm monorepo (aplikace v `apps/web`, migrace v `supabase/`, archiv sprintu 3 v `nova/`). Skripty `os/qa` i `security_probe.py` počítají s jedním kořenem; z kořene repa probe skenoval i routy v `nova/` a neviděl middleware. Migrace v repu neodpovídají produkci (WORKLOG 7/2026: `svj_polls` nikdy neexistovala).

**Rozhodnutí:** QA kořen je `apps/web` (`supabase/` tam je symlink na `../../supabase`, jméno stacku `gra3` přes `"name"` v `qa.json`), `.vibekodex/security.json` leží v `apps/web`, týdenní test i CI běží na `apps/web`. Schéma QA se bere `--dump-schema` z produkce (parita ověřená), ne z migrací; sloupcové REVOKE doplňuje `supabase/qa/seed_grants.sql`. Serveroví klienti Supabase volají `fetch` s `cache: 'no-store'`.

**Alternativy:** (a) QA z kořene repa — `dev:qa` nemá kde spustit Next, probe hlásí fantomové routy; (b) opravit migrace, aby seděly s produkcí — dražší a nic nezaručí, dump je pravda; (c) `nova/` smazat — rozhodnutí uživatele, zatím ponecháno.

**Důsledky:** `/ship` krok 1b = `security_probe.py apps/web`. Nová migrace v produkci → znovu `local_db.sh apps/web --dump-schema nudiugowvzflokflcokd` + `--reset` + `parity.sh`. Každý nový serverový klient Supabase dědí `noStoreFetch`.

---

### [2026-10] DEC-030 — Růst hodnoty na /podil: krajský index ČSÚ místo čísla pro Špindlerův Mlýn
**Status:** LOCKED

**Kontext:** Právník požadoval k „8–12 % ročně ve Špindlerově Mlýně" zdroj, rok a varování. Rešerše ukázala, že pro samotné město žádná veřejná řada realizovaných cen neexistuje; dostupné bodové údaje mají různé metodiky a nelze z nich poctivě spočítat roční růst.

**Rozhodnutí:** Na webu se uvádí jen doložitelný údaj: index cen bytů ČSÚ (Ceny nemovitostí 2023–2025, tab. 2-6b, 2015 = 100) za Královéhradecký kraj — průměr 11 % ročně 2015–2025 s výslovnou zmínkou poklesu v roce 2023. Špindlerův Mlýn jen bodově (Deloitte 2023/2024 ~190 000 Kč/m²) s citací média a data. Vždy s varováním podle standardu čl. 44 odst. 4 nař. 2017/565 (minulost, není spolehlivý ukazatel, hodnota může klesat, nejde o doporučení).

**Alternativy:** (a) okres Trutnov 10,6 % p.a. 2023–2025 — jen dva roky, pod doporučených pět; (b) spojit město 2021 a Deloitte 2023 — 26 % p.a., metodicky nepoctivé; (c) číslo úplně vypustit — zbytečně oslabuje nabídku, když krajský údaj doložit lze.

**Důsledky:** Každé procento výnosu nebo zhodnocení na webu musí mít zdroj, rok, období a varování (platí i pro „2–5 % výnos z nájmu" — zatím označeno jen jako orientační). Při nové publikaci ČSÚ (vždy v létě) aktualizovat číslo a kód publikace. Smlouva bod 9 — právník.

---

### [2026-07] DEC-028 — Počet podílů: DB + PIN editor místo čísla v URL
**Status:** LOCKED (reviduje DEC-010)

**Kontext:** DEC-010 (číslo v URL /podil/[available]) znamenal editovat inzerované linky při každém prodeji podílu — na to se linkuje ze statických materiálů, měnit link pokaždé nejde.

**Rozhodnutí:** `/podil` je stabilní link — počet volných podílů čte z `app_settings.podil_available` (migrace 009). Editace: `/sprava-podilu` — stránka chráněná PINem (env `PODIL_PIN`), určená pro asistentku. Cookie = HMAC(PODIL_PIN), 30 dní, změna PINu zneplatní přístup. `/podil/[cislo]` zůstává funkční pro explicitní marketingové linky.

**Důsledky:** Asistentka mění číslo bez deploye a bez přístupu do admin panelu. Fallback 50 při výpadku DB. PIN v env — lokálně i Vercel production.

---

### [2026-07] DEC-025 — SVJ ankety: options jsonb na svj_posts, hlasy odděleně
**Status:** LOCKED

**Kontext:** CLAUDE.md počítal s tabulkou `svj_polls`, která nikdy nevznikla. Gotcha: votes[] v jsonb nelze chránit RLS a vznikají race conditions.

**Rozhodnutí:** Žádná `svj_polls` tabulka. Definice ankety žije přímo na `svj_posts` (type='poll'): `options jsonb` = `[{key: 'opt-1', label: 'Ano'}, ...]` + `poll_deadline timestamptz`. Hlasy odděleně v `svj_poll_votes` s `UNIQUE(post_id, owner_id)` — změna hlasu = upsert.

**Důsledky:** Options jsou po prvním hlasu immutable (updateSvjPost to vynucuje) — hlasy odkazují na klíče možností. Deadline = konec dne CET (+01:00).

---

### [2026-07] DEC-026 — Dokumenty: privátní bucket + signed URLs
**Status:** LOCKED

**Kontext:** SVJ dokumenty (stanovy, zápisy) a klientské dokumenty (kupní smlouvy) obsahují citlivá data — nesmí být ve veřejném bucketu.

**Rozhodnutí:** Privátní Storage bucket `dokumenty` (migrace 008). Upload: server action `createSignedUploadUrl` → browser nahrává přímo do Storage (FILE-01, obchází Vercel 4.5MB limit) → server action uloží metadata do DB (`svj_documents` / `owner_documents`), při selhání insertu cleanup souboru. Čtení: výhradně signed URLs (1h expirace) generované server action s ownership checkem.

**Struktura cest:** `svj/{ts}-{file}` pro SVJ, `owners/{ownerId}/{ts}-{file}` pro klientské. `saveOwnerDocument` validuje prefix cesty proti ownerId.

---

### [2026-07] DEC-027 — Portál mobilní nav: top bar + drawer
**Status:** LOCKED

**Kontext:** Portál měl fixed sidebar bez breakpointů — na mobilu nepoužitelný. Admin používá bottom tab bar (DEC-022), ale portál má 6 položek (Apartmán, Dokumenty, Údržba, SVJ, Pronájem, Profil) — do tab baru se nevejdou.

**Rozhodnutí:** Desktop (lg+): sidebar beze změny. Mobil: fixed top bar (brand + hamburger) + full-width drawer se všemi položkami a odhlášením. Main content `lg:ml-64 pt-14 lg:pt-0`.

---

### [2026-06] DEC-024 — Portal login: email + heslo místo magic link
**Status:** LOCKED

**Kontext:** Magic link vyžaduje funkční emailovou infrastrukturu (Resend + vlastní doména). Doména podzlatymnavrsim.cz zatím na Cloudflare/Wix — nelze nastavit DNS záznamy pro Vercel/Resend dokud nový web není live. Blokuje testování portálu.

**Rozhodnutí:** Primární login portálu = email + heslo (`supabase.auth.signInWithPassword`). Admin vytváří uživatele ručně v Supabase dashboard. Magic link invite flow (`sendMagicLink` server action) zůstává jako backup pro budoucí onboarding.

**Důvod:**
- Testování portálu bez emailové infrastruktury
- Jednodušší UX — majitelé znají heslo, nepotřebují email při každém přihlášení
- Magic link lze přidat zpět jako "zaslat odkaz" po přechodu domény

**Důsledky:** Při tvorbě majitele admin: (1) vytvoří uživatele v Supabase Auth s heslem, (2) propojí `owners.user_id`.
