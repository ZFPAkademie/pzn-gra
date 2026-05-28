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

## 📊 Metriky projektu

| Metrika | Hodnota |
|---------|---------|
| Počet konverzací | 30+ |
| Počet sprintů | 5 |
| Počet redesignů homepage | 5 |
| Emergency restores | 2 |
| Finální verze | v23 |
| Doba vývoje | ~5 měsíců |
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

*Aktualizace: 28.5.2026*
