import { createClient } from "@supabase/supabase-js";

// Public client used ONLY for Realtime subscriptions on the browser
export function createRealtimeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: { params: { eventsPerSecond: 2 } },
    }
  );
}
