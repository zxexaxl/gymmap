import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildEnrichmentMonitorRun,
  enrichmentManifestHash,
  normalizeSupportText,
  validateEnrichmentManifest,
  type EnrichmentAuthorityManifest,
  type EnrichmentSourceObservation,
  type PublishedEnrichmentClaim,
} from "../hyrox-enrichment-monitor";
import { observeEnrichmentSources } from "../hyrox-enrichment-monitor-source";

const manifestPath = new URL("../../../data/hyrox/h3-5a-enrichment-monitor-authority.json", import.meta.url);
const checkedAt = "2026-08-30T12:51:32.225Z";

async function loadManifest() {
  return validateEnrichmentManifest(JSON.parse(await readFile(manifestPath, "utf8")) as EnrichmentAuthorityManifest);
}

function published(manifest: EnrichmentAuthorityManifest): PublishedEnrichmentClaim[] {
  return manifest.claims.map((claim) => ({
    kind: claim.kind,
    locationId: claim.locationId,
    slug: claim.slug,
    lastConfirmedAt: claim.lastConfirmedAt,
    staleAt: claim.staleAt,
  }));
}

function healthySources(manifest: EnrichmentAuthorityManifest): EnrichmentSourceObservation[] {
  return manifest.sources.map((source) => {
    const support = manifest.claims.filter((claim) => claim.sourceKey === source.sourceKey)
      .flatMap((claim) => claim.supportPatternGroups.map((group) => group[0])).join(" — ");
    return {
      sourceKey: source.sourceKey,
      status: "AVAILABLE",
      requestedUrl: source.url,
      finalUrl: source.url,
      canonicalUrl: source.canonicalUrl,
      httpStatus: 200,
      attempts: 1,
      error: null,
      materialRedirect: false,
      normalizedContent: normalizeSupportText(support),
    };
  });
}

function run(manifest: EnrichmentAuthorityManifest, overrides: {
  checkedAt?: string;
  publishedClaims?: PublishedEnrichmentClaim[];
  observations?: EnrichmentSourceObservation[];
} = {}) {
  return buildEnrichmentMonitorRun({
    manifest,
    checkedAt: overrides.checkedAt ?? checkedAt,
    publishedClaims: overrides.publishedClaims ?? published(manifest),
    sourceObservations: overrides.observations ?? healthySources(manifest),
  });
}

test("authority manifest includes the exact H3-11D Cohort 1 release graph and canonical hash", async () => {
  const manifest = await loadManifest();
  assert.deepEqual(manifest.counts, { sources: 36, uniqueExternalUrls: 25, equipment: 128, capabilities: 59, claims: 187, enrichedLocations: 33 });
  assert.equal(enrichmentManifestHash(manifest), manifest.manifestHash);
  assert.equal(new Set(manifest.claims.map((claim) => claim.claimKey)).size, 187);
  assert.equal(new Set(manifest.claims.map((claim) => claim.sourceKey)).size, 36);
  assert.equal(new Set(manifest.sources.map((source) => source.url)).size, 25);
});

test("initial frozen time preserves thirteen due-soon legacy claims and adds 37 fresh Cohort 1 claims", async () => {
  const result = run(await loadManifest());
  assert.equal(result.records.length, 187);
  assert.equal(result.records.filter((record) => record.freshness.status === "FRESH").length, 174);
  assert.equal(result.records.filter((record) => record.freshness.status === "DUE_SOON").length, 13);
  assert.equal(result.records.filter((record) => record.classifications.includes("NO_CHANGE")).length, 174);
  assert.equal(result.reviewQueue.length, 13);
  assert.ok(result.reviewQueue.every((record) => record.slug === "competition-simulation"));
  assert.ok(result.reviewQueue.every((record) => record.classifications.includes("DUE_SOON_RECONFIRMATION")));
});

