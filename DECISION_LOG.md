# Decision Log

> Golden Ridge Apartments - Technical & Business Decisions  
> Last Updated: 2025-01-28

---

## Purpose

This document records key architectural and business decisions that affect the project direction. Decisions marked **LOCKED** should not be changed without explicit stakeholder approval and impact assessment.

---

## Decisions

### DEC-001: Currency

| Field | Value |
|-------|-------|
| **Decision** | EUR (Euro) as the sole currency |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Target market includes Czech, German, Austrian, and Polish guests. EUR provides neutral pricing without CZK volatility concerns. Simplifies Stripe integration. |
| **Implications** | - All prices stored as `base_price_eur` in database<br>- Stripe charges in EUR<br>- No multi-currency conversion needed<br>- Price display uses EUR symbol |
| **Alternatives Considered** | CZK (rejected: volatility), Multi-currency (rejected: complexity for MVP) |

---

### DEC-002: Payment Model

| Field | Value |
|-------|-------|
| **Decision** | 100% upfront payment at booking |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Simplifies booking flow, reduces no-shows, eliminates deposit tracking complexity. Standard for short-term vacation rentals. |
| **Implications** | - Single Stripe Checkout session per booking<br>- No partial payment tracking<br>- Refund policy must be clearly communicated<br>- No balance due at check-in |
| **Alternatives Considered** | Deposit + balance (rejected: complexity), Pay at property (rejected: no-show risk) |

---

### DEC-003: Database Platform

| Field | Value |
|-------|-------|
| **Decision** | Supabase (PostgreSQL) |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Managed PostgreSQL with built-in auth, RLS, and real-time capabilities. Free tier sufficient for MVP. Native TypeScript support. |
| **Implications** | - Row Level Security for data access control<br>- Service role key for server-side operations<br>- Anon key for client-side reads<br>- SQL migrations in `docs/supabase/` |
| **Alternatives Considered** | PlanetScale (rejected: no RLS), Firebase (rejected: NoSQL complexity), Self-hosted (rejected: operational overhead) |

---

### DEC-004: Payment Processor

| Field | Value |
|-------|-------|
| **Decision** | Stripe Checkout |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Industry standard, hosted checkout page (PCI compliance), webhook reliability, Czech/EU support, test mode for development. |
| **Implications** | - Redirect to Stripe for payment<br>- Webhook handler required<br>- Signature verification mandatory<br>- Session expiry (30 min) |
| **Alternatives Considered** | Stripe Elements (rejected: PCI scope), PayPal (rejected: UX), GoPay (rejected: limited features) |

---

### DEC-005: Email Provider

| Field | Value |
|-------|-------|
| **Decision** | Resend |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Developer-friendly API, React email support, good deliverability, simple pricing. |
| **Implications** | - Domain verification required for production<br>- Test domain available for development<br>- HTML + plain text templates<br>- Graceful fallback to console logging |
| **Alternatives Considered** | SendGrid (rejected: complexity), AWS SES (rejected: setup overhead), Postmark (rejected: pricing) |

---

### DEC-006: Booking Status Flow

| Field | Value |
|-------|-------|
| **Decision** | PENDING → CONFIRMED (webhook) |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Booking created immediately to reserve dates, confirmed only after payment webhook received. Prevents overselling. |
| **Implications** | - Dates blocked on PENDING status<br>- Orphan PENDING bookings possible (expired checkouts)<br>- Status updates only via webhook<br>- No manual confirmation option |
| **Flow** | `PENDING` → `CONFIRMED` → `COMPLETED` (future) |

---

### DEC-007: Minimum Stay

| Field | Value |
|-------|-------|
| **Decision** | 2 nights minimum |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Reduces turnover costs, aligns with vacation rental market norms, stored per-apartment in `min_nights` field. |
| **Implications** | - Enforced in API and frontend<br>- Can be adjusted per apartment<br>- Price API validates against minimum |

---

### DEC-008: URL Strategy

| Field | Value |
|-------|-------|
| **Decision** | NEXT_PUBLIC_APP_URL for all return URLs |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Single source of truth for base URL. Works in development (localhost) and production (domain) without code changes. |
| **Implications** | - No hardcoded localhost<br>- Environment-driven configuration<br>- Stripe success/cancel URLs use this variable<br>- Email links use this variable |

---

### DEC-009: Feature Flag for Booking

| Field | Value |
|-------|-------|
| **Decision** | ENABLE_BOOKING=true to unlock booking |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Allows deployment without live booking capability. Useful for staging, content review, or temporarily disabling bookings. |
| **Implications** | - API returns 503 when disabled<br>- CTA buttons can be hidden/disabled<br>- Default is disabled (must opt-in) |

---

### DEC-010: Bilingual Support

| Field | Value |
|-------|-------|
| **Decision** | Czech (cs) and English (en) |
| **Status** | 🔒 **LOCKED** |
| **Date** | 2025-01-28 |
| **Rationale** | Primary markets are Czech domestic and international tourists (German, Austrian, Polish who often prefer English). |
| **Implications** | - All content in `description_cs` and `description_en`<br>- Email templates bilingual<br>- Language stored per booking<br>- Cookie-based locale detection |

---

## Pending Decisions

| ID | Topic | Status | Notes |
|----|-------|--------|-------|
| DEC-011 | Cancellation policy | OPEN | Needs business input |
| DEC-012 | Seasonal pricing | DEFERRED | Post-MVP |
| DEC-013 | Admin authentication | DEFERRED | Sprint 4+ |

---

## Change Process

To modify a LOCKED decision:

1. Document the proposed change and rationale
2. Assess impact on existing implementation
3. Get stakeholder approval
4. Update this log with new decision and date
5. Implement required changes

---

*Document maintained by: Development Team*  
*Review frequency: Per sprint*
