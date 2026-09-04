import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { validateLessonPublicationLocations } from "./lesson-coordinate-publication";

export async function ensureLessonLocationMembership(
  supabase: SupabaseClient<Database>,
  locationId: string,
  authoritySource: string,
) {
  const { data: location, error: locationError } = await supabase.from("gym_locations")
    .select("id, is_active, latitude, longitude").eq("id", locationId).single();
  if (locationError || !location) {
    throw new Error(`Failed to load Lesson publication location ${locationId}: ${locationError?.message ?? "missing location"}`);
  }
  validateLessonPublicationLocations([location]);

  const { error } = await supabase.from("lesson_location_memberships").upsert(
    { location_id: locationId, authority_source: authoritySource },
    { onConflict: "location_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(`Failed to ensure Lesson membership for ${locationId}: ${error.message}`);
  }
}
