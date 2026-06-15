import { createClient } from '@supabase/supabase-js';

// Retrieve values from Vite or system environment with static fallback
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : undefined) ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined) ||
  (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined) ||
  'https://kvwfibxfutoulvymmlfd.supabase.co';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ||
  (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2d2ZpYnhmdXRvdWx2eW1tbGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTY3MDksImV4cCI6MjA5NzA3MjcwOX0.Iy9yhl7o5STj0cNp_wXWwEisH9FCHT7y8qg3GNVQN7I';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials are missing or could not be loaded in supabaseClient!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
