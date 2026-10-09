# PROJECT_SNAPSHOT.md
## Pod Zlatým návrším — Stav projektu

**Datum:** 30. července 2026  
**Verze:** v27  
**Status:** Funkčně hotovo (web + booking + admin + portál + SVJ). Blokuje spuštění: ceníky a DNS.

### ⚠️ Kde projekt reálně běží
- **`https://pzn-gra.vercel.app`** — jediná živá adresa nového webu
- **`podzlatymnavrsim.cz` NENÍ náš web** — DNS stále míří na Wix (ověřeno 29.7.2026).
  Alias ve Vercelu je nastavený, přepnutí DNS je otevřený úkol.

### Přístupy (tři oddělené systémy — nepleť si je)
| Kde | Adresa | Přihlášení |
|-----|--------|-----------|
| Administrace | `/admin` | pouze heslo `ADMIN_DASH_PASSWORD` (= `zlato`, slabé → doporučena změna). Supabase Auth se tu NEPOUŽÍVÁ. |
| Klientský portál | `/portal` | Supabase Auth, e-mail + heslo. Funkční účet: `obelsky@gmail.com`. `gra@podzlatymnavrsim.cz` má heslo, ale chybí mu vazba v `owners` → odmítne ho. |
| Správa podílů | `/sprava-podilu` | PIN z env `PODIL_PIN` (= `943702`) |

### Další krok
1. 🔴 Doplnit ceníky pro 7 bytů v `/admin/ceniky` — bez nich nejdou rezervovat
2. 🔴 Přepnout DNS ostré domény (odblokuje i Resend e-maily / magic link)
3. Projít E2E rezervaci (platební údaje jsou od 30.7. konečně správné)

---

## 1. Celkový záměr systému

### Vize
**Pod Zlatým návrším** je prémiový apartmánový resort ve Špindlerově Mlýně (~18 apartmánů ve 2 chatách) s:
- Integrovaným property management systémem
- Klientským portálem pro všechny majitele
- SVJ modulem pro komunikaci vlastníků
- Booking engine s channel managerem

### Typy apartmánů a jejich zobrazení

