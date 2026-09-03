/* eslint-disable @typescript-eslint/no-explicit-any -- assertions inspect generated authority JSON */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ACCEPTED_COHORT_HASHES,
  ACCEPTED_R2_HASHES,
  ACCEPTED_R3_HASHES,
  buildCohort1Release,
  cohortReleaseHash,
  cohortReleaseManifestHash,
  validateCohort1Release,
} from "../hyrox-cohort1-release";

const read = (path: string) => JSON.parse(fs.readFileSync(path, "utf8"));
const raw = read("data/hyrox/h3-11d-cohort1-raw-evidence.json");
const ledger = read("data/hyrox/h3-11d-cohort1-review-ledger-candidate.json");
const positive = read("data/hyrox/h3-11d-cohort1-positive-claim-candidate.json");
const r2 = read("data/hyrox/h3-11d-r2-raw-fact-freshness-authority.json");
const r3 = read("data/hyrox/h3-11d-r3-cohort1-monitor-candidate.json");
const liveEnrichment = read("data/hyrox/h3-5a-enrichment-monitor-authority.json");
const sourceRecheck = read("data/hyrox/h3-11d-cohort1-source-recheck.json");
const committed = read("data/hyrox/h3-11d-cohort1-production-release.json");
const cohort2 = read("data/hyrox/h3-11d-cohort2-beequick-production-release.json");
const cohort3 = read("data/hyrox/h3-11d-cohort3-golds-production-release.json");
const deltaSourceKeys = new Set(committed.canonicalMonitorDelta.sources.map((row: any) => row.sourceKey));
const deltaClaimKeys = new Set(committed.canonicalMonitorDelta.claims.map((row: any) => row.claimKey));
for (const row of cohort2.canonicalMonitorDelta.sources) deltaSourceKeys.add(row.sourceKey);
for (const row of cohort2.canonicalMonitorDelta.claims) deltaClaimKeys.add(row.claimKey);
for (const row of cohort3.canonicalMonitorDelta.sources) deltaSourceKeys.add(row.sourceKey);
for (const row of cohort3.canonicalMonitorDelta.claims) deltaClaimKeys.add(row.claimKey);
const enrichment = liveEnrichment.counts.claims === 150 ? liveEnrichment : {
  ...liveEnrichment,
  counts: { sources: 26, uniqueExternalUrls: 15, equipment: 109, capabilities: 41, claims: 150, enrichedLocations: 25 },
  sources: liveEnrichment.sources.filter((row: any) => !deltaSourceKeys.has(row.sourceKey)),
  claims: liveEnrichment.claims.filter((row: any) => !deltaClaimKeys.has(row.claimKey)),
  manifestHash: "65a7e36c81f52d72b6215e26ab03caecac3d036e73a378a740fc8c3a03e34df2",
};

const build = () => validateCohort1Release(buildCohort1Release({
  raw, ledger, positive, r2, r3Candidate: r3, existingEnrichment: enrichment, sourceRecheck,
  sourceMain: "2636c838b57de55617f611064a90630eaf3d1408",
}));

test("accepted Cohort, R2 and R3 authority identities are frozen", () => {
  assert.deepEqual(committed.authority.cohort, ACCEPTED_COHORT_HASHES);
  assert.deepEqual(committed.authority.r2, ACCEPTED_R2_HASHES);
  assert.deepEqual(committed.authority.r3, ACCEPTED_R3_HASHES);
  assert.equal(committed.authority.stationDerivation, false);
  assert.equal(committed.authority.publicRawOrRestrictionPublication, false);
});

test("release artifact is a deterministic derivation of accepted inputs", () => {
  assert.deepEqual(build(), committed);
  assert.equal(committed.manifestHash, cohortReleaseManifestHash(committed));
});

