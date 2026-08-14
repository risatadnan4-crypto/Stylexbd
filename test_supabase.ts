import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvwfibxfutoulvymmlfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2d2ZpYnhmdXRvdWx2eW1tbGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTY3MDksImV4cCI6MjA5NzA3MjcwOX0.Iy9yhl7o5STj0cNp_wXWwEisH9FCHT7y8qg3GNVQN7I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Querying forms table...");
  const { data: forms, error: formsError } = await supabase.from("forms").select("*");
  if (formsError) {
    console.error("❌ Forms Error:", formsError);
  } else {
    console.log("✅ Forms Success! Found", forms?.length, "forms.");
    if (forms && forms.length > 0) {
      console.log("Sample form:", forms[0]);
    }
  }

  console.log("Querying form_submissions table...");
  const { data: subs, error: subsError } = await supabase.from("form_submissions").select("*");
  if (subsError) {
    console.error("❌ Submissions Error:", subsError);
  } else {
    console.log("✅ Submissions Success! Found", subs?.length, "submissions.");
    if (subs && subs.length > 0) {
      console.log("Sample submission:", subs[0]);
    }
  }
}

test();