test("freshness boundaries preserve category horizons and UTC instants", async () => {
  const manifest = await loadManifest();
  const claim = manifest.claims.find((item) => item.slug === "competition-simulation")!;
  const stale = Date.parse(claim.staleAt);
  for (const [at, expected] of [
    [new Date(stale - 30 * 86_400_000 + 1_000).toISOString(), "DUE_SOON"],
    [new Date(stale - 14 * 86_400_000 + 1_000).toISOString(), "URGENT"],
    [claim.staleAt, "STALE"],
  ] as const) {
    const record = run(manifest, { checkedAt: at }).records.find((item) => item.claimKey === claim.claimKey)!;
    assert.equal(record.freshness.status, expected);
  }
  assert.equal(manifest.claims.filter((item) => item.kind === "equipment" && item.freshnessHorizonDays === 180).length, 128);
  assert.equal(manifest.claims.filter((item) => item.kind === "capability" && item.freshnessHorizonDays === 90).length, 43);
  assert.equal(manifest.claims.filter((item) => item.kind === "capability" && item.freshnessHorizonDays === 30).length, 16);
});

test("support matcher tolerates harmless markup/reordering but rejects unrelated keywords", async () => {
  const manifest = await loadManifest();
  const observations = healthySources(manifest);
  observations.forEach((item) => { item.normalizedContent = `<section> ${item.normalizedContent?.replace(/ — /g, "\n")} </section>`; });
  assert.equal(run(manifest, { observations }).records.filter((record) => record.claimSupportStatus === "MISSING").length, 0);

  const target = manifest.claims.find((claim) => claim.sourceKey.endsWith(":field-hyrox") && claim.slug === "competition-simulation")!;
  const source = observations.find((item) => item.sourceKey === target.sourceKey)!;
  source.normalizedContent = "別施設の一般記事で模擬レース形式を紹介しています";
  const record = run(manifest, { observations }).records.find((item) => item.claimKey === target.claimKey)!;
  assert.equal(record.claimSupportStatus, "MISSING");
  assert.ok(record.classifications.includes("REVIEW_REQUIRED_CLAIM_SUPPORT"));
});

test("source redirect and unavailability are review signals, never negative facts", async () => {
  const manifest = await loadManifest();
  const observations = healthySources(manifest);
  const first = observations[0];
  first.status = "REDIRECTED_VALID";
  first.materialRedirect = true;
  first.finalUrl = "https://new-authority.example/facility";
  const affected = manifest.claims.filter((claim) => claim.sourceKey === first.sourceKey).length;
  let result = run(manifest, { observations });
  assert.equal(result.records.filter((record) => record.classifications.includes("REVIEW_REQUIRED_SOURCE_URL")).length, affected);

  first.status = "NOT_FOUND";
  first.materialRedirect = false;
  first.normalizedContent = undefined;
  result = run(manifest, { observations });
  assert.equal(result.records.filter((record) => record.classifications.includes("SOURCE_UNAVAILABLE")).length, affected);
  assert.ok(result.records.every((record) => !("available" in record) && !("unavailable" in record)));
});

test("publication checks distinguish fresh missing, stale omitted, and unexpected extra", async () => {
  const manifest = await loadManifest();
  const allPublished = published(manifest);
  const freshClaim = manifest.claims.find((claim) => claim.kind === "equipment")!;
  let result = run(manifest, { publishedClaims: allPublished.filter((item) => !(item.kind === freshClaim.kind && item.locationId === freshClaim.locationId && item.slug === freshClaim.slug)) });
  assert.ok(result.records.find((item) => item.claimKey === freshClaim.claimKey)!.classifications.includes("PUBLICATION_MISMATCH"));

  const competition = manifest.claims.find((claim) => claim.slug === "competition-simulation")!;
  result = run(manifest, {
    checkedAt: competition.staleAt,
    publishedClaims: allPublished.filter((item) => !(item.kind === competition.kind && item.locationId === competition.locationId && item.slug === competition.slug)),
  });
  const staleRecord = result.records.find((item) => item.claimKey === competition.claimKey)!;
  assert.equal(staleRecord.publicationState, "EXPECTED_STALE_UNPUBLISHED");
  assert.ok(staleRecord.classifications.includes("STALE_RECONFIRMATION_REQUIRED"));
  assert.ok(!staleRecord.classifications.includes("PUBLICATION_MISMATCH"));

  result = run(manifest, { publishedClaims: [...allPublished, { kind: "equipment", locationId: "extra", slug: "ski-erg", lastConfirmedAt: checkedAt, staleAt: "2027-01-01T00:00:00.000Z" }] });
  assert.equal(result.publicationExtras.length, 1);
  assert.equal(result.runIssues[0].code, "PUBLICATION_EXTRA");
});

