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

## AKTUÁLNÍ STAV (v21)

### ✅ Implementováno
- Veřejný web s Alpine Quiet Luxury design systémem
- Homepage, stránky apartmánů (prodej + pronájem)
- Lead capture systém (4 typy leadů)
- Supabase Storage integrace (fotky)
- Admin inbox pro leady
- Investiční kalkulačka
- Stránka družstevních podílů (/podil)

### 🚧 K implementaci (Fáze 2-5)
- [ ] Booking engine
- [ ] Channel manager
- [ ] Klientský portál (owner + SVJ)
- [ ] Admin dashboard v2
- [ ] Stripe Connect

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

Před implementací přečti:
- `docs/PROJECT_SNAPSHOT.md` — aktuální stav
- `docs/LESSONS_LEARNED.md` — co nefunguje
- `docs/DECISION_LOG.md` — architektonická rozhodnutí

---

## REFERENCE PROJEKTY

- **FABR** — podobný klientský portál (Claude zná tento projekt)

---

## JAK PRACUJEME

1. Popis požadavku
2. Kontrola existujícího kódu
3. Návrh implementace → schválení
4. Implementace po modulech
5. `npm run build` test
6. Git commit + push
7. SQL migrace ručně v Supabase

---

*Verze: v21 | Aktualizace: 27.5.2026*
