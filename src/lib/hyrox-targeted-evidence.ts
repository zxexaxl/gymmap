import { createHash } from "node:crypto";
import type { HyroxMonitorBaseline } from "./hyrox-monitor";
import type { PublishedEnrichmentClaim } from "./hyrox-enrichment-monitor";

export const H3_6_EQUIPMENT_SLUGS = [
  "ski-erg", "row-erg", "weighted-sled", "wall-ball-target", "farmers-carry-implements",
  "sandbag", "functional-training-lane", "treadmill", "running-track",
] as const;
export const H3_6_CAPABILITY_SLUGS = [
  "open-training", "discipline-coaching", "competition-simulation", "sled-push-pull-space", "outdoor-running-access",
] as const;

export type H36EquipmentSlug = (typeof H3_6_EQUIPMENT_SLUGS)[number];
export type H36CapabilitySlug = (typeof H3_6_CAPABILITY_SLUGS)[number];
export type H36TargetSlug = H36EquipmentSlug | H36CapabilitySlug;
export type H36ClaimKind = "equipment" | "capability";
export type H36EvidenceQuality = "Q1" | "Q2" | "Q3" | "Q4" | "Q5";
export type H36ClaimClassification = "CONFIRMED_CANDIDATE" | "REVIEW_REQUIRED" | "OBSERVED_NOT_CANDIDATE" | "OBSERVED_DEFERRED" | "NO_EVIDENCE_FOUND";
export type H36FacilityStatus = "CONFIRMED_ENRICHMENT" | "REVIEW_ONLY" | "NO_USEFUL_EVIDENCE" | "SOURCE_BLOCKED";
export type H36AutomationClass = "AUTOMATABLE" | "SEMI_AUTOMATED" | "MANUAL_HEAVY";

export type H33SampleLocation = { locationId: string; hgyId: string };
export type H36CohortLocation = {
  locationId: string;
  locationSlug: string;
  hgyId: string;
  locationName: string;
  brandName: string;
  prefecture: string;
  officialUrl: string;
  sourceHost: string;
  cohortType: "repeatable-brand-site" | "stable-facility-site";
  selectionTier: 1 | 2;
  selectionReason: string;
  expectedAdapter: "orangetheory" | "golds-gym" | "gym-field" | "ufc-gym" | "generic";
  previousH3_3Sample: false;
};

export type H36CohortArtifact = {
  schemaVersion: 1;
  selectedAt: string;
  selectionContract: { maxFacilities: 25; evidenceBlind: true; priorityBrands: string[] };
  authority: { originMain: string; h3_3Commit: string; h3_3SampleSha256: string; currentOfficial: 82; h3_3Sample: 15; remaining: 67; existingEnrichedFacilities: 9 };
  counts: { facilities: number; brands: number; hosts: number };
  locations: H36CohortLocation[];
  cohortHash: string;
};

export type H36Source = {
  sourceKey: string;
  url: string;
  canonicalUrl: string;
  title: string;
  quality: H36EvidenceQuality;
  facilitySpecific: boolean;
  publisherAuthority: "facility_official" | "brand_official" | "official_secondary";
  observedAt: string;
};

export type H36ClaimDecision = {
  kind: H36ClaimKind;
  slug: H36TargetSlug;
  classification: H36ClaimClassification;
  sourceKey: string | null;
  excerpt: string | null;
  structuredFact: string | null;
  reason: string;
  proposedFreshnessDays: 30 | 90 | 180 | null;
  supportFingerprint: string[];
};

export type H36FacilityReview = {
  locationId: string;
  locationSlug: string;
  hgyId: string;
  locationName: string;
  brandName: string;
  prefecture: string;
  status: H36FacilityStatus;
  automationClass: H36AutomationClass;
  pagesInspected: number;
  reviewActions: number;
  sources: H36Source[];
  decisions: H36ClaimDecision[];
  notes: string;
};

export type H36ReviewArtifact = {
  schemaVersion: 1;
  cohortHash: string;
  observedAt: string;
  reviewedAt: string;
  productionWrite: false;
  facilities: H36FacilityReview[];
  artifactHash: string;
};

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "cohortHash" && key !== "artifactHash" && key !== "metrics").sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

export function h36Hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function host(url: string) { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); }

