// Stripe client wrapper
// Requires: npm install stripe
// Until installed, this file provides type stubs for build compatibility.

let _stripe: StripeClient | null = null;

export interface StripeLineItem {
  quantity: number;
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: {
      name: string;
      description?: string;
    };
  };
}

export interface StripeCheckoutSessionParams {
  mode: 'payment';
  payment_method_types: string[];
  customer_email: string;
  line_items: StripeLineItem[];
  metadata: Record<string, string>;
  success_url: string;
  cancel_url: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  metadata: Record<string, string>;
  payment_intent: string | { id: string } | null;
}

export interface StripeEvent {
  type: string;
  data: { object: StripeCheckoutSession };
}

export interface StripeClient {
  checkout: {
    sessions: {
      create(params: StripeCheckoutSessionParams): Promise<StripeCheckoutSession>;
    };
  };
  webhooks: {
    constructEvent(body: string, sig: string, secret: string): StripeEvent;
  };
}

export function getStripe(): StripeClient {
  if (_stripe) return _stripe;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    }) as StripeClient;
    return _stripe!;
  } catch {
    throw new Error(
      'Stripe není nainstalován. Spusť: npm install stripe'
    );
  }
}
