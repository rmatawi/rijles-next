import { createClient } from "@supabase/supabase-js";

// Centralized Supabase configuration
export const SUPABASE_CONFIG = {
  URL: process.env.VITE_REACT_APP_SUPABASE_URL,
  ANON_KEY: process.env.VITE_REACT_APP_SUPABASE_ANON_KEY
};

// Validate environment variables
if (!SUPABASE_CONFIG.URL) {
  console.error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
}

if (!SUPABASE_CONFIG.ANON_KEY) {
  console.error(
    "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
  );
}

// Create Supabase client
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY
);