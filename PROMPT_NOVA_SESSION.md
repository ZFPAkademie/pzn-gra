# PROMPT — Nová session: Pod Zlatým návrším

> Zkopíruj celý tento text do nové Claude konverzace.
> Přilož soubory uvedené v sekci PŘÍLOHY.

---

Ahoj! Pokračujeme v projektu **Pod Zlatým návrším**.

## Co přikládám

Přikládám tyto soubory — přečti je všechny před tím než cokoliv řekneš:

1. `CLAUDE.md` — instrukce projektu, stack, pravidla, Vibecodex pattern mapping
2. `DECISION_LOG.md` — všechna architektonická rozhodnutí (DEC-001 až DEC-017)
3. `PROJECT_SNAPSHOT.md` — aktuální stav systému a roadmap
4. `nova/SPRINT3_BOOKING_REFERENCE.md` — hotový booking engine (SQL + API + libs) k extrakci

## Co je hotovo (Fáze 1)

- Veřejný web s Alpine Quiet Luxury designem (cs + en)
- Lead capture systém (4 typy leadů → Supabase)
- Admin leads inbox (základní)
- Supabase Storage (fotky apartmánů)
- Stránka /podil s dynamickým URL

## Co stavíme dál

Jsme na začátku **Fáze 2 — Owner Portal základ**.

Systém má být jako FABR (ten projekt znáš) ale pro hotelový a developerský provoz + SVJ správu:
- ~3 apartmány k prodeji
- ~10 apartmánů k pronájmu (booking engine, channel manager Booking.com/Airbnb)
- ~8 apartmánů prodaných nepronajímající — mají portál + SVJ přístup
- Každý majitel = vlastní klientský profil + přehled
- Admin nastavuje provize, visibility, zve majitele
- Majitelé jsou vypláceni z výnosů (Stripe Connect)
- SVJ modul pro komunikaci všech vlastníků

## Vibecodex OS

Tento projekt používá Vibecodex. Máš k dispozici:
- `VIBEKODEX_MODULE_PROTOCOL.md` — pro každý nový modul projdi Fázi 0 (7 otázek)
- `VIBEKODEX_PATTERNS.md` — standardní patterns
- `VIBEKODEX_ADVANCED.md` — pokročilé patterns

## Jak začít

1. Přečti přiložené soubory
2. Projdi `VIBEKODEX_MODULE_PROTOCOL.md` Fáze 0 — polož mi 7 otázek pro **Owner Portal modul**
3. Počkej na moje odpovědi
4. Navrhni implementační plán → já schválím (GO / HOLD)
5. Pak začneme stavět

Nic jiného nedělej, dokud neprojdeme Fázi 0.

---

## Technické reference (pro orientaci)

- **Live:** https://pzn-gra.vercel.app
- **GitHub:** https://github.com/ZFPAkademie/pzn-gra
- **Local:** `/Users/ondrej/Documents/moje-weby/gra3`
- **Stack:** Next.js 14 App Router, TypeScript, Tailwind, Supabase, Stripe, Resend, Vercel
- **Booking engine kód:** `nova/golden-ridge-sprint3/apps/web/src/lib/` (availability, booking, pricing, stripe, token, email)

---

*Handoff z: 27.5.2026 | CLAUDE.md verze v22*
