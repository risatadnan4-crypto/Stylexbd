import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvwfibxfutoulvymmlfd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H9VO46sxlCErey2huyYgSw_ltLEvlx2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Querying products table with VITE_SUPABASE_PUBLISHABLE_KEY...");
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("❌ Error:", error);
  } else {
    console.log("✅ Success! Found", data?.length, "products.");
  }
}

test();
