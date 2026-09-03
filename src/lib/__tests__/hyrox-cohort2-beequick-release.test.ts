/* eslint-disable @typescript-eslint/no-explicit-any -- assertions inspect generated authority JSON */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { cohortReleaseHash } from "../hyrox-cohort1-release";

const read = (path: string) => JSON.parse(fs.readFileSync(path, "utf8"));
const release = read("data/hyrox/h3-11d-cohort2-beequick-production-release.json");
const evidence = read("data/hyrox/h3-11d-cohort2-beequick-evidence.json");
const h3c = read("data/hyrox/h3-11c-source-qualification.json");
const expectedHgyIds = [
  "HGY_KXsKkigAHxENjfO8pM4ocl6FF", "HGY_VNYgC17BsAJ3cLgavQTUPCgay",
  "HGY_YZfgVtrVZUDXC2kDU4ctStVOk", "HGY_e48JpyZiFH8V9aqp7zJ8ouQju",
  "HGY_hh2gFINyLgIbu8P1uFb9ChYf1", "HGY_sbFQoJaYts6eUUShzWUC6e8sv",
];

test("Cohort 2 is the exact accepted H3-11C BeeQuick cohort", () => {
  const accepted = h3c.cohorts.find((row: any) => row.id === "h3-11d-c2-beequick-location-template");
  assert.deepEqual(new Set(accepted.hgy_ids), new Set(expectedHgyIds));
  assert.deepEqual(release.facilities.map((row: any) => row.hgy_id), expectedHgyIds);
  assert.equal(new Set(release.facilities.map((row: any) => row.location_id)).size, 6);
  assert.equal(release.hashes.COHORT_2_IDENTITY_SHA256, cohortReleaseHash(release.facilities.map((row: any) => ({
    hgy_id: row.hgy_id, location_id: row.location_id, slug: row.slug,
  })).sort((a: any, b: any) => a.hgy_id.localeCompare(b.hgy_id))));
});

test("six current facility pages are bound and source delta is exact", () => {
  assert.deepEqual(release.sourceReview, {
    checked: 6, available: 6, bindingDrift: 0, supportDrift: 0, monitorErrors: 0,
    maxConcurrency: 4, maxAttempts: 2, automaticReconfirmation: false,
  });
  assert.equal(release.sourceDelta.reuse.length, 6);
  assert.equal(release.sourceDelta.insert.length, 6);
  assert.equal(release.sourceDelta.hold.length, 0);
  assert.ok(release.sourceDelta.insert.every((row: any) => row.facilityBinding === "BRAND_FACILITY_SPECIFIC"));
  assert.ok(release.sourceDelta.insert.every((row: any) => /^[0-9a-f]{64}$/.test(row.contentHash)));
});

test("review ledger uses legal positive or fail-closed partial states", () => {
  assert.deepEqual(release.reviewLedger.summary, {
    cycles: 6, units: 222, unitSources: 228, complete: 75, partial: 147,
    sufficient: 75, insufficient: 147, blocked: 0, positiveFound: 75,
    noPositiveFound: 0, notAssessed: 147,
  });
  assert.equal(new Set(release.reviewLedger.cycles.map((row: any) => row.location_id)).size, 6);
  assert.equal(new Set(release.reviewLedger.units.map((row: any) => row.id)).size, 222);
  for (const row of release.reviewLedger.units) {
    if (row.review_progress === "COMPLETE") {
      assert.equal(row.source_sufficiency, "SUFFICIENT");
      assert.equal(row.positive_outcome, "POSITIVE_FOUND");
    } else {
      assert.equal(row.review_progress, "PARTIAL");
      assert.equal(row.source_sufficiency, "INSUFFICIENT");
      assert.equal(row.positive_outcome, "NOT_ASSESSED");
    }
  }
});

test("canonical packet is 36 equipment plus three conservative open-use claims", () => {
  assert.equal(release.canonicalPositive.equipmentClaims.length, 36);
  assert.equal(release.canonicalPositive.capabilityClaims.length, 3);
  assert.equal(release.canonicalPositive.evidence.length, 39);
  const counts: Record<string, number> = {};
  for (const row of release.canonicalPositive.equipmentClaims) {
    counts[row.equipment_slug] = (counts[row.equipment_slug] ?? 0) + 1;
  }
  assert.deepEqual(counts, {
    "ski-erg": 6, "row-erg": 6, "farmers-carry-implements": 6, sandbag: 6,
    treadmill: 6, "weighted-sled": 5, "running-track": 1,
  });
  assert.deepEqual(new Set(release.canonicalPositive.capabilityClaims.map((row: any) => row.location_id)), new Set([
    "42267408-cbb5-4c3f-9b5f-10a102271a27", "08a40e56-5405-4b97-98ed-2bc16263c9df",
    "4972bb69-ded7-4ed9-9f99-0898f099837c",
  ]));
  assert.ok(release.canonicalPositive.capabilityClaims.every((row: any) => row.capability_slug === "open-training"));
});

test("raw and restriction observations preserve weak facts without derivation", () => {
  assert.equal(release.rawPersistence.observations.length, 14);
  assert.equal(release.rawPersistence.rawFactRows.length, 14);
  assert.equal(release.rawPersistence.rawDimensionRows.length, 6);
  assert.equal(release.restrictionPersistence.observations.length, 8);
  assert.equal(release.restrictionPersistence.restrictionRows.length, 11);
  assert.equal(release.rawPersistence.rawFactRows.filter((row: any) => row.factTypeSlug === "general-training-floor").length, 6);
  assert.equal(release.rawPersistence.rawDimensionRows.filter((row: any) => {
    const fact = release.rawPersistence.rawFactRows.find((candidate: any) => candidate.id === row.rawFactId);
    return fact?.factTypeSlug === "general-training-floor";
  }).length, 0);
  assert.equal(release.transaction.stationDerivationRows, 0);
  assert.equal(release.authority.stationDerivation, false);
  assert.equal(release.authority.publicNegativePublication, false);
});

