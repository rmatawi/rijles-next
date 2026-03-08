import { createClient } from "@supabase/supabase-js";

// Centralized Supabase configuration
export const SUPABASE_CONFIG = {
  URL:
    process.env.VITE_REACT_APP_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ANON_KEY:
    process.env.VITE_REACT_APP_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

// Validate environment variables
if (!SUPABASE_CONFIG.URL) {
  console.error(
    "Missing Supabase URL env var (VITE_REACT_APP_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)"
  );
}

if (!SUPABASE_CONFIG.ANON_KEY) {
  console.error(
    "Missing Supabase anon key env var (VITE_REACT_APP_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
  );
}

// Create Supabase client
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY
);
