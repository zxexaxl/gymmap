import { addUtcDays, deterministicHash } from "./hyrox-import-candidate";
import { haversineDistanceMeters, normalizeAddress, normalizeName, normalizePostalCode, normalizeUrl } from "./hyrox-official-clubs";
import { validJapanCoordinates } from "./hyrox-unmatched-review";

export const H2_10_RECONCILED_CONTRACT_SHA256 = "2f7c725e0dd81428115a815d7f79a1e2b30776764d94b5a973283cdcaec206aa";
export const H2_10R_COMMIT = "7d0099fb7aefcbc51654668ad9ecb706a622c343";
export const H2_10_LOCATION_TYPES = [
  "fitness_club", "fitness_spa", "light_gym", "flat", "sopra", "bodymake_gym", "fitness_studio",
] as const;

export type H210ReadyRecord = {
  hgy_external_id: string;
  canonical_name: string;
  slug: string;
  brand_id: string | null;
  proposed_brand: { name: string; slug: string } | null;
  location_type: string;
  address: string;
  postal_code: string;
  prefecture: string;
  city: string;
  latitude: number;
  longitude: number;
  official_url: string;
  source_url: string;
  is_active: true;
  import_preview: { last_confirmed_at: string; stale_at: string };
  authority_trace: Array<{ authority: string; url: string; result: string }>;
};

export type H210ProductionPreflight = {
  observed_at: string;
  counts: {
    gym_brands: number; gym_locations: number; training_disciplines_hyrox: number; training_sources: number;
    location_external_identifiers_hyrox: number; location_training_disciplines: number;
    training_affiliations_hyrox: number; training_evidence: number; published_hyrox: number;
    official_hyrox: number; search_hyrox: number; location_equipment: number;
    location_training_capabilities: number; program_training_disciplines: number;
  };
  brands: Array<{ id: string; name: string; slug: string; official_url: string | null; description: string | null }>;
  locations: Array<{
    id: string; brand_id: string; name: string; slug: string; postal_code: string | null; prefecture: string | null;
    city: string | null; address_line: string | null; latitude: number | null; longitude: number | null;
    nearest_station: string | null; official_url: string | null; source_url: string | null; location_type: string | null;
    is_active: boolean; last_verified_at: string | null;
  }>;
  hyrox_disciplines: Array<{ id: string; slug: string; name: string; is_active: boolean }>;
  training_sources: Array<Record<string, unknown>>;
  hyrox_external_identifiers: Array<{ id: string; location_id: string; namespace: string; external_identifier: string;
    training_source_id: string | null; verification_status: string; verified_at: string | null }>;
  location_training_disciplines: Array<Record<string, unknown>>;
  hyrox_affiliations: Array<{ id: string; location_id: string; discipline_id: string; affiliation_type: string;
    awarding_organization: string; external_identifier: string | null; affiliation_state: string;
    verification_status: string; last_confirmed_at: string | null; stale_at: string | null }>;
  training_evidence: Array<Record<string, unknown>>;
};

export type H210Revalidation = {
  schema_version: 1;
  phase: "H2-10R";
  observed_at: string;
  reconciled_h2_9_contract_sha256: string;
  input_count: number;
  governing_body_pass_count: number;
  facility_authority_pass_count: number;
  collision_pass_count: number;
  remaining_authority_drift_count: number;
  production_baseline: Record<string, number | string>;
  records: Array<{
    hgy_external_id: string; governing_body_status: "PASS"; facility_authority_status: "PASS";
    collision_status: "PASS"; facility_authority_url: string; facility_final_url: string;
    nearby_nonmatching_locations: Array<{ location_id: string; slug: string; distance_meters: number }>;
    blockers: string[];
  }>;
};

export type H210BrandResolution = {
  brand_ref: string;
  name: string;
  slug: string;
  resolution: "EXISTING_BRAND_REUSE" | "NEW_CHAIN_BRAND" | "NEW_SINGLE_LOCATION_BRAND";
  existing_brand_id: string | null;
  official_url: string;
  location_refs: string[];
  source_authority_urls: string[];
  collision_status: "clear";
  candidate_hash: string;
};

