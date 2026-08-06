import { createClient } from '@supabase/supabase-js';

// Default working fallback credentials
const DEFAULT_URL = 'https://kvwfibxfutoulvymmlfd.supabase.co';
const DEFAULT_KEY = 'sb_publishable_H9VO46sxlCErey2huyYgSw_ltLEvlx2';

// Retrieve values from Vite or system environment
const rawSupabaseUrl = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : undefined) ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined) ||
  (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined);

// Sanitize URL helper
const sanitizeUrl = (url: string | undefined): string => {
  let u = (url || '').trim();
  if (u.endsWith("/")) {
    u = u.slice(0, -1);
  }
  if (u.toLowerCase().endsWith("/rest/v1")) {
    u = u.slice(0, -8);
  }
  if (u.endsWith("/")) {
    u = u.slice(0, -1);
  }
  return u;
};

const tempUrl = sanitizeUrl(rawSupabaseUrl);

const rawSupabaseAnonKey = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined) ||
  (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined);

const isValidUrl = (url: string): boolean => {
  const u = url.trim();
  return u !== "" && u !== "undefined" && u !== "null" && u.startsWith("http");
};

const isValidKey = (key: string | undefined): boolean => {
  if (!key) return false;
  const k = key.trim();
  return k !== "" && k !== "undefined" && k !== "null" && k.length > 10;
};

// Select final verified URL and Key
const finalUrl = isValidUrl(tempUrl) ? tempUrl : DEFAULT_URL;
const finalKey = isValidKey(rawSupabaseAnonKey) ? rawSupabaseAnonKey!.trim() : DEFAULT_KEY;

export const supabaseUrl = finalUrl;
export const supabaseAnonKey = finalKey;

// Safe dummy client to prevent browser crash in worst-case scenario
function createDummyClient() {
  console.warn("⚠️ Utilizing safety dummy Supabase client fallback.");
  const dummyResponse = () => Promise.resolve({ data: [], error: null });
  const dummySingleResponse = () => Promise.resolve({ data: null, error: null });
  
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: dummySingleResponse,
        }),
        limit: dummyResponse,
        order: dummyResponse,
      }),
      insert: dummyResponse,
      upsert: dummyResponse,
      update: dummyResponse,
      delete: () => ({
        not: dummyResponse,
        neq: dummyResponse,
      }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error("Supabase uninitialized") }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    auth: {
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error("Supabase uninitialized") }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error("Supabase uninitialized") }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: () => ({
      on: function() { return this; },
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
  } as any;
}

let supabaseInstance: any;
try {
  supabaseInstance = createClient(finalUrl, finalKey);
} catch (err: any) {
  console.error("❌ Failed to initialize standard Supabase client in browser context:", err.message);
  supabaseInstance = createDummyClient();
}

export const supabase = supabaseInstance;
export default supabase;

