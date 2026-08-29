import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertH25Candidate,
  buildH25Candidate,
  type H25ProductionPreflight,
  type H25SourceRevalidation,
} from "../hyrox-new-location-import-candidate";
import type { H24ReviewRecord } from "../hyrox-unmatched-review";

const json = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;

function inputs() {
  const review = json<{ records: H24ReviewRecord[] }>("data/hyrox/h2-4-unmatched-location-review.json");
  const ready = json<{ count: number; records: H24ReviewRecord[] }>("data/hyrox/h2-4-new-location-candidates.json");
  const preflight = json<H25ProductionPreflight>("data/hyrox/h2-5-production-preflight.json");
  const revalidation = json<H25SourceRevalidation>("data/hyrox/h2-5-source-revalidation.json");
  const h23 = json<{ records: Array<{ official_external_id: string }> }>("data/hyrox/h2-2-reviewed-import-candidate.json");
  return { review, ready, preflight, revalidation, h23ExternalIds: h23.records.map((record) => record.official_external_id) };
}

test("builds exactly the 17 reviewed READY locations and seven-table graph", () => {
  const candidate = buildH25Candidate(inputs());
  assertH25Candidate(candidate);
  assert.equal(candidate.brands.length, 16);
  assert.equal(candidate.brands.filter((brand) => brand.semantic === "chain").length, 5);
  assert.equal(candidate.brands.filter((brand) => brand.semantic === "single_location_brand").length, 11);
  assert.equal(candidate.locations.length, 17);
  assert.equal(candidate.locations.flatMap((record) => record.evidence).length, 34);
  assert.ok(candidate.locations.every((record) => record.is_active && record.evidence.length === 2));
});

test("candidate is deterministic and freshness derives from revalidation authority", () => {
  const left = buildH25Candidate(inputs());
  const right = buildH25Candidate(inputs());
  assert.deepEqual(left, right);
  assert.equal(left.candidate_hash, right.candidate_hash);
  assert.ok(left.locations.every((record) => record.last_verified_at === left.authority.source_revalidated_at));
  assert.ok(left.locations.every((record) => Date.parse(record.location_training_discipline.stale_at) - Date.parse(record.last_verified_at) === 90 * 86_400_000));
});

test("isolates READY input from H2-3, correction, needs-review, incomplete, and non-standard records", () => {
  const input = inputs();
  const candidate = buildH25Candidate(input);
  const included = new Set(candidate.locations.map((record) => record.hgy_external_id));
  assert.equal(candidate.validation.ready_input_count, 17);
  assert.equal(candidate.validation.included_count, 17);
  assert.ok(input.h23ExternalIds.every((id) => !included.has(id)));
  assert.ok(candidate.locations.every((record) => input.ready.records.some((ready) => ready.hgy_external_id === record.hgy_external_id)));
  assert.equal(candidate.validation.excluded_counts.NEW_LOCATION_NEEDS_REVIEW, 144);
  assert.equal(candidate.validation.excluded_counts.EXISTING_LOCATION_CONFIRMED_MATCH, 1);
  assert.equal(candidate.validation.excluded_counts.NON_STANDARD_LOCATION, 1);
});

test("blocks duplicate HGY and location slugs", () => {
  const hgy = inputs();
  hgy.ready.records[1].hgy_external_id = hgy.ready.records[0].hgy_external_id;
  assert.throws(() => buildH25Candidate(hgy), /Duplicate HGY/);
  const slug = inputs();
  slug.ready.records[1].proposed_slug = slug.ready.records[0].proposed_slug;
  assert.throws(() => buildH25Candidate(slug), /Duplicate location slugs/);
});

test("blocks brand name, brand slug, and semantic grouping collisions", () => {
  const name = inputs();
  name.preflight.brands.push({ id: "collision", name: name.ready.records[0].proposed_brand_name!, slug: "different", official_url: null, description: null });
  assert.throws(() => buildH25Candidate(name), /production brand name collision/);
  const slug = inputs();
  slug.preflight.brands.push({ id: "collision", name: "Different", slug: slug.ready.records[0].proposed_brand_slug!, official_url: null, description: null });
  assert.throws(() => buildH25Candidate(slug), /production brand slug collision/);
  const semantic = inputs();
  semantic.ready.records[1].proposed_brand_slug = semantic.ready.records[0].proposed_brand_slug;
  assert.throws(() => buildH25Candidate(semantic), /brand grouping is semantically inconsistent/);
});

