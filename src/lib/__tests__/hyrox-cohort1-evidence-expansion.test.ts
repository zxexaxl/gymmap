import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

/* eslint-disable @typescript-eslint/no-explicit-any -- deterministic authority fixtures are validated structurally below */

const paths = {
  evidence: "data/hyrox/h3-11d-cohort1-raw-evidence.json",
  ledger: "data/hyrox/h3-11d-cohort1-review-ledger-candidate.json",
  claims: "data/hyrox/h3-11d-cohort1-positive-claim-candidate.json",
  gaps: "data/hyrox/h3-11d-cohort1-persistence-gaps.json",
};
const evidence = JSON.parse(fs.readFileSync(paths.evidence, "utf8"));
const ledger = JSON.parse(fs.readFileSync(paths.ledger, "utf8"));
const claims = JSON.parse(fs.readFileSync(paths.claims, "utf8"));
const gaps = JSON.parse(fs.readFileSync(paths.gaps, "utf8"));
const h3c = JSON.parse(fs.readFileSync("data/hyrox/h3-11c-source-qualification.json", "utf8"));
const h3a = JSON.parse(fs.readFileSync("data/hyrox/h3-11a-station-evidence-authority.json", "utf8"));

const expectedHgyIds = [
  "HGY_4GF2DeDJoIzNRU4jn9scAv65V", "HGY_6lR3pcwsQaSGSlsQTdrNrO1jc", "HGY_C0V7CK7K15SLUrMhBvyyO0phM", "HGY_CKpn4DHneWfrqTUVaA7D5Whop",
  "HGY_Cl8QF5olON4Y0D7mho4iGg34L", "HGY_gp7GcAxbIZtxk5KpvoDwAOOcr", "HGY_j1Szv4JmxytARCgfm48f0Z4xS", "HGY_w8GnFtzgPzHOTZfWMBGzdEtoC",
];
const stationIds = ["ski-erg", "sled-push", "sled-pull", "burpee-broad-jump", "row", "farmers-carry", "sandbag-lunges", "wall-balls"];
const timestampKeys = new Set(["reviewed_at", "observed_at", "last_confirmed_at", "stale_at", "coverage_expires_at"]);

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stable(record[key])]));
  }
  return value;
}
function hash(value: unknown, replaceTimestamps = false): string {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value), replaceTimestamps ? (key, child) => timestampKeys.has(key) ? "<timestamp>" : child : undefined)).digest("hex");
}
function withoutHashes<T extends { deterministic_hashes?: unknown }>(value: T): Omit<T, "deterministic_hashes"> {
  const copy = structuredClone(value);
  delete copy.deterministic_hashes;
  return copy;
}

test("H3-11D Cohort 1 identity is exact and remains no-current-positive at candidate start", () => {
  assert.deepEqual(evidence.facilities.map((row: any) => row.identity.hgy_id), expectedHgyIds);
  assert.equal(new Set(evidence.facilities.map((row: any) => row.identity.location_id)).size, 8);
  for (const row of evidence.facilities) {
    assert.equal(row.identity.current_official, true);
    assert.equal(row.identity.current_positive_enrichment_count, 0);
  }
  const accepted = h3c.cohorts.find((row: any) => row.id === "h3-11d-c1-facility-hyrox-text-pilot");
  assert.deepEqual(new Set(accepted.hgy_ids), new Set(expectedHgyIds));
  assert.equal(hash(evidence.facilities.map((row: any) => row.identity)), evidence.deterministic_hashes.COHORT_1_IDENTITY_SHA256);
});

