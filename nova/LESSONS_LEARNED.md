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

## 📊 Metriky projektu

| Metrika | Hodnota |
|---------|---------|
| Počet konverzací | 25+ |
| Počet sprintů | 4 |
| Počet redesignů homepage | 5 |
| Emergency restores | 2 |
| Finální verze | v21 |
| Doba vývoje | ~4 měsíce |

---

## 🔄 Co dělat jinak příště

1. **MVP first** — Lead capture od začátku
2. **Content-first** — Obsah jako konstanta, design kolem
3. **str_replace only** — Nikdy celé soubory
4. **Local build test** — `npm run build` před každým push
5. **Snapshot discipline** — ZIP před každou session
6. **Clear requirements** — "Zachovat obsah?" první otázka

---

*Aktualizace: 27.5.2026*
