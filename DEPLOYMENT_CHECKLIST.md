# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## Sprint 4 - Golden Ridge Apartments

---

## ✅ 1. SUPABASE SETUP

### SQL (run in Supabase SQL Editor):
```sql
-- Copy entire content from: docs/supabase/PRODUCTION_SETUP.sql
```

### Verify:
- [ ] Table `public.leads` exists
- [ ] RLS policies are enabled
- [ ] Test insert works (from anon role)

---

## ✅ 2. VERCEL ENVIRONMENT VARIABLES

Set in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Where to get |
|----------|--------------|
| `NEXT_PUBLIC_APP_URL` | Your domain (e.g., `https://podzlatymnavrsim.cz`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret!) |
| `ADMIN_DASH_PASSWORD` | Your choice (strong password for /admin) |

### ⚠️ IMPORTANT:
- `NEXT_PUBLIC_*` variables are visible in browser
- `SUPABASE_SERVICE_ROLE_KEY` is SECRET - never expose!
- Apply to: **Production**, **Preview**, **Development**

---

## ✅ 3. VERCEL PROJECT SETTINGS

- **Root Directory**: `apps/web`
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

---

## ✅ 4. FUNCTIONAL PAGES

### Public Pages:
| URL | Status |
|-----|--------|
| `/` | Homepage with path selector |
| `/o-projektu` | About project |
| `/lokalita` | Location info |
| `/standardy` | Standards |
| `/suites` | Apartment overview |
| `/investicni-prilezitost` | Investment (buy whole apt) |
| `/nemovitostni-produkt` | **NEW** Investment shares |
| `/apartmany-spindleruv-mlyn-pronajem` | Rental catalog |
| `/golden-ridge-apartments/apartman/[slug]` | Apartment detail |
| `/apartmany-prodej` | Sales catalog |
| `/kontakt` | Contact page |
| `/kdo-stavi-chaty` | Builder info |

### Admin Pages:
| URL | Status |
|-----|--------|
| `/admin/login` | Admin login |
| `/admin/leads` | Leads inbox |
| `/admin/leads/[id]` | Lead detail |

---

## ✅ 5. API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/leads` | POST | Create lead (public forms) |
| `/api/v1/contact` | POST | Contact form |
| `/api/admin/login` | POST | Admin authentication |
| `/api/admin/logout` | POST | Admin logout |
| `/api/admin/leads` | GET | List leads (protected) |
| `/api/admin/leads/[id]` | GET/PATCH | Lead detail (protected) |

---

## ✅ 6. LEAD TYPES SUPPORTED

| Type | Source |
|------|--------|
| `rent_inquiry` | Rental detail pages |
| `sale_inquiry` | Sales detail pages |
| `investment_inquiry` | Investment opportunity page |
| `investment_share_request` | **NEW** Nemovitostní produkt |
| `general_inquiry` | Contact page |

---

## ✅ 7. POST-DEPLOYMENT TESTS

### Test Lead Submission:
1. Go to `/nemovitostni-produkt`
2. Click "Získat nabídku podílů"
3. Fill form, submit
4. Check `/admin/leads` for new entry

### Test Admin:
1. Go to `/admin/login`
2. Enter `ADMIN_DASH_PASSWORD`
3. View leads, change status

---

## 📝 GIT COMMANDS

```bash
git add -A
git commit -m "feat: Sprint 4 - Nemovitostní produkt + production ready"
git push origin main
```

---

## 🔒 SECURITY NOTES

1. **ADMIN_DASH_PASSWORD** - Use strong, unique password
2. **SUPABASE_SERVICE_ROLE_KEY** - Never expose in frontend
3. **RLS** - Row Level Security is enabled on leads table
4. **Rate Limiting** - 5 requests/minute on lead submission

---

## Status: READY FOR PRODUCTION ✅