const priority: Record<string, { tier: 1 | 2; adapter: H36CohortLocation["expectedAdapter"]; reason: string }> = {
  "Orangetheory Fitness": { tier: 1, adapter: "orangetheory", reason: "Repeated branch-specific first-party pages plus an existing reviewed HYROX brand source." },
  "Gold's Gym": { tier: 1, adapter: "golds-gym", reason: "Repeated branch-specific first-party shop pages with stable text structure." },
  "ジムフィールド": { tier: 1, adapter: "gym-field", reason: "Repeated first-party studio structure and an existing reviewed HYROX source." },
  "UFC GYM": { tier: 1, adapter: "ufc-gym", reason: "Existing reviewed UFC GYM source pattern with a separate branch-specific first-party site." },
};

export function selectH36Cohort(args: {
  baselines: HyroxMonitorBaseline[];
  h3Sample: H33SampleLocation[];
  publishedClaims: PublishedEnrichmentClaim[];
  selectedAt: string;
  originMain: string;
  h3SampleSha256: string;
}): H36CohortArtifact {
  if (args.baselines.length !== 82 || new Set(args.baselines.map((row) => row.hgyId)).size !== 82) throw new Error("Current Official HYROX authority must contain exactly 82 unique HGY identities");
  if (args.h3Sample.length !== 15 || new Set(args.h3Sample.map((row) => row.locationId)).size !== 15) throw new Error("H3-3 sample authority must contain exactly 15 locations");
  const sampleIds = new Set(args.h3Sample.map((row) => row.locationId));
  const remaining = args.baselines.filter((row) => !sampleIds.has(row.locationId));
  if (remaining.length !== 67) throw new Error(`Remaining cohort mismatch: ${remaining.length}`);
  const enrichedIds = new Set(args.publishedClaims.map((claim) => claim.locationId));
  if (enrichedIds.size !== 9 || [...enrichedIds].some((id) => !sampleIds.has(id))) throw new Error("Existing H3-5 enriched locations must be the nine-location subset of H3-3 sample");
  const locations = remaining.filter((row) => priority[row.brandName]).map((row): H36CohortLocation => {
    if (!row.locationSlug || !row.officialUrl || !row.prefecture) throw new Error(`Incomplete target identity: ${row.hgyId}`);
    const policy = priority[row.brandName];
    return {
      locationId: row.locationId, locationSlug: row.locationSlug, hgyId: row.hgyId, locationName: row.locationName,
      brandName: row.brandName, prefecture: row.prefecture, officialUrl: row.officialUrl, sourceHost: host(row.officialUrl),
      cohortType: "repeatable-brand-site", selectionTier: policy.tier, selectionReason: policy.reason,
      expectedAdapter: policy.adapter, previousH3_3Sample: false,
    };
  }).sort((a, b) => a.selectionTier - b.selectionTier || a.brandName.localeCompare(b.brandName) || a.hgyId.localeCompare(b.hgyId));
  if (locations.length === 0 || locations.length > 25) throw new Error(`Target cohort size outside bounded contract: ${locations.length}`);
  if (locations.some((row) => enrichedIds.has(row.locationId) || sampleIds.has(row.locationId))) throw new Error("Target cohort overlaps sample/current enrichment");
  const withoutHash = {
    schemaVersion: 1 as const, selectedAt: args.selectedAt,
    selectionContract: { maxFacilities: 25 as const, evidenceBlind: true as const, priorityBrands: Object.keys(priority).sort() },
    authority: { originMain: args.originMain, h3_3Commit: "7a90c9db0bc43039d4c02bdfe377fab5bfb34e12", h3_3SampleSha256: args.h3SampleSha256,
      currentOfficial: 82 as const, h3_3Sample: 15 as const, remaining: 67 as const, existingEnrichedFacilities: 9 as const },
    counts: { facilities: locations.length, brands: new Set(locations.map((row) => row.brandName)).size, hosts: new Set(locations.map((row) => row.sourceHost)).size },
    locations,
  };
  return { ...withoutHash, cohortHash: h36Hash(withoutHash) };
}

export function validateH36Cohort(value: H36CohortArtifact) {
  if (value.locations.length !== value.counts.facilities || value.locations.length > 25 || value.authority.remaining !== 67 || value.authority.h3_3Sample !== 15) throw new Error("Invalid H3-6 cohort counts");
  if (h36Hash(value) !== value.cohortHash) throw new Error("H3-6 cohort hash mismatch");
  if (new Set(value.locations.map((row) => row.locationId)).size !== value.locations.length || value.locations.some((row) => row.previousH3_3Sample)) throw new Error("H3-6 cohort identity mismatch");
  return value;
}

