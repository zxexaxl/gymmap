import { createHash } from "node:crypto";

export const HYROX_EQUIPMENT_SLUGS = [
  "ski-erg",
  "row-erg",
  "weighted-sled",
  "wall-ball-target",
  "farmers-carry-implements",
  "sandbag",
  "functional-training-lane",
  "treadmill",
  "running-track",
] as const;

export const HYROX_CAPABILITY_SLUGS = [
  "open-training",
  "discipline-coaching",
  "competition-simulation",
  "sled-push-pull-space",
  "outdoor-running-access",
] as const;

export type EquipmentSlug = (typeof HYROX_EQUIPMENT_SLUGS)[number];
export type CapabilitySlug = (typeof HYROX_CAPABILITY_SLUGS)[number];
export type EvidenceQuality = "Q1" | "Q2" | "Q3" | "Q4" | "Q5";
export type ClaimClassification =
  | "CONFIRMED_CANDIDATE"
  | "REVIEW_REQUIRED"
  | "OBSERVED_NOT_CANDIDATE"
  | "NO_EVIDENCE_FOUND";

export type EvidenceSignal = {
  quality: EvidenceQuality;
  facilitySpecific: boolean;
  explicitPositive: boolean;
  contextualMatch: boolean;
};

/**
 * Turns a discovery signal into a review classification. This deliberately
 * does not infer a negative claim from missing evidence, or a positive claim
 * from affiliation, a keyword, or a generic brand page.
 */
export function classifyEvidenceSignal(signal: EvidenceSignal): ClaimClassification {
  if (!signal.explicitPositive) return "NO_EVIDENCE_FOUND";
  if (!signal.contextualMatch) return "OBSERVED_NOT_CANDIDATE";
  if (signal.quality === "Q4" || signal.quality === "Q5") return "OBSERVED_NOT_CANDIDATE";
  if (!signal.facilitySpecific || signal.quality === "Q3") return "REVIEW_REQUIRED";
  return "CONFIRMED_CANDIDATE";
}

export type PocSource = {
  ref: string;
  url: string;
  title: string;
  sourceKind: "facility_page" | "schedule" | "social_post" | "other";
  publisherAuthority: "facility_official" | "official_schedule" | "official_social";
  quality: EvidenceQuality;
  facilitySpecific: boolean;
  excerpt: string;
  observedAt: string;
};

export type PocClaimGroup = {
  sourceRef: string;
  classification: Exclude<ClaimClassification, "NO_EVIDENCE_FOUND">;
  equipment?: EquipmentSlug[];
  capabilities?: CapabilitySlug[];
  reason: string;
};

export type PocFacilityReview = {
  locationId: string;
  slug: string;
  hgyId: string;
  name: string;
  brand: string;
  prefecture: string;
  sourceSurface: "rich_first_party" | "partial_first_party" | "official_secondary_only" | "no_useful_source";
  automationClass: "AUTOMATABLE" | "SEMI_AUTOMATED" | "MANUAL_HEAVY";
  pagesInspected: number;
  reviewActions: number;
  sources: PocSource[];
  claimGroups: PocClaimGroup[];
  notes: string;
};

export type PocReviewArtifact = {
  schemaVersion: number;
  observedAt: string;
  sampleSha256: string;
  productionAuthority: {
    publishedOfficial: number;
    publishedEquipment: number;
    publishedCapabilities: number;
  };
  facilities: PocFacilityReview[];
};

export type ExpandedClaim = {
  locationId: string;
  locationSlug: string;
  hgyId: string;
  targetType: "equipment" | "capability";
  targetSlug: EquipmentSlug | CapabilitySlug;
  classification: Exclude<ClaimClassification, "NO_EVIDENCE_FOUND">;
  source: PocSource;
  reason: string;
  evidenceHash: string;
};

const equipmentSet = new Set<string>(HYROX_EQUIPMENT_SLUGS);
const capabilitySet = new Set<string>(HYROX_CAPABILITY_SLUGS);

function canonicalHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function deterministicSampleRank(selectionSeed: string, hgyId: string) {
  return createHash("sha256").update(`${selectionSeed}:${hgyId}`).digest("hex");
}

