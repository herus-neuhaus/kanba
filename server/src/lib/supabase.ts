import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// This is a server-side Supabase client used for Auth operations
// WARNING: Do NOT use this to bypass RLS for data fetching. Data fetching should be done via Drizzle.
export const supabaseAuthClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
