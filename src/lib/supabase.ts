import { createClient } from '@supabase/supabase-js';

// Retrieve values from environment or fallback to user credentials
const rawSupabaseUrl = 
  (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined) ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : undefined) ||
  'https://kvwfibxfutoulvymmlfd.supabase.co';

// Sanitize URL by removing trailing slash and /rest/v1 if present
let sanitizedUrl = (rawSupabaseUrl || '').trim();
if (sanitizedUrl.endsWith("/")) {
  sanitizedUrl = sanitizedUrl.slice(0, -1);
}
if (sanitizedUrl.toLowerCase().endsWith("/rest/v1")) {
  sanitizedUrl = sanitizedUrl.slice(0, -8);
}
if (sanitizedUrl.endsWith("/")) {
  sanitizedUrl = sanitizedUrl.slice(0, -1);
}

export const SUPABASE_URL = sanitizedUrl;

export const SUPABASE_ANON_KEY = 
  (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined) ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ||
  'sb_publishable_H9VO46sxlCErey2huyYgSw_ltLEvlx2';

export const B_BUCKET = 'products';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials are missing or could not be loaded.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
