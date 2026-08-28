import { createHash } from "node:crypto";
import {
  HYROX_SOURCE_NAMESPACE,
  type GymMapLocationRecord,
  type OfficialClubRecord,
  type ResolutionRecord,
} from "./hyrox-official-clubs";

export const HYROX_DISCIPLINE_SLUG = "hyrox" as const;
export const HYROX_AFFILIATION_TYPE = "training_club" as const;
export const HYROX_AWARDING_ORGANIZATION = "HYROX" as const;

export type ResolutionArtifact = {
  observed_at: string;
  records: ResolutionRecord[];
};

export type DiscoveryArtifact = {
  observed_at: string;
  records: OfficialClubRecord[];
};

export type LocationInventoryArtifact = {
  observed_at: string;
  records: GymMapLocationRecord[];
};

export type CandidateEvidence = {
  evidence_ref: string;
  training_source_ref: string;
  target_type: "training_affiliation" | "location_training_discipline";
  target_ref: string;
  assertion: "supports";
  review_status: "accepted";
  evidence_text: null;
  structured_evidence: {
    finder_listing: true;
    official_external_id: string;
    official_name: string;
  };
  observed_at: string;
  reviewed_at: string;
  content_hash: string;
};

export type CandidateRecord = {
  official_name: string;
  official_external_id: string;
  matched_location: {
    id: string;
    slug: string;
    name: string;
    is_active: true;
  };
  match_method: string;
  official_source_url: string;
  observed_at: string;
  stale_at: string;
  conflict_status: "clear";
  training_source: {
    source_ref: string;
    location_id: string;
    url: string;
    canonical_url: string;
    source_kind: "finder";
    publisher_authority: "governing_body";
    availability_state: "available";
    last_checked_at: string;
    unavailable_since: null;
    review_required: false;
    content_hash: string;
    metadata_json: {
      namespace: typeof HYROX_SOURCE_NAMESPACE;
      external_identifier: string;
      official_name: string;
    };
  };
  external_identifier: {
    location_id: string;
    namespace: typeof HYROX_SOURCE_NAMESPACE;
    external_identifier: string;
    training_source_ref: string;
    verification_status: "confirmed";
    verified_at: string;
    metadata_json: {
      official_name: string;
    };
  };
  location_training_discipline: {
    target_ref: string;
    location_id: string;
    discipline_slug: typeof HYROX_DISCIPLINE_SLUG;
    support_state: "available";
    verification_status: "confirmed";
    last_confirmed_at: string;
    stale_at: string;
    notes: null;
  };
  training_affiliation: {
    target_ref: string;
    location_id: string;
    discipline_slug: typeof HYROX_DISCIPLINE_SLUG;
    affiliation_type: typeof HYROX_AFFILIATION_TYPE;
    awarding_organization: typeof HYROX_AWARDING_ORGANIZATION;
    external_identifier: string;
    affiliation_state: "active";
    verification_status: "confirmed";
    valid_from: null;
    valid_to: null;
    last_confirmed_at: string;
    stale_at: string;
    notes: null;
  };
  evidence: [CandidateEvidence, CandidateEvidence];
};

