import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export async function ensureLessonLocationMembership(
  supabase: SupabaseClient<Database>,
  locationId: string,
  authoritySource: string,
) {
  const { error } = await supabase.from("lesson_location_memberships").upsert(
    { location_id: locationId, authority_source: authoritySource },
    { onConflict: "location_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(`Failed to ensure Lesson membership for ${locationId}: ${error.message}`);
  }
}
