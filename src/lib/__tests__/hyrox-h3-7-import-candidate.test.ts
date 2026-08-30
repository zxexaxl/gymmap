import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildH37Release, h37Hash, h37PlusDays, H3_6_COHORT_HASH, H3_6_COMMIT } from "../hyrox-h3-7-import-candidate";
import { claimSupportPresent, enrichmentClaimKey, type EnrichmentAuthorityManifest } from "../hyrox-enrichment-monitor";
import type { H37SourceRevalidation } from "../hyrox-h3-7-source-revalidation";

const root = new URL("../../../", import.meta.url);
async function json<T>(path: string) { return JSON.parse(await readFile(new URL(path, root), "utf8")) as T; }
type BuildInput = Parameters<typeof buildH37Release>[0];

async function inputs(): Promise<BuildInput> {
  const equipment = await json<{ candidates: BuildInput["equipment"] }>("data/hyrox/h3-6-confirmed-equipment-candidates.json");
  const capabilities = await json<{ candidates: BuildInput["capabilities"] }>("data/hyrox/h3-6-confirmed-capability-candidates.json");
  return {
    equipment: equipment.candidates,
    capabilities: capabilities.candidates,
    review: await json<BuildInput["review"]>("data/hyrox/h3-6-targeted-equipment-evidence.json"),
    preflight: await json<BuildInput["preflight"]>("data/hyrox/h3-7-production-preflight.json"),
    revalidation: await json<H37SourceRevalidation>("data/hyrox/h3-7-targeted-source-revalidation.json"),
    currentManifest: await json<EnrichmentAuthorityManifest>("data/hyrox/h3-5a-enrichment-monitor-authority.json"),
  };
}

function counts(values: string[]) {
  return Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length]));
}

test("exact H3-6 reviewed input is isolated and excluded decisions never enter the candidate", async () => {
  const built = buildH37Release(await inputs());
  assert.equal(H3_6_COMMIT, "160b5593093e89273c1142954c42fafbfff8196f");
  assert.equal(H3_6_COHORT_HASH, "1cb18ad83aba8a0c71898780995856c2ba8bd49b61eb00b6874184637e1d9c0f");
  assert.deepEqual(built.candidate.counts, {
    facilities: 16, trainingSources: 16, uniqueUrls: 6, equipment: 73, capabilities: 25, evidence: 98,
    excludedReviewRequired: 12, excludedObservedNotCandidate: 14, negativeClaims: 0,
  });
  assert.deepEqual(counts(built.candidate.equipment.map((row) => row.equipmentSlug)), {
    "farmers-carry-implements": 15, "functional-training-lane": 1, "row-erg": 13, sandbag: 13,
    "ski-erg": 2, treadmill: 14, "wall-ball-target": 3, "weighted-sled": 12,
  });
  assert.deepEqual(counts(built.candidate.capabilities.map((row) => row.capabilitySlug)), {
    "competition-simulation": 11, "discipline-coaching": 12, "open-training": 1, "sled-push-pull-space": 1,
  });
  assert.ok(![...built.candidate.equipment, ...built.candidate.capabilities].some((row) =>
    ["running-track", "outdoor-running-access"].includes("equipmentSlug" in row ? row.equipmentSlug : row.capabilitySlug)));
});

test("source and evidence graphs preserve natural relations, reuse, quality, and target integrity", async () => {
  const built = buildH37Release(await inputs());
  assert.equal(built.candidate.sources.length, 16);
  assert.equal(new Set(built.candidate.sources.map((row) => row.url)).size, 6);
  assert.equal(new Set(built.candidate.sources.map((row) => row.sourceRef)).size, 16);
  assert.deepEqual(counts(built.candidate.evidence.map((row) => row.structuredEvidence.evidenceQuality)), { Q1: 10, Q2: 88 });
  assert.equal(new Set(built.candidate.evidence.map((row) => row.contentHash)).size, 98);
  const targets = new Set([
    ...built.candidate.equipment.map((row) => row.equipmentRef),
    ...built.candidate.capabilities.map((row) => row.capabilityRef),
  ]);
  assert.ok(built.candidate.evidence.every((row) => row.assertion === "supports" && row.reviewStatus === "accepted" && targets.has(row.targetRef)));
});

test("freshness uses H3-6 observation authority and category-specific deterministic horizons", async () => {
  const built = buildH37Release(await inputs());
  const observedAt = "2026-08-30T11:49:02.406Z";
  assert.ok(built.candidate.equipment.every((row) => row.lastConfirmedAt === observedAt && row.staleAt === "2027-02-26T11:49:02.406Z"));
  assert.ok(built.candidate.capabilities.filter((row) => row.capabilitySlug !== "competition-simulation")
    .every((row) => row.lastConfirmedAt === observedAt && row.staleAt === "2026-11-28T11:49:02.406Z"));
  assert.ok(built.candidate.capabilities.filter((row) => row.capabilitySlug === "competition-simulation")
    .every((row) => row.lastConfirmedAt === observedAt && row.staleAt === "2026-09-29T11:49:02.406Z"));
  assert.equal(h37PlusDays(observedAt, 30), "2026-09-29T11:49:02.406Z");
});

