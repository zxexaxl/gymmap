import { normalizeAddress, normalizeName, normalizePostalCode, normalizeUrl } from "./hyrox-official-clubs";
import { addUtcDays, deterministicHash } from "./hyrox-import-candidate";
import { validJapanCoordinates, type H24ReviewRecord } from "./hyrox-unmatched-review";

export const H2_5_LOCATION_TYPES = [
  "fitness_club", "fitness_spa", "light_gym", "flat", "sopra", "bodymake_gym", "fitness_studio",
] as const;

export type H25ProductionPreflight = {
  observed_at: string;
  counts: Record<string, number> & {
    gym_brands: number;
    gym_locations: number;
    training_sources: number;
    location_external_identifiers_hyrox: number;
    location_training_disciplines: number;
    training_affiliations_hyrox: number;
    training_evidence: number;
  };
  brands: Array<{ id: string; name: string; slug: string; official_url: string | null; description: string | null }>;
  locations: Array<{
    id: string; brand_id: string; name: string; slug: string; postal_code: string | null; prefecture: string | null;
    city: string | null; address_line: string | null; latitude: number | null; longitude: number | null;
    nearest_station: string | null; official_url: string | null; source_url: string | null; location_type: string | null;
    is_active: boolean; last_verified_at: string | null;
  }>;
  hyrox_external_identifiers: Array<{ location_id: string; namespace: string; external_identifier: string }>;
  training_sources: Array<{ location_id: string | null; canonical_url: string | null; source_kind: string; publisher_authority: string }>;
  hyrox_affiliations: Array<{ location_id: string; external_identifier: string | null }>;
};

export type H25SourceRevalidation = {
  observed_at: string;
  input_count: number;
  pass_count: number;
  blocked_count: number;
  records: Array<{
    hgy_external_id: string;
    status: "PASS" | "BLOCKED";
    observed_at: string;
    facility_site: { requested_url: string; final_url: string | null; status: number | null; error: string | null };
    blockers: string[];
  }>;
};

export type H25BrandCandidate = {
  brand_ref: string;
  name: string;
  slug: string;
  official_url: string;
  description: null;
  semantic: "chain" | "single_location_brand";
  location_refs: string[];
  source_authority_urls: string[];
  collision_status: "clear";
  candidate_hash: string;
};

export type H25EvidenceCandidate = {
  evidence_ref: string;
  training_source_ref: string;
  target_type: "training_affiliation" | "location_training_discipline";
  target_ref: string;
  assertion: "supports";
  review_status: "accepted";
  evidence_text: null;
  structured_evidence: { finder_listing: true; official_external_id: string; official_name: string };
  observed_at: string;
  reviewed_at: string;
  content_hash: string;
};

export type H25LocationCandidate = {
  location_ref: string;
  hgy_external_id: string;
  hyrox_official_name: string;
  name: string;
  slug: string;
  brand_ref: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  latitude: number;
  longitude: number;
  nearest_station: null;
  official_url: string;
  source_url: string;
  location_type: typeof H2_5_LOCATION_TYPES[number];
  is_active: true;
  last_verified_at: string;
  coordinate_source: "hyrox-governing-body-finder";
  collision_status: "clear";
  candidate_hash: string;
  training_source: {
    source_ref: string;
    location_ref: string;
    url: string;
    canonical_url: string;
    source_kind: "finder";
    publisher_authority: "governing_body";
    availability_state: "available";
    last_checked_at: string;
    unavailable_since: null;
    review_required: false;
    content_hash: string;
    metadata_json: { namespace: "hyrox-training-club"; external_identifier: string; official_name: string };
  };
  external_identifier: {
    location_ref: string;
    namespace: "hyrox-training-club";
    external_identifier: string;
    training_source_ref: string;
    verification_status: "confirmed";
    verified_at: string;
    metadata_json: { official_name: string };
  };
  location_training_discipline: {
    target_ref: string;
    location_ref: string;
    discipline_slug: "hyrox";
    support_state: "available";
    verification_status: "confirmed";
    last_confirmed_at: string;
    stale_at: string;
    notes: null;
  };
  training_affiliation: {
    target_ref: string;
    location_ref: string;
    discipline_slug: "hyrox";
    affiliation_type: "training_club";
    awarding_organization: "HYROX";
    external_identifier: string;
    affiliation_state: "active";
    verification_status: "confirmed";
    valid_from: null;
    valid_to: null;
    last_confirmed_at: string;
    stale_at: string;
    notes: null;
  };
  evidence: [H25EvidenceCandidate, H25EvidenceCandidate];
};