test("H3-11D sources are fresh, facility-bound, taxonomy-aligned, and deduplicated", () => {
  assert.equal(evidence.sources.length, 24);
  assert.equal(new Set(evidence.sources.map((row: any) => row.requested_url)).size, 24);
  const sourceClasses = new Set(h3a.sourceClasses.map((row: any) => row.id));
  const bindings = new Set(["FACILITY_SPECIFIC", "BRAND_FACILITY_SPECIFIC", "GENERIC_NON_FACILITY_BOUND", "UNKNOWN_INSUFFICIENT"]);
  for (const source of evidence.sources) {
    assert.ok(sourceClasses.has(source.source_class));
    assert.ok(bindings.has(source.facility_binding));
    assert.equal(source.access_state, "AVAILABLE");
    assert.ok(["FACILITY_SPECIFIC", "BRAND_FACILITY_SPECIFIC"].includes(source.facility_binding));
    assert.match(source.content_sha256, /^[a-f0-9]{64}$/);
    assert.doesNotThrow(() => new URL(source.requested_url));
  }
  assert.equal(evidence.sources.filter((row: any) => row.training_source_resolution === "REUSE_EXISTING_TRAINING_SOURCE").length, 8);
  assert.equal(evidence.sources.filter((row: any) => row.training_source_resolution === "NEW_TRAINING_SOURCE_CANDIDATE").length, 16);
});

test("H3-11D raw evidence and separate restrictions are fully traceable", () => {
  assert.equal(evidence.facts.length, 61);
  const facts = new Set(evidence.facts.map((row: any) => row.fact_id));
  const sources = new Set(evidence.sources.map((row: any) => row.source_ref));
  assert.equal(facts.size, 61);
  for (const fact of evidence.facts) {
    assert.ok(["RAW_EQUIPMENT_FACT", "RAW_SPACE_FACT", "RAW_USAGE_FACT", "RAW_COACHING_PROGRAM_FACT", "RAW_SOURCE_ASSERTION", "RAW_ACCESS_RESTRICTION_EVIDENCE"].includes(fact.candidate_fact_type));
    assert.equal(fact.positive_only, fact.candidate_fact_type !== "RAW_ACCESS_RESTRICTION_EVIDENCE");
    assert.equal(fact.public_negative_authorized, false);
    assert.ok(["EXISTING_CANONICAL_PERSISTENCE", "RAW_FACT_PERSISTENCE_GAP", "RESTRICTION_PERSISTENCE_GAP"].includes(fact.persistence.fit));
    assert.ok(fact.source_refs.length > 0);
    fact.source_refs.forEach((ref: string) => assert.ok(sources.has(ref)));
  }
  assert.equal(evidence.semantics.source_fact_is_not_derived_station_state, true);
  assert.equal(evidence.semantics.public_domain_claims_positive_only, true);
  assert.equal(evidence.semantics.access_restrictions_internal_only, true);
  assert.equal(evidence.semantics.negative_or_restriction_publication_authorized, false);
});

test("H3-11D review units are complete, legal, and never manufacture NO_POSITIVE_FOUND", () => {
  assert.equal(ledger.cycles.length, 8);
  assert.equal(ledger.units.length, 296);
  assert.equal(new Set(ledger.units.map((row: any) => row.unit_key)).size, 296);
  assert.equal(ledger.invalidations.length, 0);
  const facts = new Set(evidence.facts.map((row: any) => row.fact_id));
  const unitKeys = new Set(ledger.units.map((row: any) => row.unit_key));
  for (const unit of ledger.units) {
    if (unit.review_progress === "COMPLETE") assert.equal(unit.source_sufficiency, "SUFFICIENT");
    if (unit.positive_outcome === "NO_POSITIVE_FOUND") {
      assert.equal(unit.review_progress, "COMPLETE");
      assert.equal(unit.source_sufficiency, "SUFFICIENT");
    }
    if (unit.review_progress === "UNREVIEWED") {
      assert.equal(unit.source_sufficiency, "UNKNOWN");
      assert.equal(unit.positive_outcome, "NOT_ASSESSED");
    }
    unit.evidence_fact_ids.forEach((id: string) => assert.ok(facts.has(id)));
  }
  assert.equal(ledger.units.filter((row: any) => row.positive_outcome === "NO_POSITIVE_FOUND").length, 0);
  for (const relation of ledger.unit_sources) assert.ok(unitKeys.has(relation.unit_key));
  assert.equal(ledger.application_status, "CANDIDATE_NOT_APPLIED");
});

