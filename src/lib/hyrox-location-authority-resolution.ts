import {
  haversineDistanceMeters,
  normalizeAddress,
  normalizePostalCode,
  normalizeText,
  normalizeUrl,
  resolveClubIdentity,
  type OfficialClubRecord,
} from "./hyrox-official-clubs";
import {
  inferLocationType,
  resolveBrand,
  semanticSlug,
  validJapanCoordinates,
  type GymBrandRecord,
  type H24LocationRecord,
  type H24ReviewRecord,
  type WebsiteObservation,
} from "./hyrox-unmatched-review";

export type OriginalAuthorityBlocker =
  | "MISSING_OFFICIAL_URL"
  | "POSTAL_AUTHORITY_GAP"
  | "SOCIAL_BOOKING_HOSTED_ONLY"
  | "IDENTITY_ADDRESS_INSUFFICIENT"
  | "OFFICIAL_SITE_UNREACHABLE";

export type H29Classification =
  | "NEW_LOCATION_READY"
  | "EXISTING_LOCATION_CONFIRMED_MATCH"
  | "REMAINS_NEEDS_REVIEW"
  | "NON_STANDARD_LOCATION"
  | "SOURCE_CONFLICT";

export type JapanPostRow = {
  postal_code: string;
  prefecture: string;
  city: string;
  town: string;
};

export type PostalAuthorityResult = {
  status: "POSTAL_AUTHORITY_CONFIRMED" | "POSTAL_AUTHORITY_UNRESOLVED" | "POSTAL_AUTHORITY_CONFLICT";
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  towns: string[];
  candidate_count: number;
  administrative_candidate_count: number;
  address_mismatch: boolean;
  authority_url: string;
};

export type GoverningBodyObservation = {
  external_id: string;
  fetched_at: string;
  found: boolean;
  error: string | null;
  hyrox_entity_id: string | null;
  official_name: string | null;
  facility_url: string | null;
  address: {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    postalCode?: string;
    geoCoordinates?: { lat?: number; lon?: number };
  } | null;
  discovery_queries: string[];
};

export type H29WebsiteObservation = WebsiteObservation & {
  site_kind: "facility_site" | "social" | "booking" | "hosted_landing";
  source_url_kind: "governing_body_current" | "h2_4_reviewed";
};

export type H29Override = {
  hgy_external_id: string;
  decision?: H29Classification;
  canonical_name?: string;
  facility_authority_url?: string;
  facility_authority_kind?: "facility_site" | "brand_locator" | "social" | "booking" | "hosted_landing";
  brand_resolution?: ReturnType<typeof resolveBrand>["brand_resolution"];
  proposed_brand_id?: string | null;
  proposed_brand_name?: string | null;
  proposed_brand_slug?: string | null;
  matched_location_id?: string;
  reason: string;
  authority_url: string;
  reviewed_at: string;
};

export type H29ResolutionRecord = {
  hgy_external_id: string;
  hyrox_official_name: string;
  original_blocker: OriginalAuthorityBlocker;
  governing_body_url: string;
  governing_body_revalidated: boolean;
  facility_authority_url: string | null;
  facility_authority_kind: "facility_site" | "brand_locator" | "social" | "booking" | "hosted_landing" | null;
  facility_authority_strength: "FIRST_PARTY_STRONG" | "OFFICIAL_SECONDARY_STRONG" | "INSUFFICIENT" | "UNAVAILABLE" | "MISSING";
  facility_observation: H29WebsiteObservation | null;
  postal_authority: PostalAuthorityResult;
  canonical_name: string;
  canonical_name_authority: string;
  canonical_address: string | null;
  address_authority: string;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_consistency: "CONSISTENT" | "CONFLICT" | "UNVERIFIED";
  brand_resolution: ReturnType<typeof resolveBrand>["brand_resolution"];
  proposed_brand_id: string | null;
  proposed_brand_name: string | null;
  proposed_brand_slug: string | null;
  proposed_location_type: string | null;
  proposed_slug: string | null;
  matched_location_id: string | null;
  matched_location_slug: string | null;
  matched_location_name: string | null;
  match_method: string;
  match_score: number | null;
  coordinate_distance_meters: number | null;
  final_classification: H29Classification;
  resolution_reason: string;
  unresolved_gaps: string[];
  sources_checked: Array<{ authority: string; url: string; result: string }>;
  discovery_queries: string[];
  reviewed_at: string;
  observed_at: string;
};

