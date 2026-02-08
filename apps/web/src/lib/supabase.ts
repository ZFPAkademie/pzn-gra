/**
 * Supabase Client
 * Production v1: Lead Capture System
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for our database tables
export interface Lead {
  id: string;
  type: 'rent_inquiry' | 'sale_inquiry' | 'general_inquiry';
  apartment_slug: string | null;
  apartment_title: string | null;
  source_url: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  preferred_dates: string | null;
  guest_count: number | null;
  gdpr_consent: boolean;
  terms_accepted: boolean;
  marketing_consent: boolean;
  status: 'new' | 'in_progress' | 'closed' | 'spam';
  notes: string | null;
  language: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: Partial<Lead>;
        Update: Partial<Lead>;
      };
    };
  };
}

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy initialization
let _supabase: SupabaseClient<Database> | null = null;
let _adminClient: SupabaseClient<Database> | null = null;

/**
 * Get public Supabase client (for read-only operations)
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/**
 * Get admin Supabase client (for write operations - server-side only)
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (!_adminClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase admin environment variables');
    }
    _adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _adminClient;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
