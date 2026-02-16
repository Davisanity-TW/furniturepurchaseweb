import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_USER_ID = "2ef2b25b-e4b1-46dd-abee-a5513043ad42";

/**
 * IMPORTANT:
 * Do NOT create the Supabase client at module scope.
 * Next.js may evaluate modules during build/prerender and crash if env vars are missing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey);
}
