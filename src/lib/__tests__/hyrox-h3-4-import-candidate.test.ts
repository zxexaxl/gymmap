import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  H3_3_COMMIT,
  H3_3_SAMPLE_SHA256,
  buildH34Candidate,
  h34Hash,
  type H34ProductionPreflight,
  type H34SourceRevalidation,
} from "../hyrox-h3-4-import-candidate";
import type { PocReviewArtifact } from "../hyrox-equipment-evidence";

const dataDir = path.resolve("data/hyrox");

async function json<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(path.join(dataDir, name), "utf8")) as T;
}

async function inputs() {
  const sampleText = await readFile(path.join(dataDir, "h3-3-equipment-poc-sample.json"), "utf8");
  return {
    review: await json<PocReviewArtifact>("h3-3-equipment-evidence-poc.json"),
    revalidation: await json<H34SourceRevalidation>("h3-4-equipment-source-revalidation.json"),
    preflight: await json<H34ProductionPreflight>("h3-4-production-preflight.json"),
    sampleSha256: createHash("sha256").update(sampleText).digest("hex"),
  };
}

test("H3-4 isolates the exact H3-3 authority and positive claim inventory", async () => {
  const candidate = buildH34Candidate(await inputs());
  assert.equal(candidate.authority.h3_3_commit, H3_3_COMMIT);
  assert.equal(candidate.authority.h3_3_sample_sha256, H3_3_SAMPLE_SHA256);
  assert.equal(candidate.counts.sample_facilities, 15);
  assert.equal(candidate.counts.enriched_facilities, 9);
  assert.equal(candidate.counts.location_equipment, 36);
  assert.equal(candidate.counts.location_training_capabilities, 16);
  assert.equal(candidate.counts.training_evidence, 52);
  assert.equal(candidate.counts.excluded_review_required, 14);
  assert.equal(candidate.counts.negative_claims, 0);
});

test("equipment and capability breakdowns match the reviewed H3-3 inventory", async () => {
  const candidate = buildH34Candidate(await inputs());
  const count = (rows: Array<{ [key: string]: unknown }>, key: string) => Object.fromEntries(
    [...new Set(rows.map((row) => String(row[key])))].sort().map((slug) => [slug, rows.filter((row) => row[key] === slug).length]),
  );
  assert.deepEqual(count(candidate.equipment, "equipment_slug"), {
    "farmers-carry-implements": 6,
    "functional-training-lane": 2,
    "row-erg": 6,
    "running-track": 1,
    sandbag: 6,
    "ski-erg": 4,
    treadmill: 3,
    "wall-ball-target": 2,
    "weighted-sled": 6,
  });
  assert.deepEqual(count(candidate.capabilities, "capability_slug"), {
    "competition-simulation": 2,
    "discipline-coaching": 8,
    "open-training": 4,
    "sled-push-pull-space": 2,
  });
});

test("source graph is exact, reused, private-minimal and drift-free", async () => {
  const candidate = buildH34Candidate(await inputs());
  assert.equal(candidate.sources.length, 10);
  assert.equal(new Set(candidate.sources.map((source) => source.source_ref)).size, 10);
  assert.deepEqual(
    candidate.sources.reduce<Record<string, number>>((result, source) => {
      const quality = String(source.metadata_json.evidence_quality);
      result[quality] = (result[quality] ?? 0) + 1;
      return result;
    }, {}),
    { Q1: 6, Q2: 4 },
  );
  const serialized = JSON.stringify(candidate.sources);
  assert.doesNotMatch(serialized, /phone|email|staff|person_name|raw_html|image/i);
  assert.ok(candidate.sources.every((source) => source.availability_state === "available" && !source.review_required));
});

test("freshness is frozen by category and generation time cannot extend it", async () => {
  const input = await inputs();
  const candidate = buildH34Candidate(input);
  assert.ok(candidate.equipment.every((row) => Date.parse(row.stale_at) - Date.parse(row.last_confirmed_at) === 180 * 86_400_000));
  for (const row of candidate.capabilities) {
    const expected = row.capability_slug === "competition-simulation" ? 30 : 90;
    assert.equal(row.freshness_horizon_days, expected);
    assert.equal(Date.parse(row.stale_at) - Date.parse(row.last_confirmed_at), expected * 86_400_000);
  }
  assert.equal(candidate.capabilities.filter((row) => row.capability_slug === "competition-simulation").length, 2);
  assert.deepEqual(buildH34Candidate(structuredClone(input)), candidate);
});

