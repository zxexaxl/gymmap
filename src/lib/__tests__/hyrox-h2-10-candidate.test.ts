import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import path from "node:path";
import { addUtcDays, deterministicHash } from "../hyrox-import-candidate";
import { assertH210Candidate, buildH210Candidate, H2_10_RECONCILED_CONTRACT_SHA256, H2_10R_COMMIT,
  type H210ProductionPreflight, type H210ReadyRecord, type H210Revalidation } from "../hyrox-h2-10-candidate";

const dataDir = path.resolve("data/hyrox");

async function json<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(path.join(dataDir, name), "utf8")) as T;
}

async function inputs() {
  const [ready, resolution, preflight, revalidation] = await Promise.all([
    json<{ schema_version: number; preview_only: boolean; records: H210ReadyRecord[] }>("h2-9-new-location-ready.json"),
    json<{ deterministic_contract_sha256: string; summary: Record<string, number>; records: Array<{ final_classification: string; hgy_external_id: string; hyrox_official_name: string }> }>("h2-9-location-authority-gap-resolution.json"),
    json<H210ProductionPreflight>("h2-10-production-preflight.json"),
    json<H210Revalidation>("h2-10r-ready-set-revalidation.json"),
  ]);
  return { ready, resolution, preflight, revalidation };
}

function clone<T>(value: T): T { return structuredClone(value); }

test("H2-10R reconciled authority isolates exactly 58 READY records", async () => {
  const input = await inputs();
  assert.equal(input.resolution.deterministic_contract_sha256, H2_10_RECONCILED_CONTRACT_SHA256);
  assert.equal(input.ready.records.length, 58);
  assert.equal(new Set(input.ready.records.map((record) => record.hgy_external_id)).size, 58);
  assert.equal(input.revalidation.input_count, 58);
  assert.equal(input.revalidation.governing_body_pass_count, 58);
  assert.equal(input.revalidation.facility_authority_pass_count, 58);
  assert.equal(input.revalidation.collision_pass_count, 58);
  assert.equal(input.revalidation.remaining_authority_drift_count, 0);
});

test("Tokorozawa carries the replacement locator and retired URL history", async () => {
  const { ready } = await inputs();
  const record = ready.records.find((item) => item.hgy_external_id === "HGY_8sKmKHEiaR8tARb6zZUUbaYjU");
  assert(record);
  assert.equal(record.official_url, "https://www.gym-field.com/studio/");
  assert(record.authority_trace.some((entry) => entry.url.includes("%E6%89%80%E6%B2%A2") && entry.result.includes("404")));
});

test("candidate graph is deterministic, complete, and contains no scope creep", async () => {
  const input = await inputs();
  const first = buildH210Candidate(input);
  const second = buildH210Candidate(clone(input));
  assertH210Candidate(first);
  assert.deepEqual(second, first);
  assert.equal(first.authority.h2_10r_commit, H2_10R_COMMIT);
  assert.equal(first.candidate_hash, "0ba500a419ae2e3e2ddc130ef0b42ee7fc9ae4bc61d05b2ae720fa350f9ff6dd");
  assert.equal(first.counts.gym_brands, 35);
  assert.equal(first.counts.gym_locations, 58);
  assert.equal(first.counts.training_sources, 58);
  assert.equal(first.counts.location_external_identifiers, 58);
  assert.equal(first.counts.location_training_disciplines, 58);
  assert.equal(first.counts.training_affiliations, 58);
  assert.equal(first.counts.training_evidence, 116);
  assert.equal(first.counts.location_equipment, 0);
  assert.equal(first.counts.location_training_capabilities, 0);
  assert.equal(first.counts.program_training_disciplines, 0);
  assert.equal(first.counts.class_schedules, 0);
});

test("brand graph finalizes 3 existing identities, 4 new chains, and 31 single-location brands", async () => {
  const candidate = buildH210Candidate(await inputs());
  assert.equal(candidate.counts.existing_brand_reuse, 3);
  assert.equal(candidate.counts.new_chain_brands, 4);
  assert.equal(candidate.counts.new_single_location_brands, 31);
  assert.deepEqual(candidate.brand_resolutions.filter((brand) => brand.resolution === "EXISTING_BRAND_REUSE").map((brand) => brand.slug).sort(),
    ["anytime-fitness", "beequick-fitness", "golds-gym"]);
  assert.deepEqual(candidate.brand_resolutions.filter((brand) => brand.resolution === "NEW_CHAIN_BRAND").map((brand) => brand.slug).sort(),
    ["beyond", "gym-field", "orangetheory-fitness", "ufc-gym"]);
});

