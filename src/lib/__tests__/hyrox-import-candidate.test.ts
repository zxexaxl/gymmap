import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  addUtcDays,
  assertCompleteH2Candidate,
  buildReviewedImportCandidate,
  deterministicHash,
  type DiscoveryArtifact,
  type LocationInventoryArtifact,
  type ResolutionArtifact,
} from "../hyrox-import-candidate";
import { renderRollbackOnlyImportRehearsal } from "../hyrox-import-sql";

async function authority() {
  const [resolution, discovery, inventory] = await Promise.all([
    readFile("data/hyrox/official-training-club-resolution.json", "utf8"),
    readFile("data/hyrox/official-training-clubs-japan.json", "utf8"),
    readFile("data/hyrox/gymmap-location-inventory.json", "utf8"),
  ]);
  return {
    resolution: JSON.parse(resolution) as ResolutionArtifact,
    discovery: JSON.parse(discovery) as DiscoveryArtifact,
    inventory: JSON.parse(inventory) as LocationInventoryArtifact,
  };
}

test("builds exactly the six reviewed confirmed matches", async () => {
  const input = await authority();
  const candidate = buildReviewedImportCandidate(input.resolution, input.discovery, input.inventory);
  assertCompleteH2Candidate(candidate);
  assert.deepEqual(candidate.counts, {
    training_sources: 6,
    location_external_identifiers: 6,
    location_training_disciplines: 6,
    training_affiliations: 6,
    training_evidence: 12,
  });
  assert.equal(candidate.validation.excluded.length, 0);
  assert.equal(new Set(candidate.records.map((record) => record.official_external_id)).size, 6);
  assert.equal(new Set(candidate.records.map((record) => record.matched_location.id)).size, 6);
});

test("candidate is deterministic and uses 90-day freshness", async () => {
  const input = await authority();
  const left = buildReviewedImportCandidate(input.resolution, input.discovery, input.inventory);
  const right = buildReviewedImportCandidate(input.resolution, input.discovery, input.inventory);
  assert.deepEqual(left, right);
  for (const record of left.records) {
    assert.equal(record.stale_at, addUtcDays(record.observed_at, 90));
    assert.match(record.training_source.content_hash, /^[a-f0-9]{64}$/);
    assert.equal(record.evidence.length, 2);
    assert.equal(new Set(record.evidence.map((evidence) => evidence.content_hash)).size, 2);
  }
  assert.equal(deterministicHash({ b: 2, a: 1 }), deterministicHash({ a: 1, b: 2 }));
});

test("excludes unmatched and source-incomplete records", async () => {
  const input = await authority();
  const candidate = buildReviewedImportCandidate(input.resolution, input.discovery, input.inventory);
  assert.ok(candidate.records.every((record) =>
    input.resolution.records.find((source) => source.official_external_id === record.official_external_id)?.resolution_status === "CONFIRMED_MATCH"));
  assert.equal(candidate.records.some((record) => record.official_external_id === null), false);
});

test("rejects duplicate external IDs and duplicate target locations", async () => {
  const input = await authority();
  const confirmed = input.resolution.records.filter((record) => record.resolution_status === "CONFIRMED_MATCH");
  const duplicateIdResolution = structuredClone(input.resolution);
  const duplicateIdConfirmed = duplicateIdResolution.records.filter((record) => record.resolution_status === "CONFIRMED_MATCH");
  duplicateIdConfirmed[1].official_external_id = duplicateIdConfirmed[0].official_external_id;
  const duplicateId = buildReviewedImportCandidate(duplicateIdResolution, input.discovery, input.inventory);
  assert.ok(duplicateId.validation.duplicate_external_ids.length > 0);
  assert.ok(duplicateId.validation.excluded.some((record) => record.reasons.includes("duplicate_external_id")));

  const duplicateLocationResolution = structuredClone(input.resolution);
  const duplicateLocationConfirmed = duplicateLocationResolution.records.filter((record) => record.resolution_status === "CONFIRMED_MATCH");
  duplicateLocationConfirmed[1].gymmap_location_id = duplicateLocationConfirmed[0].gymmap_location_id;
  const duplicateLocation = buildReviewedImportCandidate(duplicateLocationResolution, input.discovery, input.inventory);
  assert.ok(duplicateLocation.validation.duplicate_location_ids.length > 0);
  assert.ok(duplicateLocation.validation.excluded.some((record) => record.reasons.includes("duplicate_target_location")));
  assert.equal(confirmed.length, 6);
});

test("excludes an inactive or missing matched location", async () => {
  const input = await authority();
  const confirmed = input.resolution.records.find((record) => record.resolution_status === "CONFIRMED_MATCH");
  assert.ok(confirmed?.gymmap_location_id);
  const inactiveInventory = structuredClone(input.inventory);
  const location = inactiveInventory.records.find((record) => record.id === confirmed.gymmap_location_id);
  assert.ok(location);
  location.is_active = false;
  const candidate = buildReviewedImportCandidate(input.resolution, input.discovery, inactiveInventory);
  assert.equal(candidate.records.length, 5);
  assert.ok(candidate.validation.excluded[0].reasons.includes("matched_location_inactive"));
});

test("evidence has governing-body accepted supports and exact claim targets", async () => {
  const input = await authority();
  const candidate = buildReviewedImportCandidate(input.resolution, input.discovery, input.inventory);
  for (const record of candidate.records) {
    assert.equal(record.training_source.publisher_authority, "governing_body");
    assert.equal(record.training_source.source_kind, "finder");
    assert.equal(record.training_source.review_required, false);
    assert.deepEqual(record.evidence.map((evidence) => evidence.target_type).sort(), [
      "location_training_discipline",
      "training_affiliation",
    ]);
    assert.ok(record.evidence.every((evidence) => evidence.assertion === "supports"));
    assert.ok(record.evidence.every((evidence) => evidence.review_status === "accepted"));
    assert.ok(record.evidence.every((evidence) => evidence.evidence_text === null));
  }
});

test("candidate graph does not infer locations, equipment, capabilities, classes, or programs", async () => {
  const input = await authority();
  const candidate = buildReviewedImportCandidate(input.resolution, input.discovery, input.inventory);
  const serialized = JSON.stringify(candidate);
  for (const forbidden of ["location_equipment", "location_training_capabilities", "class_schedules", "program_training_disciplines"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("SQL preview is serialized, conflict-blocking, idempotent, and rollback-only", async () => {
  const input = await authority();
  const candidate = buildReviewedImportCandidate(input.resolution, input.discovery, input.inventory);
  const sql = renderRollbackOnlyImportRehearsal(candidate);
  assert.match(sql, /^-- H2-2 reviewed import candidate: LOCAL REHEARSAL ONLY\./);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /HYROX external identifier belongs to another location/);
  assert.match(sql, /excluded\.last_confirmed_at > location_training_disciplines\.last_confirmed_at/);
  assert.match(sql, /where not exists \([\s\S]*evidence\.content_hash/);
  assert.equal((sql.match(/select pg_temp\.apply_h2_hyrox_candidate\(\);/g) ?? []).length, 2);
  assert.match(sql.trim(), /rollback;$/);
  assert.doesNotMatch(sql, /insert into public\.gym_locations/i);
  assert.doesNotMatch(sql, /location_equipment|location_training_capabilities|class_schedules|program_training_disciplines/i);
});
