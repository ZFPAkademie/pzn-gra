# LESSONS_LEARNED.md
## Pod Zlatým návrším — Co funguje a co ne

---

## ✅ Co fungovalo výborně

### 1. Kanonický JSON jako zdroj pravdy
```typescript
// apartments.canonical.json
{ "slug": "chata-1-suite-7", "layout": "1+kk", "totalArea": "38,44 m²", ... }
```
**Proč funguje:**
- Změny na jednom místě
- Git versioning
- TypeScript typy
- Žádné DB migrace pro statická data

**Kdy použít:** Pro data která se mění zřídka (apartmány, features).
**Kdy nepoužít:** Pro dynamická data (rezervace, ceny, dostupnost).

---

### 2. Supabase Storage + TypeScript helper
```typescript
const images = getApartmentImages('chata-1-suite-7');
const hero = getApartmentHeroImage('chata-1-suite-7');
```
**Proč funguje:**
- Abstrakce nad Supabase URLs
- Sorting logic (interiér → exteriér → půdorysy)
- Next.js Image optimization
- Centrální správa

---

### 3. URL-based state (/podil/[available])
**Proč funguje:**
- Zero-code updates
- Marketing může měnit linky
- Shareable stavy
- Validace v kódu (0-50)

**Pattern:** Pro jednoduché číselné stavy které mění non-tech lidé.

---

### 4. Alpine ornamenty jako komponenty
```tsx
<AlpineOrnament variant="corner" className="text-gold/20" />
```
**Proč funguje:**
- Konzistentní brand
- Škálovatelné SVG
- Tailwind integrace
- Reusable

---

### 5. Lead capture před booking engine
**Proč funguje:**
- Time-to-market 2 týdny vs 2 měsíce
- Business validace
- Jednoduchá iterace
- Manuální správa stačila

**Poučení:** Vždy validuj business model před komplexní implementací.

---

### 6. Inline formuláře místo modálů
**Proč funguje:**
- Méně kliknutí
- Lepší mobile UX
- Jednodušší kód
- Vyšší konverze

---

## ❌ Co nefungovalo

### 1. Přepisování celých souborů
**Problém:** 5+ redesignů homepage ztratilo původní obsah.

**Co se stalo:**
1. `cat > page.tsx` s novým designem
2. Původní texty zmizely
3. Emergency restore
4. Opakování

**Řešení:** VŽDY `str_replace`, nikdy celý soubor.

**Pattern:**
```bash
# ❌ ŠPATNĚ
cat > file.tsx << 'EOF'
// nový obsah
EOF

# ✅ SPRÁVNĚ
str_replace(old_str, new_str, path)
```

---

### 2. Booking systém implementován, ale nepoužit
**Problém:** Sprint 2-3 = kompletní booking, pak pivot na lead capture.

**Co se stalo:**
- Stripe integrace hotová
- Email notifikace hotové
- Calendar picker hotový
- Nic z toho se nepoužívá

**Poučení:** MVP first. Lead capture stačil od začátku.

---

### 3. TypeScript strict + Supabase types
**Problém:** `Type 'never'` errors při Vercel build.

**Co se stalo:**
- Lokálně OK
- CI build fails
- Hodiny debugging

**Řešení:**
```typescript
// Pragmatický type casting
const data = result as unknown as Apartment[];
```

**Poučení:** Testuj `npm run build` lokálně PŘED push.

---

### 4. Emoji jako ikony
**Problém:** Neprofesionální look, různý rendering.

**Řešení:** SVG ikony vždy (Lucide, Heroicons, custom).

---

### 5. Ceny hardcodované v kódu
**Problém:** Změna ceny = změna kódu + deploy.

**Řešení:** Ceny z DB nebo config, nebo vůbec nezobrazovat.

---

## 🔧 Technické lekce

### Next.js App Router
```typescript
// ✅ cookies() v async server component
export default async function Page() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
}

// ❌ cookies() bez async = error
```

### Supabase client
```typescript
// ✅ Singleton
export const supabase = createClient(url, key);

// ❌ Nový client v každé funkci = memory leak
```

### Tailwind custom colors
```typescript
// ✅ V theme.extend.colors
theme: {
  extend: {
    colors: { navy: '#0B1626' }
  }
}

// ❌ V theme.colors = přepíše defaults
```

### Next.js Image remotePatterns
```javascript
// next.config.js
images: {
  remotePatterns: [{
    protocol: 'https',
    hostname: '*.supabase.co',
    pathname: '/storage/v1/object/public/**',
  }],
}
```