export type H210EvidenceCandidate = {
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

export type H210LocationCandidate = {
  location_ref: string; hgy_external_id: string; hyrox_official_name: string; name: string; slug: string;
  brand_ref: string; brand_resolution: H210BrandResolution["resolution"]; postal_code: string; prefecture: string;
  city: string; address_line: string; latitude: number; longitude: number; nearest_station: null;
  official_url: string; source_url: string; location_type: typeof H2_10_LOCATION_TYPES[number]; is_active: true;
  last_verified_at: string; coordinate_source: "hyrox-governing-body-finder"; collision_status: "clear";
  authority_trace: H210ReadyRecord["authority_trace"];
  candidate_hash: string;
  training_source: {
    source_ref: string; location_ref: string; url: string; canonical_url: string; source_kind: "finder";
    publisher_authority: "governing_body"; availability_state: "available"; last_checked_at: string;
    unavailable_since: null; review_required: false; content_hash: string;
    metadata_json: { namespace: "hyrox-training-club"; external_identifier: string; official_name: string };
  };
  external_identifier: {
    location_ref: string; namespace: "hyrox-training-club"; external_identifier: string; training_source_ref: string;
    verification_status: "confirmed"; verified_at: string; metadata_json: { official_name: string };
  };
  location_training_discipline: {
    target_ref: string; location_ref: string; discipline_slug: "hyrox"; support_state: "available";
    verification_status: "confirmed"; last_confirmed_at: string; stale_at: string; notes: null;
  };
  training_affiliation: {
    target_ref: string; location_ref: string; discipline_slug: "hyrox"; affiliation_type: "training_club";
    awarding_organization: "HYROX"; external_identifier: string; affiliation_state: "active";
    verification_status: "confirmed"; valid_from: null; valid_to: null; last_confirmed_at: string;
    stale_at: string; notes: null;
  };
  evidence: [H210EvidenceCandidate, H210EvidenceCandidate];
};

export type H210Candidate = {
  schema_version: 1; phase: "H2-10"; preview_only: true; no_database_writes: true;
  authority: { h2_10r_commit: string; reconciled_contract_sha256: string; production_observed_at: string; source_revalidated_at: string };
  stale_policy_days: 90;
  validation: {
    ready_input_count: 58; included_count: 58; excluded_counts: Record<string, number>;
    duplicate_hgy_ids: string[]; duplicate_location_slugs: string[]; collisions: string[];
  };
  counts: {
    existing_brand_reuse: number; new_chain_brands: number; new_single_location_brands: number;
    gym_brands: number; gym_locations: 58; training_sources: 58; location_external_identifiers: 58;
    location_training_disciplines: 58; training_affiliations: 58; training_evidence: 116;
    location_equipment: 0; location_training_capabilities: 0; program_training_disciplines: 0; class_schedules: 0;
  };
  import_order: string[]; import_policy: Record<string, string>; production_baseline: H210ProductionPreflight["counts"];
  publication_rehearsal: { published_before: number; published_after: number; official_before: number; official_after: number; search_before: number; search_after: number };
  static_publication: { active_locations_before: number; active_locations_after: number; route_delta: 58;
    route_eligible_slugs: string[]; sitemap_eligible_slugs: string[]; deployment_required: true };
  brand_resolutions: H210BrandResolution[]; brands: H210BrandResolution[]; locations: H210LocationCandidate[];
  candidate_hash: string;
};

function duplicates(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

function brandAuthorityUrl(records: H210ReadyRecord[]): string {
  const selected = [...records].sort((left, right) => left.hgy_external_id.localeCompare(right.hgy_external_id))[0].official_url;
  if (records.length === 1) return selected;
  const url = new URL(selected);
  return `${url.origin}/`;
}

function makeEvidence(record: H210ReadyRecord, officialName: string, observedAt: string, sourceRef: string,
  targetType: H210EvidenceCandidate["target_type"], targetRef: string): H210EvidenceCandidate {
  const structured = { finder_listing: true as const, official_external_id: record.hgy_external_id, official_name: officialName };
  const contentHash = deterministicHash({ source_ref: sourceRef, target_type: targetType, target_ref: targetRef,
    assertion: "supports", observed_at: observedAt, structured_evidence: structured });
  return { evidence_ref: `sha256:${contentHash}`, training_source_ref: sourceRef, target_type: targetType,
    target_ref: targetRef, assertion: "supports", review_status: "accepted", evidence_text: null,
    structured_evidence: structured, observed_at: observedAt, reviewed_at: observedAt, content_hash: contentHash };
}

export function buildH210Candidate(input: {
  ready: { schema_version: number; preview_only: boolean; records: H210ReadyRecord[] };
  resolution: { deterministic_contract_sha256: string; summary: Record<string, number>; records: Array<{ final_classification: string; hgy_external_id: string; hyrox_official_name: string }> };
  preflight: H210ProductionPreflight;
  revalidation: H210Revalidation;
}): H210Candidate {
  const ready = [...input.ready.records].sort((left, right) => left.hgy_external_id.localeCompare(right.hgy_external_id));
  const collisions: string[] = [];
  const duplicateHgy = duplicates(ready.map((record) => record.hgy_external_id));
  const duplicateSlugs = duplicates(ready.map((record) => record.slug));
  const readyResolution = input.resolution.records.filter((record) => record.final_classification === "NEW_LOCATION_READY");
  const resolutionById = new Map(readyResolution.map((record) => [record.hgy_external_id, record]));
  if (input.resolution.deterministic_contract_sha256 !== H2_10_RECONCILED_CONTRACT_SHA256) collisions.push("Reconciled contract hash mismatch");
  if (ready.length !== 58 || readyResolution.length !== 58) collisions.push("READY input must contain exactly 58 records");
  if (duplicateHgy.length) collisions.push(`Duplicate HGY IDs: ${duplicateHgy.join(",")}`);
  if (duplicateSlugs.length) collisions.push(`Duplicate location slugs: ${duplicateSlugs.join(",")}`);
  if (input.revalidation.reconciled_h2_9_contract_sha256 !== H2_10_RECONCILED_CONTRACT_SHA256
      || input.revalidation.input_count !== 58 || input.revalidation.governing_body_pass_count !== 58
      || input.revalidation.facility_authority_pass_count !== 58 || input.revalidation.collision_pass_count !== 58
      || input.revalidation.remaining_authority_drift_count !== 0) collisions.push("H2-10R revalidation authority is incomplete");
  const revalidationById = new Map(input.revalidation.records.map((record) => [record.hgy_external_id, record]));
  const preflightCounts = input.preflight.counts;
  const expectedBaseline = { gym_brands: 23, gym_locations: 386, training_sources: 24,
    location_external_identifiers_hyrox: 24, location_training_disciplines: 24,
    training_affiliations_hyrox: 24, training_evidence: 48, published_hyrox: 24, official_hyrox: 24, search_hyrox: 24 };
  for (const [key, value] of Object.entries(expectedBaseline)) {
    if (preflightCounts[key as keyof typeof preflightCounts] !== value) collisions.push(`Production baseline drift: ${key}`);
  }
  if (preflightCounts.location_equipment !== 0 || preflightCounts.location_training_capabilities !== 0
      || preflightCounts.program_training_disciplines !== 0) collisions.push("Out-of-scope training rows exist in production");

  const productionBrandsById = new Map(input.preflight.brands.map((brand) => [brand.id, brand]));
  const productionBrandsBySlug = new Map(input.preflight.brands.map((brand) => [brand.slug, brand]));
  const productionBrandsByName = new Map(input.preflight.brands.map((brand) => [normalizeName(brand.name), brand]));
  const productionLocationsBySlug = new Map(input.preflight.locations.map((location) => [location.slug, location]));
  const productionUrls = new Map(input.preflight.locations.filter((location) => location.official_url)
    .map((location) => [normalizeUrl(location.official_url), location]));
  const productionAddresses = new Map(input.preflight.locations.filter((location) => location.address_line)
    .map((location) => [normalizeAddress(location.address_line), location]));
  const productionHgy = new Map(input.preflight.hyrox_external_identifiers.map((identity) => [identity.external_identifier, identity.location_id]));
  const productionSources = new Set(input.preflight.training_sources.flatMap((source) =>
    typeof source.canonical_url === "string" ? [normalizeUrl(source.canonical_url)] : []));
  const productionAffiliationIds = new Set(input.preflight.hyrox_affiliations.flatMap((affiliation) => affiliation.external_identifier ? [affiliation.external_identifier] : []));

  type BrandGroup = { name: string; slug: string; existing: H210ProductionPreflight["brands"][number] | null; records: H210ReadyRecord[] };
  const brandGroups = new Map<string, BrandGroup>();
  for (const record of ready) {
    const revalidation = revalidationById.get(record.hgy_external_id);
    if (!revalidation || revalidation.blockers.length || revalidation.governing_body_status !== "PASS"
        || revalidation.facility_authority_status !== "PASS" || revalidation.collision_status !== "PASS") {
      collisions.push(`${record.hgy_external_id}: missing passing H2-10R authority`);
    }
    if (revalidation && normalizeUrl(revalidation.facility_authority_url) !== normalizeUrl(record.official_url)) {
      collisions.push(`${record.hgy_external_id}: facility authority differs from reconciled READY record`);
    }
    if (!/^HGY_[A-Za-z0-9]+$/.test(record.hgy_external_id) || !record.canonical_name || !record.slug || !record.address
        || normalizePostalCode(record.postal_code).length !== 7 || !record.prefecture || !record.city
        || !validJapanCoordinates(record.latitude, record.longitude) || !record.official_url || !record.source_url
        || !H2_10_LOCATION_TYPES.includes(record.location_type as typeof H2_10_LOCATION_TYPES[number])) {
      collisions.push(`${record.hgy_external_id}: missing or invalid required field`);
    }
    if (productionLocationsBySlug.has(record.slug)) collisions.push(`${record.hgy_external_id}: production location slug collision`);
    if (productionUrls.has(normalizeUrl(record.official_url))) collisions.push(`${record.hgy_external_id}: production official URL collision`);
    if (productionAddresses.has(normalizeAddress(record.address))) collisions.push(`${record.hgy_external_id}: production address collision`);
    if (productionHgy.has(record.hgy_external_id)) collisions.push(`${record.hgy_external_id}: production HGY collision`);
    if (productionSources.has(normalizeUrl(record.source_url))) collisions.push(`${record.hgy_external_id}: production source collision`);
    if (productionAffiliationIds.has(record.hgy_external_id)) collisions.push(`${record.hgy_external_id}: production affiliation collision`);
    const auditedNearby = new Set(revalidation?.nearby_nonmatching_locations.map((item) => item.location_id) ?? []);
    const newNearby = input.preflight.locations.filter((location) => location.latitude !== null && location.longitude !== null
      && haversineDistanceMeters(record.latitude, record.longitude, location.latitude, location.longitude) <= 100
      && !auditedNearby.has(location.id));
    if (newNearby.length) collisions.push(`${record.hgy_external_id}: unaudited production location within 100m`);

    let existing = record.brand_id ? productionBrandsById.get(record.brand_id) ?? null : null;
    const name = record.proposed_brand?.name ?? existing?.name ?? "";
    const slug = record.proposed_brand?.slug ?? existing?.slug ?? "";
    if (!existing && record.proposed_brand) {
      const slugMatch = productionBrandsBySlug.get(slug);
      const nameMatch = productionBrandsByName.get(normalizeName(name));
      if (slugMatch || nameMatch) {
        if (!slugMatch || !nameMatch || slugMatch.id !== nameMatch.id) collisions.push(`${record.hgy_external_id}: production brand semantic conflict`);
        else existing = slugMatch;
      }
    }
    if (!name || !slug || (existing && (existing.slug !== slug || normalizeName(existing.name) !== normalizeName(name)))) {
      collisions.push(`${record.hgy_external_id}: brand identity unresolved`);
    }
    const key = existing ? `existing:${existing.id}` : `new:${slug}`;
    const group = brandGroups.get(key);
    if (group && (group.slug !== slug || normalizeName(group.name) !== normalizeName(name))) collisions.push(`${record.hgy_external_id}: brand grouping conflict`);
    else brandGroups.set(key, { name, slug, existing, records: [...(group?.records ?? []), record] });
  }
  const sharedUrls = duplicates(ready.map((record) => normalizeUrl(record.official_url)));
  for (const url of sharedUrls) {
    const records = ready.filter((record) => normalizeUrl(record.official_url) === url);
    const brands = new Set(records.map((record) => record.brand_id ?? record.proposed_brand?.slug));
    if (brands.size !== 1) collisions.push(`Candidate facility URL shared across different brands: ${url}`);
  }
  if (duplicates(ready.map((record) => normalizeAddress(record.address))).length) collisions.push("Candidate normalized address collision");
  if (duplicates(ready.map((record) => `${record.latitude.toFixed(6)},${record.longitude.toFixed(6)}`)).length) collisions.push("Candidate coordinate collision");

  const brandResolutions: H210BrandResolution[] = [...brandGroups.values()].sort((a, b) => a.slug.localeCompare(b.slug)).map((group) => {
    const resolution = group.existing ? "EXISTING_BRAND_REUSE" as const
      : group.records.length > 1 ? "NEW_CHAIN_BRAND" as const : "NEW_SINGLE_LOCATION_BRAND" as const;
    const base = { brand_ref: `brand:${group.slug}`, name: group.name, slug: group.slug, resolution,
      existing_brand_id: group.existing?.id ?? null, official_url: group.existing?.official_url ?? brandAuthorityUrl(group.records),
      location_refs: group.records.map((record) => `location:${record.slug}`).sort(),
      source_authority_urls: [...new Set(group.records.map((record) => record.official_url))].sort(), collision_status: "clear" as const };
    return { ...base, candidate_hash: deterministicHash(base) };
  });
  const brandByRecord = new Map<string, H210BrandResolution>();
  for (const brand of brandResolutions) for (const ref of brand.location_refs) brandByRecord.set(ref, brand);
  const observedAt = input.revalidation.observed_at;
  const staleAt = addUtcDays(observedAt, 90);
  const locations: H210LocationCandidate[] = ready.map((record) => {
    const officialName = resolutionById.get(record.hgy_external_id)?.hyrox_official_name ?? record.canonical_name;
    const locationRef = `location:${record.slug}`;
    const brand = brandByRecord.get(locationRef)!;
    const sourceRef = `hyrox-finder:${record.hgy_external_id}`;
    const disciplineRef = `${locationRef}:hyrox`;
    const affiliationRef = `${locationRef}:hyrox:training_club:HYROX`;
    const metadata = { namespace: "hyrox-training-club" as const, external_identifier: record.hgy_external_id, official_name: officialName };
    const base = { location_ref: locationRef, hgy_external_id: record.hgy_external_id, hyrox_official_name: officialName,
      name: record.canonical_name, slug: record.slug, brand_ref: brand.brand_ref, brand_resolution: brand.resolution,
      postal_code: normalizePostalCode(record.postal_code), prefecture: record.prefecture, city: record.city,
      address_line: record.address, latitude: record.latitude, longitude: record.longitude, nearest_station: null,
      official_url: record.official_url, source_url: record.source_url, location_type: record.location_type as H210LocationCandidate["location_type"],
      is_active: true as const, last_verified_at: observedAt, coordinate_source: "hyrox-governing-body-finder" as const,
      collision_status: "clear" as const, authority_trace: record.authority_trace };
    return { ...base, candidate_hash: deterministicHash(base),
      training_source: { source_ref: sourceRef, location_ref: locationRef, url: record.source_url, canonical_url: record.source_url,
        source_kind: "finder", publisher_authority: "governing_body", availability_state: "available", last_checked_at: observedAt,
        unavailable_since: null, review_required: false, content_hash: deterministicHash({ canonical_url: record.source_url, observed_at: observedAt, metadata_json: metadata }), metadata_json: metadata },
      external_identifier: { location_ref: locationRef, namespace: "hyrox-training-club", external_identifier: record.hgy_external_id,
        training_source_ref: sourceRef, verification_status: "confirmed", verified_at: observedAt, metadata_json: { official_name: officialName } },
      location_training_discipline: { target_ref: disciplineRef, location_ref: locationRef, discipline_slug: "hyrox",
        support_state: "available", verification_status: "confirmed", last_confirmed_at: observedAt, stale_at: staleAt, notes: null },
      training_affiliation: { target_ref: affiliationRef, location_ref: locationRef, discipline_slug: "hyrox",
        affiliation_type: "training_club", awarding_organization: "HYROX", external_identifier: record.hgy_external_id,
        affiliation_state: "active", verification_status: "confirmed", valid_from: null, valid_to: null,
        last_confirmed_at: observedAt, stale_at: staleAt, notes: null },
      evidence: [makeEvidence(record, officialName, observedAt, sourceRef, "training_affiliation", affiliationRef),
        makeEvidence(record, officialName, observedAt, sourceRef, "location_training_discipline", disciplineRef)] };
  });
  const productionEvidenceHashes = new Set(input.preflight.training_evidence.flatMap((evidence) =>
    typeof evidence.content_hash === "string" ? [evidence.content_hash] : []));
  if (locations.some((location) => location.evidence.some((evidence) => productionEvidenceHashes.has(evidence.content_hash)))) {
    collisions.push("Production evidence collision");
  }
  if (ready.some((record) => new Date(observedAt).valueOf() < new Date(record.import_preview.last_confirmed_at).valueOf())) {
    collisions.push("H2-10R observation would regress freshness");
  }
  if (collisions.length) throw new Error(`H2-10 candidate blocked:\n${collisions.join("\n")}`);
  const newBrands = brandResolutions.filter((brand) => brand.resolution !== "EXISTING_BRAND_REUSE");
  const withoutHash = {
    schema_version: 1 as const, phase: "H2-10" as const, preview_only: true as const, no_database_writes: true as const,
    authority: { h2_10r_commit: H2_10R_COMMIT, reconciled_contract_sha256: H2_10_RECONCILED_CONTRACT_SHA256,
      production_observed_at: input.preflight.observed_at, source_revalidated_at: observedAt }, stale_policy_days: 90 as const,
    validation: { ready_input_count: 58 as const, included_count: 58 as const,
      excluded_counts: { REMAINS_NEEDS_REVIEW: 83, SOURCE_CONFLICT: 3, SOURCE_INCOMPLETE: 21, NON_STANDARD: 1 },
      duplicate_hgy_ids: duplicateHgy, duplicate_location_slugs: duplicateSlugs, collisions },
    counts: { existing_brand_reuse: brandResolutions.filter((brand) => brand.resolution === "EXISTING_BRAND_REUSE").length,
      new_chain_brands: newBrands.filter((brand) => brand.resolution === "NEW_CHAIN_BRAND").length,
      new_single_location_brands: newBrands.filter((brand) => brand.resolution === "NEW_SINGLE_LOCATION_BRAND").length,
      gym_brands: newBrands.length, gym_locations: 58 as const, training_sources: 58 as const,
      location_external_identifiers: 58 as const, location_training_disciplines: 58 as const,
      training_affiliations: 58 as const, training_evidence: 116 as const, location_equipment: 0 as const,
      location_training_capabilities: 0 as const, program_training_disciplines: 0 as const, class_schedules: 0 as const },
    import_order: ["gym_brands", "gym_locations", "training_sources", "location_external_identifiers",
      "location_training_disciplines", "training_affiliations", "training_evidence"],
    import_policy: { serialization: "One atomic transaction protected by pg_advisory_xact_lock.",
      brands: "Exact semantic name+slug identity reuses; mismatch blocks the full set.",
      locations: "Exact reviewed slug+identity may reuse only on a true rerun; URL/address/near-coordinate conflicts block.",
      hgy: "namespace+HGY may belong to one location only; different ownership blocks.",
      sources: "Canonical governing-body source reuses only with matching location and authority.",
      affiliations: "Canonical relation reuses only when external identity matches.",
      evidence: "Deterministic content_hash deduplicates identical evidence.",
      freshness: "Reruns do not extend freshness; older observations never regress confirmed state." },
    production_baseline: input.preflight.counts,
    publication_rehearsal: { published_before: preflightCounts.published_hyrox, published_after: preflightCounts.published_hyrox + 58,
      official_before: preflightCounts.official_hyrox, official_after: preflightCounts.official_hyrox + 58,
      search_before: preflightCounts.search_hyrox, search_after: preflightCounts.search_hyrox + 58 },
    static_publication: { active_locations_before: input.preflight.locations.filter((location) => location.is_active).length,
      active_locations_after: input.preflight.locations.filter((location) => location.is_active).length + 58, route_delta: 58 as const,
      route_eligible_slugs: locations.map((record) => record.slug).sort(),
      sitemap_eligible_slugs: locations.map((record) => record.slug).sort(), deployment_required: true as const },
    brand_resolutions: brandResolutions, brands: newBrands, locations,
  };
  return { ...withoutHash, candidate_hash: deterministicHash(withoutHash) };
}

export function assertH210Candidate(candidate: H210Candidate): void {
  if (candidate.locations.length !== 58 || candidate.brands.length !== candidate.counts.gym_brands) throw new Error("H2-10 graph counts invalid");
  if (candidate.locations.flatMap((record) => record.evidence).length !== 116 || candidate.validation.collisions.length) throw new Error("H2-10 evidence/collision gate invalid");
  if (candidate.static_publication.route_eligible_slugs.length !== 58 || candidate.static_publication.sitemap_eligible_slugs.length !== 58) throw new Error("H2-10 static publication set invalid");
}