```
┌─────────────────────────────────────────────────────────────────┐
│                    VŠECHNY APARTMÁNY (~18)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ K PRODEJI   │  │ PRODÁNO     │  │ PRODÁNO     │             │
│  │ + PRONÁJEM  │  │ PRONAJÍMÁ   │  │ NEPRONAJÍMÁ │             │
│  │   (3)       │  │   (~7)      │  │   (~8)      │             │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤             │
│  │ Web: PRODEJ │  │ Web: PRONA. │  │ Web: ❌     │             │
│  │ Web: PRONA. │  │ Portál: ✅  │  │ Portál: ✅  │             │
│  │ Portál: ❌  │  │ SVJ: ✅     │  │ SVJ: ✅     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  Majitel se může kdykoliv rozhodnout:                          │
│  • Přidat apartmán do rental programu (opt-in)                 │
│  • Odebrat z rental programu (opt-out)                         │
│  • Admin nastavuje visibility flags                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Business modely

#### A) Prodej apartmánů (aktuálně 3)
- Lead capture → kontakt obchodníka → offline prodej
- Po prodeji: majitel získá přístup do portálu
- Může se rozhodnout pronajímat (opt-in)

#### B) Pronájem apartmánů (~10 v programu)
- Online booking s platbou kartou
- Channel manager (Booking.com, Airbnb)
- Majitelé dostávají výnosy mínus provize

#### C) Družstevní podíly (50 podílů)
- Pouze apartmán 7 (nezmiňovat číslo)
- Lead capture → osobní schůzka

#### D) SVJ komunikace (všichni majitelé)
- Nástěnka, diskuze, hlasování
- Dokumenty (stanovy, zápisy)
- Kontakty na správce

---

## 2. Systémové komponenty

### 2.1 Veřejný web (✅ HOTOVO)
- Homepage, info stránky
- Sekce PRODEJ (apartmány s `for_sale=true`)
- Sekce PRONÁJEM (apartmány s `for_rent=true`)
- Lead capture formuláře
- Investiční kalkulačka

### 2.2 Booking Engine (✅ HOTOVO — Fáze 2)
- Kalendář dostupnosti (single-month widget, range selection)
- Ceníky z DB (pricing_rules), min_nights enforcement
- Rezervační flow — bankovní převod + SPD QR kód
- Rezervační karta /rezervace/[token], messaging host↔admin
- Admin panel + potvrzení platby + check-in info
- Transakční emaily (Resend, soft-fail)

### 2.3 Channel Manager (✅ Infrastruktura — Fáze 3)
- iCal import z Booking.com/Airbnb → blocked_dates
- iCal export /api/v1/ical/[token]
- Admin UI /admin/channel-manager
- Vercel Cron každou hodinu
- Živé přihlašovací údaje z Booking.com/Airbnb: ČEKÁ

### 2.4 Admin Dashboard (✅ HOTOVO — 10 sekcí)
```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  APARTMÁNY           MAJITELÉ            REZERVACE              │
│  • Seznam všech      • Seznam všech      • Všechny rezervace    │
│  • Nastavit flags    • Pozvat do portálu • Check-in/out         │
│  • Visibility        • Nastavit provizi  • Kalendář             │
│                      • Bank účty         • Hosté                │
│                                                                 │
│  FINANCE             SVJ                 NASTAVENÍ              │
│  • Výplaty           • Spravovat posty   • Ceníky               │
│  • Revenue report    • Dokumenty         • Sezóny               │
│  • Provize přehled   • Polls             • Channel manager      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Klientský Portál (✅ HOTOVO — mobilně responsive)
```
┌─────────────────────────────────────────────────────────────────┐
│  KLIENTSKÝ PORTÁL (pro všechny majitele)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MŮJ APARTMÁN (všichni)     PRONÁJEM (opt-in)    SVJ (všichni) │
│  ─────────────────────      ─────────────────    ───────────── │
│  • Profil apartmánu         • Dashboard          • Nástěnka    │
│  • Fotogalerie              • Kalendář           • Diskuze     │
│  • Dokumenty                • Rezervace          • Hlasování   │
│  • Údržba                   • Výnosy/provize     • Dokumenty   │
│                             • Blokace            • Kontakty    │
│                             • Statistiky         •             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  "Chci pronajímat"                                      │   │
│  │  → Požádat admina o zařazení do rental programu        │   │
│  │  → Admin nastaví provizi a aktivuje                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Aktuální stav (v27 — 30.7.2026)

### ✅ Hotovo
| Komponenta | Status | Poznámky |
|------------|--------|----------|
| Homepage | ✅ | Alpine Quiet Luxury design |
| Stránky prodej | ✅ | 3 apartmány, data z DB |
| Stránky pronájem | ✅ | 8 apartmánů, data z DB |
| Stránka podíl | ✅ | Počet volných podílů z DB, edituje asistentka na /sprava-podilu (DEC-028) |
| Lead capture | ✅ | 4 typy leadů |
| Admin inbox (leady) | ✅ | Status, detail, odpověď |
| Supabase Storage | ✅ | Fotky apartmánů |
| **Booking engine** | ✅ | Kalendář, ceník, min_nights, rezervační flow |
| **Rezervační karta** | ✅ | /rezervace/[token], QR platba |
| **Messaging** | ✅ | Host ↔ admin (30s polling) |
| **Admin rezervace** | ✅ | Seznam, detail, potvrzení, check-in info |
| **Transakční emaily** | ✅ | Resend — 3 šablony (soft-fail) |
| **iCal channel manager** | ✅ | Import z Booking.com/Airbnb, export, cron |
| **Admin apartmány** | ✅ | Seznam + detail (/admin/apartmany/[id]) |
| **Admin ceníky** | ✅ | CRUD pricing_rules per apartmán |
| **Admin blokace** | ✅ | Správa blocked_dates (ne-iCal) |
| **Admin majitelé** | ✅ | CRUD + invite magic link → owners.user_id |
| **Admin shared nav** | ✅ | Všechny sekce, mobilní bottom tab bar |
| **Migrace 007** | ✅ | Data apartmánů v DB (title, desc, orientation, rooms) |
| **Admin blokace — edit** | ✅ | updateBlock action + EditBlockForm inline |
| **Portal login — email+heslo** | ✅ | Přechod z magic link na signInWithPassword (DEC-024) |
| **Portal — základní struktura** | ✅ | Layout, nav, Můj apartmán, SVJ nástěnka, Pronájem dashboard, Blokace |
| **Portal — redirect loop fix** | ✅ | Middleware + no_access error stránka |
| **Portal — mobilní layout** | ✅ | Top bar + drawer (DEC-027), responsive grids |
| **Portal — pronajem fix sloupců** | ✅ | 🔴 bug: nights_count/total_price_cents → nights/total_amount_cents |
| **SVJ — detail + komentáře** | ✅ | /portal/svj/[id], add/delete own, admin moderace |
| **SVJ — hlasování** | ✅ | options jsonb + svj_poll_votes upsert (DEC-025), optimistic UI |
| **SVJ — dokumenty** | ✅ | Privátní bucket + signed URLs (DEC-026), admin upload/edit/delete |
| **SVJ admin — edit postů** | ✅ | updateSvjPost, soft delete (archived_at), author moderace |
| **Portal — dokumenty klienta** | ✅ | /portal/dokumenty (owner_documents), admin /admin/dokumenty |
| **Portal — údržba** | ✅ | /portal/udrzba hlášení závad, admin /admin/udrzba (status chips + note) |
| **Sitemap z DB** | ✅ | Slugy dle visibility flags, /podil přidán, revalidate 1h |
| **Migrace 008** | ✅ | Poll options, archived_at, GRANTy, bucket dokumenty |
| **/sprava-podilu** | ✅ | PIN stránka pro asistentku — počet volných podílů (DEC-028, migrace 009) |
| **Fotogalerie bytů** | ✅ | Admin upload/řazení/mazání fotek (DEC-029, migrace 010 + seed 158 fotek) |

### 🚧 K implementaci
| Komponenta | Priorita | Závislosti |
|------------|----------|------------|
| **PRODUKCE — rezervace live** | 🔴 KRITICKÉ | Viz checklist níže — ceníky jen 1/8 apartmánů! |
| Channel Manager credentials | HIGH | Booking.com/Airbnb přístupy od managera |
| Admin — subtitle/rooms edit na detailu | MEDIUM | Zobrazují se veřejně, ale nejdou editovat |
| `lead-form.tsx:296` — přebývající `)}` | LOW | tsc hlásí TS1381 (schová `ignoreBuildErrors`), běh webu OK |
| Stripe platby | LOW | Manager approval |
| Stripe Connect (výplaty) | LOW | Portál + Stripe |

### 🔴 Checklist pro spuštění rezervací v produkci
| Krok | Status | Akce |
|------|--------|------|
| **DNS ostré domény** | 🔴 | Ověřeno 29.7.2026: podzlatymnavrsim.cz stále míří na WIX (apex → 301 na www → wixdns.net). Nový web běží POUZE na pzn-gra.vercel.app. Alias v Vercelu je nastavený, chybí přepnout DNS. |
| Vercel env vars | ✅ | 30.7.2026 doplněno BANK_IBAN, BANK_NAME, EMAIL_FROM, NEXT_PUBLIC_APP_URL — do té doby se hostům zobrazoval zástupný IBAN `CZ00 0000…`! Chybí už jen ADMIN_EMAIL (fallback rezervace@podzlatymnavrsim.cz). |
| Resend doména | ❓ | DNS záznamy pro podzlatymnavrsim.cz ověřeny? |
| Ceníky v DB | 🔴 | Ověřeno 28.7.: pricing_rules má jen 1/8 pronajímaných apartmánů — doplnit! |
| Apartmány viditelné | ✅ | Ověřeno 28.7.: 8× for_rent + in_rental_program, 3× for_sale |
| E2E test rezervace | ❓ | Projít celý flow od výběru termínu po potvrzení |
| Channel Manager URL | ❓ | iCal URL z Booking.com/Airbnb vloženy do /admin/channel-manager |

---

## 4. Apartmány - visibility flags

### Datový model
```typescript
interface Apartment {
  // Základní
  id: string;
  slug: string;
  building: string;  // "Chata 1" | "Chata 2"
  unit: string;      // "Suite 7"
  
