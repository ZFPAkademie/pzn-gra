# Pod Zlatým návrším – Design System 2030

## 1. Účel dokumentu

Tento dokument definuje **designový systém pro web Pod Zlatým návrším** s výhledem do roku 2030.
Slouží jako:
- jednotný zdroj pravdy pro design a UI,
- podklad pro vývoj (Next.js / Tailwind / komponenty),
- mantinel pro budoucí iterace (booking, API, CRM, data).

Cílem je **prémiový, klidný, horský digitální zážitek**, který vydrží roky.

---

## 2. Brand DNA (neměnné pilíře)

**Pod Zlatým návrším** není:
- krátkodobý developerský projekt,
- agresivní prodejní web,
- hotelový katalog.

Je to:
- 🏔 dlouhodobá horská hodnota,
- 🪙 investice a stabilita,
- 🌲 klid, příroda, rytmus krajiny,
- 🏛 rezidenční projekt s architektonickou důstojností.

Design musí působit **tiše, sebevědomě a nadčasově**.

---

## 3. Vizuální směr

### Název směru
**Alpine Quiet Luxury 2030**

### Charakteristika
- moderní horská architektura,
- digitální minimalismus,
- žádná vizuální exhibice,
- důraz na prostor, typografii a rytmus.

Zakázáno:
- křiklavé barvy,
- módní efekty (přehnané gradienty, glassmorphism),
- ilustrativní realitní klišé.

---

## 4. Barevná paleta

### Primární barvy
- **Deep Alpine Navy** `#0B1626`
  - hero sekce
  - investiční a pronájemové stránky

- **Warm Gold** `#C9A24D`
  - CTA
  - akcenty
  - linky

### Sekundární barvy
- **Stone Grey** `#F4F6F8` – pozadí sekcí
- **Forest Green (dark)** `#1F2F2A` – doplňkové plochy
- **Off-white** `#FAFAF7` – textové bloky

Zlato je **výhradně akcent**, nikdy plošná barva.

---

## 5. Typografie

### Primární font
**Fedra Sans Pro**
- Headings: SemiBold / Bold
- Body text: Regular

Použití:
- nadpisy,
- hlavní texty,
- navigace,
- UI prvky.

### Sekundární font
**Bree Light**
- krátké claimy,
- mikrotexty,
- zvýraznění.

Maximálně **2 fonty** v celém systému.

---

## 6. Layout & spacing

### Základní pravidla
- velké vertikální mezery (luxus = prostor),
- sekce max. 2–3 hlavní sdělení,
- krátké textové bloky,
- žádné dlouhé sloupce textu.

### Hero sekce
- 1 silná věta
- 1 krátký podtext
- 1 CTA

Příklad:
> **Apartmány v srdci Krkonoš.**  
> Klid, hodnota a dlouhodobý smysl.

---

## 7. Karty apartmánů (standard)

Každá karta musí mít:
- fotografii nebo klidný placeholder,
- název jednotky,
- parametry (m², dispozice),
- typ:
  - Pronájem
  - Prodej
  - Investiční produkt
- stav (volné / prodáno / rezervováno),
- CTA.

### Cena
- Pronájem: `od XX € / noc`
- Prodej: `Cena na vyžádání`
- Investice: `Podíl od …`

---

## 8. CTA systém

### Primární CTA (zlatá)
- Získat nabídku
- Poptat termín
- Kontaktovat

### Sekundární CTA
- Zobrazit detail
- Více informací

Pravidla:
- max. 1 primární CTA na sekci,
- žádná křiklavost,
- konzistentní styl.

---

## 9. Ikony & grafika

- minimalistické line ikony,
- jednotná tloušťka linky,
- žádné emoji styly,
- žádné realitní klišé.

Doporučení:
- Lucide Icons
- Heroicons

---

## 10. Obsah & data

### Aktuální fáze
- statický obsah je přípustný,
- texty mohou být „natvrdo“,
- design a struktura mají prioritu.

### Budoucí fáze
- napojení na Supabase,
- booking,
- platby,
- správa poptávek.

Design musí být **komponentově připravený**.

---

## 11. Checklist

### Musíme udělat hned
- [ ] sjednotit hero sekce
- [ ] sjednotit karty apartmánů
- [ ] sjednotit CTA styl
- [ ] vyčistit typografii

### Můžeme odložit
- [ ] booking flow
- [ ] API / databáze
- [ ] platební brána

### Připravit do budoucna
- [ ] design tokens
- [ ] UI komponenty
- [ ] stavové varianty

---

## 12. Závěr

Design Pod Zlatým návrším má být:
- klidný,
- sebevědomý,
- nadčasový,
- technologicky připravený.

Tento dokument je závazný pro všechny další iterace webu.