export const JAPAN_POST_UTF_DATA_URL = "https://www.post.japanpost.jp/service/search/zipcode/download/utf/zip/utf_ken_all.zip";

function csvFields(line: string): string[] {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(value); value = "";
    } else value += character;
  }
  fields.push(value);
  return fields;
}

export function parseJapanPostCsv(content: string): JapanPostRow[] {
  return content.split(/\r?\n/).filter(Boolean).map((line) => {
    const fields = csvFields(line);
    if (fields.length < 9) throw new Error("Invalid Japan Post CSV row");
    return { postal_code: normalizePostalCode(fields[2]), prefecture: fields[6].trim(), city: fields[7].trim(), town: fields[8].trim() };
  });
}

export function buildJapanPostIndex(rows: JapanPostRow[]): Map<string, JapanPostRow[]> {
  const index = new Map<string, JapanPostRow[]>();
  for (const row of rows) {
    const existing = index.get(row.postal_code) ?? [];
    existing.push(row);
    index.set(row.postal_code, existing);
  }
  return index;
}

export function resolvePostalAuthority(record: H24ReviewRecord, index: Map<string, JapanPostRow[]>): PostalAuthorityResult {
  const postalCode = normalizePostalCode(record.postal_code);
  const candidates = postalCode.length === 7 ? index.get(postalCode) ?? [] : [];
  const administrative = [...new Map(candidates.map((row) => [`${row.prefecture}\u0000${row.city}`, row])).values()];
  const addressMismatch = Boolean(record.prefecture && administrative.length === 1 && normalizeText(record.prefecture) !== normalizeText(administrative[0].prefecture));
  const status = candidates.length === 0
    ? "POSTAL_AUTHORITY_UNRESOLVED"
    : administrative.length !== 1 || addressMismatch
      ? "POSTAL_AUTHORITY_CONFLICT"
      : "POSTAL_AUTHORITY_CONFIRMED";
  return {
    status,
    postal_code: postalCode.length === 7 ? postalCode : null,
    prefecture: administrative.length === 1 ? administrative[0].prefecture : null,
    city: administrative.length === 1 ? administrative[0].city : null,
    towns: [...new Set(candidates.map((row) => row.town))].sort(),
    candidate_count: candidates.length,
    administrative_candidate_count: administrative.length,
    address_mismatch: addressMismatch,
    authority_url: JAPAN_POST_UTF_DATA_URL,
  };
}

export function originalBlocker(record: H24ReviewRecord): OriginalAuthorityBlocker {
  const conflict = record.conflicts[0] ?? "";
  if (conflict.includes("missing from the governing-body")) return "MISSING_OFFICIAL_URL";
  if (conflict.includes("Postal authority")) return "POSTAL_AUTHORITY_GAP";
  if (conflict.includes("social, booking, or hosted")) return "SOCIAL_BOOKING_HOSTED_ONLY";
  if (conflict.includes("enough name/address")) return "IDENTITY_ADDRESS_INSUFFICIENT";
  if (conflict.includes("could not be verified live")) return "OFFICIAL_SITE_UNREACHABLE";
  throw new Error(`Unknown H2-9 blocker for ${record.hgy_external_id}: ${conflict}`);
}

function normalizedCanonicalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    url.search = ""; url.hash = "";
    return url.toString();
  } catch { return null; }
}

function canonicalName(record: H24ReviewRecord, website: H29WebsiteObservation | null, override: H29Override | undefined): { name: string; authority: string } {
  if (override?.canonical_name) return { name: override.canonical_name.trim(), authority: override.authority_url };
  // Page titles frequently contain marketing copy rather than an entity name. The
  // governing-body listing remains the canonical name unless a reviewed override
  // names a stronger facility authority explicitly.
  return { name: record.canonical_name || record.hyrox_official_name, authority: record.hyrox_source_url };
}

function nonStandardName(name: string): boolean {
  return /\brental\s*gym\b|virtual|online\s*(?:gym|coach)|event[- ]?only/i.test(name);
}

export function websiteStrength(website: H29WebsiteObservation | null, governingFound: boolean): H29ResolutionRecord["facility_authority_strength"] {
  if (!website) return "MISSING";
  if (website.error || !website.status || website.status >= 400) return "UNAVAILABLE";
  const identityAddress = website.postal_code_match || (website.official_name_match && website.address_token_match);
  if (website.site_kind === "facility_site") return identityAddress ? "FIRST_PARTY_STRONG" : "INSUFFICIENT";
  const secondaryStrong = governingFound && website.postal_code_match && (website.official_name_match || website.address_token_match);
  return secondaryStrong ? "OFFICIAL_SECONDARY_STRONG" : "INSUFFICIENT";
}