---

## 📋 Procesní lekce

### Vždy před velkými změnami
```bash
zip -r backup-$(date +%Y%m%d).zip project/
```

### Komunikace s klientem
- "uprav" = malá změna
- "předělej" = větší změna, zachovat obsah
- "kompletně nový" = může se ztratit obsah → ZEPTEJ SE

### Klíčová otázka
**"Mám zachovat původní texty a obsah?"**

---

## 🎨 Design lekce

### Alpine Quiet Luxury ≠ minimalism
- Prostor ≠ prázdnota
- Premium ≠ nudný
- Klidný ≠ bez charakteru

### Barvy pro luxury real estate
```
Navy  = důvěra, stabilita
Gold  = hodnota, exkluzivita
Stone = čistota, prostor
Cream = teplo, přirozenost
```

---

### 7. Resend inicializace lazy (ne na module level)
**Problém:** `new Resend(undefined)` při build throwuje, protože env var není dostupná v build time.

**Řešení:**
```typescript
// ❌ Module level — throwuje při build
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Lazy — inicializace až při prvním volání
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}
```

**Platí pro:** Jakýkoli SDK klient inicializovaný z env vars (Stripe, OpenAI, atp.).

---

### 8. Next.js App Router — client komponenty exportovat jako named exports, ne jako objekt
**Problém:** Exportování objektu s komponentami z `'use client'` souboru způsobuje server-side exception při použití v server componentě.

**Řešení:**
```typescript
// ❌ Způsobuje runtime error v server komponentě
export const MyClient = { Button, Form, Table };
// použití: <MyClient.Button />

// ✅ Named exports fungují správně
export { Button, Form, Table };
// použití: <Button />
```

**Proč:** Next.js serializuje cross-boundary imports. Objekt s funkcemi nelze serializovat.

---

### 9. iCal DTEND je exkluzivní (den po posledním nocleh)
**Problém:** Booking.com/Airbnb exportuje `DTEND` jako den, kdy host odejde (ne kdy přijel naposled).

**Příklad:** Pobyt 1.6.–5.6. (4 noci) → `DTSTART:20260601`, `DTEND:20260605`

**Řešení při importu:** `endDate = DTEND - 1 den` → uložit jako `end_date = '2026-06-04'`
**Řešení při exportu:** `DTEND = check_out + 1 den`

---

### 10. revalidatePath v server akci resetuje client useState
**Problém:** `sendMagicLink` volal `revalidatePath()` — způsobilo RSC refresh, který resetoval komponentu před tím než admin stihl zkopírovat magic link URL. Tlačítko "probliklo a zmizelo".

**Řešení:**
```typescript
// ❌ Resetuje UI dřív než admin vidí výsledek
export async function sendMagicLink(id: string) {
  const link = await generateLink(...);
  revalidatePath('/admin/majitele'); // ← toto resetuje celý strom
  return { ok: true, link };
}

// ✅ Revalidate jen pro mutace, nikdy pro "zobraz výsledek"
export async function sendMagicLink(id: string) {
  const link = await generateLink(...);
  // žádný revalidatePath — uživatel refreshne ručně
  return { ok: true, link };
}
```

**Pravidlo:** `revalidatePath` používej jen po create/update/delete záznamů. Nikdy po akcích které vrací data zobrazovaná v UI (tokeny, linky, generované hodnoty).

---

### 11. Server action musí uložit user_id ihned po generateLink
**Problém:** `generateLink` vytváří auth uživatele ale nevrací ho automaticky jako `session.user`. Pokud nezachytíme `data.user.id` a ihned neuložíme do `owners.user_id`, vazba se ztratí.

**Řešení:**
```typescript
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email,
});
if (data?.user?.id) {
  await supabase.from('owners').update({ user_id: data.user.id }).eq('id', ownerId);
}
```

**Platí pro:** Jakýkoli flow kde admin vytváří auth uživatele bez self-registrace.

---

### 12. Shared nav komponenta jako jediný zdroj pravdy
**Problém:** Admin sekce (leads, rezervace, channel manager) měly každá vlastní hardcoded nav → missing items, nekonzistence, nutnost updatovat na 8 místech.

**Řešení:** `_components/admin-nav.tsx` s `'use client'` a `usePathname()` pro active state. Importovat na každé admin stránce.

**Pattern:** Jakmile sdílený layout existuje, vše jde do něj. Jinak: každá stránka = tech dluh.

---

