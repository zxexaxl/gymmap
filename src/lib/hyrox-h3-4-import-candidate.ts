import { createHash } from "node:crypto";
import {
  HYROX_CAPABILITY_SLUGS,
  HYROX_EQUIPMENT_SLUGS,
  expandReviewedClaims,
  plusDays,
  type ExpandedClaim,
  type PocReviewArtifact,
} from "./hyrox-equipment-evidence";

export const H3_3_COMMIT = "7a90c9db0bc43039d4c02bdfe377fab5bfb34e12";
export const H3_3_SAMPLE_SHA256 = "d58b83b254e32a564443bbae46d832e1d5a74ae56f6e24dcf3a2ac854733e9ce";
export const H3_4_LOCK_KEY = "gymmap:hyrox:h3-4:equipment-evidence-import";

type RevalidationSource = {
  source_ref: string;
  url: string;
  final_url: string;
  http_status: number;
  authority_match: boolean;
  content_basis_present: boolean;
  marker_groups: string[][];
};

export type H34SourceRevalidation = {
  schema_version: number;
  observed_at: string;
  method: string;
  source_drift_count: number;
  sources: RevalidationSource[];
};

export type H34ProductionPreflight = {
  schema_version: number;
  observed_at: string;
  read_only: boolean;
  authority: { origin_main: string; h3_3_commit: string; project_ref: string };
  counts: {
    published_hyrox: number;
    official_hyrox: number;
    training_sources: number;
    training_evidence: number;
    location_equipment: number;
    location_training_capabilities: number;
    program_training_disciplines_hyrox: number;
  };
  collisions: Record<string, number>;
  taxonomy: { equipment: string[]; capabilities: string[] };
  sample_locations: Array<{
    id: string;
    slug: string;
    name: string;
    brand_id: string;
    brand_name: string;
    prefecture: string;
    city: string;
    address_line: string;
    latitude: number;
    longitude: number;
    is_active: boolean;
    official_url: string;
    hgy_id: string;
    official: boolean;
    discipline_last_confirmed_at: string;
  }>;
  sample_brands: Array<{ id: string; name: string; slug: string }>;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function h34Hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function sourceRef(claim: ExpandedClaim) {
  return `source:${claim.hgyId}:${claim.source.ref}`;
}

function targetRef(claim: ExpandedClaim) {
  return `${claim.targetType}:${claim.locationId}:${claim.targetSlug}`;
}

function capabilityHorizon(slug: string) {
  return slug === "competition-simulation" ? 30 : 90;
}

export function buildH34Candidate(input: {
  review: PocReviewArtifact;
  revalidation: H34SourceRevalidation;
  preflight: H34ProductionPreflight;
  sampleSha256: string;
}) {
  const { review, revalidation, preflight } = input;
  if (input.sampleSha256 !== H3_3_SAMPLE_SHA256 || review.sampleSha256 !== H3_3_SAMPLE_SHA256) {
    throw new Error("H3-3 sample hash authority mismatch");
  }
  if (preflight.authority.h3_3_commit !== H3_3_COMMIT) throw new Error("H3-3 commit authority mismatch");
  if (!preflight.read_only || preflight.counts.published_hyrox !== 82 || preflight.counts.official_hyrox !== 82) {
    throw new Error("Production publication authority drift");
  }
  if (preflight.counts.location_equipment !== 0 || preflight.counts.location_training_capabilities !== 0) {
    throw new Error("Production equipment/capability first-import collision");
  }
  if (Object.values(preflight.collisions).some((count) => count !== 0)) throw new Error("Production collision preflight failed");
  if (revalidation.source_drift_count !== 0) throw new Error("Equipment source authority drift");
  if (!Number.isFinite(Date.parse(revalidation.observed_at))) throw new Error("Invalid revalidation observation timestamp");

  const allClaims = expandReviewedClaims(review);
  const confirmed = allClaims.filter((claim) => claim.classification === "CONFIRMED_CANDIDATE");
  const excluded = allClaims.filter((claim) => claim.classification !== "CONFIRMED_CANDIDATE");
  const equipmentClaims = confirmed.filter((claim) => claim.targetType === "equipment");
  const capabilityClaims = confirmed.filter((claim) => claim.targetType === "capability");
  if (equipmentClaims.length !== 36 || capabilityClaims.length !== 16 || confirmed.length !== 52) {
    throw new Error("H3-3 confirmed claim inventory mismatch");
  }
  if (excluded.length !== 14 || excluded.some((claim) => claim.classification !== "REVIEW_REQUIRED")) {
    throw new Error("H3-3 excluded claim inventory mismatch");
  }

  const sampleLocations = new Set(review.facilities.map((facility) => facility.locationId));
  const enrichedLocations = new Set(confirmed.map((claim) => claim.locationId));
  if (review.facilities.length !== 15 || enrichedLocations.size !== 9) throw new Error("H3-3 facility scope mismatch");
  if (preflight.sample_locations.length !== 15 || preflight.sample_locations.some((location) =>
    !sampleLocations.has(location.id) || !location.is_active || !location.official)) {
    throw new Error("Sample production identity drift");
  }
  if (preflight.taxonomy.equipment.slice().sort().join("|") !== HYROX_EQUIPMENT_SLUGS.slice().sort().join("|")) {
    throw new Error("Equipment taxonomy drift");
  }
  if (preflight.taxonomy.capabilities.slice().sort().join("|") !== HYROX_CAPABILITY_SLUGS.slice().sort().join("|")) {
    throw new Error("Capability taxonomy drift");
  }

  const revalidationByRef = new Map(revalidation.sources.map((source) => [source.source_ref, source]));
  const sourceClaims = new Map<string, ExpandedClaim[]>();
  for (const claim of confirmed) {
    const rows = sourceClaims.get(claim.source.ref) ?? [];
    rows.push(claim);
    sourceClaims.set(claim.source.ref, rows);
  }
  if (sourceClaims.size !== 10 || revalidationByRef.size !== 10) throw new Error("Confirmed source inventory mismatch");

  const sources = [...sourceClaims.entries()].map(([ref, claims]) => {
    const first = claims[0];
    const checked = revalidationByRef.get(ref);
    if (!checked || checked.url !== first.source.url || checked.http_status !== 200 ||
      !checked.authority_match || !checked.content_basis_present) {
      throw new Error(`Source revalidation failed: ${ref}`);
    }
    if (first.source.quality !== "Q1" && first.source.quality !== "Q2") {
      throw new Error(`Non-importable reviewed source quality: ${ref}`);
    }
    const naturalRef = sourceRef(first);
    return {
      source_ref: naturalRef,
      h3_3_source_ref: ref,
      location_id: first.locationId,
      hgy_id: first.hgyId,
      url: first.source.url,
      canonical_url: checked.final_url,
      source_kind: first.source.sourceKind,
      publisher_authority: first.source.publisherAuthority,
      availability_state: "available",
      last_checked_at: revalidation.observed_at,
      review_required: false,
      content_hash: h34Hash({
        canonical_url: checked.final_url,
        h3_3_source_ref: ref,
        location_id: first.locationId,
        targets: claims.map(targetRef).sort(),
      }),
      metadata_json: { evidence_quality: first.source.quality, h3_3_commit: H3_3_COMMIT, h3_3_source_ref: ref },
    };
  }).sort((left, right) => left.source_ref.localeCompare(right.source_ref));

  const equipment = equipmentClaims.map((claim) => ({
    equipment_ref: targetRef(claim),
    location_id: claim.locationId,
    location_slug: claim.locationSlug,
    hgy_id: claim.hgyId,
    equipment_slug: claim.targetSlug,
    availability_state: "available",
    quantity: null,
    access_mode: "unknown",
    reservation_requirement: "unknown",
    verification_status: "confirmed",
    last_confirmed_at: revalidation.observed_at,
    stale_at: plusDays(revalidation.observed_at, 180),
    source_ref: sourceRef(claim),
  })).sort((left, right) => left.equipment_ref.localeCompare(right.equipment_ref));

  const capabilities = capabilityClaims.map((claim) => {
    const horizonDays = capabilityHorizon(claim.targetSlug);
    return {
      capability_ref: targetRef(claim),
      location_id: claim.locationId,
      location_slug: claim.locationSlug,
      hgy_id: claim.hgyId,
      discipline_slug: "hyrox",
      capability_slug: claim.targetSlug,
      availability_state: "available",
      access_mode: claim.targetSlug === "open-training" ? "open_training" : "unknown",
      reservation_requirement: "unknown",
      verification_status: "confirmed",
      last_confirmed_at: revalidation.observed_at,
      stale_at: plusDays(revalidation.observed_at, horizonDays),
      freshness_horizon_days: horizonDays,
      source_ref: sourceRef(claim),
      semantic_basis: claim.targetSlug === "competition-simulation"
        ? "Reviewed first-party source describes repeatable mock-race or race-equivalent training, not a historical one-off event."
        : null,
    };
  }).sort((left, right) => left.capability_ref.localeCompare(right.capability_ref));

  const equipmentByRef = new Map(equipment.map((claim) => [claim.equipment_ref, claim]));
  const capabilityByRef = new Map(capabilities.map((claim) => [claim.capability_ref, claim]));
  const evidence = confirmed.map((claim) => {
    const ref = targetRef(claim);
    const structured = {
      evidence_quality: claim.source.quality,
      h3_3_source_ref: claim.source.ref,
      target_slug: claim.targetSlug,
    };
    const contentHash = h34Hash({
      assertion: "supports",
      observed_at: revalidation.observed_at,
      source_ref: sourceRef(claim),
      structured_evidence: structured,
      target_ref: ref,
    });
    return {
      evidence_ref: `evidence:${contentHash}`,
      source_ref: sourceRef(claim),
      target_type: claim.targetType === "equipment" ? "location_equipment" : "location_training_capability",
      target_ref: ref,
      assertion: "supports",
      review_status: "accepted",
      evidence_text: claim.source.excerpt,
      structured_evidence: structured,
      observed_at: revalidation.observed_at,
      reviewed_at: revalidation.observed_at,
      content_hash: contentHash,
    };
  }).sort((left, right) => left.evidence_ref.localeCompare(right.evidence_ref));

  if (new Set(evidence.map((row) => row.content_hash)).size !== 52) throw new Error("Evidence hash collision");
  if (evidence.some((row) => row.target_type === "location_equipment" ? !equipmentByRef.has(row.target_ref) : !capabilityByRef.has(row.target_ref))) {
    throw new Error("Evidence target mismatch");
  }

  const equipmentByLocation = new Map<string, string[]>();
  const capabilityByLocation = new Map<string, string[]>();
  for (const claim of equipment) equipmentByLocation.set(claim.location_id, [...(equipmentByLocation.get(claim.location_id) ?? []), claim.equipment_slug]);
  for (const claim of capabilities) capabilityByLocation.set(claim.location_id, [...(capabilityByLocation.get(claim.location_id) ?? []), claim.capability_slug]);
  const publication = [...enrichedLocations].sort().map((locationId) => ({
    location_id: locationId,
    equipment_slugs: (equipmentByLocation.get(locationId) ?? []).sort(),
    capability_slugs: (capabilityByLocation.get(locationId) ?? []).sort(),
    open_training_available: (capabilityByLocation.get(locationId) ?? []).includes("open-training"),
  }));

  const candidateWithoutHash = {
    schema_version: 1,
    preview_only: true,
    authority: {
      origin_main: preflight.authority.origin_main,
      h3_3_commit: H3_3_COMMIT,
      h3_3_sample_sha256: H3_3_SAMPLE_SHA256,
      h3_4_source_observed_at: revalidation.observed_at,
      production_preflight_observed_at: preflight.observed_at,
    },
    counts: {
      sample_facilities: 15,
      enriched_facilities: 9,
      training_sources: sources.length,
      location_equipment: equipment.length,
      location_training_capabilities: capabilities.length,
      training_evidence: evidence.length,
      excluded_review_required: excluded.length,
      negative_claims: 0,
    },
    import_policy: {
      advisory_lock_key: H3_4_LOCK_KEY,
      atomic_transaction: true,
      dependency_order: ["training_sources", "location_equipment", "location_training_capabilities", "training_evidence"],
      first_import_requires_clean_collision_preflight: true,
      exact_rerun_is_idempotent: true,
      semantic_conflict: "BLOCK",
    },
    freshness_policy: {
      physical_equipment_days: 180,
      open_training_days: 90,
      discipline_coaching_days: 90,
      sled_push_pull_space_days: 90,
      competition_simulation_days: 30,
    },
    production_baseline: preflight.counts,
    sources,
    equipment,
    capabilities,
    evidence,
    publication_rehearsal: {
      hyrox_before: 82,
      hyrox_after: 82,
      official_before: 82,
      official_after: 82,
      published_equipment_rows: 36,
      equipment_positive_facilities: 6,
      published_capability_rows: 16,
      capability_positive_facilities: 9,
      enriched_facilities: 9,
      open_training_positive_facilities: 4,
      locations: publication,
      negative_claims: 0,
    },
    consumer_audit: {
      runtime_consumers: ["src/lib/hyrox-discovery.ts"],
      equipment_or_capability_rendering: false,
      partial_enrichment_exposed_in_h3_1_ui: false,
      ui_change_required_before_import: false,
    },
    scale_out_strategy: "GO_TARGETED",
  };

  const candidate = { ...candidateWithoutHash, candidate_hash: h34Hash(candidateWithoutHash) };
  assertH34Candidate(candidate);
  return candidate;
}

export type H34Candidate = ReturnType<typeof buildH34Candidate>;

export function assertH34Candidate(candidate: {
  counts: Record<string, number>;
  sources: Array<{ source_ref: string }>;
  equipment: Array<{ equipment_ref: string; availability_state: string }>;
  capabilities: Array<{ capability_ref: string; availability_state: string; capability_slug: string; freshness_horizon_days: number }>;
  evidence: Array<{ evidence_ref: string; content_hash: string; assertion: string; review_status: string }>;
  publication_rehearsal: { open_training_positive_facilities: number };
}) {
  if (candidate.counts.training_sources !== 10 || candidate.sources.length !== 10) throw new Error("Candidate source count mismatch");
  if (candidate.counts.location_equipment !== 36 || candidate.equipment.length !== 36) throw new Error("Candidate equipment count mismatch");
  if (candidate.counts.location_training_capabilities !== 16 || candidate.capabilities.length !== 16) throw new Error("Candidate capability count mismatch");
  if (candidate.counts.training_evidence !== 52 || candidate.evidence.length !== 52) throw new Error("Candidate evidence count mismatch");
  if (candidate.counts.excluded_review_required !== 14 || candidate.counts.negative_claims !== 0) throw new Error("Excluded claim contract mismatch");
  if (candidate.equipment.some((row) => row.availability_state !== "available") || candidate.capabilities.some((row) => row.availability_state !== "available")) {
    throw new Error("Non-positive candidate claim");
  }
  if (new Set(candidate.sources.map((row) => row.source_ref)).size !== 10 ||
      new Set(candidate.equipment.map((row) => row.equipment_ref)).size !== 36 ||
      new Set(candidate.capabilities.map((row) => row.capability_ref)).size !== 16 ||
      new Set(candidate.evidence.map((row) => row.content_hash)).size !== 52) {
    throw new Error("Candidate natural identity collision");
  }
  if (candidate.evidence.some((row) => row.assertion !== "supports" || row.review_status !== "accepted")) {
    throw new Error("Evidence acceptance contract mismatch");
  }
  const simulations = candidate.capabilities.filter((row) => row.capability_slug === "competition-simulation");
  if (simulations.length !== 2 || simulations.some((row) => row.freshness_horizon_days !== 30)) {
    throw new Error("Competition simulation freshness/semantic contract mismatch");
  }
  if (candidate.publication_rehearsal.open_training_positive_facilities !== 4) throw new Error("Open training publication mismatch");
}