export type H25Candidate = {
  schema_version: 1;
  phase: "H2-5";
  preview_only: true;
  no_database_writes: true;
  authority: { h2_4_commit: string; production_observed_at: string; source_revalidated_at: string };
  stale_policy_days: 90;
  validation: {
    ready_input_count: 17;
    included_count: 17;
    excluded_counts: Record<string, number>;
    duplicate_hgy_ids: string[];
    duplicate_location_slugs: string[];
    collisions: string[];
  };
  counts: {
    gym_brands: number;
    gym_locations: 17;
    training_sources: 17;
    location_external_identifiers: 17;
    location_training_disciplines: 17;
    training_affiliations: 17;
    training_evidence: 34;
  };
  import_order: string[];
  import_policy: Record<string, string>;
  production_baseline: H25ProductionPreflight["counts"];
  publication_impact: Record<string, string>;
  brands: H25BrandCandidate[];
  locations: H25LocationCandidate[];
  candidate_hash: string;
};

function duplicates(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

function brandOfficialUrl(record: H24ReviewRecord): string {
  const url = new URL(record.canonical_facility_url!);
  return record.brand_resolution === "NEW_BRAND_CANDIDATE" ? `${url.origin}/` : record.canonical_facility_url!;
}

function distanceMeters(left: H24ReviewRecord, right: H25ProductionPreflight["locations"][number]): number | null {
  if (left.latitude === null || left.longitude === null || right.latitude === null || right.longitude === null) return null;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(right.latitude - left.latitude);
  const dLon = rad(right.longitude - left.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(left.latitude)) * Math.cos(rad(right.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function buildH25Candidate(input: {
  review: { records: H24ReviewRecord[] };
  ready: { count: number; records: H24ReviewRecord[] };
  preflight: H25ProductionPreflight;
  revalidation: H25SourceRevalidation;
  h23ExternalIds: string[];
}): H25Candidate {
  const ready = [...input.ready.records].sort((a, b) => a.hgy_external_id.localeCompare(b.hgy_external_id));
  const collisions: string[] = [];
  const duplicateHgy = duplicates(ready.map((record) => record.hgy_external_id));
  const duplicateSlugs = duplicates(ready.map((record) => record.proposed_slug ?? ""));
  const reviewReady = input.review.records.filter((record) => record.final_classification === "NEW_LOCATION_READY");
  if (input.ready.count !== 17 || ready.length !== 17 || reviewReady.length !== 17) collisions.push("READY input must contain exactly 17 records");
  if (ready.some((record) => record.final_classification !== "NEW_LOCATION_READY" || record.manual_review_required)) collisions.push("Review-blocked record entered candidate input");
  if (duplicateHgy.length) collisions.push(`Duplicate HGY IDs: ${duplicateHgy.join(",")}`);
  if (duplicateSlugs.length) collisions.push(`Duplicate location slugs: ${duplicateSlugs.join(",")}`);
  if (ready.some((record) => input.h23ExternalIds.includes(record.hgy_external_id))) collisions.push("H2-3 imported record entered H2-5 input");
  if (input.revalidation.input_count !== 17 || input.revalidation.pass_count !== 17 || input.revalidation.blocked_count !== 0) collisions.push("Source revalidation did not pass all 17 records");
  const revalidationById = new Map(input.revalidation.records.map((record) => [record.hgy_external_id, record]));
  if (ready.some((record) => revalidationById.get(record.hgy_external_id)?.status !== "PASS")) collisions.push("Candidate lacks passing source revalidation");
  if (input.preflight.counts.training_sources !== 6 || input.preflight.counts.location_external_identifiers_hyrox !== 6
      || input.preflight.counts.location_training_disciplines !== 6 || input.preflight.counts.training_affiliations_hyrox !== 6
      || input.preflight.counts.training_evidence !== 12) collisions.push("Production H2-3 baseline is not exact");

  const productionBrandNames = new Map(input.preflight.brands.map((brand) => [normalizeName(brand.name), brand]));
  const productionBrandSlugs = new Map(input.preflight.brands.map((brand) => [brand.slug, brand]));
  const productionLocationSlugs = new Map(input.preflight.locations.map((location) => [location.slug, location]));
  const productionLocationUrls = new Map(input.preflight.locations.filter((location) => location.official_url).map((location) => [normalizeUrl(location.official_url), location]));
  const productionAddresses = new Map(input.preflight.locations.filter((location) => location.address_line).map((location) => [normalizeAddress(location.address_line), location]));
  const productionHgy = new Map(input.preflight.hyrox_external_identifiers.map((identity) => [identity.external_identifier, identity.location_id]));

  for (const record of ready) {
    if (!record.proposed_slug || !record.proposed_brand_slug || !record.proposed_brand_name || !record.canonical_facility_url
        || !record.address || !record.postal_code || !record.prefecture || !record.city || record.latitude === null || record.longitude === null
        || !record.proposed_location_type) collisions.push(`${record.hgy_external_id}: missing canonical location field`);
    if (!validJapanCoordinates(record.latitude, record.longitude)) collisions.push(`${record.hgy_external_id}: invalid coordinates`);
    if (!H2_5_LOCATION_TYPES.includes(record.proposed_location_type as typeof H2_5_LOCATION_TYPES[number])) collisions.push(`${record.hgy_external_id}: invalid location_type`);
    if (productionBrandSlugs.has(record.proposed_brand_slug!)) collisions.push(`${record.hgy_external_id}: production brand slug collision`);
    if (productionBrandNames.has(normalizeName(record.proposed_brand_name))) collisions.push(`${record.hgy_external_id}: production brand name collision`);
    if (productionLocationSlugs.has(record.proposed_slug!)) collisions.push(`${record.hgy_external_id}: production location slug collision`);
    if (productionLocationUrls.has(normalizeUrl(record.canonical_facility_url))) collisions.push(`${record.hgy_external_id}: production official URL collision`);
    if (productionAddresses.has(normalizeAddress(record.address))) collisions.push(`${record.hgy_external_id}: production normalized address collision`);
    if (productionHgy.has(record.hgy_external_id)) collisions.push(`${record.hgy_external_id}: production HGY collision`);
    const near = input.preflight.locations.filter((location) => (distanceMeters(record, location) ?? Infinity) <= 100);
    if (near.length) collisions.push(`${record.hgy_external_id}: production location within 100m (${near.map((location) => location.slug).join(",")})`);
  }
  if (duplicates(ready.map((record) => normalizeAddress(record.address))).length) collisions.push("Candidate normalized address collision");
  if (duplicates(ready.map((record) => normalizeUrl(record.canonical_facility_url))).length) collisions.push("Candidate official URL collision");

  const grouped = new Map<string, H24ReviewRecord[]>();
  for (const record of ready) grouped.set(record.proposed_brand_slug!, [...(grouped.get(record.proposed_brand_slug!) ?? []), record]);
  const brands: H25BrandCandidate[] = [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([slug, records]) => {
    const names = [...new Set(records.map((record) => record.proposed_brand_name!))];
    const resolutions = [...new Set(records.map((record) => record.brand_resolution))];
    if (names.length !== 1 || resolutions.length !== 1) collisions.push(`${slug}: brand grouping is semantically inconsistent`);
    if (records.length > 1 && resolutions[0] !== "NEW_BRAND_CANDIDATE") collisions.push(`${slug}: independent facilities were merged`);
    const semantic = resolutions[0] === "NEW_BRAND_CANDIDATE" ? "chain" as const : "single_location_brand" as const;
    const base = {
      brand_ref: `brand:${slug}`,
      name: names[0],
      slug,
      official_url: brandOfficialUrl(records[0]),
      description: null,
      semantic,
      location_refs: records.map((record) => `location:${record.proposed_slug}`).sort(),
      source_authority_urls: [...new Set(records.map((record) => record.canonical_facility_url!))].sort(),
      collision_status: "clear" as const,
    };
    return { ...base, candidate_hash: deterministicHash(base) };
  });

  const locations: H25LocationCandidate[] = ready.map((record) => {
    const observedAt = input.revalidation.observed_at;
    const staleAt = addUtcDays(observedAt, 90);
    const locationRef = `location:${record.proposed_slug}`;
    const sourceRef = `hyrox-finder:${record.hgy_external_id}`;
    const disciplineRef = `${locationRef}:hyrox`;
    const affiliationRef = `${locationRef}:hyrox:training_club:HYROX`;
    const sourceMetadata = { namespace: "hyrox-training-club" as const, external_identifier: record.hgy_external_id, official_name: record.hyrox_official_name };
    const sourceHash = deterministicHash({ canonical_url: record.hyrox_source_url, observed_at: observedAt, metadata_json: sourceMetadata });
    const evidenceFor = (targetType: H25EvidenceCandidate["target_type"], targetRef: string): H25EvidenceCandidate => {
      const structured = { finder_listing: true as const, official_external_id: record.hgy_external_id, official_name: record.hyrox_official_name };
      const hash = deterministicHash({ source_ref: sourceRef, target_type: targetType, target_ref: targetRef, assertion: "supports", observed_at: observedAt, structured_evidence: structured });
      return { evidence_ref: `sha256:${hash}`, training_source_ref: sourceRef, target_type: targetType, target_ref: targetRef, assertion: "supports", review_status: "accepted", evidence_text: null, structured_evidence: structured, observed_at: observedAt, reviewed_at: observedAt, content_hash: hash };
    };
    const base = {
      location_ref: locationRef,
      hgy_external_id: record.hgy_external_id,
      hyrox_official_name: record.hyrox_official_name,
      name: record.canonical_name,
      slug: record.proposed_slug!,
      brand_ref: `brand:${record.proposed_brand_slug}`,
      postal_code: normalizePostalCode(record.postal_code),
      prefecture: record.prefecture!,
      city: record.city!,
      address_line: record.address!,
      latitude: record.latitude!,
      longitude: record.longitude!,
      nearest_station: null,
      official_url: record.canonical_facility_url!,
      source_url: record.hyrox_source_url,
      location_type: record.proposed_location_type as H25LocationCandidate["location_type"],
      is_active: true as const,
      last_verified_at: observedAt,
      coordinate_source: "hyrox-governing-body-finder" as const,
      collision_status: "clear" as const,
    };
    return {
      ...base,
      candidate_hash: deterministicHash(base),
      training_source: { source_ref: sourceRef, location_ref: locationRef, url: record.hyrox_source_url, canonical_url: record.hyrox_source_url, source_kind: "finder", publisher_authority: "governing_body", availability_state: "available", last_checked_at: observedAt, unavailable_since: null, review_required: false, content_hash: sourceHash, metadata_json: sourceMetadata },
      external_identifier: { location_ref: locationRef, namespace: "hyrox-training-club", external_identifier: record.hgy_external_id, training_source_ref: sourceRef, verification_status: "confirmed", verified_at: observedAt, metadata_json: { official_name: record.hyrox_official_name } },
      location_training_discipline: { target_ref: disciplineRef, location_ref: locationRef, discipline_slug: "hyrox", support_state: "available", verification_status: "confirmed", last_confirmed_at: observedAt, stale_at: staleAt, notes: null },
      training_affiliation: { target_ref: affiliationRef, location_ref: locationRef, discipline_slug: "hyrox", affiliation_type: "training_club", awarding_organization: "HYROX", external_identifier: record.hgy_external_id, affiliation_state: "active", verification_status: "confirmed", valid_from: null, valid_to: null, last_confirmed_at: observedAt, stale_at: staleAt, notes: null },
      evidence: [evidenceFor("training_affiliation", affiliationRef), evidenceFor("location_training_discipline", disciplineRef)],
    };
  });

  if (collisions.length) throw new Error(`H2-5 candidate blocked:\n${collisions.join("\n")}`);
  const withoutHash = {
    schema_version: 1 as const,
    phase: "H2-5" as const,
    preview_only: true as const,
    no_database_writes: true as const,
    authority: { h2_4_commit: "d711265918387058159c09b3417a258090d6a8e8", production_observed_at: input.preflight.observed_at, source_revalidated_at: input.revalidation.observed_at },
    stale_policy_days: 90 as const,
    validation: {
      ready_input_count: 17 as const,
      included_count: 17 as const,
      excluded_counts: Object.fromEntries([...new Set(input.review.records.map((record) => record.final_classification))].sort().map((status) => [status, input.review.records.filter((record) => record.final_classification === status && status !== "NEW_LOCATION_READY").length])),
      duplicate_hgy_ids: duplicateHgy,
      duplicate_location_slugs: duplicateSlugs,
      collisions,
    },
    counts: { gym_brands: brands.length, gym_locations: 17 as const, training_sources: 17 as const, location_external_identifiers: 17 as const, location_training_disciplines: 17 as const, training_affiliations: 17 as const, training_evidence: 34 as const },
    import_order: ["gym_brands", "gym_locations", "training_sources", "location_external_identifiers", "location_training_disciplines", "training_affiliations", "training_evidence"],
    import_policy: {
      serialization: "One atomic transaction protected by a transaction-scoped advisory lock.",
      brands: "Reuse only an exact semantic name+slug identity; any name or slug mismatch blocks the whole set.",
      locations: "Reuse only an exact reviewed slug identity; URL, normalized-address, proximity, or semantic mismatch blocks.",
      sources: "Reuse one governing-body finder source by canonical URL only when location and authority match.",
      external_identifiers: "The namespace+HGY identity may belong to exactly one location; different-location ownership blocks.",
      affiliations: "Reuse the canonical location+HYROX+training_club+HYROX relation only when external identity matches.",
      evidence: "Deterministic SHA-256 content hash deduplicates source+target+assertion+observation evidence.",
      freshness: "Only a strictly newer authoritative observation may advance confirmation fields; older input never regresses them.",
    },
    production_baseline: input.preflight.counts,
    publication_impact: {
      gym_locations: "RLS currently permits public SELECT; is_active=true locations become eligible for existing location pages, map/data loaders, and static params immediately.",
      schedule_search: "No class_schedules are imported, so the 17 locations do not become schedule-search result rows; the 16 public brands do become available as brand-filter options after cache refresh.",
      sitemap: "Existing sitemap generation selects active gym locations, so the 17 slugs become sitemap entries on the next build.",
      gym_brands: "RLS currently permits public SELECT; brand rows are publicly readable immediately, though no standalone brand route was found.",
      atomicity: "Brand/location identity and the HYROX publication graph must be inserted in the same production transaction to avoid partial public exposure.",
    },
    brands,
    locations,
  };
  return { ...withoutHash, candidate_hash: deterministicHash(withoutHash) };
}

export function assertH25Candidate(candidate: H25Candidate): void {
  if (candidate.locations.length !== 17 || candidate.counts.gym_locations !== 17) throw new Error("H2-5 requires 17 locations");
  if (candidate.counts.training_sources !== 17 || candidate.counts.location_external_identifiers !== 17
      || candidate.counts.location_training_disciplines !== 17 || candidate.counts.training_affiliations !== 17
      || candidate.counts.training_evidence !== 34) throw new Error("H2-5 graph counts are invalid");
  if (candidate.validation.collisions.length) throw new Error("H2-5 candidate contains collisions");
}