export type ReviewedImportCandidate = {
  schema_version: 2;
  phase: "H2-2";
  preview_only: true;
  no_database_writes: true;
  generated_from: {
    resolution: "official-training-club-resolution.json";
    discovery: "official-training-clubs-japan.json";
    inventory: "gymmap-location-inventory.json";
  };
  observed_at: string;
  reviewed_at: string;
  stale_policy_days: 90;
  validation: {
    confirmed_input_count: number;
    included_count: number;
    excluded: Array<{ official_external_id: string | null; official_name: string; reasons: string[] }>;
    duplicate_external_ids: string[];
    duplicate_location_ids: string[];
  };
  counts: {
    training_sources: number;
    location_external_identifiers: number;
    location_training_disciplines: number;
    training_affiliations: number;
    training_evidence: number;
  };
  import_policy: {
    serialization: string;
    source_reuse: string;
    freshness: string;
    identity_conflict: string;
    affiliation_conflict: string;
    evidence_dedupe: string;
  };
  records: CandidateRecord[];
};

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function deterministicHash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function addUtcDays(iso: string, days: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid ISO timestamp: ${iso}`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function duplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

export function buildReviewedImportCandidate(
  resolution: ResolutionArtifact,
  discovery: DiscoveryArtifact,
  inventory: LocationInventoryArtifact,
): ReviewedImportCandidate {
  if (resolution.observed_at !== discovery.observed_at) {
    throw new Error("Resolution and discovery observed_at values differ");
  }

  const confirmed = resolution.records.filter((record) => record.resolution_status === "CONFIRMED_MATCH");
  const officialById = new Map(
    discovery.records.filter((record) => record.external_id).map((record) => [record.external_id as string, record]),
  );
  const locationById = new Map(inventory.records.map((record) => [record.id, record]));
  const duplicateExternalIds = duplicateValues(
    confirmed.flatMap((record) => record.official_external_id ? [record.official_external_id] : []),
  );
  const duplicateLocationIds = duplicateValues(
    confirmed.flatMap((record) => record.gymmap_location_id ? [record.gymmap_location_id] : []),
  );
  const excluded: ReviewedImportCandidate["validation"]["excluded"] = [];
  const records: CandidateRecord[] = [];

  for (const match of [...confirmed].sort((left, right) =>
    (left.official_external_id ?? "").localeCompare(right.official_external_id ?? ""))) {
    const reasons: string[] = [];
    const externalId = match.official_external_id;
    if (!externalId || !/^HGY_[A-Za-z0-9]+$/.test(externalId)) reasons.push("missing_or_invalid_external_id");
    if (match.source_namespace !== HYROX_SOURCE_NAMESPACE) reasons.push("invalid_source_namespace");
    if (!match.official_source_url) reasons.push("missing_official_source_url");
    if (match.manual_review_required || match.conflicts.length > 0) reasons.push("match_no_longer_unambiguous");
    if (externalId && duplicateExternalIds.includes(externalId)) reasons.push("duplicate_external_id");
    if (match.gymmap_location_id && duplicateLocationIds.includes(match.gymmap_location_id)) reasons.push("duplicate_target_location");

    const official = externalId ? officialById.get(externalId) : undefined;
    const location = match.gymmap_location_id ? locationById.get(match.gymmap_location_id) : undefined;
    if (!official) reasons.push("official_source_record_missing");
    if (!location) reasons.push("matched_location_missing");
    else if (!location.is_active) reasons.push("matched_location_inactive");
    if (official && official.official_source_url !== match.official_source_url) reasons.push("official_source_url_changed");

    if (reasons.length || !externalId || !official || !location || !location.is_active) {
      excluded.push({ official_external_id: externalId, official_name: match.official_name, reasons });
      continue;
    }

    const sourceRef = `hyrox-finder:${externalId}`;
    const disciplineTargetRef = `${location.id}:hyrox`;
    const affiliationTargetRef = `${location.id}:hyrox:training_club:HYROX`;
    const staleAt = addUtcDays(discovery.observed_at, 90);
    const sourceMetadata = {
      namespace: HYROX_SOURCE_NAMESPACE,
      external_identifier: externalId,
      official_name: official.official_name,
    };
    const sourceHash = deterministicHash({
      url: official.official_source_url,
      source_kind: "finder",
      publisher_authority: "governing_body",
      availability_state: "available",
      observed_at: discovery.observed_at,
      metadata_json: sourceMetadata,
    });
    const evidenceFor = (
      targetType: CandidateEvidence["target_type"],
      targetRef: string,
    ): CandidateEvidence => {
      const structured = {
        finder_listing: true as const,
        official_external_id: externalId,
        official_name: official.official_name,
      };
      const evidenceHash = deterministicHash({
        source_ref: sourceRef,
        target_type: targetType,
        target_ref: targetRef,
        assertion: "supports",
        observed_at: discovery.observed_at,
        structured_evidence: structured,
      });
      return {
        evidence_ref: `sha256:${evidenceHash}`,
        training_source_ref: sourceRef,
        target_type: targetType,
        target_ref: targetRef,
        assertion: "supports",
        review_status: "accepted",
        evidence_text: null,
        structured_evidence: structured,
        observed_at: discovery.observed_at,
        reviewed_at: discovery.observed_at,
        content_hash: evidenceHash,
      };
    };

    records.push({
      official_name: official.official_name,
      official_external_id: externalId,
      matched_location: { id: location.id, slug: location.slug, name: location.name, is_active: true },
      match_method: match.match_method,
      official_source_url: official.official_source_url,
      observed_at: discovery.observed_at,
      stale_at: staleAt,
      conflict_status: "clear",
      training_source: {
        source_ref: sourceRef,
        location_id: location.id,
        url: official.official_source_url,
        canonical_url: official.official_source_url,
        source_kind: "finder",
        publisher_authority: "governing_body",
        availability_state: "available",
        last_checked_at: discovery.observed_at,
        unavailable_since: null,
        review_required: false,
        content_hash: sourceHash,
        metadata_json: sourceMetadata,
      },
      external_identifier: {
        location_id: location.id,
        namespace: HYROX_SOURCE_NAMESPACE,
        external_identifier: externalId,
        training_source_ref: sourceRef,
        verification_status: "confirmed",
        verified_at: discovery.observed_at,
        metadata_json: { official_name: official.official_name },
      },
      location_training_discipline: {
        target_ref: disciplineTargetRef,
        location_id: location.id,
        discipline_slug: HYROX_DISCIPLINE_SLUG,
        support_state: "available",
        verification_status: "confirmed",
        last_confirmed_at: discovery.observed_at,
        stale_at: staleAt,
        notes: null,
      },
      training_affiliation: {
        target_ref: affiliationTargetRef,
        location_id: location.id,
        discipline_slug: HYROX_DISCIPLINE_SLUG,
        affiliation_type: HYROX_AFFILIATION_TYPE,
        awarding_organization: HYROX_AWARDING_ORGANIZATION,
        external_identifier: externalId,
        affiliation_state: "active",
        verification_status: "confirmed",
        valid_from: null,
        valid_to: null,
        last_confirmed_at: discovery.observed_at,
        stale_at: staleAt,
        notes: null,
      },
      evidence: [
        evidenceFor("training_affiliation", affiliationTargetRef),
        evidenceFor("location_training_discipline", disciplineTargetRef),
      ],
    });
  }

  return {
    schema_version: 2,
    phase: "H2-2",
    preview_only: true,
    no_database_writes: true,
    generated_from: {
      resolution: "official-training-club-resolution.json",
      discovery: "official-training-clubs-japan.json",
      inventory: "gymmap-location-inventory.json",
    },
    observed_at: discovery.observed_at,
    reviewed_at: discovery.observed_at,
    stale_policy_days: 90,
    validation: {
      confirmed_input_count: confirmed.length,
      included_count: records.length,
      excluded,
      duplicate_external_ids: duplicateExternalIds,
      duplicate_location_ids: duplicateLocationIds,
    },
    counts: {
      training_sources: records.length,
      location_external_identifiers: records.length,
      location_training_disciplines: records.length,
      training_affiliations: records.length,
      training_evidence: records.length * 2,
    },
    import_policy: {
      serialization: "Acquire a transaction-scoped advisory lock before conflict checks and writes.",
      source_reuse: "Reuse one governing-body finder source by canonical_url; block duplicates or incompatible identity.",
      freshness: "Update confirmation fields only when incoming observed_at is newer; older observations never regress state.",
      identity_conflict: "Block when namespace/external_identifier belongs to another location.",
      affiliation_conflict: "Block external-ID or canonical affiliation conflicts; never overwrite a different authority identity.",
      evidence_dedupe: "Insert only when the deterministic SHA-256 content_hash does not already exist for the resolved source and target.",
    },
    records,
  };
}

export function assertCompleteH2Candidate(candidate: ReviewedImportCandidate): void {
  const expected = { training_sources: 6, location_external_identifiers: 6, location_training_disciplines: 6, training_affiliations: 6, training_evidence: 12 };
  if (candidate.validation.confirmed_input_count !== 6 || candidate.validation.included_count !== 6) {
    throw new Error(`H2-2 gate requires 6 validated records; got ${candidate.validation.included_count}`);
  }
  if (candidate.validation.excluded.length) throw new Error("H2-2 candidate contains excluded records");
  for (const [key, value] of Object.entries(expected)) {
    if (candidate.counts[key as keyof typeof expected] !== value) throw new Error(`Unexpected ${key} count`);
  }
}
