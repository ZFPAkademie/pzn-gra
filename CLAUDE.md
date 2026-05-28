# CLAUDE.md
## Pod Zlatým návrším — Instrukce pro Claude

---

## ROLE

Jsi **senior fullstack developer a systémový architekt** pro Pod Zlatým návrším.

Nepíšeš obecné rady. Implementuješ konkrétní produkční kód.
Pracuješ evolučně — nikdy nepřepisuješ fungující části bez důvodu.

---

## PROJEKT

**Pod Zlatým návrším** — Prémiový apartmánový resort ve Špindlerově Mlýně s integrovaným property management systémem a SVJ portálem.

### Business model & architektura

```
┌─────────────────────────────────────────────────────────────────┐
│                        VEŘEJNÝ WEB                              │
├─────────────────────────────────────────────────────────────────┤
│  PRODEJ              │  PRONÁJEM              │  PODÍLY        │
│  (apartmány k prodeji)│  (apartmány v programu)│  (50 podílů)   │
│  → Lead capture      │  → Online booking      │  → Lead capture│
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BOOKING ENGINE                               │
├─────────────────────────────────────────────────────────────────┤
│  Kalendář dostupnosti │ Dynamický ceník │ Rezervace │ Platby   │
│  Blokace majitelů     │ Sezónní ceny    │ Check-in  │ Stripe   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHANNEL MANAGER                                │
├─────────────────────────────────────────────────────────────────┤
│  Booking.com API  │  Airbnb API  │  Vlastní web (primární)     │
│  ← sync kalendář  │  ← sync      │                             │
│  → import reserv. │  → import    │                             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD                               │
├─────────────────────────────────────────────────────────────────┤
│  Všechny apartmány  │  Nastavení provizí  │  Výplaty majitelům │
│  Všichni majitelé   │  Ceníky & sezóny    │  Revenue analytika │
│  Rezervace & hosté  │  Channel settings   │  SVJ správa        │
│  Viditelnost apt.   │  Klientské účty     │  Dokumenty         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    KLIENTSKÝ PORTÁL                             │
│              (všichni majitelé apartmánů)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  MŮJ APARTMÁN   │  │  PRONÁJEM       │  │  SVJ            │ │
│  │  (všichni)      │  │  (opt-in)       │  │  (všichni)      │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │  Profil apt.    │  │  Kalendář       │  │  Nástěnka       │ │
│  │  Dokumenty      │  │  Rezervace      │  │  Hlasování      │ │
│  │  Fotogalerie    │  │  Výnosy/provize │  │  Dokumenty      │ │
│  │  Údržba         │  │  Blokace        │  │  Diskuze        │ │
│  │                 │  │  Statistiky     │  │  Kontakty       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stavy apartmánů (viditelnost)

```
┌────────────────────────────────────────────────────────────────┐
│  STAV APARTMÁNU          │ WEB PRODEJ │ WEB PRONÁJEM │ PORTÁL │
├────────────────────────────────────────────────────────────────┤
│  K prodeji               │     ✅     │      ❌      │   ❌   │
│  K prodeji + pronajímá   │     ✅     │      ✅      │   ✅   │
│  Prodáno + pronajímá     │     ❌     │      ✅      │   ✅   │
│  Prodáno + nepronajímá   │     ❌     │      ❌      │   ✅   │
│  Prodáno + opt-in later  │     ❌     │    (možné)   │   ✅   │
└────────────────────────────────────────────────────────────────┘
```

### Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payments:** Stripe (Checkout + Connect pro výplaty)
- **Email:** Resend
- **Hosting:** Vercel
- **Channel Manager:** Booking.com Partner API, Airbnb API
- **Reference:** Podobný klientský portál existuje v projektu FABR

---

## AKTUÁLNÍ STAV (v24 — 28.5.2026)

### ✅ Implementováno
- Veřejný web s Alpine Quiet Luxury design systémem — data z DB (migrace 007)
- Homepage, stránky apartmánů (prodej + pronájem), /podil
- Lead capture systém (4 typy leadů) + admin inbox
- Supabase Storage integrace (fotky)
- **Booking engine** — kalendář, ceník (pricing_rules + min_nights), bankovní převod + SPD QR kód
- **Rezervační karta** — /rezervace/[token], messaging host↔admin
- **Resend emaily** — 3 transakční šablony (soft-fail)
- **iCal channel manager** — import Booking.com/Airbnb, export feed, admin UI, Vercel Cron
- **Admin panel — 8 sekcí** se shared nav (desktop + mobilní bottom tab bar):
  - Leady, Rezervace, Apartmány + detail (/admin/apartmany/[id])
  - Majitelé + invite magic link (owners.user_id linkován)
  - Ceníky (CRUD), Blokace (CRUD), SVJ, Channels
- DB migrace 001–007 spuštěné

### 🚧 K implementaci
- [ ] Klientský portál — /portal route ochrana (middleware)
- [ ] Klientský portál — Můj apartmán, SVJ, dokumenty
- [ ] Admin — visibility flags UI (for_sale/for_rent/in_rental_program)
- [ ] Blokace — edit formulář (jen delete)
- [ ] Stripe platby (čeká na schválení managera)
- [ ] Channel Manager credentials (Booking.com/Airbnb přístupy od managera)

### Env vars potřeba v Vercel
RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL, BANK_IBAN, BANK_NAME, CRON_SECRET

---

## ZÁVAZNÁ PRAVIDLA

### Architektura
- **Supabase-first** — vše v PostgreSQL s RLS
- **Multi-tenant** — `owner_id` + `apartment_id` na všech tabulkách
- **Role-based access:** admin, owner, guest
- **Audit trail** — každá mutace → `audit_log`
- **Soft delete** — `deleted_at` místo DELETE

### Apartmány - visibility flags
```typescript
interface Apartment {
  // Základní
  id: string;
  slug: string;
  owner_id: string | null;  // null = neprodáno
  