### 13. Dual layout pattern pro mobil/desktop (admin tabulky)
**Problém:** Admin tabulky (`<table>`) se na mobilech horizontálně přesouvají mimo viewport — nelze to vyřešit CSS bez ztráty čitelnosti.

**Řešení:** Paralelní renderování dvou layoutů:
```tsx
{/* Mobilní karty */}
<div className="md:hidden space-y-3">
  {items.map(item => <MobileCard key={item.id} item={item} />)}
</div>
{/* Desktop tabulka */}
<div className="hidden md:block">
  <table>...</table>
</div>
```

**Kdy použít:** Jakákoli admin stránka s tabulkovým přehledem + více než 4 sloupci.

---

### 14. Portal login: magic link vs. heslo
**Problém:** Magic link vyžaduje fungující emailovou infrastrukturu (vlastní doména + DNS záznamy pro Resend/Vercel). Při vývoji nebo při blokovaném přechodu domény nelze testovat portál.

**Řešení:** Primární login = email + heslo (`signInWithPassword`). Magic link invite ponechat jako admin nástroj. Heslo admin nastaví ručně v Supabase Dashboard (Auth → Users → Create user).

**Pravidlo:** Pokud testovatelnost závisí na externím DNS/emailu, implementuj fallback s heslem od začátku.

---

### 15. Monorepo: root .env.local Next.js nenačítá
**Problém:** `.env.local` ležel v rootu monorepa (gra3/), ale Next.js běží v `apps/web` a čte env jen odtud. Lokální dev/start běžel bez env vars — tichý fail (Supabase klienti s undefined URL).

**Řešení:** Kopie `.env.local` do `apps/web/` (je v .gitignore). Při změně env měnit obě, nebo root smazat.

---

### 16. sitemap.ts s DB dotazem = build-time static
**Problém:** `app/sitemap.ts` se prerendruje při buildu (○ Static). DB dotaz na slugy proběhl bez env vars → soft-fail → sitemap bez apartmánů, a v runtime se už nikdy neobnovila.

**Řešení:**
```typescript
export const revalidate = 3600; // ISR — regeneruje se s daty
// + try/catch kolem DB dotazu (sitemap bez apartmánů > 500)
// + baseUrl.replace(/\/+$/, '') — env s trailing slash = double slash v URL
```

---

### 17. Názvy sloupců ověřovat proti živé DB, ne proti dokumentaci
**Problém:** Portál pronájem selectoval `nights_count`/`total_price_cents` — sloupce se reálně jmenují `nights`/`total_amount_cents`. Supabase vrátí error → `data = null` → majitel viděl 0 Kč tržeb. Dokumentace (CLAUDE.md datový model) popisovala jiné schéma, než jaké migrace vytvořily.

**Řešení:** Před psaním dotazů `supabase_sql.sh "SELECT column_name FROM information_schema.columns WHERE table_name='...'"`. Dokumentace lže, DB ne.

---

### 18. Fallback hodnota v kódu skryje chybějící env var na produkci
**Problém:** `const BANK_IBAN = process.env.BANK_IBAN ?? 'CZ00 0000 0000 0000 0000 0000'` — proměnná nebyla ve Vercelu vůbec nastavená, ale nic nespadlo. Hostům se v platebních údajích tiše zobrazoval zástupný IBAN. Objeveno až porovnáním `.env.local` s `vercel env ls`.

**Řešení:** Po každém přidání env var ověř, že je i v prostředí, kde poběží:
```bash
vercel env ls production | awk 'NR>3 {print $1}' | sort > /tmp/v.txt
grep -E '^[A-Z_]+=' .env.local | sed 's/=.*//' | sort -u | comm -23 - /tmp/v.txt
```
**Pravidlo:** Fallback smí být bezpečný default (URL, jméno), nikdy hodnota, která vypadá funkčně, ale funkční není (číslo účtu, API klíč, telefon). Tam radši nech chybu vybouchnout.

**Pozn.:** Změna env var ve Vercelu se projeví až po novém nasazení — `vercel redeploy <url>`.

---

### 19. Alias domény ve Vercelu ≠ doména skutečně míří na Vercel
**Problém:** `vercel inspect` vypsal podzlatymnavrsim.cz mezi aliasy, z čehož jsem usoudil, že web běží na ostré doméně. Ve skutečnosti DNS pořád mířilo na Wix (apex → 301 na www → wixdns.net, server Pepyaka). Klientovi tak málem šel odkaz na neexistující stránku.

