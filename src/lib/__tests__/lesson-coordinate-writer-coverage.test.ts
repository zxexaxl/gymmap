import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

// Audited in docs/lesson-coordinate-ingestion-guard.md. New writers require classification.
const audited = [
  "scripts/experimental/import-central-extraction.ts",
  "scripts/experimental/import-jexer-extraction.ts",
  "scripts/geocode-gym-locations.ts",
  "scripts/hyrox/build-h3-11d-cohort2-beequick-release.ts",
  "scripts/hyrox/render-h3-11d-cohort1-release-sql.ts",
  "scripts/hyrox/setup-h3-11d-cohort1-release-validation.sql",
  "scripts/hyrox/setup-h3-11d-cohort2-beequick-validation.sql",
  "scripts/hyrox/setup-h3-11d-cohort3-golds-validation.sql",
  "scripts/hyrox/validate-h3-11b-review-ledger.sql",
  "scripts/hyrox/validate-h3-11d-r1-raw-fact-persistence.sql",
  "scripts/validate-lesson-coordinate-ingestion-sql.mjs",
  "scripts/validate-nas-higashiomiya-coordinate-repair.mjs",
  "scripts/validate-nas-osaki-coordinate-repair.mjs",
  "src/lib/lesson-membership-writer.ts",
  "supabase/migrations/0011_add_lesson_discovery_membership.sql",
  "supabase/sql/insert_central_tokyo_locations.sql",
  "supabase/sql/insert_golds_kanto_locations.sql",
  "supabase/sql/insert_jexer_kanagawa_saitama_chiba_locations.sql",
  "supabase/sql/insert_jexer_tokyo_locations.sql",
  "supabase/sql/insert_konami_kanto_locations.sql",
  "supabase/sql/insert_megalos_kanto_locations.sql",
  "supabase/sql/insert_nas_kanto_locations.sql",
  "supabase/sql/insert_tipness_kanto_locations.sql",
  "supabase/sql/repair_nas_higashiomiya_coordinates.sql",
  "supabase/sql/repair_nas_osaki_coordinates.sql",
  "supabase/sql/rollback_nas_higashiomiya_coordinates.sql"
];

test("repository write-path inventory has no unreviewed Lesson publication writer", () => {
  const paths = [...new Set(execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { encoding: "utf8" }).trim().split("\n"))];
  const discovered = paths.filter((path) => {
    if (!/\.(ts|tsx|sql|mjs)$/.test(path) || path.includes("/__tests__/") || path.includes("/tests/")) return false;
    const source = readFileSync(path, "utf8");
    return /(?:insert\s+into|update)\s+(?:public\.)?(?:gym_locations|lesson_location_memberships|class_schedules)\b/i.test(source)
      || /\.from\(["'](?:gym_locations|lesson_location_memberships|class_schedules)["']\)(?:(?!\.from\()[\s\S]){0,1000}?\.(?:insert|upsert|update)\(/.test(source);
  }).sort();
  assert.deepEqual(discovered, audited);
});