test("global outage creates one run-level root cause instead of disappearance alerts", async () => {
  const manifest = await loadManifest();
  const observations = healthySources(manifest).map((item) => ({ ...item, status: "TEMPORARILY_UNREACHABLE" as const, normalizedContent: undefined, error: "network unavailable" }));
  const result = run(manifest, { observations });
  assert.deepEqual(result.runIssues.map((issue) => issue.code), ["MONITOR_SOURCE_OUTAGE"]);
  assert.equal(result.records.filter((record) => record.classifications.includes("SOURCE_UNAVAILABLE")).length, 0);
  assert.equal(result.records.filter((record) => record.classifications.includes("MONITOR_ERROR")).length, 187);
  assert.equal(result.sourceIssues.length, 36);
  assert.equal(result.reviewQueue.length, 13, "freshness queue remains visible while outage noise is grouped");
});

test("source collector fetches each unique source once and retries a transient 500", async () => {
  const manifest = await loadManifest();
  const oneSource = { ...manifest, sources: [manifest.sources[0]], claims: [], counts: { ...manifest.counts, sources: 1, claims: 0 } };
  let calls = 0;
  const fetchImpl: typeof fetch = async (input) => {
    calls += 1;
    const response = new Response(calls === 1 ? "temporary" : "<html><body>supported</body></html>", { status: calls === 1 ? 500 : 200 });
    Object.defineProperty(response, "url", { value: String(input) });
    return response;
  };
  const result = await observeEnrichmentSources(oneSource, { fetchImpl, sleep: async () => {}, maxAttempts: 2 });
  assert.equal(calls, 2);
  assert.equal(result.stats.sources, 1);
  assert.equal(result.stats.retries, 1);
  assert.equal(result.observations[0].status, "AVAILABLE");
});

test("source collector preserves redirect, 403, 404, 429, and timeout semantics", async () => {
  const manifest = await loadManifest();
  const oneSource = { ...manifest, sources: [manifest.sources[0]], claims: [], counts: { ...manifest.counts, sources: 1, claims: 0 } };
  async function observe(status: number, finalUrl = oneSource.sources[0].url) {
    const fetchImpl: typeof fetch = async () => {
      const response = new Response(status === 200 ? "<html>ok</html>" : "error", { status });
      Object.defineProperty(response, "url", { value: finalUrl });
      return response;
    };
    return (await observeEnrichmentSources(oneSource, { fetchImpl, sleep: async () => {}, maxAttempts: 1 })).observations[0];
  }
  assert.equal((await observe(200, new URL("current/", oneSource.sources[0].url).toString())).status, "REDIRECTED_VALID");
  assert.equal((await observe(403)).status, "ACCESS_RESTRICTED");
  assert.equal((await observe(404)).status, "NOT_FOUND");
  assert.equal((await observe(429)).status, "TEMPORARILY_UNREACHABLE");

  const timedOut = await observeEnrichmentSources(oneSource, {
    fetchImpl: async () => { throw new DOMException("timed out", "AbortError"); },
    sleep: async () => {},
    maxAttempts: 1,
  });
  assert.equal(timedOut.observations[0].status, "TEMPORARILY_UNREACHABLE");
});