test("publication/search preview adds only positives and keeps 82 HYROX locations invariant", async () => {
  const preview = buildH37Release(await inputs()).candidate.publicationPreview;
  assert.deepEqual({
    equipment: preview.equipmentRows, equipmentFacilities: preview.equipmentPositiveFacilities,
    capabilities: preview.capabilityRows, capabilityFacilities: preview.capabilityPositiveFacilities,
    enrichedFacilities: preview.anyEnrichedFacilities, openTraining: preview.openTrainingPositiveFacilities,
    simulation: preview.competitionSimulationPositiveFacilities, hyrox: preview.hyroxLocations,
    official: preview.officialLocations, search: preview.searchLocations, negative: preview.negativeClaims,
  }, { equipment: 109, equipmentFacilities: 22, capabilities: 41, capabilityFacilities: 21,
    enrichedFacilities: 25, openTraining: 5, simulation: 13, hyrox: 82, official: 82, search: 82, negative: 0 });
});

test("monitor onboarding keeps the current 52 identities and adds exactly 98 compatible claims", async () => {
  const input = await inputs();
  const built = buildH37Release(input);
  assert.equal(built.monitorDelta.claims.length, 98);
  assert.equal(built.projectedManifest.claims.length, 150);
  assert.equal(new Set(built.projectedManifest.claims.map((row) => row.claimKey)).size, 150);
  assert.equal(built.projectedManifest.sources.length, 26);
  assert.equal(built.projectedManifest.counts.uniqueExternalUrls, 15);
  for (const claim of input.currentManifest.claims) {
    assert.deepEqual(built.projectedManifest.claims.find((row) => row.claimKey === claim.claimKey), claim);
  }
  for (const claim of built.monitorDelta.claims) {
    assert.equal(claim.claimKey, enrichmentClaimKey(claim.kind, claim.locationId, claim.slug));
    const content = claim.supportPatternGroups.flat().join(" ");
    assert.equal(claimSupportPresent(claim, content), true);
  }
  assert.equal(built.monitorDelta.claims.filter((row) => row.freshnessHorizonDays === 180).length, 73);
  assert.equal(built.monitorDelta.claims.filter((row) => row.freshnessHorizonDays === 90).length, 14);
  assert.equal(built.monitorDelta.claims.filter((row) => row.freshnessHorizonDays === 30).length, 11);
});

test("candidate, monitor, projected manifest, and release hashes regenerate deterministically", async () => {
  const left = buildH37Release(await inputs());
  const right = buildH37Release(await inputs());
  assert.equal(left.candidate.candidateHash, "9610b5ea03d43c78823857620d4813203f6db2a1e12632c5c559dffec19ba83e");
  assert.equal(left.monitorDelta.deltaHash, "f3cfeca4db5828308e6cb85d4c370153d61a489d11429ad6618d4bae0b02e79a");
  assert.equal(left.projectedManifest.manifestHash, "65a7e36c81f52d72b6215e26ab03caecac3d036e73a378a740fc8c3a03e34df2");
  assert.equal(left.release.releaseHash, "dc97df4fd675d29e71425c7720ede609234c749da305aa5249f8dcfc3c32c255");
  assert.deepEqual(left, right);
  assert.equal(left.release.releaseHash, h37Hash({ ...left.release, releaseHash: undefined }));
});

test("rehearsal SQL is local-guarded, atomic, conflict-fail-closed, idempotent, and rolls back", async () => {
  const sql = await readFile(new URL("data/hyrox/h3-7-targeted-equipment-import-candidate.rehearsal.sql", root), "utf8");
  assert.match(sql, /current_database\(\) !~ '\^gymmap_h3_7_rehearsal'/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /call pg_temp\.apply_h37\(\);[\s\S]*call pg_temp\.apply_h37\(\);/);
  assert.match(sql, /source authority conflict/);
  assert.match(sql, /equipment semantic conflict/);
  assert.match(sql, /capability semantic conflict/);
  assert.match(sql, /evidence conflict/);
  assert.match(sql, /freshness regression/);
  assert.match(sql, /rollback;/);
  assert.doesNotMatch(sql, /postgres(?:ql)?:\/\//i);
});

test("H3-7 implementation has no production write credential, UI mutation, or live-manifest mutation", async () => {
  const paths = [
    "src/lib/hyrox-h3-7-import-candidate.ts", "src/lib/hyrox-h3-7-source-revalidation.ts", "src/lib/hyrox-h3-7-rehearsal-sql.ts",
    "scripts/hyrox/build-h3-7-production-preflight.ts", "scripts/hyrox/build-h3-7-targeted-import-candidate.ts",
    "scripts/hyrox/revalidate-h3-7-targeted-sources.ts", "scripts/hyrox/render-h3-7-rehearsal.ts",
  ];
  const source = (await Promise.all(paths.map((path) => readFile(new URL(path, root), "utf8")))).join("\n");
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|service[_-]?role/i);
  assert.doesNotMatch(source, /\.from\([^)]*\)\.(?:insert|update|delete|upsert)\(/i);
  assert.doesNotMatch(source, /src\/app|src\/components/);
  assert.doesNotMatch(source, /writeFile\([^\n]*h3-5a-enrichment-monitor-authority/);
});