test("all current persistence candidates have exact existing freshness policies", () => {
  const allowed = new Set([
    "raw-physical-component-180-day", "raw-space-90-day", "raw-usage-90-day",
    "raw-access-restriction-90-day",
  ]);
  for (const row of [...release.rawPersistence.rawFactRows, ...release.restrictionPersistence.restrictionRows]) {
    assert.ok(allowed.has(row.freshnessPolicyKey));
    assert.ok(Date.parse(row.freshnessExpiresAt) > Date.parse(row.reviewedAt));
  }
});

test("canonical and raw monitor deltas cover every candidate observation", () => {
  assert.equal(release.canonicalMonitorDelta.claims.length, 39);
  assert.equal(release.canonicalMonitorDelta.sources.length, 6);
  assert.equal(release.rawMonitorDelta.entries.length, 22);
  assert.equal(release.rawMonitorDelta.sources.length, 6);
  assert.equal(new Set(release.canonicalMonitorDelta.claims.map((row: any) => row.claimKey)).size, 39);
  assert.equal(new Set(release.rawMonitorDelta.entries.map((row: any) => row.observationKey)).size, 22);
  assert.ok(release.rawMonitorDelta.entries.every((row: any) => row.persistenceKeys.length >= 1));
});

test("visual sled/rope/lane evidence is preserved as a non-blocking monitor gap", () => {
  assert.equal(release.deferredGaps.length, 1);
  assert.equal(release.deferredGaps[0].category, "MONITOR_POLICY_GAP");
  assert.equal(release.deferredGaps[0].releaseDisposition, "DEFERRED_NON_BLOCKING");
  assert.equal(release.deferredGaps[0].stationDerivation, false);
});

test("component hashes, arithmetic and transaction boundary are deterministic", () => {
  assert.equal(release.hashes.SOURCE_DELTA_SHA256, cohortReleaseHash(release.sourceDelta));
  assert.equal(release.hashes.LEDGER_IMPORT_PACKET_SHA256, cohortReleaseHash(release.reviewLedger));
  assert.equal(release.hashes.CANONICAL_POSITIVE_IMPORT_SHA256, cohortReleaseHash(release.canonicalPositive));
  assert.equal(release.hashes.RAW_FACT_IMPORT_SHA256, cohortReleaseHash(release.rawPersistence));
  assert.equal(release.hashes.RESTRICTION_IMPORT_SHA256, cohortReleaseHash(release.restrictionPersistence));
  assert.equal(release.hashes.CANONICAL_MONITOR_DELTA_SHA256, cohortReleaseHash(release.canonicalMonitorDelta));
  assert.equal(release.hashes.RAW_MONITOR_DELTA_SHA256, cohortReleaseHash(release.rawMonitorDelta));
  assert.equal(release.hashes.DEFERRED_GAP_SHA256, cohortReleaseHash(release.deferredGaps));
  assert.deepEqual(release.projected, {
    officialFacilities: 82, trainingSources: 130, equipmentClaims: 164, capabilityClaims: 62,
    trainingEvidence: 391, reviewCycles: 14, reviewUnits: 518, reviewUnitSources: 704,
    invalidations: 0, rawFacts: 34, rawDimensions: 61, restrictions: 17,
    canonicalMonitored: 226, rawMonitored: 45, equipmentPositiveFacilities: 33,
    capabilityPositiveFacilities: 32, anyEnrichedFacilities: 39,
  });
  const sql = fs.readFileSync("scripts/hyrox/apply-h3-11d-cohort2-beequick-production-release.sql", "utf8");
  assert.match(sql, /^-- H3-11D Cohort 2 BeeQuick exact candidate release/);
  assert.match(sql, /begin;/);
  assert.match(sql, /commit;/);
  assert.match(sql, /deterministic-id conflict/);
  assert.match(sql, /natural-key conflict/);
  assert.doesNotMatch(sql, /on conflict do nothing/i);
  assert.doesNotMatch(sql, /\b(update|delete|truncate)\s+public\./i);
});

test("candidate contains no privileged write path or runtime import", () => {
  const candidateFiles = [
    "scripts/hyrox/build-h3-11d-cohort2-beequick-release.ts",
    "scripts/hyrox/apply-h3-11d-cohort2-beequick-production-release.sql",
  ].map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(candidateFiles, /SUPABASE_SERVICE_ROLE_KEY|service_role_key|\.from\([^)]*\)\.insert/);
  for (const directory of ["src/app", "src/components"]) {
    for (const name of fs.readdirSync(directory, { recursive: true })) {
      const file = `${directory}/${String(name)}`;
      if (!/\.(ts|tsx)$/.test(file)) continue;
      assert.equal(fs.readFileSync(file, "utf8").includes("h3-11d-cohort2-beequick"), false, file);
    }
  }
});

test("evidence manifest and release describe the same six-facility packet", () => {
  assert.deepEqual(evidence.facilities, release.facilities);
  assert.equal(evidence.observations.length, 61);
  assert.equal(evidence.reviewCoverageSummary.units, 222);
  const report = fs.readFileSync("docs/hyrox-h3-11d-cohort2-beequick-production-data-candidate.md", "utf8");
  for (const digest of [...Object.values(release.hashes), release.manifestHash] as string[]) {
    assert.match(report, new RegExp(digest));
  }
});
