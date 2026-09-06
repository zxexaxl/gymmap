import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const maintenanceMode = process.env.GYMMAP_MAINTENANCE_MODE === "true";

export function hasSupabaseEnv() {
  return !maintenanceMode && Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClient() {
  if (maintenanceMode) {
    throw new Error("GymMap maintenance mode is enabled.");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
