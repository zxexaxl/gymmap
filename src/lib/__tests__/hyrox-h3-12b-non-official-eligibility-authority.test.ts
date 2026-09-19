/* eslint-disable @typescript-eslint/no-explicit-any -- assertions inspect frozen authority JSON */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const authority = JSON.parse(fs.readFileSync(
  "data/hyrox/h3-12b-non-official-eligibility-authority.json",
  "utf8",
));
const h312a = JSON.parse(fs.readFileSync(
  "data/hyrox/h3-12a-tokyo-training-facility-gap-audit.json",
  "utf8",
));

function canonicalize(value: any): any {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function sha256(value: any) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

test("H3-12A accepted authority remains intact and H3-12B is design-only", () => {
  assert.equal(authority.acceptedH312A, "a50013a17b19c86c12b648560b54b4bdf49b6fab");
  assert.equal(h312a.schemaVersion, "h3-12a-v1");
  assert.equal(h312a.productOptions.find((item: any) => item.recommendation === "RECOMMENDED").id, "B");
  assert.equal(h312a.scope.publicStationCountsAuthorized, false);
  assert.ok(Object.values(authority.productionInvariance).every((value) => value === false));
});

test("eligibility is first-party, facility-bound, explicit, and independent of station count", () => {
  assert.match(authority.evidenceAuthority.minimumPositiveRule, /facility-bound first-party/);
  assert.deepEqual(authority.evidenceAuthority.facilityBinding.accepted, [
    "FACILITY_SPECIFIC",
    "BRAND_FACILITY_SPECIFIC",
  ]);
  assert.equal(authority.evidenceAuthority.stationEvidenceRequired, false);
  assert.equal(authority.evidenceAuthority.minimumStationCount, null);
  assert.ok(authority.evidenceAuthority.insufficientAlone.some((item: string) => item.includes("8/8")));
  assert.ok(authority.evidenceAuthority.discoveryOnlySources.includes("HYFIT"));
});

test("Official remains a governing-body-only derived state", () => {
  assert.equal(authority.officialSemantics.unchanged, true);
  assert.equal(authority.officialSemantics.nonOfficialOfficialValue, false);
  assert.equal(authority.officialSemantics.facilityMarketingCanConferOfficialStatus, false);
  assert.match(authority.officialSemantics.authority, /governing-body/);
  assert.equal(authority.publicationGate.persistenceDecision, "DERIVE_DO_NOT_STORE_REDUNDANT_ENUM");
});

test("public labels and disclosure never imply non-Official affiliation", () => {
  assert.equal(authority.labels.official.full, "Official Training Club");
  assert.equal(authority.labels.verifiedNonOfficial.full, "施設の公式情報でHYROXトレーニングを確認");
  assert.doesNotMatch(authority.labels.verifiedNonOfficial.compact, /認定|公式|Official/);
  assert.match(authority.labels.verifiedNonOfficial.accessible, /認定を示すものではありません/);
  assert.match(authority.disclosure, /Officialバッジ/);
});

test("count semantics are deterministic and official-only is affiliation-only", () => {
  assert.equal(authority.counts.invariant, "N = O + V");
  assert.equal(authority.counts.dedupeKey, "location_id");
  assert.equal(authority.counts.doubleCountAllowed, false);
  assert.equal(authority.discoveryBehavior.officialOnlyFilter.predicate, "official=true only");
  assert.equal(authority.discoveryBehavior.officialOnlyFilter.equipmentOrStationPredicateAllowed, false);
});

test("eligibility freshness fails closed without monitor-driven renewal", () => {
  assert.equal(authority.freshness.horizonDays, 90);
  assert.match(authority.freshness.anchor, /reviewed_at/);
  assert.equal(authority.freshness.httpAvailabilityExtendsFreshness, false);
  assert.equal(authority.freshness.genericPageReachabilityIsReconfirmation, false);
  assert.match(authority.freshness.expiryBehavior, /Fail closed/);
  assert.equal(authority.monitoring.monitorObservationExtendsReviewedAt, false);
  assert.equal(authority.monitoring.automaticProductionWrite, false);
  assert.equal(authority.monitoring.newPrivilegedDatabaseSecret, false);
  assert.deepEqual(new Set(authority.monitoring.detections), new Set([
    "TIME_EXPIRY",
    "SUPPORT_DRIFT",
    "FACILITY_BINDING_DRIFT",
    "SOURCE_UNAVAILABLE",
    "MONITOR_ERROR",
  ]));
});

test("schema and RPC fit official=false while loader and UI remain implementation gaps", () => {
  assert.equal(authority.architectureFit.schemaChangeRequired, false);
  assert.equal(authority.architectureFit.rpcChangeRequired, false);
  assert.equal(authority.architectureFit.loaderTypeChangeRequired, true);
  assert.equal(authority.architectureFit.uiAssumptionChangeRequired, true);
  assert.ok(authority.architectureFit.currentApplicationBlockers.includes("HyroxDiscoveryLocation fixes official:true"));
});

test("eligibility review uses one auxiliary dimension and stays separate from H3-11E", () => {
  assert.equal(authority.reviewLedger.recommendedDimension.dimensionKind, "AUXILIARY");
  assert.equal(authority.reviewLedger.recommendedDimension.slug, "discipline-eligibility");
  assert.equal(authority.reviewLedger.migrationRequired, false);
  assert.equal(authority.stationSeparation.stationDataGatesEligibility, false);
  assert.equal(authority.stationSeparation.publicStationScoreAuthorized, false);
});

test("seed-six and additional Tokyo candidate classifications are complete", () => {
  assert.equal(authority.seedValidation.length, 6);
  assert.deepEqual(authority.seedValidation.map((item: any) => item.facility), h312a.seedFacilities.map((item: any) => item.facility));
  assert.equal(authority.seedValidation.filter((item: any) => item.classification === "ELIGIBLE_OFFICIAL").length, 2);
  assert.equal(authority.seedValidation.filter((item: any) => item.classification === "ELIGIBLE_VERIFIED_NON_OFFICIAL").length, 4);
  assert.equal(authority.additionalTokyoValidation.length, 4);
  assert.deepEqual(authority.additionalTokyoValidation.map((item: any) => item.facility), h312a.additionalCandidates.map((item: any) => item.facility));
  assert.equal(authority.additionalTokyoValidation.find((item: any) => item.facility.startsWith("GOLD'S GYM")).classification, "REVIEW_REQUIRED");
});

test("false-positive cases A through J are deterministic", () => {
  assert.deepEqual(authority.falsePositiveCases.map((item: any) => item.id), ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  assert.equal(authority.falsePositiveCases.find((item: any) => item.id === "A").result, "NOT_ELIGIBLE_FOR_HYROX_DISCOVERY");
  assert.equal(authority.falsePositiveCases.find((item: any) => item.id === "F").result, "NOT_ELIGIBLE_FOR_HYROX_DISCOVERY");
  assert.equal(authority.falsePositiveCases.find((item: any) => item.id === "G").result, "ELIGIBLE_OFFICIAL");
  assert.equal(authority.falsePositiveCases.find((item: any) => item.id === "H").result, "ELIGIBLE_VERIFIED_NON_OFFICIAL");
});

test("Phase 1 candidate set is bounded, non-production, and never ranked by stations", () => {
  assert.equal(authority.phase1Candidates.length, 8);
  assert.equal(authority.phase1Candidates.filter((item: any) => item.phase1Disposition === "READY_FOR_REVIEW_NOT_IMPORT").length, 7);
  assert.equal(authority.phase1Candidates.filter((item: any) => item.phase1Disposition === "HOLD_REVIEW_REQUIRED").length, 1);
  assert.ok(authority.phase1Candidates.every((item: any) => item.projectedOfficial === false));
  assert.ok(authority.phase1Candidates.every((item: any) => item.schemaCanRepresent === true));
  assert.ok(authority.phase1Candidates.every((item: any) => item.h311eNeededForEligibility === false));
  assert.ok(authority.phase1Candidates.every((item: any) => !/\d\/8/.test(item.reviewPriority)));
});

test("authority hashes are deterministic and exclude execution timestamps", () => {
  assert.deepEqual(authority.authorityHashes, {
    NON_OFFICIAL_ELIGIBILITY_AUTHORITY_SHA256: sha256({
      stateModel: authority.stateModel,
      evidenceAuthority: authority.evidenceAuthority,
      officialSemantics: authority.officialSemantics,
      publicationGate: authority.publicationGate,
    }),
    LABEL_AUTHORITY_SHA256: sha256({labels: authority.labels, disclosure: authority.disclosure}),
    COUNT_SEMANTICS_SHA256: sha256(authority.counts),
    ELIGIBILITY_FRESHNESS_SHA256: sha256(authority.freshness),
    PHASE1_CANDIDATE_SET_SHA256: sha256(authority.phase1Candidates),
  });
  assert.equal("generatedAt" in authority, false);
  assert.equal("executedAt" in authority, false);
});
