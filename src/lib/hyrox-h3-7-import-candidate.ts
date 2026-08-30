import { createHash } from "node:crypto";
import { enrichmentClaimKey, type EnrichmentAuthorityManifest, type EnrichmentMonitorClaim, type EnrichmentMonitorSource } from "./hyrox-enrichment-monitor";
import type { H37SourceClaim, H37SourceRevalidation } from "./hyrox-h3-7-source-revalidation";

export const H3_6_COMMIT = "160b5593093e89273c1142954c42fafbfff8196f";
export const H3_6_COHORT_HASH = "1cb18ad83aba8a0c71898780995856c2ba8bd49b61eb00b6874184637e1d9c0f";
export const H3_7_LOCK_KEY = "gymmap:hyrox:h3-7:targeted-equipment-import";
export const H3_7_FRESHNESS_POLICY = "hyrox-enrichment-v1:equipment-180:capability-90:simulation-30";

type CandidateInput = H37SourceClaim & {
  evidence: H37SourceClaim["evidence"] & { excerpt: string; structuredFact: string; evidenceHash: string };
  proposedFreshnessDays: 30 | 90 | 180;
};

export type H37ProductionPreflight = {
  schemaVersion: 1; checkedAt: string; readOnly: true; access: string;
  counts: { publishedHyrox: number; officialHyrox: number; searchHyrox: number; trainingSources: number; locationEquipment: number; locationTrainingCapabilities: number; trainingEvidence: number; monitoredClaims: number };
  taxonomy: { equipment: string[]; capabilities: string[] };
  candidateTargets: { locations: number; hgyIdentities: number; currentOfficialMatches: number; existingPublishedClaimRelations: number };
  collisions: Record<string, number>;
};

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["candidateHash", "deltaHash", "manifestHash", "releaseHash", "liveVerification"].includes(key))
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

