/**
 * Leads Service
 * Production v1: Lead capture and management
 */

import { getAdminClient, getSupabase } from './supabase';

// ===========================================
// TYPES
// ===========================================

export interface LeadInput {
  type: 'rent_inquiry' | 'sale_inquiry' | 'investment_inquiry' | 'general_inquiry';
  apartment_slug?: string;
  apartment_title?: string;
  source_url?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  message?: string;
  preferred_dates?: string;
  guest_count?: number;
  gdpr_consent: boolean;
  terms_accepted: boolean;
  marketing_consent?: boolean;
  language?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Lead extends LeadInput {
  id: string;
  status: 'new' | 'in_progress' | 'closed' | 'spam';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadListItem {
  id: string;
  type: string;
  apartment_slug: string | null;
  apartment_title: string | null;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
}

// ===========================================
// CREATE LEAD (PUBLIC)
// ===========================================

export async function createLead(input: LeadInput): Promise<{ success: boolean; lead_id?: string; error?: string }> {
  try {
    // Validate required fields
    if (!input.first_name?.trim()) {
      return { success: false, error: 'First name is required' };
    }
    if (!input.last_name?.trim()) {
      return { success: false, error: 'Last name is required' };
    }
    if (!input.email?.trim()) {
      return { success: false, error: 'Email is required' };
    }
    if (!input.gdpr_consent) {
      return { success: false, error: 'GDPR consent is required' };
    }
    if (!input.terms_accepted) {
      return { success: false, error: 'Terms acceptance is required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    const supabase = getAdminClient();
    
    const insertData = {
      type: input.type,
      apartment_slug: input.apartment_slug || null,
      apartment_title: input.apartment_title || null,
      source_url: input.source_url || null,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      message: input.message?.trim() || null,
      preferred_dates: input.preferred_dates || null,
      guest_count: input.guest_count || null,
      gdpr_consent: input.gdpr_consent,
      terms_accepted: input.terms_accepted,
      marketing_consent: input.marketing_consent || false,
      language: input.language || 'cs',
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null,
      status: 'new' as const,
    };
    
    const { data, error } = await supabase
      .from('leads')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create lead:', error);
      return { success: false, error: 'Failed to submit inquiry' };
    }

    console.log('✓ Lead created:', data.id);
    return { success: true, lead_id: data.id };

  } catch (error) {
    console.error('Lead creation error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ===========================================
// ADMIN OPERATIONS (REQUIRES SERVICE ROLE)
// ===========================================

/**
 * Get all leads for admin inbox
 */
export async function getLeads(options?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ leads: LeadListItem[]; total: number }> {
  const supabase = getAdminClient();
  
  let query = supabase
    .from('leads')
    .select('id, type, apartment_slug, apartment_title, first_name, last_name, email, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch leads:', error);
    return { leads: [], total: 0 };
  }

  return { leads: data || [], total: count || 0 };
}

/**
 * Get single lead by ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch lead:', error);
    return null;
  }

  return data as Lead;
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  id: string, 
  status: 'new' | 'in_progress' | 'closed' | 'spam',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  
  const updateData: { status: string; notes?: string } = { status };
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Failed to update lead:', error);
    return { success: false, error: 'Failed to update lead' };
  }

  return { success: true };
}

/**
 * Get lead counts by status
 */
export async function getLeadCounts(): Promise<Record<string, number>> {
  const supabase = getAdminClient();
  
  const statuses = ['new', 'in_progress', 'closed', 'spam'];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    
    counts[status] = count || 0;
  }

  return counts;
}