test("all eight exact Official facility identities are present once", () => {
  assert.equal(committed.facilities.length, 8);
  assert.equal(new Set(committed.facilities.map((row: any) => row.location_id)).size, 8);
  assert.equal(new Set(committed.facilities.map((row: any) => row.hgy_id)).size, 8);
  assert.ok(committed.facilities.every((row: any) => row.current_official));
});

test("fresh bounded source recheck keeps 24 sources eligible without reconfirmation", () => {
  assert.deepEqual(sourceRecheck.counts, {
    checked: 24, available: 24, monitorErrors: 0, sourceUnavailable: 0,
    supportDrift: 0, bindingDrift: 0, bindingCheckUnavailable: 0,
  });
  assert.ok(sourceRecheck.records.every((row: any) => row.reconfirmed === false));
  assert.equal(committed.sourceDelta.reuse.length, 8);
  assert.equal(committed.sourceDelta.insert.length, 16);
  assert.equal(committed.sourceDelta.holds.length, 0);
  assert.equal(new Set([...committed.sourceDelta.reuse, ...committed.sourceDelta.insert].map((row: any) => row.id)).size, 24);
});

test("review ledger preserves accepted 8/296/476/0 states without negatives", () => {
  assert.equal(committed.reviewLedger.cycles.length, 8);
  assert.equal(committed.reviewLedger.units.length, 296);
  assert.equal(committed.reviewLedger.unitSources.length, 476);
  assert.equal(committed.reviewLedger.invalidations.length, 0);
  assert.equal(committed.reviewLedger.units.filter((row: any) => row.positive_outcome === "NO_POSITIVE_FOUND").length, 0);
  assert.ok(committed.reviewLedger.units.every((row: any) => row.review_progress === "COMPLETE" ? row.source_sufficiency === "SUFFICIENT" : true));
});

test("canonical packet is exactly 19 equipment plus 18 capability claims with 38 evidence rows", () => {
  assert.equal(committed.canonicalPositive.equipmentClaims.length, 19);
  assert.equal(committed.canonicalPositive.capabilityClaims.length, 18);
  assert.equal(committed.canonicalPositive.evidence.length, 38);
  assert.equal(new Set(committed.canonicalPositive.evidence.map((row: any) => row.targetId)).size, 37);
  assert.equal(committed.canonicalPositive.capabilityClaims.filter((row: any) => row.capability_slug === "competition-simulation").length, 3);
  assert.ok([...committed.canonicalPositive.equipmentClaims, ...committed.canonicalPositive.capabilityClaims]
    .every((row: any) => row.verification_status === "confirmed" && row.availability_state === "available"));
});

test("19 raw observations and four restrictions normalize losslessly into typed rows", () => {
  assert.equal(committed.rawPersistence.acceptedObservations, 19);
  assert.equal(committed.rawPersistence.rawFactRows.length, 20);
  assert.equal(new Set(committed.rawPersistence.rawFactRows.map((row: any) => row.observationKey)).size, 19);
  assert.equal(committed.rawPersistence.rawDimensionRows.length, 55);
  assert.equal(committed.restrictionPersistence.acceptedObservations, 4);
  assert.equal(committed.restrictionPersistence.restrictionRows.length, 6);
  assert.equal(new Set(committed.restrictionPersistence.restrictionRows.map((row: any) => row.observationKey)).size, 4);
});

test("all raw and restriction rows carry exact R2 currentness without extension", () => {
  const rows = [...committed.rawPersistence.rawFactRows, ...committed.restrictionPersistence.restrictionRows];
  assert.equal(rows.length, 26);
  assert.ok(rows.every((row: any) => row.currentnessEligibility === "CURRENT_IMPORT_ELIGIBLE"));
  assert.ok(rows.every((row: any) => Date.parse(row.freshnessExpiresAt) > Date.parse(row.reviewedAt)));
  assert.equal(new Set(committed.rawPersistence.rawFactRows.map((row: any) => row.freshnessPolicyKey)).size, 4);
  assert.deepEqual(new Set(committed.restrictionPersistence.restrictionRows.map((row: any) => row.freshnessPolicyKey)), new Set(["raw-access-restriction-90-day"]));
});

