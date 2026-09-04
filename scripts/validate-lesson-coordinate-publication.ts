import "./experimental/load-env";
import { createClient } from "@supabase/supabase-js";
import { validateLessonPublicationLocations, type LessonPublicationLocation } from "../src/lib/lesson-coordinate-publication";

// Explicit operational preflight. SELECT only; never run from application requests.
async function main() {
  if (!process.argv.includes("--read-only")) throw new Error("Use --read-only to request the Lesson publication census");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Public Supabase URL and anon key are required");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const locations: LessonPublicationLocation[] = [];
  let expectedCount: number | undefined;
  for (let offset = 0; ; offset += 500) {
    const { data, error, count } = await client.from("lesson_location_memberships")
      .select("location_id, gym_locations!inner(id, is_active, latitude, longitude)", { count: "exact" })
      .eq("gym_locations.is_active", true).order("location_id").range(offset, offset + 499);
    if (error || !data || count === null) throw new Error(error?.message ?? "Incomplete Lesson census");
    if (expectedCount !== undefined && expectedCount !== count) throw new Error("Lesson census changed during pagination");
    expectedCount = count;
    for (const membership of data) {
      const joined = membership.gym_locations as unknown as LessonPublicationLocation | LessonPublicationLocation[];
      const row = Array.isArray(joined) ? joined[0] : joined;
      if (!row || (Array.isArray(joined) && joined.length !== 1)) throw new Error("Invalid Lesson location join");
      locations.push(row);
    }
    if (locations.length >= count) break;
    if (!data.length) throw new Error("Truncated Lesson census");
  }
  if (locations.length !== expectedCount || new Set(locations.map((row) => row.id)).size !== expectedCount) {
    throw new Error("Incomplete or duplicate Lesson census");
  }
  validateLessonPublicationLocations(locations);
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), activePositive: locations.length, coordinateComplete: locations.length, gaps: 0, mutation: false }));
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
