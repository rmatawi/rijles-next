const viteEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.startsWith("VITE_"))
);

const env = {
  ...viteEnv,
  VITE_REACT_APP_SUPABASE_URL:
    process.env.VITE_REACT_APP_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "",
  VITE_REACT_APP_SUPABASE_ANON_KEY:
    process.env.VITE_REACT_APP_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "",
};

/** @type {import('next').NextConfig} */
const nextConfig = { env };

export default nextConfig;
