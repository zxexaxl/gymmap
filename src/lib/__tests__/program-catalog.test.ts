import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProgramCatalog,
  findCatalogMasterEntryBySlug,
  flattenProgramCatalog,
  getCanonicalProgramSlug,
} from "../program-catalog";
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
});

test("catalog drops programs without current Lesson availability", () => {
  const groups = buildProgramCatalog([
    { locationId: "alpha", lessons: [["unknown", null, null, 9]] },
  ], [makeProgram("BODYCOMBAT", "bodycombat")]);

  assert.deepEqual(groups, []);
});
