import { createClient } from "@supabase/supabase-js";

// Public Supabase client - used ONLY for auth flows and Realtime on the browser
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
