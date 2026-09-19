/* eslint-disable @typescript-eslint/no-explicit-any -- assertions inspect frozen research authority JSON */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const audit = JSON.parse(fs.readFileSync(
  "data/hyrox/h3-12a-tokyo-training-facility-gap-audit.json",
  "utf8",
));

const allowedClassifications = new Set([
  "FIRST_PARTY_POSITIVE_SUPPORT",
  "PARTIAL_SUPPORT",
  "INSUFFICIENT_SUPPORT",
  "NO_CURRENT_FIRST_PARTY_SUPPORT_FOUND",
  "SOURCE_BLOCKED",
]);

test("H3-12A freezes six seed facilities and all eight station review units", () => {
  assert.equal(audit.schemaVersion, "h3-12a-v1");
  assert.equal(audit.seedFacilities.length, 6);
  assert.equal(audit.stations.length, 8);

  const stationSlugs = new Set(audit.stations.map((station: any) => station.slug));
  for (const facility of audit.seedFacilities) {
    assert.equal(facility.stationAudit.length, 8, facility.facility);
    assert.equal(new Set(facility.stationAudit.map((unit: any) => unit.station)).size, 8);
    assert.ok(facility.stationAudit.every((unit: any) => stationSlugs.has(unit.station)));
    assert.ok(facility.stationAudit.every((unit: any) => allowedClassifications.has(unit.classification)));
  }
});

test("H3-12A preserves positive-only semantics and does not authorize station scores", () => {
  const serialized = JSON.stringify(audit);
  assert.doesNotMatch(serialized, /CONFIRMED_UNAVAILABLE/);
  assert.equal(audit.scope.publicStationCountsAuthorized, false);
  assert.equal(audit.eligibilityProposal.arbitraryStationThresholdAllowed, false);
  assert.ok(audit.publicOutputDependencies.some((row: any) =>
    row.output === "numeric station scores" && row.classification === "NOT_SUPPORTED_BY_CURRENT_EVIDENCE"));
});

test("H3-12A keeps affiliation separate and selects the Official-first model", () => {
  assert.equal(audit.architectureFit.publishedHyroxWithOfficialFalseFeasible, true);
  assert.equal(audit.architectureFit.schemaMigrationRequiredForBasicState, false);
  const recommended = audit.productOptions.filter((option: any) => option.recommendation === "RECOMMENDED");
  assert.deepEqual(recommended.map((option: any) => option.id), ["B"]);
  assert.match(audit.eligibilityProposal.requiredDisclaimer, /Official Training Club/);
});

test("H3-12A final candidate discovery is first-party backed and bounded", () => {
  assert.equal(audit.additionalCandidates.length, 4);
  assert.ok(audit.additionalCandidates.every((candidate: any) =>
    candidate.officialSource.startsWith("https://") && candidate.gymMapPresence === "ABSENT"));
  assert.ok(audit.additionalCandidates.every((candidate: any) => candidate.officialState === "UNRESOLVED"));
});

test("H3-12A is research-only and freezes complete production invariance", () => {
  assert.equal(audit.scope.productionMutationAuthorized, false);
  assert.ok(Object.values(audit.productionInvariance).every((value) => value === false));
  assert.match(audit.humanGate, /H3-12B/);
});
