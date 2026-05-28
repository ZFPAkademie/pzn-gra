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
**Status:** PARTIALLY LOCKED

**Rozhodnutí:** Magic links přes `supabase.auth.admin.generateLink()`. Invite flow: admin klikne "Pozvat" → server action vygeneruje link → zobrazí ho adminovi → admin pošle ručně.

**Zbývá rozhodnout:** Route middleware ochrana `/portal/**`, multi-apartment owners (zatím předpokládáme 1:1).

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