  // Visibility flags (admin nastavuje)
  for_sale: boolean;        // Zobrazit v sekci PRODEJ
  for_rent: boolean;        // Zobrazit v sekci PRONÁJEM
  in_rental_program: boolean; // Aktivní v booking engine
  
  // Status
  status: 'available' | 'reserved' | 'sold';
}
```

### Kód
- Evoluční migrace — `ALTER TABLE`, nikdy `DROP` bez souhlasu
- Soft fail pro external API
- Server components default
- `str_replace` místo přepisování souborů

---

## DESIGN TOKENS

```typescript
colors: {
  navy: '#0B1626',      // Primární dark
  gold: '#C9A24D',      // CTA, akcenty
  stone: '#F4F6F8',     // Pozadí sekcí
  forest: '#1F2F2A',    // Doplňkové
  cream: '#FAFAF7',     // Světlé pozadí
}
```

- `font-light` pro headings
- Alpine ornamenty (SVG komponenty)
- Žádné emoji, žádné bold headings

---

## CO NESMÍŠ

- ❌ Přepisovat celé soubory
- ❌ Mazat obsah při redesignu
- ❌ Zmiňovat "apartmán č. 7" na /podil
- ❌ DROP TABLE bez souhlasu
- ❌ Hardcodovat ceny nebo visibility

---

## DATOVÝ MODEL (CÍLOVÝ)

```sql
-- ═══════════════════════════════════════════════════════════
-- APARTMÁNY & VLASTNÍCI
-- ═══════════════════════════════════════════════════════════

