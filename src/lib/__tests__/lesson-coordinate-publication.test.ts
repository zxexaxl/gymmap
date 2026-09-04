import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { validateLessonMapEligibilityForPublication as validate, validateLessonPublicationLocations, lessonCoordinatePublicationSqlGuard } from "../lesson-coordinate-publication";
import { ensureLessonLocationMembership } from "../lesson-membership-writer";

const valid = { id: "physical", isActive: true, lessonMembershipRequested: true, latitude: 35.6, longitude: 139.7 };
const invalidPairs = [
  [null, null], [undefined, undefined], [null, 139], [35, null], [undefined, 139], [35, undefined],
  [NaN, 139], [35, NaN], [Infinity, 139], [35, -Infinity],
  [90.000001, 139], [-90.000001, 139], [35, 180.000001], [35, -180.000001],
] as const;

test("active physical Lesson coordinates: complete, finite, inclusive geographic bounds", () => {
  validate(valid);
  validate({ ...valid, latitude: -90, longitude: -180 });
  validate({ ...valid, latitude: 90, longitude: 180 });
  validate({ ...valid, latitude: 0, longitude: 0 });
  for (const [latitude, longitude] of invalidPairs) {
    assert.throws(() => validate({ ...valid, latitude, longitude }), /PUBLICATION_HOLD/);
  }
});

test("the repaired eight-facility NAS cohort satisfies publication eligibility", () => {
  // Public coordinate authority read on 2026-09-04; this test never repairs data.
  const repaired = [
    ["seisekisakuragaoka", 35.651980, 139.447217], ["shinozaki", 35.705810, 139.904634],
    ["hikarigaoka", 35.760570, 139.628253], ["musashiurawa", 35.845536, 139.647899],
    ["higashiomiya-newbuild", 35.947483, 139.641284], ["rokakoen", 35.668015, 139.608705],
    ["osaki", 35.618258, 139.726683], ["nishikasai", 35.664095, 139.860002],
  ] as const;
  for (const [id, latitude, longitude] of repaired) validate({ ...valid, id, latitude, longitude });
});

test("closed history is preserved; reactivation requires valid coordinates; HYROX-only is outside Lesson", () => {
  const closed = { ...valid, isActive: false, latitude: null, longitude: null };
  validate(closed);
  assert.throws(() => validate({ ...closed, isActive: true }), /PUBLICATION_HOLD/);
  validate({ ...valid, lessonMembershipRequested: false, latitude: null, longitude: null });
});

function clientFor(latitude: number | null | undefined, longitude: number | null | undefined, is_active = true) {
  const mutations: unknown[] = [];
  const client = {
    from(table: string) {
      if (table === "gym_locations") return {
        select(columns: string) {
          assert.equal(columns, "id, is_active, latitude, longitude");
          return { eq() { return { async single() { return { data: { id: "existing-slug", is_active, latitude, longitude }, error: null }; } }; } };
        },
      };
      assert.equal(table, "lesson_location_memberships");
      return { async upsert(row: unknown, options: unknown) { mutations.push({ row, options }); return { error: null }; } };
    },
  } as unknown as SupabaseClient<Database>;
  return { client, mutations };
}

test("membership writer rejects invalid authoritative state before mutation, including existing slugs and dropped fields", async () => {
  for (const [latitude, longitude] of invalidPairs) {
    const { client, mutations } = clientFor(latitude, longitude);
    await assert.rejects(ensureLessonLocationMembership(client, "existing-slug", "test"), /PUBLICATION_HOLD/);
    assert.equal(mutations.length, 0);
  }
  // A prior registration payload dropped valid coordinates: the DB read, not the input claim, wins.
  const input = { latitude: 35, longitude: 139 };
  assert.ok(input.latitude && input.longitude);
  const { client, mutations } = clientFor(undefined, undefined);
  await assert.rejects(ensureLessonLocationMembership(client, "existing-slug", "test"), /PUBLICATION_HOLD/);
  assert.equal(mutations.length, 0);
});

test("valid publication and inactive preservation keep membership idempotent without coordinate writes", async () => {
  for (const fixture of [clientFor(35, 139), clientFor(null, null, false)]) {
    await ensureLessonLocationMembership(fixture.client, "existing-slug", "test");
    assert.deepEqual(fixture.mutations, [{ row: { location_id: "existing-slug", authority_source: "test" }, options: { onConflict: "location_id", ignoreDuplicates: true } }]);
  }
});

test("all importer targets are checked before any mutation, including a late invalid target", () => {
  let mutations = 0;
  assert.throws(() => {
    validateLessonPublicationLocations([
      { id: "valid", is_active: true, latitude: 35, longitude: 139 },
      { id: "invalid", is_active: true, latitude: null, longitude: null },
    ]);
    mutations++;
  }, /PUBLICATION_HOLD/);
  assert.equal(mutations, 0);
  for (const brand of ["central", "jexer"]) {
    const source = readFileSync(`scripts/experimental/import-${brand}-extraction.ts`, "utf8");
    const main = source.slice(source.indexOf("async function main("));
    assert.ok(main.indexOf("validateLessonPublicationLocations(") < main.indexOf("await ensureProgramId("));
    assert.match(main, /select\("id, name, is_active, latitude, longitude"\)/);
    assert.match(main, /ensureLessonLocationMembership/);
  }
});

test("all reachable registration packets use the equivalent transaction guard", () => {
  for (const family of ["central_tokyo", "golds_kanto", "jexer_kanagawa_saitama_chiba", "jexer_tokyo", "konami_kanto", "megalos_kanto", "nas_kanto", "tipness_kanto"]) {
    const sql = readFileSync(`supabase/sql/insert_${family}_locations.sql`, "utf8");
    assert.ok(sql.indexOf("begin;") < sql.indexOf("insert into gym_locations"));
    assert.match(sql, /lock table public.gym_locations, public.lesson_location_memberships in share row exclusive mode/);
    assert.ok(sql.endsWith(`${lessonCoordinatePublicationSqlGuard()}\n\ncommit;\n`));
  }
});