**Řešení:** Alias ověřuj vždy ze strany DNS a odpovědi serveru, ne z konfigurace:
```bash
dig +short www.domena.cz          # kam to reálně míří
curl -sIL https://domena.cz | grep -i '^server\|^x-vercel'
```

---

### 20. Procento zhodnocení pro malé město nejde doložit, kraj ano
**Symptom:** Web tvrdil „růst 8–12 % ročně ve Špindlerově Mlýně" bez zdroje; právník to zastavil.

**Příčina:** Pro obec s ~1 100 obyvateli žádná veřejná roční řada realizovaných cen neexistuje — ČSÚ publikuje jen kraj a okres, Deloitte Real Index jen krajská města, média citují bodové údaje různých metodik (nabídkové vs. realizované, novostavby vs. vše). Číslo vzniklo odhadem.

**Fix:** Nejnižší úroveň, kde existuje oficiální řada (ČSÚ Ceny nemovitostí, tab. 2-6b index 2015 = 100 za kraj, tab. 2-4 Kč/m² za okres), + bodové údaje pro lokalitu s citací, + varování o minulé výkonnosti. Nikdy nespojovat body z různých metodik do jednoho ročního růstu.

**Universal?** ANO — každý web, který uvádí procento výnosu nebo zhodnocení.

---

### 21. Next.js datová cache vracela starou dostupnost
**Symptom:** V QA po založení rezervace vracel `/api/v1/apartments/[slug]/availability` dál `available: true`; v `.next/cache/fetch-cache` ležely uložené odpovědi PostgREST na dotaz do `bookings`.

**Příčina:** App Router cachuje `fetch` i v route handlerech a supabase-js přes něj volá REST. Dotaz bez `cache: 'no-store'` se vrátil z disku. Platilo i v produkci (bez rezervací se to neprojevilo).

**Fix:** `global.fetch = (i, init) => fetch(i, { ...init, cache: 'no-store' })` u všech serverových klientů (`supabase-server.ts`, `supabase.ts`). Test `scripts/e2e-smoke.mjs` (vložit rezervaci → termín obsazený).

**Universal?** ANO — každý Next 13+/14 projekt se supabase-js na serveru.

---

### 22. Lokální `core.hooksPath` tiše vypnul globální gitleaks
**Symptom:** Commity šly bez kontroly tajemství, přestože globálně je `core.hooksPath` na `os/hooks/git`.

**Příčina:** `.git/config` projektu měl vlastní `hooksPath` na prázdnou `.git/hooks` (pozůstatek staršího nástroje). Lokální hodnota přebíjí globální a nic to nehlásí.

**Fix:** `git config --unset core.hooksPath` v projektu. Kontrola: `git config --show-origin core.hooksPath` musí ukázat `~/.gitconfig`.

**Universal?** ANO — ověřit v každém projektu, který kdy měl husky/lefthook.

---

### 23. `ignoreBuildErrors` schoval syntaktickou chybu a 11 typových chyb
**Symptom:** `tsc` hlásil jediný TS1381 v `lead-form.tsx`; po odstranění přebytečného `)}` vyplavalo 11 dalších chyb (neexistující importy ve Stripe webhooku, chybějící sloupec v selectu, mrtvá komponenta).

**Příčina:** `next.config.js` má `typescript.ignoreBuildErrors: true`, takže build i deploy procházely; syntaktická chyba navíc zastavila typecheck souboru dřív, než stihl ohlásit zbytek.

**Fix:** Vše opraveno (commit 88e53f7), CI má krok `tsc --noEmit`, který to od teď zastaví. `ignoreBuildErrors` zatím zůstává.

**Universal?** ANO — `ignoreBuildErrors` jen s CI typecheckem, jinak nikdy.

---

## 📊 Metriky projektu

| Metrika | Hodnota |
|---------|---------|
| Počet konverzací | 35+ |
| Počet sprintů | 6 |
| Počet redesignů homepage | 5 |
| Emergency restores | 2 |
| Finální verze | v25 |
| Doba vývoje | ~6 měsíců |
| Migrací v DB | 7 |
| Admin sekcí | 8 (leady, rezervace, apartmány, majitelé, ceníky, blokace, SVJ, channels) |

---

## 🔄 Co dělat jinak příště

1. **MVP first** — Lead capture od začátku
2. **Content-first** — Obsah jako konstanta, design kolem
3. **str_replace only** — Nikdy celé soubory
4. **Local build test** — `npm run build` před každým push
5. **Snapshot discipline** — ZIP před každou session
6. **Clear requirements** — "Zachovat obsah?" první otázka

---

*Aktualizace: 3.6.2026*