apartments (
  id uuid PRIMARY KEY,
  slug text UNIQUE,
  building text,
  unit text,
  layout text,
  area_m2 decimal,
  floor int,
  
  -- Vlastnictví
  owner_id uuid REFERENCES owners(id),
  status text CHECK (status IN ('available', 'reserved', 'sold')),
  
  -- Visibility (admin nastavuje)
  for_sale boolean DEFAULT false,
  for_rent boolean DEFAULT false,
  in_rental_program boolean DEFAULT false,
  
  -- Metadata
  features jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

owners (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  
  -- Kontakt
  name text,
  email text,
  phone text,
  
  -- Finance
  bank_account text,
  commission_rate decimal,  -- Admin nastavuje
  
  -- Status
  is_active boolean DEFAULT true,
  created_at timestamptz
);

-- ═══════════════════════════════════════════════════════════
-- BOOKING ENGINE
-- ═══════════════════════════════════════════════════════════

reservations (
  id uuid PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id),
  guest_id uuid REFERENCES guests(id),
  
  check_in date,
  check_out date,
  nights int,
  
  -- Finance
  total_price decimal,
  commission decimal,
  net_to_owner decimal,
  currency text DEFAULT 'EUR',
  
  -- Status
  status text CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  source text CHECK (source IN ('direct', 'booking', 'airbnb')),
  
  -- Stripe
  stripe_payment_id text,
  
  created_at timestamptz
);

guests (
  id uuid PRIMARY KEY,
  name text,
  email text,
  phone text,
  nationality text,
  notes text,
  created_at timestamptz
);

blocked_dates (
  id uuid PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id),
  owner_id uuid REFERENCES owners(id),
  
  start_date date,
  end_date date,
  reason text,  -- 'owner_use', 'maintenance', 'other'
  
  created_at timestamptz
);

pricing_rules (
  id uuid PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id),
  
  season text,  -- 'low', 'mid', 'high', 'peak'
  start_date date,
  end_date date,
  price_per_night decimal,
  min_nights int,
  
  created_at timestamptz
);

-- ═══════════════════════════════════════════════════════════
-- CHANNEL MANAGER
-- ═══════════════════════════════════════════════════════════

channel_connections (
  id uuid PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id),
  
  channel text CHECK (channel IN ('booking', 'airbnb', 'expedia')),
  external_id text,
  sync_enabled boolean DEFAULT true,
  last_sync timestamptz,
  
  created_at timestamptz
);

-- ═══════════════════════════════════════════════════════════
-- FINANCE & PROVIZE
-- ═══════════════════════════════════════════════════════════

commission_settings (
  id uuid PRIMARY KEY,
  apartment_id uuid REFERENCES apartments(id),
  owner_id uuid REFERENCES owners(id),
  
  rate decimal,  -- např. 0.20 = 20%
  effective_from date,
  
  created_at timestamptz
);

payouts (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES owners(id),
  
  period_start date,
  period_end date,
  
  gross_amount decimal,
  commission_amount decimal,
  net_amount decimal,
  currency text DEFAULT 'EUR',
  
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id text,
  
  created_at timestamptz
);

-- ═══════════════════════════════════════════════════════════
-- SVJ MODUL
-- ═══════════════════════════════════════════════════════════

svj_posts (
  id uuid PRIMARY KEY,
  author_id uuid REFERENCES owners(id),
  
  type text CHECK (type IN ('announcement', 'discussion', 'poll', 'document')),
  title text,
  content text,
  
  is_pinned boolean DEFAULT false,
  
  created_at timestamptz,
  updated_at timestamptz
);

svj_comments (
  id uuid PRIMARY KEY,
  post_id uuid REFERENCES svj_posts(id),
  author_id uuid REFERENCES owners(id),
  
  content text,
  
  created_at timestamptz
);

svj_polls (
  id uuid PRIMARY KEY,
  post_id uuid REFERENCES svj_posts(id),
  
  question text,
  options jsonb,  -- [{id, text, votes: [owner_ids]}]
  deadline timestamptz,
  
  created_at timestamptz
);

svj_documents (
  id uuid PRIMARY KEY,
  
  category text,  -- 'stanovy', 'zapisy', 'finance', 'ostatni'
  title text,
  file_url text,
  
  uploaded_by uuid REFERENCES owners(id),
  created_at timestamptz
);

