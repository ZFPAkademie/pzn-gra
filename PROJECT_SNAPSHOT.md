# PROJECT_SNAPSHOT.md
## Pod Zlatým návrším — Stav projektu

**Datum:** 28. května 2026  
**Verze:** v24  
**Status:** Production (fáze 2 + admin)

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

### 2.4 Admin Dashboard (🚧 Fáze A — průběžně)
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

### 2.5 Klientský Portál (🚧 TODO)
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

## 3. Aktuální stav (v24 — 28.5.2026)

### ✅ Hotovo
| Komponenta | Status | Poznámky |
|------------|--------|----------|
| Homepage | ✅ | Alpine Quiet Luxury design |
| Stránky prodej | ✅ | 3 apartmány, data z DB |
| Stránky pronájem | ✅ | 8 apartmánů, data z DB |
| Stránka podíl | ✅ | Dynamické URL /podil/[available] |
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

### 🚧 K implementaci
| Komponenta | Priorita | Závislosti |
|------------|----------|------------|
| Klientský portál — auth | HIGH | Supabase Auth magic links (invite flow hotový) |
| Klientský portál — Můj apartmán | HIGH | Auth |
| SVJ modul | MEDIUM | Klientský portál |
| Admin — visibility flags UI | MEDIUM | — |
| Blokace — edit (jen delete) | LOW | — |
| Stripe platby | LOW | Manager approval |
| Stripe Connect (výplaty) | LOW | Portál + Stripe |
| Channel Manager credentials | LOW | Booking.com/Airbnb přístupy od managera |

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
- [x] Admin blokace — CRUD blocked_dates
- [x] Admin majitelé — CRUD + invite magic link
- [x] Data apartmánů migrována z JSON do DB (migrace 007)
- [ ] Visibility flags UI (for_sale, for_rent, in_rental_program toggle)
- [ ] Blokace edit (jen delete, chybí edit)

### Fáze 4 — Klientský Portál
- [x] Invite flow backend (generateLink → owners.user_id)
- [ ] Owner auth middleware (/portal route ochrana)
- [ ] Můj apartmán
- [ ] SVJ modul
- [ ] Dokumenty

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
| 001 | Základní schéma (apartments, owners, leads) | ✅ |
| 002 | Booking engine (bookings, blocked_dates, pricing_rules) | ✅ |
| 003 | iCal channel manager (channel_connections, source column) | ✅ |
| 004 | Admin auth cookie | ✅ |
| 005 | Messaging (booking_messages) | ✅ |
| 006 | SVJ (svj_posts, svj_comments, svj_polls, svj_documents) | ✅ |
| 007 | Apartmány obsah (description, orientation, rooms, subtitle + seed) | ✅ |

---

*Aktualizace: 28.5.2026*
