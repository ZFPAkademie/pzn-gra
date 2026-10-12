/**
 * Front Desk Master — klient veřejného API Booking Enginu.
 *
 * Používá stejné endpointy jako rezervační formulář FDM (new-booking.frontdeskmaster.com).
 * API není oficiálně dokumentované → každé volání má timeout a vrací { ok, error },
 * nikdy nehází (pattern ERR-02). Detaily v FDM_INTEGRATION_REFERENCE.md (lokální).
 *
 * hostelId je veřejný identifikátor (je v HTML našeho FDM formuláře), ale drží se v env,
 * aby se nehardcodoval.
 */

const API_BASE =
  process.env.FDM_BE_API_URL?.replace(/\/$/, '') ??
  'https://api-bookingengine.frontdeskmaster.com/HSOPService.svc';

const TIMEOUT_MS = 15000;

export type FdmResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface FdmRoomUse {
  Id: number;
  Name: string;
  NumberOfPeople: number;
  Beds?: number[];
}

export interface FdmAvailabilityDay {
  date: string; // YYYY-MM-DD
  roomUseId: number;
  available: number; // počet volných jednotek (0/1 u nás)
}

export interface FdmPriceDay {
  date: string;
  roomUseId: number;
  rateId: number;
  rateName: string;
  price: number; // v měně property (EUR)
}

export interface FdmRestrictionDay {
  date: string;
  roomUseId: number;
  rateId: number;
  minStayArrival: number | null;
  minStayThrough: number | null;
  closed: boolean;
  closedOnArrival: boolean;
}

export interface FdmReservationGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface FdmCreateReservationInput {
  roomUseId: number;
  roomUseName: string;
  rateId: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  totalPrice: number; // v měně property, za celý pobyt
  note?: string;
  guest: FdmReservationGuest;
}

export interface FdmReservationResponse {
  ReservationCode?: string;
  GuestAccountId?: string | number;
  [key: string]: unknown;
}

export function getFdmHostelId(): string | null {
  return process.env.FDM_HOSTEL_ID?.trim() || null;
}

export function isFdmConfigured(): boolean {
  return !!getFdmHostelId();
}

/** FDM vrací datumy jako "/Date(1797724800000)/" (UTC půlnoc) → YYYY-MM-DD */
export function parseFdmDate(value: unknown): string {
  if (typeof value === 'string') {
    const m = value.match(/\/Date\((-?\d+)/);
    if (m) return new Date(parseInt(m[1], 10)).toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  }
  if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10);
  return '';
}

/** YYYY-MM-DD → ms UTC půlnoci */
export function toFdmMs(dateStr: string): number {
  return Date.UTC(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(5, 7), 10) - 1,
    parseInt(dateStr.slice(8, 10), 10)
  );
}

/**
 * YYYY-MM-DD → "/Date(ms)/" — serializovaný DateTime pro .NET server FDM.
 * Formulář FDM posílá datumy přesně takhle (Utils/DateTimeHelper.ToMS). Holé číslo
 * server neumí deserializovat a vrací HTTP 417 „Operation failed due to exception"
 * (zjištěno 12. 10. 2026 na rezervaci golden-ridge-4).
 */
export function toFdmDate(dateStr: string): string {
  return `/Date(${toFdmMs(dateStr)})/`;
}

