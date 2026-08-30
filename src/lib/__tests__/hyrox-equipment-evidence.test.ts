import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildCandidateGraph,
  buildPublicationPreview,
  classifyEvidenceSignal,
  deterministicSampleRank,
  evidenceHash,
  expandReviewedClaims,
  type PocReviewArtifact,
} from "../hyrox-equipment-evidence";
import { verifyOfficialSource, verifySourcesBounded } from "../hyrox-equipment-source-verifier";

const reviewPath = new URL("../../../data/hyrox/h3-3-equipment-evidence-poc.json", import.meta.url);
const samplePath = new URL("../../../data/hyrox/h3-3-equipment-poc-sample.json", import.meta.url);

async function loadReview() {
  return JSON.parse(await readFile(reviewPath, "utf8")) as PocReviewArtifact;
}

function response(status: number, url: string, redirected = false) {
  return { status, url, redirected } as Response;
}

test("source authority is fail-closed and never creates negative claims", () => {
  assert.equal(classifyEvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: true, contextualMatch: true }), "CONFIRMED_CANDIDATE");
  assert.equal(classifyEvidenceSignal({ quality: "Q2", facilitySpecific: true, explicitPositive: true, contextualMatch: true }), "CONFIRMED_CANDIDATE");
  assert.equal(classifyEvidenceSignal({ quality: "Q2", facilitySpecific: false, explicitPositive: true, contextualMatch: true }), "REVIEW_REQUIRED");
  assert.equal(classifyEvidenceSignal({ quality: "Q3", facilitySpecific: true, explicitPositive: true, contextualMatch: true }), "REVIEW_REQUIRED");
  assert.equal(classifyEvidenceSignal({ quality: "Q4", facilitySpecific: true, explicitPositive: true, contextualMatch: true }), "OBSERVED_NOT_CANDIDATE");
  assert.equal(classifyEvidenceSignal({ quality: "Q5", facilitySpecific: true, explicitPositive: true, contextualMatch: true }), "OBSERVED_NOT_CANDIDATE");
  assert.equal(classifyEvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: true, contextualMatch: false }), "OBSERVED_NOT_CANDIDATE");
  assert.equal(classifyEvidenceSignal({ quality: "Q1", facilitySpecific: true, explicitPositive: false, contextualMatch: true }), "NO_EVIDENCE_FOUND");
});

test("frozen sample has exact deterministic 6/9 geography and 6/9 organization strata", async () => {
  const sample = JSON.parse(await readFile(samplePath, "utf8")) as {
    sourceAuthority: { selectionSeed: string };
    locations: Array<{ hgyId: string; selectionRank: string; selectionStrata: string[] }>;
  };
  assert.equal(sample.locations.length, 15);
  assert.equal(new Set(sample.locations.map((item) => item.hgyId)).size, 15);
  assert.equal(sample.locations.filter((item) => item.selectionStrata.includes("tokyo")).length, 6);
  assert.equal(sample.locations.filter((item) => item.selectionStrata.includes("non-tokyo")).length, 9);
  assert.equal(sample.locations.filter((item) => item.selectionStrata.includes("multi-location-chain")).length, 6);
  assert.equal(sample.locations.filter((item) => item.selectionStrata.includes("independent-single-location")).length, 9);
  for (const item of sample.locations) {
    assert.equal(item.selectionRank, deterministicSampleRank(sample.sourceAuthority.selectionSeed, item.hgyId));
  }
});

test("explicit equipment and capabilities require their own contextual evidence", () => {
  const explicit = { quality: "Q1" as const, facilitySpecific: true, explicitPositive: true, contextualMatch: true };
  assert.equal(classifyEvidenceSignal(explicit), "CONFIRMED_CANDIDATE");
  assert.equal(classifyEvidenceSignal({ ...explicit, contextualMatch: false }), "OBSERVED_NOT_CANDIDATE");
  assert.equal(classifyEvidenceSignal({ ...explicit, explicitPositive: false }), "NO_EVIDENCE_FOUND");
  // The same rule applies independently to SkiErg, RowErg, sled, wall-ball
  // target, open gym, coaching, simulation, and sled-space. No relation creates another.
});

test("frozen review expands to exact positive-only candidate graph", async () => {
  const review = await loadReview();
  const claims = expandReviewedClaims(review);
  const graph = buildCandidateGraph(review);
  assert.equal(review.facilities.length, 15);
  assert.equal(claims.filter((claim) => claim.classification === "CONFIRMED_CANDIDATE").length, 52);
  assert.equal(claims.filter((claim) => claim.classification === "REVIEW_REQUIRED").length, 14);
  assert.equal(graph.trainingSources.length, 10);
  assert.equal(graph.equipment.length, 36);
  assert.equal(graph.capabilities.length, 16);
  assert.equal(graph.evidence.length, 52);
  assert.ok(graph.equipment.every((claim) => claim.availabilityState === "available"));
  assert.ok(graph.capabilities.every((claim) => claim.availabilityState === "available"));
});