export function resolveAuthorityRecord(input: {
  record: H24ReviewRecord;
  source: OfficialClubRecord;
  governing: GoverningBodyObservation;
  website: H29WebsiteObservation | null;
  postalIndex: Map<string, JapanPostRow[]>;
  locations: H24LocationRecord[];
  brands: GymBrandRecord[];
  publishedLocationIds: Set<string>;
  reservedSlugs: Set<string>;
  reviewedAt: string;
  override?: H29Override;
}): H29ResolutionRecord {
  const { record, source, governing, website, override } = input;
  const blocker = originalBlocker(record);
  const postal = resolvePostalAuthority(record, input.postalIndex);
  const finalUrl = normalizedCanonicalUrl(override?.facility_authority_url ?? website?.canonical_url ?? website?.final_url ?? governing.facility_url ?? record.canonical_facility_url);
  const name = canonicalName(record, website, override);
  const facilityKind = override?.facility_authority_kind ?? website?.site_kind ?? null;
  const strength = override?.facility_authority_url
    ? (["facility_site", "brand_locator"].includes(override.facility_authority_kind ?? "") ? "FIRST_PARTY_STRONG" : "OFFICIAL_SECONDARY_STRONG")
    : websiteStrength(website, governing.found);
  const liveCoordinates = governing.address?.geoCoordinates;
  const coordinateDistance = source.latitude !== null && source.longitude !== null && typeof liveCoordinates?.lat === "number" && typeof liveCoordinates?.lon === "number"
    ? haversineDistanceMeters(source.latitude, source.longitude, liveCoordinates.lat, liveCoordinates.lon) : null;
  const coordinateConsistency = coordinateDistance === null ? "UNVERIFIED" : coordinateDistance <= 500 ? "CONSISTENT" : "CONFLICT";
  const updatedSource: OfficialClubRecord = {
    ...source,
    external_id: record.hgy_external_id,
    official_name: name.name,
    address: record.address,
    postal_code: postal.postal_code ?? record.postal_code,
    latitude: record.latitude,
    longitude: record.longitude,
    facility_url: finalUrl,
    prefecture: postal.prefecture ?? source.prefecture,
    city: postal.city ?? source.city,
  };
  const match = resolveClubIdentity(updatedSource, input.locations);
  const automaticBrand = resolveBrand(name.name, input.brands);
  const brand = override?.brand_resolution ? {
    brand_resolution: override.brand_resolution,
    proposed_brand_id: override.proposed_brand_id ?? null,
    proposed_brand_name: override.proposed_brand_name ?? null,
    proposed_brand_slug: override.proposed_brand_slug ?? null,
  } : automaticBrand;
  let slug = semanticSlug(name.name, postal.postal_code);
  if (slug && slug === brand.proposed_brand_slug) {
    slug = postal.postal_code ? `${slug}-${postal.postal_code}` : null;
  }
  const unresolved: string[] = [];
  if (!governing.found || governing.hyrox_entity_id !== record.hgy_external_id) unresolved.push("governing-body record could not be revalidated");
  if (!finalUrl) unresolved.push("reliable facility-specific authority URL missing");
  if (!["FIRST_PARTY_STRONG", "OFFICIAL_SECONDARY_STRONG"].includes(strength)) unresolved.push("facility identity/address not confirmed by strong first-party authority");
  if (postal.status !== "POSTAL_AUTHORITY_CONFIRMED") unresolved.push(`postal authority ${postal.status.toLowerCase()}`);
  if (!record.address) unresolved.push("full physical address missing");
  if (!validJapanCoordinates(record.latitude, record.longitude)) unresolved.push("valid Japan coordinates missing");
  if (brand.brand_resolution === "BRAND_AMBIGUOUS") unresolved.push("brand semantics unresolved");
  if (!slug) unresolved.push("deterministic semantic slug unavailable");
  if (slug && input.reservedSlugs.has(slug)) unresolved.push(`proposed slug collision: ${slug}`);
  if (match.resolution_status === "PROBABLE_MATCH" || match.resolution_status === "AMBIGUOUS") unresolved.push(`current GymMap rematch ${match.resolution_status.toLowerCase()}`);

  const sourceConflict = coordinateConsistency === "CONFLICT" || postal.status === "POSTAL_AUTHORITY_CONFLICT" ||
    (governing.found && governing.hyrox_entity_id !== record.hgy_external_id);
  let classification: H29Classification;
  let reason: string;
  if (sourceConflict) {
    classification = "SOURCE_CONFLICT"; reason = "Material governing-body, coordinate, or postal authority conflict";
  } else if (override?.decision === "NEW_LOCATION_READY" && unresolved.length > 0) {
    classification = "REMAINS_NEEDS_REVIEW";
    reason = "Structured override could not satisfy every fail-closed READY invariant";
  } else if (override?.decision) {
    classification = override.decision; reason = override.reason;
  } else if (nonStandardName(name.name)) {
    classification = "NON_STANDARD_LOCATION"; reason = "Entity is not a conventional persistent gym location";
  } else if (match.resolution_status === "CONFIRMED_MATCH" && match.gymmap_location_id) {
    if (input.publishedLocationIds.has(match.gymmap_location_id)) {
      classification = "SOURCE_CONFLICT";
      reason = "A second unimported HGY identity resolves to an already-published HYROX location";
      unresolved.push("multiple HGY identities resolve to the same current GymMap location");
    } else {
      classification = "EXISTING_LOCATION_CONFIRMED_MATCH";
      reason = "Current GymMap inventory satisfies fail-closed confirmed identity rules";
    }
  } else if (unresolved.length === 0) {
    classification = "NEW_LOCATION_READY"; reason = "Governing, facility, postal, coordinate, brand, and duplicate preconditions are complete";
  } else {
    classification = "REMAINS_NEEDS_REVIEW"; reason = "One or more required authority gates remain unresolved";
  }
  if (classification === "NEW_LOCATION_READY" && slug) input.reservedSlugs.add(slug);

  const matchedLocation = match.gymmap_location_id ? input.locations.find((location) => location.id === match.gymmap_location_id) : null;
  return {
    hgy_external_id: record.hgy_external_id,
    hyrox_official_name: record.hyrox_official_name,
    original_blocker: blocker,
    governing_body_url: record.hyrox_source_url,
    governing_body_revalidated: governing.found && governing.hyrox_entity_id === record.hgy_external_id,
    facility_authority_url: finalUrl,
    facility_authority_kind: facilityKind,
    facility_authority_strength: strength,
    facility_observation: website,
    postal_authority: postal,
    canonical_name: name.name,
    canonical_name_authority: name.authority,
    canonical_address: record.address,
    address_authority: record.hyrox_source_url,
    postal_code: postal.postal_code,
    prefecture: postal.prefecture ?? record.prefecture,
    city: postal.city ?? record.city,
    latitude: record.latitude,
    longitude: record.longitude,
    coordinate_consistency: coordinateConsistency,
    ...brand,
    proposed_location_type: classification === "NEW_LOCATION_READY" ? inferLocationType(name.name, brand.proposed_brand_slug) : matchedLocation?.location_type ?? null,
    proposed_slug: classification === "NEW_LOCATION_READY" ? slug : null,
    matched_location_id: classification === "EXISTING_LOCATION_CONFIRMED_MATCH" ? match.gymmap_location_id : null,
    matched_location_slug: classification === "EXISTING_LOCATION_CONFIRMED_MATCH" ? match.gymmap_slug : null,
    matched_location_name: classification === "EXISTING_LOCATION_CONFIRMED_MATCH" ? match.gymmap_name : null,
    match_method: match.match_method,
    match_score: match.score,
    coordinate_distance_meters: match.coordinate_distance_meters,
    final_classification: classification,
    resolution_reason: reason,
    unresolved_gaps: [...new Set(unresolved)].sort(),
    sources_checked: [
      { authority: "HYROX governing-body Training Finder", url: record.hyrox_source_url, result: governing.found ? "revalidated" : `unavailable: ${governing.error}` },
      ...(finalUrl ? [{ authority: ["facility_site", "brand_locator"].includes(facilityKind ?? "") ? "facility/brand first-party" : "official facility-controlled secondary", url: finalUrl, result: strength }] : []),
      { authority: "Japan Post official postal data", url: JAPAN_POST_UTF_DATA_URL, result: postal.status },
    ],
    discovery_queries: governing.discovery_queries,
    reviewed_at: input.reviewedAt,
    observed_at: governing.fetched_at,
  };
}

export function duplicateValues(values: Array<string | null>): string[] {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

export function normalizedAddressKey(value: string | null): string | null {
  const normalized = normalizeAddress(value);
  return normalized || null;
}

export function normalizedUrlKey(value: string | null): string | null {
  const normalized = normalizeUrl(value);
  return normalized || null;
}