test("canonical and raw monitor deltas are complete but remain separate", () => {
  assert.equal(committed.canonicalMonitorDelta.claims.length, 37);
  assert.equal(committed.canonicalMonitorDelta.sources.length, 10);
  assert.equal(committed.projectedCanonicalMonitor.counts.claims, 187);
  assert.equal(committed.rawMonitorDelta.entries.length, 23);
  assert.equal(committed.rawMonitorDelta.sources.length, 9);
  assert.equal(committed.rawMonitorDelta.projectedManifest.mode, "LIVE_MONITORED");
  assert.ok(committed.rawMonitorDelta.entries.every((row: any) => row.expectedPersistenceKey && row.persistenceKeys.length >= 1));
  assert.equal(committed.rawMonitorDelta.entries.filter((row: any) => row.kind === "raw_fact").length, 19);
  assert.equal(committed.rawMonitorDelta.entries.filter((row: any) => row.kind === "restriction").length, 4);
});

test("release component and coherence hashes are reproducible", () => {
  const rebuilt = build();
  assert.deepEqual(rebuilt.hashes, committed.hashes);
  assert.match(committed.hashes.COHORT1_RELEASE_COHERENCE_SHA256, /^[0-9a-f]{64}$/);
  assert.equal(committed.hashes.CANONICAL_MONITOR_DELTA_SHA256, cohortReleaseHash(committed.canonicalMonitorDelta));
  assert.equal(committed.hashes.RAW_MONITOR_DELTA_SHA256, committed.rawMonitorDelta.projectedManifest.authority.monitorPacketHash);
});

test("projected Production arithmetic is exact", () => {
  assert.deepEqual(committed.projected, {
    officialFacilities: 82, trainingSources: 124, reviewCycles: 8, reviewUnits: 296,
    reviewUnitSources: 476, invalidations: 0, rawFacts: 20, rawFactDimensions: 55,
    restrictions: 6, equipmentClaims: 128, capabilityClaims: 59, trainingEvidence: 352,
    canonicalMonitoredClaims: 187, rawRestrictionMonitoredEntries: 23,
    equipmentPositiveFacilities: 27, capabilityPositiveFacilities: 29, anyEnrichedFacilities: 33,
  });
});

test("generated apply path is transactional, idempotent and fail closed", () => {
  const sql = fs.readFileSync("scripts/hyrox/apply-h3-11d-cohort1-production-release.sql", "utf8");
  assert.match(sql, /^-- H3-11D Cohort 1 exact candidate release/);
  assert.match(sql, /begin;/);
  assert.match(sql, /commit;/);
  assert.match(sql, /deterministic-id conflict/);
  assert.match(sql, /where not exists/);
  assert.doesNotMatch(sql, /on conflict do nothing/i);
  assert.doesNotMatch(sql, /\b(update|delete|truncate)\s+public\./i);
});

test("release files have no app runtime import or privileged secret", () => {
  const files = ["src/app", "src/components"].flatMap((directory) => fs.readdirSync(directory, { recursive: true })
    .filter((name) => String(name).endsWith(".ts") || String(name).endsWith(".tsx"))
    .map((name) => `${directory}/${String(name)}`));
  assert.ok(files.every((file) => !fs.readFileSync(file, "utf8").includes("hyrox-cohort1-release")));
  const candidateFiles = [
    "src/lib/hyrox-cohort1-release.ts",
    "scripts/hyrox/build-h3-11d-cohort1-release.ts",
    "scripts/hyrox/render-h3-11d-cohort1-release-sql.ts",
  ].map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(candidateFiles, /SUPABASE_SERVICE_ROLE_KEY|service_role_key|\.from\([^)]*\)\.insert/);
});