test("all location fields, types, slugs, addresses, postal codes, and coordinates pass", async () => {
  const candidate = buildH210Candidate(await inputs());
  assert.equal(new Set(candidate.locations.map((location) => location.slug)).size, 58);
  assert.equal(new Set(candidate.locations.map((location) => location.address_line)).size, 58);
  assert.equal(new Set(candidate.locations.map((location) => `${location.latitude},${location.longitude}`)).size, 58);
  for (const location of candidate.locations) {
    assert.match(location.hgy_external_id, /^HGY_[A-Za-z0-9]+$/);
    assert.match(location.postal_code, /^\d{7}$/);
    assert(location.name && location.prefecture && location.city && location.address_line && location.official_url && location.source_url);
    assert.equal(location.collision_status, "clear");
  }
});

test("freshness uses the frozen observation and never artifact generation time", async () => {
  const input = await inputs();
  const candidate = buildH210Candidate(input);
  for (const location of candidate.locations) {
    assert.equal(location.last_verified_at, input.revalidation.observed_at);
    assert.equal(location.location_training_discipline.stale_at, addUtcDays(input.revalidation.observed_at, 90));
    assert.equal(location.training_affiliation.stale_at, addUtcDays(input.revalidation.observed_at, 90));
  }
  const older = clone(input);
  older.revalidation.observed_at = "2020-01-01T00:00:00.000Z";
  assert.throws(() => buildH210Candidate(older), /regress freshness/);
});

test("publication and static manifests model 24 to 82 and all 58 active slugs", async () => {
  const candidate = buildH210Candidate(await inputs());
  assert.deepEqual(candidate.publication_rehearsal, {
    published_before: 24, published_after: 82, official_before: 24, official_after: 82, search_before: 24, search_after: 82,
  });
  assert.equal(candidate.static_publication.route_eligible_slugs.length, 58);
  assert.equal(candidate.static_publication.active_locations_before, 383);
  assert.equal(candidate.static_publication.active_locations_after, 441);
  assert.deepEqual(candidate.static_publication.sitemap_eligible_slugs, candidate.static_publication.route_eligible_slugs);
  assert.equal(new Set(candidate.static_publication.route_eligible_slugs).size, 58);
});

test("production drift and semantic conflicts fail closed", async () => {
  const base = await inputs();
  const cases: Array<[string, (input: Awaited<ReturnType<typeof inputs>>) => void, RegExp]> = [
    ["brand", (input) => { input.preflight.brands.find((brand) => brand.slug === "anytime-fitness")!.name = "Different Brand"; }, /brand semantic conflict/],
    ["slug", (input) => { input.preflight.locations[0].slug = input.ready.records[0].slug; }, /location slug collision/],
    ["url", (input) => { input.preflight.locations[0].official_url = input.ready.records[0].official_url; }, /official URL collision/],
    ["address", (input) => { input.preflight.locations[0].address_line = input.ready.records[0].address; }, /address collision/],
    ["near coordinate", (input) => { input.preflight.locations[0].latitude = input.ready.records[0].latitude; input.preflight.locations[0].longitude = input.ready.records[0].longitude; }, /unaudited production location within 100m/],
    ["HGY", (input) => { input.preflight.hyrox_external_identifiers[0].external_identifier = input.ready.records[0].hgy_external_id; }, /production HGY collision/],
    ["source", (input) => { input.preflight.training_sources[0].canonical_url = input.ready.records[0].source_url; }, /production source collision/],
    ["affiliation", (input) => { input.preflight.hyrox_affiliations[0].external_identifier = input.ready.records[0].hgy_external_id; }, /production affiliation collision/],
  ];
  for (const [, mutate, expected] of cases) {
    const input = clone(base); mutate(input); assert.throws(() => buildH210Candidate(input), expected);
  }
});

test("evidence is deterministic and deduplicable by content hash", async () => {
  const base = await inputs();
  const candidate = buildH210Candidate(base);
  const hashes = candidate.locations.flatMap((location) => location.evidence.map((evidence) => evidence.content_hash));
  assert.equal(hashes.length, 116);
  assert.equal(new Set(hashes).size, 116);
  const { candidate_hash: hash, ...withoutHash } = candidate;
  assert.equal(hash, deterministicHash(withoutHash));
});

test("rehearsal artifact is guarded, advisory-locked, idempotent, and rollback-only", async () => {
  const sql = await readFile(path.join(dataDir, "h2-10-reviewed-new-location-import-candidate.rehearsal.sql"), "utf8");
  assert.match(sql, /current_database\(\) !~ '\^gymmap_h2_10_rehearsal'/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /call pg_temp\.apply_h210\(\);[\s\S]*call pg_temp\.apply_h210\(\);/);
  assert.match(sql, /second pass was not idempotent/);
  assert.match(sql, /rollback;/);
  assert.doesNotMatch(sql, /supabase db push|SUPABASE_SERVICE_ROLE_KEY/);
});