export function validateH36Review(cohort: H36CohortArtifact, review: H36ReviewArtifact) {
  validateH36Cohort(cohort);
  if (review.cohortHash !== cohort.cohortHash || review.facilities.length !== cohort.locations.length || review.productionWrite !== false) throw new Error("H3-6 review/cohort authority mismatch");
  if (h36Hash(review) !== review.artifactHash) throw new Error("H3-6 review artifact hash mismatch");
  const targets = new Set(cohort.locations.map((row) => row.locationId));
  if (new Set(review.facilities.map((row) => row.locationId)).size !== targets.size || review.facilities.some((row) => !targets.has(row.locationId))) throw new Error("H3-6 review target mismatch");
  const equipment = new Set<string>(H3_6_EQUIPMENT_SLUGS); const capabilities = new Set<string>(H3_6_CAPABILITY_SLUGS);
  for (const facility of review.facilities) {
    if (facility.pagesInspected > 3 || facility.pagesInspected < 0) throw new Error(`${facility.hgyId}: page budget exceeded`);
    const sources = new Map(facility.sources.map((source) => [source.sourceKey, source]));
    const logical = new Set<string>();
    for (const decision of facility.decisions) {
      const allowed = decision.kind === "equipment" ? equipment : capabilities;
      if (!allowed.has(decision.slug)) throw new Error(`${facility.hgyId}: unsupported taxonomy ${decision.slug}`);
      const key = `${decision.kind}:${decision.slug}`; if (logical.has(key)) throw new Error(`${facility.hgyId}: duplicate claim decision ${key}`); logical.add(key);
      if (decision.classification === "CONFIRMED_CANDIDATE") {
        const source = decision.sourceKey ? sources.get(decision.sourceKey) : null;
        if (!source || !["Q1", "Q2"].includes(source.quality) || !source.facilitySpecific || !decision.excerpt || decision.supportFingerprint.length === 0) throw new Error(`${facility.hgyId}: confirmed claim lacks explicit Q1/Q2 reviewed support`);
        if (["running-track", "outdoor-running-access"].includes(decision.slug)) throw new Error(`${facility.hgyId}: deferred taxonomy cannot be confirmed`);
      }
      if (decision.classification === "NO_EVIDENCE_FOUND" && decision.sourceKey !== null) throw new Error(`${facility.hgyId}: no-evidence decision cannot assert a source`);
    }
    const confirmed = facility.decisions.some((row) => row.classification === "CONFIRMED_CANDIDATE");
    const reviewOnly = facility.decisions.some((row) => row.classification === "REVIEW_REQUIRED");
    const expectedStatus: H36FacilityStatus = confirmed ? "CONFIRMED_ENRICHMENT" : reviewOnly ? "REVIEW_ONLY" : facility.status === "SOURCE_BLOCKED" ? "SOURCE_BLOCKED" : "NO_USEFUL_EVIDENCE";
    if (facility.status !== expectedStatus) throw new Error(`${facility.hgyId}: facility status mismatch`);
  }
  return review;
}

export function h36ConfirmedDecisions(review: H36ReviewArtifact) {
  return review.facilities.flatMap((facility) => facility.decisions.filter((decision) => decision.classification === "CONFIRMED_CANDIDATE")
    .map((decision) => ({ facility, decision, source: facility.sources.find((source) => source.sourceKey === decision.sourceKey)! })))
    .sort((a, b) => a.facility.hgyId.localeCompare(b.facility.hgyId) || a.decision.kind.localeCompare(b.decision.kind) || a.decision.slug.localeCompare(b.decision.slug));
}

export function classifyH36EvidenceSignal(input: {
  quality: H36EvidenceQuality;
  facilitySpecific: boolean;
  explicitPositive: boolean;
  semanticMatch: boolean;
  deferred?: boolean;
  capabilityRequirementMet?: boolean;
}): H36ClaimClassification {
  if (!input.explicitPositive) return "NO_EVIDENCE_FOUND";
  if (input.deferred) return "OBSERVED_DEFERRED";
  if (!input.semanticMatch) return "OBSERVED_NOT_CANDIDATE";
  if (input.quality === "Q4" || input.quality === "Q5") return "OBSERVED_NOT_CANDIDATE";
  if (input.capabilityRequirementMet === false) return "REVIEW_REQUIRED";
  if (!input.facilitySpecific || input.quality === "Q3") return "REVIEW_REQUIRED";
  return "CONFIRMED_CANDIDATE";
}