async function request<T>(
  path: string,
  params: Record<string, string>,
  init?: { method?: 'GET' | 'POST'; body?: unknown }
): Promise<FdmResult<T>> {
  const hostelId = getFdmHostelId();
  if (!hostelId) return { ok: false, error: 'FDM_HOSTEL_ID není nastaveno' };

  const qs = new URLSearchParams({ ...params, hostelId }).toString();
  const url = `${API_BASE}${path}?${qs}`;

  try {
    const res = await fetch(url, {
      method: init?.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        Origin: 'https://new-booking.frontdeskmaster.com',
        'User-Agent': 'PZN-Booking/1.0',
        ...(init?.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `FDM HTTP ${res.status}: ${text.slice(0, 300)}` };
    }
    try {
      return { ok: true, data: JSON.parse(text) as T };
    } catch {
      return { ok: false, error: `FDM: neplatná odpověď (${text.slice(0, 120)})` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `FDM nedostupné: ${msg}` };
  }
}

export async function fdmGetRoomUses(language = 'EN'): Promise<FdmResult<FdmRoomUse[]>> {
  const r = await request<FdmRoomUse[] | { Collection: FdmRoomUse[] }>('/bookingengine/roomuses', { language });
  if (!r.ok) return r;
  const list = Array.isArray(r.data) ? r.data : r.data.Collection ?? [];
  return { ok: true, data: list.map((x) => ({ Id: x.Id, Name: x.Name, NumberOfPeople: x.NumberOfPeople, Beds: x.Beds })) };
}

/** Dostupnost po dnech. endDate je inkluzivní (FDM vrací i poslední den). */
export async function fdmGetAvailability(
  startDate: string,
  endDate: string
): Promise<FdmResult<FdmAvailabilityDay[]>> {
  const r = await request<{ Collection: Array<{ Date: string; RoomUseId: number; Availability: number }> }>(
    '/bookingengine/availability',
    { startDate, endDate }
  );
  if (!r.ok) return r;
  const rows = r.data?.Collection ?? [];
  return {
    ok: true,
    data: rows.map((x) => ({ date: parseFdmDate(x.Date), roomUseId: x.RoomUseId, available: Number(x.Availability ?? 0) })),
  };
}

/** Ceny po dnech a sazbách. Pozn.: FDM formulář volá endDate = odjezd − 1 den. */
export async function fdmGetPricing(startDate: string, endDate: string): Promise<FdmResult<FdmPriceDay[]>> {
  const r = await request<Array<{ RoomUseId: number; Rates: Array<{ RateId: number; RateName: string; Prices: Array<{ Date: string; Price: number }> }> }>>(
    '/bookingengine/pricing',
    { startDate, endDate }
  );
  if (!r.ok) return r;
  const out: FdmPriceDay[] = [];
  for (const ru of r.data ?? []) {
    for (const rate of ru.Rates ?? []) {
      for (const p of rate.Prices ?? []) {
        out.push({ date: parseFdmDate(p.Date), roomUseId: ru.RoomUseId, rateId: rate.RateId, rateName: rate.RateName, price: Number(p.Price) });
      }
    }
  }
  return { ok: true, data: out };
}

export async function fdmGetRestrictions(startDate: string, endDate: string): Promise<FdmResult<FdmRestrictionDay[]>> {
  const r = await request<Array<{ RoomUseId: number; Rates: Array<{ RateId: number; Restrictions: Array<Record<string, unknown>> }> }>>(
    '/bookingengine/restrictions',
    { startDate, endDate }
  );
  if (!r.ok) return r;
  const out: FdmRestrictionDay[] = [];
  for (const ru of r.data ?? []) {
    for (const rate of ru.Rates ?? []) {
      for (const x of rate.Restrictions ?? []) {
        out.push({
          date: parseFdmDate(x.Date),
          roomUseId: ru.RoomUseId,
          rateId: rate.RateId,
          minStayArrival: x.MinStayArrival == null ? null : Number(x.MinStayArrival),
          minStayThrough: x.MinStayThrough == null ? null : Number(x.MinStayThrough),
          closed: x.Closed === true,
          closedOnArrival: x.ClosedOnArrival === true,
        });
      }
    }
  }
  return { ok: true, data: out };
}

/**
 * Založí rezervaci v FDM (zdroj „Booking Engine“). Tělo odpovídá tomu, co posílá
 * formulář FDM (modul Bll/ReservationDataBuilder). Bez karty, platba převodem u nás.
 */
export function buildFdmReservationBody(input: FdmCreateReservationInput, overrides: Record<string, unknown> = {}) {
  const nights = Math.round((toFdmMs(input.checkOut) - toFdmMs(input.checkIn)) / 86400000);
  const body = {
    CheckInDate: toFdmDate(input.checkIn),
    CheckOutDate: toFdmDate(input.checkOut),
    ArrivalTime: { Hours: null, Minutes: null },
    RateId: input.rateId,
    Note: input.note ?? '',
    EmailConsentGiven: false,
    Prepayment: 0,
    PrepaymentGBP: 0,
    IgnoreAnonymize: false,
    Guest: {
      FirstName: input.guest.firstName,
      LastName: input.guest.lastName,
      Address: null,
      Email: input.guest.email,
      City: null,
      Country: null,
      ZipCode: null,
      Phone: input.guest.phone ?? null,
      Gender: null,
      TaxNumber: null,
      IdNumber: null,
      CreditCardDetails: {
        CCName: '',
        CCType: '',
        CCNumber: '',
        ExpirationMonth: 0,
        ExpirationYear: 0,
        CVC: '',
        IsFromChannexPCI: false,
        ChannexPCIToken: '',
      },
    },
    Nights: [
      {
        Day: toFdmDate(input.checkIn),
        Beds: input.guests,
        Nights: nights,
        Price: Math.round(input.totalPrice * 100) / 100,
        OriginalPrice: Math.round(input.totalPrice * 100) / 100,
        RoomUseId: input.roomUseId,
        RoomUseName: input.roomUseName,
        RoomsCount: 1,
        RoomsIndex: 0,
        RateId: input.rateId,
      },
    ],
    Extras: [],
    CouponId: null,
    IsFromBookLocal: false,
    PaymentViaBankTransfer: true,
  };
  return { ...body, ...overrides };
}

export async function fdmPostReservationBody(body: Record<string, unknown>): Promise<FdmResult<FdmReservationResponse>> {
  return request<FdmReservationResponse>('/bookingengine/reservations', {}, { method: 'POST', body });
}

export async function fdmCreateReservation(
  input: FdmCreateReservationInput,
  overrides: Record<string, unknown> = {}
): Promise<FdmResult<FdmReservationResponse>> {
  const nights = Math.round((toFdmMs(input.checkOut) - toFdmMs(input.checkIn)) / 86400000);
  if (nights < 1) return { ok: false, error: 'Neplatný rozsah dat' };
  return fdmPostReservationBody(buildFdmReservationBody(input, overrides));
}