  // Vlastnictví
  owner_id: string | null;  // null = neprodáno
  status: 'available' | 'reserved' | 'sold';
  
  // Visibility (admin nastavuje)
  for_sale: boolean;         // Zobrazit v sekci PRODEJ
  for_rent: boolean;         // Zobrazit v sekci PRONÁJEM
  in_rental_program: boolean; // Aktivní v booking engine
}
```

### Příklady
| Apartmán | owner_id | for_sale | for_rent | in_rental_program | Kde se zobrazí |
|----------|----------|----------|----------|-------------------|----------------|
| Suite 7 | null | true | true | true | PRODEJ + PRONÁJEM |
| Suite 9 | owner_1 | false | true | true | PRONÁJEM + Portál |
| Suite 2 | owner_2 | false | false | false | Pouze Portál |

---

## 5. Reference projekty

### FABR
- Podobný klientský portál
- Claude zná tento projekt
- Lze použít jako vzor pro auth flow a dashboard

---

## 6. Roadmap

### Fáze 1 — Lead Capture (✅ HOTOVO)
- [x] Veřejný web
- [x] Lead formuláře
- [x] Admin inbox

### Fáze 2 — Booking Engine ✅ HOTOVO
- [x] Kalendář dostupnosti (single-month widget, range selection)
- [x] Ceníky z DB (pricing_rules), min_nights enforcement
- [x] Rezervační flow — bankovní převod + SPD QR kód
- [x] Rezervační karta /rezervace/[token]
- [x] Messaging host ↔ admin
- [x] Admin panel rezervací + check-in info
- [x] Transakční emaily (Resend)
- [ ] Stripe Checkout (čeká na schválení managera)

### Fáze 3 — Channel Manager ✅ HOTOVO (infrastruktura)
- [x] iCal import z Booking.com/Airbnb → blocked_dates
- [x] iCal export /api/v1/ical/[token] pro externí kanály
- [x] Admin UI /admin/channel-manager
- [x] Vercel Cron každou hodinu
- [ ] Připojit URL adresy s manažerem (přístupy do Booking.com/Airbnb)

### Fáze A — Admin Panel ✅ HOTOVO (průběžně)
- [x] Shared AdminNav komponenta (desktop + mobilní bottom tab bar)
- [x] Admin apartmány — seznam + detail /admin/apartmany/[id]
- [x] Admin ceníky — CRUD pricing_rules
- [x] Admin blokace — CRUD blocked_dates + edit
- [x] Admin majitelé — CRUD + invite magic link
- [x] Data apartmánů migrována z JSON do DB (migrace 007)
- [x] Visibility flags UI (for_sale, for_rent, in_rental_program toggle)
- [x] Fotogalerie bytů — upload/řazení/hlavní foto/mazání (migrace 010, DEC-029)
- [x] Klientské dokumenty /admin/dokumenty + údržba /admin/udrzba
- [ ] Editace polí `subtitle` a `rooms` (zobrazují se veřejně, ale nejdou měnit)

### Fáze 4 — Klientský Portál ✅ HOTOVO
- [x] Login stránka — email + heslo (signInWithPassword)
- [x] Auth middleware — /portal ochrana hotová + redirect loop fix
- [x] Základní struktura (layout, nav, protected routes)
- [x] Můj apartmán — základní info, profil
- [x] SVJ — nástěnka (read-only)
- [x] Pronájem — dashboard, statistiky, nadcházející rezervace
- [x] Blokace majitele — přidat/smazat termíny
- [x] Mobilní layout — top bar + drawer (DEC-027)
- [x] Dokumenty majitele — /portal/dokumenty, signed URLs (DEC-026)
- [x] Údržba — hlášení závad + sledování stavu
- [x] SVJ — detail postu + komentáře
- [x] SVJ — hlasování (DEC-025)
- [x] SVJ — dokumenty sekce
- [ ] Fotogalerie apartmánu v portálu (admin ji už má)

### Fáze 5 — Rental Program
- [ ] Opt-in flow
- [ ] Výnosy & provize
- [ ] Blokace (majitel)
- [ ] Stripe Connect (výplaty)

### Fáze 6 — Admin Dashboard v2
- [ ] Správa visibility flags
- [ ] Nastavení provizí
- [ ] Revenue analytika
- [ ] SVJ správa

---

## 7. Technický stack

- **Frontend:** Next.js 14, TypeScript, Tailwind
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Stripe (Checkout + Connect)
- **Email:** Resend
- **Hosting:** Vercel

---

## 8. Environment variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=info@zfpreality.cz

# Stripe (TODO)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Admin
ADMIN_PASSWORD=
JWT_SECRET=
```

---

---

## 9. DB migrace

| Migrace | Obsah | Status |
|---------|-------|--------|
| 001 | Owner portal foundation (owners, apartments, owner_documents, maintenance_requests, blocked_dates, svj_posts, svj_poll_votes, audit_log) | ✅ |
| 002 | Booking engine (pricing_rules + ALTER apartments flags) | ✅ |
| 003 | Bookings + seed (bookings, ALTER apartments title/base_price_cents/max_guests) | ✅ |
| 004 | Messaging (booking_messages, checkin_info) | ✅ |
| 005 | iCal channel manager (channel_connections, blocked_dates.source) | ✅ |
| 006 | Portal fáze 4 (svj_comments, svj_documents, owner_invitations) | ✅ |
| 007 | Apartmány obsah (description, orientation, rooms, subtitle + seed) | ✅ |
| 008 | SVJ dotažení (svj_posts.options/poll_deadline/archived_at, GRANTy, bucket dokumenty) | ✅ |

Pozn.: `svj_polls` tabulka neexistuje a nikdy neexistovala — ankety řeší DEC-025.

---

*Aktualizace: 3.6.2026*
