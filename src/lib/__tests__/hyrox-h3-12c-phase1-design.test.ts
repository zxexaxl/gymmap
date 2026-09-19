/* eslint-disable @typescript-eslint/no-explicit-any -- assertions inspect frozen H3-12C authority JSON */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const readJson = (name: string) => JSON.parse(fs.readFileSync(path.join(root, "data/hyrox", name), "utf8"));
const identity = readJson("h3-12c-phase1-identity-eligibility.json");
const monitor = readJson("h3-12c-eligibility-monitor-candidate.json");
const publication = readJson("h3-12c-publication-packet-design.json");
const implementation = readJson("h3-12c-loader-type-ui-implementation-contract.json");
const hashes = readJson("h3-12c-phase1-authority-hashes.json");
const h312b = readJson("h3-12b-non-official-eligibility-authority.json");

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stable(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha(value: unknown) {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function dateOnly(value: string) { return value.slice(0, 10); }

function semanticHashes() {
  const identitySemantic = identity.phase1Candidates.map((candidate: any) => ({
    authorityName: candidate.authorityName,
    canonicalName: candidate.canonicalName,
    brand: candidate.brand,
    identity: candidate.identity,
    officialStatus: {
      classification: candidate.officialStatus.classification,
      official: candidate.officialStatus.official,
      hgyId: candidate.officialStatus.hgyId,
    },
  }));
  const eligibilitySemantic = identity.phase1Candidates.map((candidate: any) => ({
    authorityName: candidate.authorityName,
    classification: candidate.eligibility.classification,
    sourceUrl: candidate.eligibility.sourceUrl,
    sourceClass: candidate.eligibility.sourceClass,
    facilityBinding: candidate.eligibility.facilityBinding,
    relationship: candidate.eligibility.relationship,
    contentSha256: candidate.eligibility.contentSha256,
    supportCheckMode: candidate.eligibility.supportCheckMode,
    supportCheck: candidate.eligibility.supportCheck,
    explicitEndAt: candidate.eligibility.explicitEndAt,
    reviewedDate: dateOnly(candidate.eligibility.reviewedAt),
    expiresDate: dateOnly(candidate.eligibility.expiresAt),
  }));
  const monitorSemantic = {
    policy: monitor.policy,
    stateSemantics: monitor.stateSemantics,
    nonOfficialEligibilityEntries: monitor.nonOfficialEligibilityEntries.map((entry: any) => ({
      ...entry,
      reviewedAt: dateOnly(entry.reviewedAt),
      expiresAt: dateOnly(entry.expiresAt),
    })),
    officialStatusDriftRouting: monitor.officialStatusDriftRouting,
    liveActivation: monitor.liveActivation,
  };
  const values: Record<string, string> = {
    PHASE1_IDENTITY_SHA256: sha(identitySemantic),
    PHASE1_ELIGIBILITY_SHA256: sha(eligibilitySemantic),
    ELIGIBILITY_MONITOR_CANDIDATE_SHA256: sha(monitorSemantic),
    PUBLICATION_PACKET_DESIGN_SHA256: sha(publication),
    IMPLEMENTATION_CONTRACT_SHA256: sha(implementation),
  };
  values.PHASE1_RELEASE_DESIGN_COHERENCE_SHA256 = sha(values);
  return values;
}

test("H3-12C freezes the exact accepted seven-candidate set without substitution", () => {
  const accepted = h312b.phase1Candidates.filter((item: any) => item.phase1Disposition !== "HOLD_REVIEW_REQUIRED").map((item: any) => item.facility);
  const actual = identity.phase1Candidates.map((item: any) => item.authorityName);
  assert.deepEqual(actual, accepted);
  assert.equal(actual.length, 7);
  assert.equal(new Set(actual).size, 7);
  assert.equal(identity.authority.phase1CandidateSetSha256, h312b.authorityHashes.PHASE1_CANDIDATE_SET_SHA256);
  assert.equal(identity.phase1Summary.goldHarajukuDisposition, "OUTSIDE_PHASE1_UNCHANGED");
});

test("exact identity review finds seven new locations and reuses only the established Gym Field brand", () => {
  assert.equal(identity.productionSnapshot.exactCandidateLocationMatches, 0);
  assert.ok(identity.phase1Candidates.every((item: any) => item.identity.resolution === "NEW_GYMMAP_LOCATION_REQUIRED"));
  const reused = identity.phase1Candidates.filter((item: any) => item.brand.decision === "REUSE_EXISTING_BRAND");
  assert.deepEqual(reused.map((item: any) => item.authorityName), ["GYM FIELD Tachikawa Studio"]);
  assert.equal(new Set(identity.phase1Candidates.map((item: any) => item.identity.proposedSlug)).size, 7);
});

test("Official status drift is governing-body-bound and non-Official candidates never receive affiliation identity", () => {
  const official = identity.phase1Candidates.filter((item: any) => item.officialStatus.official);
  const nonOfficial = identity.phase1Candidates.filter((item: any) => !item.officialStatus.official);
  assert.equal(official.length, 3);
  assert.equal(nonOfficial.length, 4);
  assert.ok(official.every((item: any) => /^HGY_[A-Za-z0-9]+$/.test(item.officialStatus.hgyId)));
  assert.ok(nonOfficial.every((item: any) => item.officialStatus.hgyId === null && item.identity.externalIdentifier === null));
  const nonOfficialPackets = publication.facilityPackets.filter((item: any) => !item.official);
  assert.ok(nonOfficialPackets.every((item: any) => item.affiliationRow === "NONE" && item.hgyId === null));
  assert.ok(nonOfficialPackets.every((item: any) => !item.writes.includes("training_affiliations") && !item.writes.includes("location_external_identifiers")));
});

test("all candidates have current first-party support and the accepted 90-day review boundary", () => {
  for (const candidate of identity.phase1Candidates) {
    assert.match(candidate.eligibility.sourceUrl, /^https:\/\//);
    assert.ok(["FACILITY_SPECIFIC", "BRAND_FACILITY_SPECIFIC"].includes(candidate.eligibility.facilityBinding));
    assert.equal(dateOnly(candidate.eligibility.reviewedAt), "2026-09-19");
    assert.equal(dateOnly(candidate.eligibility.expiresAt), "2026-12-18");
    assert.equal(candidate.eligibility.explicitEndAt, null);
    assert.ok(["ELIGIBLE_OFFICIAL", "ELIGIBLE_VERIFIED_NON_OFFICIAL"].includes(candidate.eligibility.classification));
  }
});

test("monitor candidate separates source health, support drift, binding drift and time expiry", () => {
  assert.equal(monitor.stateSemantics.http429Timeout5xx, "MONITOR_ERROR");
  assert.equal(monitor.stateSemantics.supportRemoved, "SUPPORT_DRIFT");
  assert.equal(monitor.stateSemantics.facilityBindingLost, "FACILITY_BINDING_DRIFT");
  assert.equal(monitor.stateSemantics.reviewExpiryReached, "TIME_EXPIRED");
  assert.equal(monitor.policy.observationExtendsReviewedAt, false);
  assert.equal(monitor.policy.maxConcurrency, 4);
  assert.equal(monitor.policy.maxAttempts, 2);
  assert.equal(monitor.nonOfficialEligibilityEntries.length, 4);
  assert.equal(monitor.officialStatusDriftRouting.length, 3);
  assert.equal(monitor.liveActivation, false);
});

test("publication architecture, counts, filter and map contracts remain coherent", () => {
  assert.equal(publication.architecture.schemaChangeRequired, false);
  assert.equal(publication.architecture.rpcChangeRequired, false);
  assert.equal(publication.architecture.publicationViewChangeRequired, false);
  assert.equal(publication.architecture.persistenceGap, false);
  assert.equal(publication.reviewLedger.productionDimensionExists, false);
  assert.equal(publication.reviewLedger.serviceRoleCanInsertDimension, false);
  assert.equal(publication.reviewLedger.operationalInsertPath, "METADATA_SEED_MIGRATION_OR_ADMIN_SQL");
  for (const counts of [publication.counts.current, publication.counts.projectedIfAllSevenPublished, publication.counts.currentTokyo, publication.counts.projectedTokyoIfAllSevenPublished]) {
    assert.equal(counts.N, counts.O + counts.V);
  }
  assert.equal(implementation.defaultDataset.default, "ALL_VERIFIED");
  assert.equal(implementation.filter.officialOnlyDefault, undefined);
  assert.equal(implementation.defaultDataset.officialOnlyDefault, false);
  assert.equal(implementation.filter.predicate, "location.official === true");
  assert.equal(implementation.map.markerDifference, false);
});

test("loader/type/UI contract removes every known Official-only application assumption", () => {
  assert.ok(implementation.loaderAudit.currentAssumptions.some((item: string) => item.includes("p_official_only=true")));
  assert.ok(implementation.loaderAudit.requiredDeltas.some((item: string) => item.includes("official:boolean")));
  assert.ok(implementation.loaderAudit.requiredDeltas.some((item: string) => item.includes("p_official_only=false")));
  assert.equal(implementation.minimumPresentationDto.redundantStatusField, false);
  assert.equal(implementation.seo.newRoute, false);
  assert.equal(implementation.seo.canonicalUnchanged, true);
  assert.equal(implementation.seo.sitemapUnchanged, true);
});

test("A through R safety cases are deterministic and prohibited station semantics are absent", () => {
  assert.deepEqual(publication.safetyCases.map((item: any) => item.id), "ABCDEFGHIJKLMNOPQR".split(""));
  const artifacts = [identity, monitor, publication, implementation].map(stable).join("\n");
  assert.doesNotMatch(artifacts, /\b[48]\/8\b|HYROX対応度/);
  assert.equal(identity.productionInvariance.databaseMutation, false);
  assert.equal(publication.productionMutation, false);
  assert.equal(implementation.implementationBoundaries.noStationDerivation, true);
});

test("semantic authority hashes are deterministic and exclude observation timestamps", () => {
  assert.deepEqual(semanticHashes(), hashes);
  for (const value of Object.values(hashes)) assert.match(String(value), /^[a-f0-9]{64}$/);
});
