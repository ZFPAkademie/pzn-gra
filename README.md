# Pod Zlatým návrším

Production v1: Public web + Lead Capture System

---

## Stránky

| URL | Popis |
|-----|-------|
| `/` | Homepage s hero, přehled režimů, CTA |
| `/apartmany-spindleruv-mlyn-pronajem` | Katalog apartmánů k pronájmu |
| `/apartmany-prodej` | Katalog apartmánů na prodej |
| `/investicni-prilezitost` | Investiční příležitost |
| `/golden-ridge-apartments/apartman/[slug]` | Detail apartmánu k pronájmu |
| `/apartmany-prodej/[slug]` | Detail apartmánu na prodej |
| `/kontakt` | Kontaktní stránka |
| `/admin/leads` | Admin inbox (password protected) |

---

## CTA Logika

| Režim | CTA Text |
|-------|----------|
| Pronájem | „Poptat termín" |
| Prodej | „Nezávazně poptat cenu" |
| Investice | „Kontaktovat investiční tým" |

**Cena u prodeje:** Vždy „Cena na dotaz" (nikdy se nezobrazuje skutečná cena)

---

## Environment Variables

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Admin Dashboard
ADMIN_DASH_PASSWORD=your-secure-password
```

---

## Local Development

### 1. Database Setup

Run in [Supabase SQL Editor](https://supabase.com/dashboard):

```
docs/supabase/003_leads_schema.sql
```

### 2. Environment

```bash
cp .env.example .env.local
# Edit with your credentials
```

### 3. Run

```bash
pnpm install
pnpm dev
```

App: http://localhost:3000

---

## Admin Inbox

### URL
```
/admin/leads
```

### Login
Enter password from `ADMIN_DASH_PASSWORD` env variable.
Session lasts 12 hours.

### Features
- Seznam leadů (filter by status)
- Detail s plným payloadem
- Změna statusu: new → in_progress → closed (nebo spam)
- Interní poznámky

---

## Vercel Deployment

### Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `ADMIN_DASH_PASSWORD` | Strong password |

### Deploy

```bash
vercel --prod
```

---

## Data

Apartmány: `src/data/apartments.canonical.json`

Pro změnu dat stačí upravit JSON a redeploynout.

---

## Lead Types

| Type | Popis |
|------|-------|
| `rent_inquiry` | Poptávka pronájmu |
| `sale_inquiry` | Poptávka prodeje |
| `investment_inquiry` | Investiční poptávka |
| `general_inquiry` | Obecný dotaz |

---

## Design Rules

- **Barvy:** Dark navy/charcoal (text), white/off-white (pozadí), gold/bronze (akcent 5-10%)
- **Tón:** Premium, klidný, bez vykřičníků
- **CTA:** Textové, klidné („Poptat termín", ne „REZERVUJTE HNED!")
- **Stav:** Žádné disabled tlačítka, žádné „brzy" texty

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Data:** Canonical JSON