test("evidence has exact source/target, accepted support, and deterministic unique hashes", async () => {
  const candidate = buildH34Candidate(await inputs());
  const sourceRefs = new Set(candidate.sources.map((source) => source.source_ref));
  const equipmentRefs = new Set(candidate.equipment.map((claim) => claim.equipment_ref));
  const capabilityRefs = new Set(candidate.capabilities.map((claim) => claim.capability_ref));
  assert.equal(new Set(candidate.evidence.map((row) => row.content_hash)).size, 52);
  for (const row of candidate.evidence) {
    assert(sourceRefs.has(row.source_ref));
    assert.equal(row.assertion, "supports");
    assert.equal(row.review_status, "accepted");
    assert(row.target_type === "location_equipment" ? equipmentRefs.has(row.target_ref) : capabilityRefs.has(row.target_ref));
  }
  const { candidate_hash: hash, ...withoutHash } = candidate;
  assert.equal(hash, h34Hash(withoutHash));
  assert.equal(hash, "f47f7edcb4fb63120d35e44ed2bda50c8c61e779724d4f12453a48037d280ae8");
});

test("publication and search projection remain positive-only and location-total invariant", async () => {
  const candidate = buildH34Candidate(await inputs());
  assert.equal(candidate.publication_rehearsal.hyrox_before, 82);
  assert.equal(candidate.publication_rehearsal.hyrox_after, 82);
  assert.equal(candidate.publication_rehearsal.official_before, 82);
  assert.equal(candidate.publication_rehearsal.official_after, 82);
  assert.equal(candidate.publication_rehearsal.published_equipment_rows, 36);
  assert.equal(candidate.publication_rehearsal.equipment_positive_facilities, 6);
  assert.equal(candidate.publication_rehearsal.published_capability_rows, 16);
  assert.equal(candidate.publication_rehearsal.capability_positive_facilities, 9);
  assert.equal(candidate.publication_rehearsal.open_training_positive_facilities, 4);
  assert.equal(candidate.publication_rehearsal.negative_claims, 0);
});

test("production drift, collisions, source drift and taxonomy drift fail closed", async () => {
  const base = await inputs();
  const cases: Array<[string, (input: typeof base) => void, RegExp]> = [
    ["equipment collision", (input) => { input.preflight.counts.location_equipment = 1; }, /first-import collision/],
    ["source collision", (input) => { input.preflight.collisions.candidate_source_urls = 1; }, /collision preflight/],
    ["source drift", (input) => { input.revalidation.source_drift_count = 1; }, /source authority drift/],
    ["missing basis", (input) => { input.revalidation.sources[0].content_basis_present = false; }, /Source revalidation failed/],
    ["taxonomy", (input) => { input.preflight.taxonomy.equipment.pop(); }, /Equipment taxonomy drift/],
    ["sample identity", (input) => { input.preflight.sample_locations[0].official = false; }, /Sample production identity drift/],
  ];
  for (const [, mutate, expected] of cases) {
    const input = structuredClone(base);
    mutate(input);
    assert.throws(() => buildH34Candidate(input), expected);
  }
});

test("rehearsal SQL is local-only, advisory-locked, idempotent, conflicting and rollback-only", async () => {
  const sql = await readFile(path.join(dataDir, "h3-4-equipment-evidence-import-candidate.rehearsal.sql"), "utf8");
  assert.match(sql, /current_database\(\) !~ '\^gymmap_h3_4_rehearsal'/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /call pg_temp\.apply_h34\(\);[\s\S]*call pg_temp\.apply_h34\(\);/);
  assert.match(sql, /second pass was not idempotent or freshness regressed/);
  assert.match(sql, /source collision did not fail/);
  assert.match(sql, /equipment conflict did not fail/);
  assert.match(sql, /capability conflict did not fail/);
  assert.match(sql, /evidence conflict did not fail/);
  assert.match(sql, /freshness regression did not fail/);
  assert.match(sql, /rollback;/);
  assert.doesNotMatch(sql, /SUPABASE_SERVICE_ROLE_KEY|supabase db push/);
});

test("H3-1 consumer ignores partial equipment/capability projection", async () => {
  const [loader, component, page] = await Promise.all([
    readFile("src/lib/hyrox-discovery.ts", "utf8"),
    readFile("src/components/training/hyrox-discovery.tsx", "utf8"),
    readFile("src/app/training/hyrox/page.tsx", "utf8"),
  ]);
  for (const consumer of [loader, component, page]) {
    assert.doesNotMatch(consumer, /equipmentSlugs|capabilitySlugs|openTrainingAvailable|classAvailable/);
    assert.doesNotMatch(consumer, /equipment_slugs|capability_slugs|open_training_available|class_available/);
  }
});