test("source reuse, evidence hashes, ordering and publication preview are deterministic", async () => {
  const review = await loadReview();
  assert.deepEqual(buildCandidateGraph(review), buildCandidateGraph(review));
  assert.deepEqual(buildPublicationPreview(review), buildPublicationPreview(review));
  const graph = buildCandidateGraph(review);
  assert.equal(new Set(graph.trainingSources.map((source) => `${source.locationId}:${source.url}`)).size, graph.trainingSources.length);
  assert.equal(new Set(graph.evidence.map((item) => item.contentHash)).size, graph.evidence.length);
  const preview = buildPublicationPreview(review);
  assert.equal(preview.length, 15);
  assert.equal(preview.filter((row) => row.openTrainingAvailable).length, 4);
  assert.ok(preview.every((row) => typeof row.openTrainingAvailable === "boolean"));
});

test("evidence hashes are target-specific and stable", () => {
  const input = { hgyId: "HGY_test", targetType: "equipment" as const, targetSlug: "ski-erg", sourceUrl: "https://example.com/gym", excerpt: "SkiErg available." };
  assert.equal(evidenceHash(input), evidenceHash(input));
  assert.notEqual(evidenceHash(input), evidenceHash({ ...input, targetSlug: "row-erg" }));
});

test("unsupported taxonomy, duplicate claims, and ineligible Q3 candidates fail closed", async () => {
  const review = await loadReview();
  const unsupported = structuredClone(review);
  unsupported.facilities[0].claimGroups[0].equipment = ["not-a-taxonomy-item" as never];
  assert.throws(() => expandReviewedClaims(unsupported), /unsupported equipment taxonomy/);

  const duplicate = structuredClone(review);
  duplicate.facilities[0].claimGroups.push(structuredClone(duplicate.facilities[0].claimGroups[0]));
  assert.throws(() => expandReviewedClaims(duplicate), /Duplicate reviewed claim/);

  const q3 = structuredClone(review);
  const q3Facility = q3.facilities.find((facility) => facility.sources.some((source) => source.quality === "Q3"))!;
  q3Facility.claimGroups[0].classification = "CONFIRMED_CANDIDATE";
  assert.throws(() => expandReviewedClaims(q3), /not automatically candidate-eligible/);
});

test("source verifier classifies 200, redirect, 403, 429, 404 and bounded retry", async () => {
  const checkedAt = "2026-08-30T00:00:00.000Z";
  assert.equal((await verifyOfficialSource("https://example.com", { fetchImpl: async () => response(200, "https://example.com"), checkedAt })).status, "AVAILABLE");
  assert.equal((await verifyOfficialSource("http://example.com", { fetchImpl: async () => response(200, "https://example.com/", true), checkedAt })).status, "REDIRECTED_VALID");
  assert.equal((await verifyOfficialSource("https://example.com", { fetchImpl: async () => response(403, "https://example.com"), checkedAt })).status, "ACCESS_RESTRICTED");
  assert.equal((await verifyOfficialSource("https://example.com", { fetchImpl: async () => response(429, "https://example.com"), checkedAt })).status, "ACCESS_RESTRICTED");
  assert.equal((await verifyOfficialSource("https://example.com", { fetchImpl: async () => response(404, "https://example.com"), checkedAt })).status, "NOT_FOUND");
  let attempts = 0;
  const retried = await verifyOfficialSource("https://example.com", {
    fetchImpl: async () => response(++attempts === 1 ? 500 : 200, "https://example.com"),
    retries: 1,
    checkedAt,
  });
  assert.equal(retried.status, "AVAILABLE");
  assert.equal(retried.attempts, 2);
});

test("source verifier caps concurrency and deduplicates URLs", async () => {
  let inFlight = 0;
  let maximum = 0;
  const fetchImpl = async (input: string | URL | Request) => {
    inFlight += 1;
    maximum = Math.max(maximum, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 2));
    inFlight -= 1;
    return response(200, String(input));
  };
  const results = await verifySourcesBounded(["https://a.example", "https://b.example", "https://a.example"], 2, { fetchImpl, checkedAt: "2026-08-30T00:00:00.000Z" });
  assert.equal(results.length, 2);
  assert.ok(maximum <= 2);
  await assert.rejects(() => verifySourcesBounded(["https://a.example"], 9, { fetchImpl }), /between 1 and 8/);
});