test("blocks production location slug, official URL, address, proximity, and HGY collisions", () => {
  const variants: Array<[keyof H25ProductionPreflight["locations"][number], unknown, RegExp]> = [
    ["slug", inputs().ready.records[0].proposed_slug, /production location slug collision/],
    ["official_url", inputs().ready.records[0].canonical_facility_url, /production official URL collision/],
    ["address_line", inputs().ready.records[0].address, /production normalized address collision/],
  ];
  for (const [key, value, expected] of variants) {
    const input = inputs();
    Object.assign(input.preflight.locations[0], { [key]: value });
    assert.throws(() => buildH25Candidate(input), expected);
  }
  const proximity = inputs();
  proximity.preflight.locations[0].latitude = proximity.ready.records[0].latitude;
  proximity.preflight.locations[0].longitude = proximity.ready.records[0].longitude;
  assert.throws(() => buildH25Candidate(proximity), /within 100m/);
  const hgy = inputs();
  hgy.preflight.hyrox_external_identifiers.push({ location_id: hgy.preflight.locations[0].id, namespace: "hyrox-training-club", external_identifier: hgy.ready.records[0].hgy_external_id });
  assert.throws(() => buildH25Candidate(hgy), /production HGY collision/);
});

test("blocks invalid fields, review status, source revalidation, and older baseline divergence", () => {
  const invalid = inputs();
  invalid.ready.records[0].proposed_location_type = "hyrox_gym";
  assert.throws(() => buildH25Candidate(invalid), /invalid location_type/);
  const coords = inputs();
  coords.ready.records[0].latitude = 10;
  assert.throws(() => buildH25Candidate(coords), /invalid coordinates/);
  const review = inputs();
  review.ready.records[0].manual_review_required = true;
  assert.throws(() => buildH25Candidate(review), /Review-blocked/);
  const source = inputs();
  source.revalidation.records[0].status = "BLOCKED";
  source.revalidation.pass_count = 16;
  source.revalidation.blocked_count = 1;
  assert.throws(() => buildH25Candidate(source), /Source revalidation/);
  const baseline = inputs();
  baseline.preflight.counts.training_evidence = 13;
  assert.throws(() => buildH25Candidate(baseline), /baseline is not exact/);
});

test("graph contains no equipment, capability, program, or class inference", () => {
  const candidate = buildH25Candidate(inputs());
  const text = JSON.stringify(candidate.locations);
  assert.doesNotMatch(text, /location_equipment|location_training_capabilities|program_training_disciplines|class_schedules/);
  assert.ok(candidate.locations.every((record) => !("official" in record.training_affiliation)));
});

test("H2-5 tooling contains no production write or migration command", () => {
  const scripts = [
    "scripts/hyrox/export-h2-5-production-preflight.ts",
    "scripts/hyrox/revalidate-h2-5-new-locations.ts",
    "scripts/hyrox/build-new-location-import-candidate.ts",
  ].map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(scripts, /\.(?:insert|update|delete|upsert)\s*\(/i);
  assert.doesNotMatch(scripts, /supabase\s+(?:db push|migration repair)/i);
  assert.doesNotMatch(scripts, /\b(?:insert|update|delete)\s+(?:into|from|public\.)/i);
});

test("rehearsal is rollback-only, atomic, idempotent, paginated, and verifies publication", () => {
  const sql = readFileSync("data/hyrox/h2-5-reviewed-new-location-import-candidate.rehearsal.sql", "utf8");
  assert.match(sql, /(?:^|\n)begin;\n/);
  assert.match(sql, /rollback;\s*$/);
  assert.equal(sql.match(/select pg_temp\.apply_h25_candidate\(\);/g)?.length, 2);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /published_location_training_disciplines/);
  assert.match(sql, /published_training_affiliations/);
  assert.match(sql, /published_training_discipline_summary/);
  assert.match(sql, /search pagination count mismatch/);
  assert.match(sql, /search pagination contains duplicate locations/);
  assert.match(sql, /Older observation regressed freshness/);
  assert.match(sql, /Private provenance grants leaked/);
});