export function h37Hash(value: unknown) { return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
export function h37PlusDays(instant: string, days: number) { return new Date(Date.parse(instant) + days * 86_400_000).toISOString(); }
function sourceSuffix(sourceKey: string) { return sourceKey.split(":").at(-1)!; }
function sourceRef(claim: CandidateInput) { return `source:${claim.hgyId}:${sourceSuffix(claim.source.sourceKey)}`; }
function targetRef(kind: "equipment" | "capability", claim: CandidateInput) { return `${kind}:${claim.locationId}:${claim.targetSlug}`; }
function branchPattern(claim: CandidateInput) {
  return claim.brandName === "Orangetheory Fitness" ? claim.locationName.replace(/オレンジセオリーフィットネス|\s/g, "") : null;
}

export function buildH37Release(input: {
  equipment: CandidateInput[]; capabilities: CandidateInput[];
  review: { artifactHash: string; observedAt: string; reviewedAt: string; metrics: { reviewRequired: number; observedNotCandidate: number; confirmedFacilities: number; observedDeferred: number } };
  preflight: H37ProductionPreflight; revalidation: H37SourceRevalidation; currentManifest: EnrichmentAuthorityManifest;
}) {
  const equipment = [...input.equipment]; const capabilities = [...input.capabilities]; const claims = [...equipment, ...capabilities];
  if (equipment.length !== 73 || capabilities.length !== 25 || claims.length !== 98 || new Set(claims.map((row) => row.locationId)).size !== 16) throw new Error("H3-6 confirmed graph mismatch");
  if (input.review.metrics.reviewRequired !== 12 || input.review.metrics.observedNotCandidate !== 14 || input.review.metrics.confirmedFacilities !== 16 || input.review.metrics.observedDeferred !== 0) throw new Error("H3-6 excluded decision mismatch");
  if (input.preflight.counts.publishedHyrox !== 82 || input.preflight.counts.officialHyrox !== 82 || input.preflight.counts.trainingSources !== 92 ||
      input.preflight.counts.locationEquipment !== 36 || input.preflight.counts.locationTrainingCapabilities !== 16 || input.preflight.counts.trainingEvidence !== 216 ||
      input.preflight.candidateTargets.currentOfficialMatches !== 16 || Object.values(input.preflight.collisions).some((value) => value !== 0)) throw new Error("Production authority/collision mismatch");
  if (input.revalidation.uniqueUrls !== 6 || input.revalidation.relations.length !== 16 || input.revalidation.driftCount !== 0 ||
      input.revalidation.relations.some((row) => !row.authorityMatch || !row.branchMatch || !row.supportBasisPresent)) throw new Error("H3-7 source authority drift");
  if (claims.some((row) => row.source.quality !== "Q1" && row.source.quality !== "Q2")) throw new Error("Non-Q1/Q2 confirmed input");
  if (claims.some((row) => row.targetSlug === "running-track" || row.targetSlug === "outdoor-running-access")) throw new Error("Deferred taxonomy leaked into candidate");
  if (new Set(claims.map((row) => `${row.locationId}:${row.targetSlug}:${equipment.includes(row) ? "equipment" : "capability"}`)).size !== 98) throw new Error("Candidate natural claim collision");

  const groupedSources = new Map<string, CandidateInput[]>();
  for (const claim of claims) groupedSources.set(sourceRef(claim), [...(groupedSources.get(sourceRef(claim)) ?? []), claim]);
  const sources = [...groupedSources.entries()].map(([ref, rows]) => {
    const first = rows[0];
    return { sourceRef: ref, locationId: first.locationId, hgyId: first.hgyId, url: first.source.url, canonicalUrl: first.source.canonicalUrl,
      sourceKind: "facility_page", publisherAuthority: "facility_official", availabilityState: "available", lastCheckedAt: first.source.observedAt,
      reviewRequired: false, contentHash: h37Hash({ ref, locationId: first.locationId, url: first.source.url, targets: rows.map((row) => row.targetSlug).sort() }),
      metadata: { evidenceQuality: first.source.quality, reviewedPublisherAuthority: first.source.publisherAuthority, h3_6Commit: H3_6_COMMIT } };
  }).sort((a, b) => a.sourceRef.localeCompare(b.sourceRef));
  if (sources.length !== 16 || new Set(sources.map((row) => row.url)).size !== 6) throw new Error("H3-7 source graph mismatch");

  const equipmentRows = equipment.map((claim) => ({ equipmentRef: targetRef("equipment", claim), locationId: claim.locationId, locationSlug: claim.locationSlug,
    locationName: claim.locationName, brandName: claim.brandName, hgyId: claim.hgyId, equipmentSlug: claim.targetSlug, availabilityState: "available",
    quantity: null, accessMode: "unknown", reservationRequirement: "unknown", verificationStatus: "confirmed", lastConfirmedAt: claim.evidence.observedAt,
    staleAt: h37PlusDays(claim.evidence.observedAt, 180), freshnessHorizonDays: 180, sourceRef: sourceRef(claim) }))
    .sort((a, b) => a.equipmentRef.localeCompare(b.equipmentRef));
  const capabilityRows = capabilities.map((claim) => ({ capabilityRef: targetRef("capability", claim), locationId: claim.locationId, locationSlug: claim.locationSlug,
    locationName: claim.locationName, brandName: claim.brandName, hgyId: claim.hgyId, disciplineSlug: "hyrox", capabilitySlug: claim.targetSlug,
    availabilityState: "available", accessMode: claim.targetSlug === "open-training" ? "open_training" : "unknown", reservationRequirement: "unknown",
    verificationStatus: "confirmed", lastConfirmedAt: claim.evidence.observedAt, staleAt: h37PlusDays(claim.evidence.observedAt, claim.proposedFreshnessDays),
    freshnessHorizonDays: claim.proposedFreshnessDays, sourceRef: sourceRef(claim), semanticBasis: claim.targetSlug === "competition-simulation"
      ? "Reviewed first-party source describes an ongoing/repeatable HYROX simulation class, not a dated one-off event." : null }))
    .sort((a, b) => a.capabilityRef.localeCompare(b.capabilityRef));
  if (equipmentRows.some((row) => row.freshnessHorizonDays !== 180) || capabilityRows.filter((row) => row.capabilitySlug === "competition-simulation").some((row) => row.freshnessHorizonDays !== 30) ||
      capabilityRows.filter((row) => row.capabilitySlug !== "competition-simulation").some((row) => row.freshnessHorizonDays !== 90)) throw new Error("Freshness policy mismatch");
  if (capabilityRows.filter((row) => row.capabilitySlug === "competition-simulation").length !== 11 || capabilityRows.filter((row) => row.capabilitySlug === "open-training").length !== 1) throw new Error("Capability semantic count mismatch");

  const allTargets = new Set([...equipmentRows.map((row) => row.equipmentRef), ...capabilityRows.map((row) => row.capabilityRef)]);
  const evidence = claims.map((claim) => {
    const kind = equipment.includes(claim) ? "equipment" as const : "capability" as const; const ref = targetRef(kind, claim);
    const structuredEvidence = { evidenceQuality: claim.source.quality, targetSlug: claim.targetSlug, h3_6EvidenceHash: claim.evidence.evidenceHash,
      supportFingerprint: claim.evidence.supportFingerprint };
    const contentHash = h37Hash({ assertion: "supports", observedAt: claim.evidence.observedAt, sourceRef: sourceRef(claim), structuredEvidence, targetRef: ref });
    return { evidenceRef: `evidence:${contentHash}`, sourceRef: sourceRef(claim), targetType: kind === "equipment" ? "location_equipment" : "location_training_capability",
      targetRef: ref, assertion: "supports", reviewStatus: "accepted", evidenceText: claim.evidence.excerpt, structuredEvidence,
      observedAt: claim.evidence.observedAt, reviewedAt: claim.evidence.reviewedAt, contentHash };
  }).sort((a, b) => a.evidenceRef.localeCompare(b.evidenceRef));
  if (evidence.length !== 98 || new Set(evidence.map((row) => row.contentHash)).size !== 98 || evidence.some((row) => !allTargets.has(row.targetRef))) throw new Error("Evidence graph mismatch");

  const publication = [...new Set(claims.map((row) => row.locationId))].sort().map((locationId) => ({ locationId,
    equipmentSlugs: equipmentRows.filter((row) => row.locationId === locationId).map((row) => row.equipmentSlug).sort(),
    capabilitySlugs: capabilityRows.filter((row) => row.locationId === locationId).map((row) => row.capabilitySlug).sort(),
    openTrainingAvailable: capabilityRows.some((row) => row.locationId === locationId && row.capabilitySlug === "open-training") }));
  const logicalCandidate = { schemaVersion: 1, previewOnly: true, authority: { h3_6Commit: H3_6_COMMIT, cohortHash: H3_6_COHORT_HASH,
    h3_6EvidenceArtifactHash: input.review.artifactHash, observedAt: input.review.observedAt, reviewedAt: input.review.reviewedAt },
    counts: { facilities: 16, trainingSources: 16, uniqueUrls: 6, equipment: 73, capabilities: 25, evidence: 98,
      excludedReviewRequired: 12, excludedObservedNotCandidate: 14, negativeClaims: 0 },
    freshnessPolicy: { version: H3_7_FRESHNESS_POLICY, physicalEquipmentDays: 180, openTrainingDays: 90, disciplineCoachingDays: 90,
      sledPushPullSpaceDays: 90, competitionSimulationDays: 30 },
    importPolicy: { advisoryLockKey: H3_7_LOCK_KEY, atomicTransaction: true, dependencyOrder: ["training_sources", "location_equipment", "location_training_capabilities", "training_evidence"], exactRerunIdempotent: true, semanticConflict: "BLOCK" },
    productionBaseline: input.preflight.counts, sources, equipment: equipmentRows, capabilities: capabilityRows, evidence,
    publicationPreview: { equipmentRows: 109, equipmentPositiveFacilities: 22, capabilityRows: 41, capabilityPositiveFacilities: 21,
      anyEnrichedFacilities: 25, openTrainingPositiveFacilities: 5, competitionSimulationPositiveFacilities: 13,
      hyroxLocations: 82, officialLocations: 82, searchLocations: 82, negativeClaims: 0, locations: publication },
    targetingStrategy: "TARGETING_VALIDATED" };
  const candidate = { ...logicalCandidate, candidateHash: h37Hash(logicalCandidate), liveVerification: { preflightCheckedAt: input.preflight.checkedAt, revalidationCheckedAt: input.revalidation.checkedAt } };

  const sourceDelta: EnrichmentMonitorSource[] = sources.map((source) => ({ sourceKey: source.sourceRef, locationId: source.locationId, hgyId: source.hgyId,
    url: source.url, canonicalUrl: source.canonicalUrl, quality: source.metadata.evidenceQuality, publisherAuthority: source.publisherAuthority }));
  const claimDelta: EnrichmentMonitorClaim[] = claims.map((claim) => {
    const kind = equipment.includes(claim) ? "equipment" as const : "capability" as const; const horizon = kind === "equipment" ? 180 : claim.proposedFreshnessDays;
    const patterns = claim.evidence.supportFingerprint.map((pattern) => [pattern]); const branch = branchPattern(claim); if (branch) patterns.unshift([branch]);
    const evidenceRow = evidence.find((row) => row.targetRef === targetRef(kind, claim))!;
    return { claimKey: enrichmentClaimKey(kind, claim.locationId, claim.targetSlug), kind, locationId: claim.locationId, locationSlug: claim.locationSlug,
      locationName: claim.locationName, hgyId: claim.hgyId, slug: claim.targetSlug, sourceKey: sourceRef(claim), lastConfirmedAt: claim.evidence.observedAt,
      staleAt: h37PlusDays(claim.evidence.observedAt, horizon), freshnessHorizonDays: horizon, evidenceHash: evidenceRow.contentHash, supportPatternGroups: patterns };
  }).sort((a, b) => a.claimKey.localeCompare(b.claimKey));
  const deltaLogical = { schemaVersion: 1, authority: { h3_6Commit: H3_6_COMMIT, cohortHash: H3_6_COHORT_HASH, dbCandidateHash: candidate.candidateHash },
    counts: { sources: 16, uniqueUrls: 6, equipment: 73, capabilities: 25, claims: 98, enrichedLocations: 16 }, sources: sourceDelta, claims: claimDelta };
  const monitorDelta = { ...deltaLogical, deltaHash: h37Hash(deltaLogical) };
  if (input.currentManifest.claims.length !== 52 || input.currentManifest.sources.length !== 10) throw new Error("Current H3-5A manifest authority mismatch");
  const projectedSources = [...input.currentManifest.sources, ...sourceDelta].sort((a, b) => a.sourceKey.localeCompare(b.sourceKey));
  const projectedClaims = [...input.currentManifest.claims, ...claimDelta].sort((a, b) => a.claimKey.localeCompare(b.claimKey));
  if (new Set(projectedSources.map((row) => row.sourceKey)).size !== 26 || new Set(projectedClaims.map((row) => row.claimKey)).size !== 150) throw new Error("Projected monitor identity collision");
  const projectedLogical = { schemaVersion: 2, authority: { currentManifestHash: input.currentManifest.manifestHash, deltaHash: monitorDelta.deltaHash,
    dbCandidateHash: candidate.candidateHash }, counts: { sources: 26, uniqueExternalUrls: new Set(projectedSources.map((row) => row.url)).size,
    equipment: 109, capabilities: 41, claims: 150, enrichedLocations: 25 }, sources: projectedSources, claims: projectedClaims };
  const projectedManifest = { ...projectedLogical, manifestHash: h37Hash(projectedLogical) };
  const releaseLogical = { schemaVersion: 1, h3_6Commit: H3_6_COMMIT, cohortHash: H3_6_COHORT_HASH, freshnessPolicyVersion: H3_7_FRESHNESS_POLICY,
    dbCandidateHash: candidate.candidateHash, monitorDeltaHash: monitorDelta.deltaHash, projectedMonitorManifestHash: projectedManifest.manifestHash };
  const release = { ...releaseLogical, releaseHash: h37Hash(releaseLogical) };
  return { candidate, monitorDelta, projectedManifest, release };
}
