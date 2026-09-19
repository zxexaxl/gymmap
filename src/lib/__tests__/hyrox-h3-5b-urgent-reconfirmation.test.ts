import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const candidatePath = new URL("../../../data/hyrox/h3-5b-urgent-reconfirmation-candidate.json", import.meta.url);
const hashesPath = new URL("../../../data/hyrox/h3-5b-urgent-reconfirmation-hashes.json", import.meta.url);
const authorityPath = new URL("../../../data/hyrox/h3-5a-enrichment-monitor-authority.json", import.meta.url);
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
type AuthorityClaim = { kind: string; slug: string; claimKey: string };
type CandidateClaim = {
  claimKey: string;
  observedState: string;
  facility: string;
  locationId: string;
  hgyId: string;
  slug: string;
  originalSourceIdentity: string;
  existingEvidenceIdentity: string;
  previousReviewedAt: string;
  previousExpiresAt: string;
  proposedReviewedAt: string;
  proposedExpiresAt: string;
  proposedUrgentAt: string;
  projectedImmediateState: string;
  facilityBinding: string;
};

async function load() {
  const [candidate, hashes, authority] = await Promise.all([candidatePath, hashesPath, authorityPath]
    .map(async (path) => JSON.parse(await readFile(path, "utf8"))));
  return { candidate, hashes, authority };
}

test("H3-5B candidate freezes the exact live 16-claim URGENT set", async () => {
  const { candidate, authority } = await load();
  const expected = authority.claims
    .filter((claim: AuthorityClaim) => claim.kind === "capability" && claim.slug === "competition-simulation")
    .map((claim: AuthorityClaim) => claim.claimKey)
    .sort();
  assert.equal(expected.length, 16);
  assert.deepEqual(candidate.claims.map((claim: CandidateClaim) => claim.claimKey), expected);
  assert.equal(new Set(candidate.claims.map((claim: CandidateClaim) => claim.claimKey)).size, 16);
  assert.ok(candidate.claims.every((claim: CandidateClaim) => claim.observedState === "URGENT"));
});

test("review is bounded to five deduplicated original URLs plus one replacement review", async () => {
  const { candidate } = await load();
  assert.equal(candidate.summary.uniqueOriginalSources, 5);
  assert.equal(candidate.summary.actualOriginalSourceRequestsAfterDeduplication, 5);
  assert.equal(candidate.summary.replacementSourcesReviewed, 1);
  assert.equal(candidate.sourceReviews.length, 6);
  assert.deepEqual(candidate.requestPolicy, {
    maximumConcurrency: 4,
    maximumAttempts: 2,
    retryAfterSupported: true,
    boundedBackoff: true,
  });
});

test("all claims have one conservative classification and exact freshness boundaries", async () => {
  const { candidate } = await load();
  assert.equal(candidate.summary.reconfirmedCurrent, 15);
  assert.equal(candidate.summary.supportMovedEquivalentSource, 1);
  assert.equal(candidate.summary.supportDriftConfirmed, 0);
  assert.equal(candidate.summary.monitorFalsePositive, 0);
  assert.equal(candidate.summary.manualReviewHold, 0);
  assert.equal(candidate.summary.temporaryMonitorError, 0);

  for (const claim of candidate.claims) {
    assert.equal(Date.parse(claim.proposedExpiresAt) - Date.parse(claim.proposedReviewedAt), 30 * 86_400_000);
    assert.equal(Date.parse(claim.proposedExpiresAt) - Date.parse(claim.proposedUrgentAt), 14 * 86_400_000);
    assert.equal(claim.projectedImmediateState, "DUE_SOON");
    assert.equal(claim.facilityBinding, "CONFIRMED");
    assert.match(claim.existingEvidenceIdentity, /^[a-f0-9]{64}$/);
  }
});

test("the sole source rebind is exact, narrow, and preserves the historical relation", async () => {
  const { candidate } = await load();
  const rebinds = candidate.candidateMutationPacket.sourceRebindDelta;
  assert.equal(rebinds.length, 1);
  assert.equal(rebinds[0].claimKey, "capability:cc8f2cee-62bd-4756-abfd-5f1b27a9c9d4:competition-simulation");
  assert.equal(rebinds[0].oldSourceUrl, "https://www.field-gym.com/hyrox/");
  assert.equal(rebinds[0].newSourceUrl, "https://www.gym-field.com/studios/higashiosaka/");
  assert.deepEqual(rebinds[0].supportPatternGroups, [["東大阪"], ["HYROX complete"], ["ランニングとワークアウトを交互"]]);
  assert.match(rebinds[0].operation, /PRESERVE_HISTORICAL_RELATION/);
  assert.deepEqual(candidate.candidateMutationPacket.publicationHoldDelta, []);
  assert.deepEqual(candidate.candidateMutationPacket.monitorMatcherDelta, []);
});

test("candidate packet hashes are deterministic and release-coherent", async () => {
  const { candidate, hashes } = await load();
  const targetSet = candidate.claims.map(({ claimKey, facility, locationId, hgyId, slug, originalSourceIdentity, existingEvidenceIdentity, previousReviewedAt, previousExpiresAt }: CandidateClaim) => ({
    claimKey, facility, locationId, hgyId, slug, originalSourceIdentity, existingEvidenceIdentity, previousReviewedAt, previousExpiresAt,
  }));
  assert.equal(sha(targetSet), hashes.H3_5B_URGENT_TARGET_SET_SHA256);
  assert.equal(sha(candidate.candidateMutationPacket.reconfirmationDbDelta), hashes.RECONFIRMATION_DB_DELTA_SHA256);
  assert.equal(sha(candidate.candidateMutationPacket.publicationHoldDelta), hashes.PUBLICATION_HOLD_DELTA_SHA256);
  assert.equal(sha(candidate.candidateMutationPacket.sourceRebindDelta), hashes.SOURCE_REBIND_DELTA_SHA256);
  assert.equal(sha(candidate.candidateMutationPacket.monitorMatcherDelta), hashes.MONITOR_MATCHER_DELTA_SHA256);
  assert.equal(sha(candidate.candidateMutationPacket.canonicalMonitorAuthorityDelta), hashes.CANONICAL_MONITOR_AUTHORITY_DELTA_SHA256);
  assert.equal(sha({
    targetSet: hashes.H3_5B_URGENT_TARGET_SET_SHA256,
    reconfirmationDbDelta: hashes.RECONFIRMATION_DB_DELTA_SHA256,
    publicationHoldDelta: hashes.PUBLICATION_HOLD_DELTA_SHA256,
    sourceRebindDelta: hashes.SOURCE_REBIND_DELTA_SHA256,
    monitorMatcherDelta: hashes.MONITOR_MATCHER_DELTA_SHA256,
    canonicalMonitorAuthorityDelta: hashes.CANONICAL_MONITOR_AUTHORITY_DELTA_SHA256,
  }), hashes.H3_5B_RELEASE_COHERENCE_SHA256);
});

test("packet is non-executed and does not authorize Production or H3-12D", async () => {
  const { candidate } = await load();
  assert.equal(candidate.candidateOnly, true);
  assert.equal(candidate.productionMutationAuthorized, false);
  assert.equal(candidate.candidateMutationPacket.executionState, "NON_EXECUTED");
  assert.equal(candidate.blocker.h3_12dProductionReleaseBlockedByH3_5b, "YES");
  assert.ok(candidate.candidateMutationPacket.preservationRules.some((rule: string) => rule.includes("does not authorize Production mutation")));
});