-- ═══════════════════════════════════════════════════════════
-- LEADS & AUDIT
-- ═══════════════════════════════════════════════════════════

leads (
  id uuid PRIMARY KEY,
  type text,
  name text,
  email text,
  phone text,
  message text,
  status text,
  metadata jsonb,
  created_at timestamptz
);

audit_log (
  id uuid PRIMARY KEY,
  table_name text,
  record_id uuid,
  action text,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz
);
```

---

## KLIENTSKÝ PORTÁL - UX SPEC

### Přístup
- Supabase Auth (magic link preferovaný)
- Admin zve majitele (invitation flow)
- Role: `owner` v user metadata

### Sekce pro VŠECHNY majitele

**1. Můj apartmán**
- Základní info (dispozice, plocha, patro)
- Fotogalerie (může uploadovat)
- Dokumenty (kupní smlouva, předávací protokol)
- Historie údržby

**2. SVJ**
- Nástěnka (oznámení, novinky)
- Diskuze (témata, komentáře)
- Hlasování (polls s deadline)
- Dokumenty (stanovy, zápisy ze schůzí)
- Kontakty (správce, ostatní vlastníci - opt-in)

### Sekce pro majitele V RENTAL PROGRAMU

**3. Pronájem** (zobrazí se jen pokud `in_rental_program = true`)
- Dashboard (obsazenost, výnosy tento měsíc)
- Kalendář rezervací
- Historie rezervací
- Výnosy & provize
- Blokace termínů (vlastní využití)
- Statistiky (roční přehled)

### Admin může
- Nastavit `in_rental_program` pro každý apartmán
- Nastavit provizi per apartmán/owner
- Pozvat majitele do portálu
- Spravovat SVJ obsah
- Vidět vše

---

## KONTEXT SOUBORŮ

Před implementací přečti (soubory jsou v ROOT projektu):
- `PROJECT_SNAPSHOT.md` — aktuální stav a roadmap
- `LESSONS_LEARNED.md` — co nefunguje, co opakovat
- `DECISION_LOG.md` — architektonická rozhodnutí (DEC-001..DEC-017+)
- `nova/SPRINT3_BOOKING_REFERENCE.md` — booking engine reference (SQL + API + libs)
- `nova/golden-ridge-sprint3/` — zdrojový kód booking engine (k extrakci pro Fázi 2)

---

## REFERENCE PROJEKTY

- **FABR** — podobný klientský portál (Claude zná tento projekt)
  - Pattern: parent→swimmer = owner→apartment (DB-01 ownership check)

---

## JAK PRACUJEME

1. Popis požadavku → projdi VIBEKODEX_MODULE_PROTOCOL.md Fáze 0 (7 otázek)
2. Kontrola existujícího kódu
3. Návrh implementace → schválení (GO / HOLD)
4. Implementace po modulech
5. `npm run build` test
6. Git commit + push
7. SQL migrace ručně v Supabase

---

## VIBECODEX INTEGRACE

Tento projekt staví dle **Vibecodex OS**. Při každém novém modulu:
- Přečti `VIBEKODEX_MODULE_PROTOCOL.md` — Fáze 0 (7 otázek povinně)
- Najdi relevantní pattern v `VIBEKODEX_PATTERNS.md` nebo `VIBEKODEX_ADVANCED.md`
- Zapiš do `PATTERNS_CONTRIB` pokud implementuješ něco nového a opakovatelného

### Pattern mapping — tento projekt

| Modul / situace | Pattern | Proč |
|-----------------|---------|------|
| Owner portal auth | **AUTH-01** (Magic Link + HMAC token) | Majitelé bez hesla, invite flow |
| Route ochrana | **AUTH-04** (Middleware bypass) | /portal chráněn, veřejné stránky volné |
| Owner → apartment access | **DB-01** (Admin client + manual ownership) | Owner vidí jen svůj apartmán |
| Nové tabulky | **DB-06** (GRANT na nové tabulky) | Každá migrace — bez GRANT tichý fail |
| check_in / check_out datumy | **DB-03** (Timezone safe dates) | CET vs UTC posun dne |
| Kalendářová logika | **DB-05** (today mimo async closure) | Promise.all v dostupnostních dotazech |
| Soft delete rezervací | **APP-02** (Soft delete) | FK reference na guests, payments |
| Status rezervace inline | **UI-02** (Inline edit auto-save) | Změna statusu bez modalu |
| Upload dokumentů | **FILE-01** (Direct Storage upload) | Vercel serverless 4.5MB limit |
| Booking.com import | **DATA-01** (Scraping + Normalizace) | Chunking, canonical typy, defensive access |
| Booking.com webhook | **PIPE-01** (Webhook + Validace + Idempotence) | Duplicitní eventy, auth header |
| Realtime kalendář | **ASYNC-02** (Realtime Subscribe setup) | Live dostupnost, setAuth před subscribe |
| Server actions | **ERR-02** (Response shape) | `{ ok, error }` vždy, nikdy throws |
| Každá migrace | **ERR-01** (Silent fail prevention) | GRANT, upsert+partial index, audit try/catch |
| Emaily (potvrzení, invite) | **EMAIL-01** (Resend setup) | Supabase rate limit bypass pro bulk |
| SVJ oznámení | **NOTIF-01** (In-app notification bell) | dedupe_key per post/event |
| Bulk invite majitelů | **AUTH-03** (Email rate limit bypass) | createUser místo inviteUserByEmail |

### Kritické gotchy — pouze pro tento projekt

```
❌ blocked_dates chybí UNIQUE(apartment_id, date) → duplicity → přidat v první migraci
❌ svj_polls.options = jsonb s votes[] → nelze RLS, race conditions → separátní svj_poll_votes
❌ Admin auth = Base64 cookie → BLOCKER před owner portálem → nahradit Supabase Auth
❌ Middleware = pass-through → opravit na začátku Fáze 2 před jakýmkoli portálem
❌ bank_account = plain text → šifrovat před produkcí Stripe Connect
❌ pricePerNight v canonical JSON → přesunout do DB při implementaci bookingu
```

### Multijazyk

Projekt je multijazyčný. Aktuálně **cs + en**, architektura připravena na rozšíření.
- `lib/i18n.ts` — locale helpers, cookie-based detekce
- `components/providers/language-provider.tsx` — `useLanguage()` hook
- `locales/index.ts` — překlady `{ cs: {...}, en: {...} }`
- Server components: čtou cookie. Client components: `useLanguage()`.

Přidání nového jazyka (PL, DE):
1. Přidat klíče do `locales/index.ts`
2. Přidat do language-switcher options
3. Všechny nové texty (portál, booking) psát ihned do obou/všech jazyků

---

## PATTERNS_CONTRIB

```
[2026-05] canonical-json-source-of-truth — JSON soubor jako zdroj pravdy pro statická data.
  Platí pro data která se mění zřídka (apartmány, features). Migrovat do DB při bookingu.
  → kandidát VIBEKODEX_PATTERNS.md / DB sekce

[2026-05] base64-admin-auth-antipattern — Base64 cookie není kryptografie. Admin systém
  s citlivými daty vždy Supabase Auth + role v user_metadata. Nikdy vlastní token bez HMAC.
  → kandidát VIBEKODEX_PATTERNS.md / AUTH sekce (anti-pattern)

[2026-05] sprint-not-merged-antipattern — Booking engine implementován v izolaci (ZIP),
  nikdy mergnut do main. Kód existuje ale není integrovaný, práce ztracena.
  Prevence: každý sprint = merge do main, ne ZIP deliverable.
  → kandidát Vibecodex Error Patterns (sekce 7)
```

---

*Verze: v24 | Aktualizace: 28.5.2026*
