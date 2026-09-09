import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProgramCatalog,
  findCatalogMasterEntryBySlug,
  flattenProgramCatalog,
  getCanonicalProgramSlug,
} from "../program-catalog";
import { buildMapLessonPurposeIndex } from "../map-lesson-purpose-index";
import type { MapLocationLessonIndex, Program } from "../types";

const makeProgram = (name: string, slug: string): Program => ({
  id: slug,
  name,
  slug,
  category: null,
  description: null,
  intensity_level: null,
  beginner_friendly: false,
  default_duration_minutes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
});

test("catalog groups canonical programs without displaying aliases twice", () => {
  const index: MapLocationLessonIndex[] = [
    {
      locationId: "alpha",
      lessons: [
        ["BODY ATTACK", "BODYATTACK", "Les Mills", 2],
        ["ボディアタック45", "BODYATTACK", "Les Mills", 1],
        ["ZUMBA", "ZUMBA", "ZUMBA", 3],
      ],
    },
    {
      locationId: "bravo",
      lessons: [
        ["BODYATTACK30", "BODYATTACK", "Les Mills", 2],
        ["ヨガ", "ヨガ", null, 4],
      ],
    },
  ];

  const items = flattenProgramCatalog(buildProgramCatalog(index, [makeProgram("ZUMBA", "zumba")]));
  const bodyAttack = items.find((item) => item.canonicalProgramName === "BODYATTACK");

  assert.equal(items.filter((item) => item.canonicalProgramName === "BODYATTACK").length, 1);
  assert.equal(bodyAttack?.facilityCount, 2);
  assert.equal(bodyAttack?.weeklyLessonCount, 5);
  assert.equal(bodyAttack?.slug, "bodyattack");
  assert.equal(bodyAttack?.databaseProgram, null);
  assert.equal(items.find((item) => item.canonicalProgramName === "ZUMBA")?.databaseProgram?.id, "zumba");
  assert.equal(items.find((item) => item.canonicalProgramName === "ヨガ")?.programBrand, null);
});

test("catalog exposes stable canonical detail slugs", () => {
  assert.equal(getCanonicalProgramSlug("BODYATTACK"), "bodyattack");
  assert.equal(getCanonicalProgramSlug("LES MILLS CORE"), "les-mills-core");
  assert.equal(findCatalogMasterEntryBySlug("bodyattack")?.canonicalProgramName, "BODYATTACK");
  assert.equal(findCatalogMasterEntryBySlug("les-mills-core")?.programBrand, "Les Mills");
  assert.equal(getCanonicalProgramSlug("LES MILLS DANCE"), "les-mills-dance");
  assert.equal(getCanonicalProgramSlug("RADICAL POWER"), "radical-power");
  assert.equal(getCanonicalProgramSlug("LES MILLS SHAPES"), "les-mills-shapes");
  assert.equal(getCanonicalProgramSlug("BODYPUMP HEAVY"), "bodypump-heavy");
  assert.equal(getCanonicalProgramSlug("LES MILLS TONE"), "les-mills-tone");
  assert.equal(getCanonicalProgramSlug("DDD HOUSE WORKOUT"), "ddd-house-workout");
  assert.equal(findCatalogMasterEntryBySlug("radical-power")?.programBrand, "Radical Fitness");
});

test("catalog assigns standard BODYPUMP and HEAVY rows exactly once", () => {
  const index = buildMapLessonPurposeIndex([
    { location_id: "alpha", raw_program_name: "BODYPUMP 45", valid_from: "2026-09-01" },
    { location_id: "alpha", raw_program_name: "BODYPUMP HEAVY", valid_from: "2026-09-01" },
    { location_id: "alpha", raw_program_name: "BODY PUMP HEAVY45", valid_from: "2026-09-01" },
    { location_id: "bravo", raw_program_name: "ボディパンプヘビー30", valid_from: "2026-09-01" },
  ]);
  const items = flattenProgramCatalog(buildProgramCatalog(index, []));
  const bodyPump = items.find((item) => item.canonicalProgramName === "BODYPUMP");
  const heavy = items.find((item) => item.canonicalProgramName === "BODYPUMP HEAVY");

  assert.deepEqual(
    { facilities: bodyPump?.facilityCount, lessons: bodyPump?.weeklyLessonCount },
    { facilities: 1, lessons: 1 },
  );
  assert.deepEqual(
    { facilities: heavy?.facilityCount, lessons: heavy?.weeklyLessonCount },
    { facilities: 2, lessons: 3 },
  );
  assert.equal((bodyPump?.weeklyLessonCount ?? 0) + (heavy?.weeklyLessonCount ?? 0), 4);
});

test("catalog drops programs without current Lesson availability", () => {
  const groups = buildProgramCatalog([
    { locationId: "alpha", lessons: [["unknown", null, null, 9]] },
  ], [makeProgram("BODYCOMBAT", "bodycombat")]);

  assert.deepEqual(groups, []);
});