test("H3-11D station taxonomy stays at eight and no station derivation is present", () => {
  const authorityStations = h3a.stations.map((row: any) => row.id);
  assert.deepEqual(authorityStations, stationIds);
  assert.equal(claims.derived_station_rows, 0);
  assert.equal(claims.publication_status, "CANDIDATE_NOT_PUBLISHED");
  const forbiddenKeys = new Set(["station_capability", "derived_station_state", "station_score", "completeness_score"]);
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      assert.equal(forbiddenKeys.has(key), false, `forbidden derived field: ${key}`);
      walk(child);
    }
  };
  walk({ evidence, ledger, claims, gaps });
});

test("H3-11D positive claim candidates are exact legacy fits and deduplicated", () => {
  assert.equal(claims.baseline_before_candidate.cohort_existing_equipment_claims, 0);
  assert.equal(claims.baseline_before_candidate.cohort_existing_capability_claims, 0);
  assert.equal(claims.equipment_claims.length, 19);
  assert.equal(claims.capability_claims.length, 18);
  assert.equal(new Set(claims.equipment_claims.map((row: any) => row.claim_key)).size, 19);
  assert.equal(new Set(claims.capability_claims.map((row: any) => row.claim_key)).size, 18);
  assert.equal(claims.evidence_relationships.length, 38);
  assert.equal(new Set(claims.evidence_relationships.map((row: any) => row.relationship_key)).size, 38);
  const existingEquipment = new Set(h3a.legacyEquipmentMappings.map((row: any) => row.slug));
  const existingCapabilities = new Set(h3a.legacyCapabilityMappings.map((row: any) => row.slug));
  for (const row of claims.equipment_claims) assert.ok(existingEquipment.has(row.equipment_slug));
  for (const row of claims.capability_claims) assert.ok(existingCapabilities.has(row.capability_slug));
});

test("H3-11D persistence gaps are explicit and do not authorize schema or publication", () => {
  assert.equal(gaps.verdict, "RAW_FACT_PERSISTENCE_GATE_REQUIRED");
  assert.equal(gaps.schema_migration_authorized, false);
  assert.deepEqual(new Set(gaps.gaps.map((row: any) => row.gap_id)), new Set(["RAW_COMPONENT_PERSISTENCE_GAP", "RAW_SPACE_PERSISTENCE_GAP", "RAW_USAGE_PERSISTENCE_GAP", "RESTRICTION_PERSISTENCE_GAP", "FRESHNESS_POLICY_GAP", "DERIVATION_ONLY_FUTURE"]));
  for (const gap of gaps.gaps.filter((row: any) => row.gap_id !== "DERIVATION_ONLY_FUTURE")) assert.equal(gap.blocks_derivation, true);
});

test("H3-11D semantic hashes are reproducible with timestamps excluded", () => {
  const expected = evidence.deterministic_hashes;
  assert.deepEqual(ledger.deterministic_hashes, expected);
  assert.deepEqual(claims.deterministic_hashes, expected);
  assert.deepEqual(gaps.deterministic_hashes, expected);
  assert.equal(hash(withoutHashes(evidence), true), expected.REVIEW_PACKET_SHA256);
  assert.equal(hash(withoutHashes(ledger), true), expected.LEDGER_CANDIDATE_SHA256);
  assert.equal(hash(withoutHashes(claims), true), expected.POSITIVE_CANDIDATE_SHA256);
  assert.equal(hash(withoutHashes(gaps), true), expected.PERSISTENCE_GAP_SHA256);
  const report = fs.readFileSync("docs/hyrox-h3-11d-cohort1-evidence-expansion.md", "utf8");
  for (const digest of Object.values(expected)) assert.match(report, new RegExp(String(digest)));
});

test("H3-11D artifacts have no runtime import", () => {
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
  for (const file of walk("src").filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes("/__tests__/"))) {
    const source = fs.readFileSync(file, "utf8");
    for (const artifact of Object.values(paths)) assert.equal(source.includes(artifact), false, `${file} imports ${artifact}`);
  }
});