export function evidenceHash(input: {
  hgyId: string;
  targetType: "equipment" | "capability";
  targetSlug: string;
  sourceUrl: string;
  excerpt: string;
}) {
  return canonicalHash({
    hgyId: input.hgyId,
    targetType: input.targetType,
    targetSlug: input.targetSlug,
    sourceUrl: new URL(input.sourceUrl).toString(),
    excerpt: input.excerpt.trim(),
    assertion: "supports",
  });
}

function validateSource(source: PocSource, hgyId: string) {
  if (!source.ref || !source.title || !source.excerpt.trim()) {
    throw new Error(`${hgyId}: every reviewed source requires ref, title, and explicit excerpt`);
  }
  const url = new URL(source.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${hgyId}: unsupported source URL protocol`);
  }
  if (!Number.isFinite(Date.parse(source.observedAt))) {
    throw new Error(`${hgyId}: invalid source observation timestamp`);
  }
  if (source.quality === "Q5" && source.publisherAuthority !== "facility_official") {
    throw new Error(`${hgyId}: third-party evidence is outside this first-party PoC artifact`);
  }
}

export function expandReviewedClaims(artifact: PocReviewArtifact): ExpandedClaim[] {
  if (artifact.facilities.length !== 15) throw new Error(`PoC requires exactly 15 facilities`);
  const hgyIds = new Set<string>();
  const locationIds = new Set<string>();
  const claims: ExpandedClaim[] = [];
  for (const facility of [...artifact.facilities].sort((a, b) => a.hgyId.localeCompare(b.hgyId))) {
    if (!/^HGY_[A-Za-z0-9]+$/.test(facility.hgyId)) throw new Error(`Invalid HGY ID: ${facility.hgyId}`);
    if (hgyIds.has(facility.hgyId) || locationIds.has(facility.locationId)) {
      throw new Error(`Duplicate facility identity: ${facility.hgyId}`);
    }
    hgyIds.add(facility.hgyId);
    locationIds.add(facility.locationId);
    const sources = new Map<string, PocSource>();
    for (const source of facility.sources) {
      validateSource(source, facility.hgyId);
      if (sources.has(source.ref)) throw new Error(`${facility.hgyId}: duplicate source ref ${source.ref}`);
      sources.set(source.ref, source);
    }
    for (const group of facility.claimGroups) {
      const source = sources.get(group.sourceRef);
      if (!source) throw new Error(`${facility.hgyId}: unknown source ref ${group.sourceRef}`);
      if (group.classification === "CONFIRMED_CANDIDATE") {
        if (!source.facilitySpecific || source.quality === "Q3" || source.quality === "Q4" || source.quality === "Q5") {
          throw new Error(`${facility.hgyId}: ${source.quality} is not automatically candidate-eligible`);
        }
      }
      const targets: Array<{ type: "equipment" | "capability"; slug: string }> = [
        ...(group.equipment ?? []).map((slug) => ({ type: "equipment" as const, slug })),
        ...(group.capabilities ?? []).map((slug) => ({ type: "capability" as const, slug })),
      ];
      if (targets.length === 0) throw new Error(`${facility.hgyId}: empty claim group`);
      for (const target of targets) {
        if (target.type === "equipment" && !equipmentSet.has(target.slug)) {
          throw new Error(`${facility.hgyId}: unsupported equipment taxonomy ${target.slug}`);
        }
        if (target.type === "capability" && !capabilitySet.has(target.slug)) {
          throw new Error(`${facility.hgyId}: unsupported capability taxonomy ${target.slug}`);
        }
        claims.push({
          locationId: facility.locationId,
          locationSlug: facility.slug,
          hgyId: facility.hgyId,
          targetType: target.type,
          targetSlug: target.slug as EquipmentSlug | CapabilitySlug,
          classification: group.classification,
          source,
          reason: group.reason,
          evidenceHash: evidenceHash({
            hgyId: facility.hgyId,
            targetType: target.type,
            targetSlug: target.slug,
            sourceUrl: source.url,
            excerpt: source.excerpt,
          }),
        });
      }
    }
  }
  const unique = new Map<string, ExpandedClaim>();
  for (const claim of claims) {
    const key = `${claim.hgyId}:${claim.targetType}:${claim.targetSlug}`;
    if (unique.has(key)) throw new Error(`Duplicate reviewed claim: ${key}`);
    unique.set(key, claim);
  }
  return [...unique.values()].sort((a, b) =>
    a.hgyId.localeCompare(b.hgyId) ||
    a.targetType.localeCompare(b.targetType) ||
    a.targetSlug.localeCompare(b.targetSlug));
}

export function confirmedClaims(artifact: PocReviewArtifact) {
  return expandReviewedClaims(artifact).filter((claim) => claim.classification === "CONFIRMED_CANDIDATE");
}

export function uniqueCandidateSources(artifact: PocReviewArtifact) {
  const sources = new Map<string, PocSource & { locationId: string; hgyId: string }>();
  for (const claim of confirmedClaims(artifact)) {
    const key = `${claim.locationId}:${new URL(claim.source.url).toString()}`;
    sources.set(key, { ...claim.source, locationId: claim.locationId, hgyId: claim.hgyId });
  }
  return [...sources.values()].sort((a, b) => a.hgyId.localeCompare(b.hgyId) || a.url.localeCompare(b.url));
}

export function buildPublicationPreview(artifact: PocReviewArtifact) {
  const byLocation = new Map<string, { equipmentSlugs: string[]; capabilitySlugs: string[]; openTrainingAvailable: boolean }>();
  for (const facility of artifact.facilities) {
    byLocation.set(facility.locationId, { equipmentSlugs: [], capabilitySlugs: [], openTrainingAvailable: false });
  }
  for (const claim of confirmedClaims(artifact)) {
    const row = byLocation.get(claim.locationId)!;
    if (claim.targetType === "equipment") row.equipmentSlugs.push(claim.targetSlug);
    else row.capabilitySlugs.push(claim.targetSlug);
  }
  return [...byLocation.entries()].map(([locationId, row]) => ({
    locationId,
    equipmentSlugs: [...new Set(row.equipmentSlugs)].sort(),
    capabilitySlugs: [...new Set(row.capabilitySlugs)].sort(),
    openTrainingAvailable: row.capabilitySlugs.includes("open-training"),
  })).sort((a, b) => a.locationId.localeCompare(b.locationId));
}

export function plusDays(timestamp: string, days: number) {
  const value = new Date(timestamp);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

export function buildCandidateGraph(artifact: PocReviewArtifact) {
  const claims = confirmedClaims(artifact);
  const equipment = claims.filter((claim) => claim.targetType === "equipment").map((claim) => ({
    locationId: claim.locationId,
    locationSlug: claim.locationSlug,
    hgyId: claim.hgyId,
    equipmentSlug: claim.targetSlug,
    availabilityState: "available",
    accessMode: "unknown",
    reservationRequirement: "unknown",
    verificationStatus: "confirmed",
    lastConfirmedAt: claim.source.observedAt,
    staleAt: plusDays(claim.source.observedAt, 180),
    sourceUrl: claim.source.url,
    evidenceHash: claim.evidenceHash,
  }));
  const capabilities = claims.filter((claim) => claim.targetType === "capability").map((claim) => ({
    locationId: claim.locationId,
    locationSlug: claim.locationSlug,
    hgyId: claim.hgyId,
    capabilitySlug: claim.targetSlug,
    availabilityState: "available",
    accessMode: claim.targetSlug === "open-training" ? "open_training" : "unknown",
    reservationRequirement: "unknown",
    verificationStatus: "confirmed",
    lastConfirmedAt: claim.source.observedAt,
    staleAt: plusDays(claim.source.observedAt, 90),
    sourceUrl: claim.source.url,
    evidenceHash: claim.evidenceHash,
  }));
  return {
    trainingSources: uniqueCandidateSources(artifact),
    equipment,
    capabilities,
    evidence: claims.map((claim) => ({
      hgyId: claim.hgyId,
      locationId: claim.locationId,
      targetType: claim.targetType,
      targetSlug: claim.targetSlug,
      assertion: "supports",
      reviewStatus: "accepted",
      observedAt: claim.source.observedAt,
      sourceUrl: claim.source.url,
      evidenceText: claim.source.excerpt,
      contentHash: claim.evidenceHash,
    })),
  };
}
